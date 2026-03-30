/**
 * Real-time PumpFun migration listener — catches ALL migrations.
 *
 * Dual-source approach:
 * 1. Solana `programSubscribe` — watches for new Pump AMM (PumpSwap) market
 *    accounts on-chain. This never misses migrations, even when logs are
 *    truncated or errors occur mid-transaction (see chainstacklabs/pumpfun-bonkfun-bot#87).
 * 2. PumpPortal WebSocket — lightweight relay that fires quickly for most events.
 *
 * Both feed into the same processing pipeline; the shared `processedMints` set
 * prevents duplicate work.
 *
 * Required env:  HELIUS_API_KEY  (or SOLANA_WSS_ENDPOINT + SOLANA_RPC_ENDPOINT)
 * Usage:         bun run migrations:listen
 */
import "dotenv/config"

import { ed25519 } from "@noble/curves/ed25519"
import { eq, sql } from "drizzle-orm"

import { db } from "../drizzle/db"
import {
  category as categoryTable,
  launchQuota,
  launchStatus,
  project as projectTable,
  projectToCategory,
  user as userTable,
} from "../drizzle/db/schema"
import { enrichCoinData } from "../lib/coin-data/enrichment"
import { generateUniqueSlug } from "../lib/slug"
import { getPumpFunCoin } from "../lib/coin-data/pumpfun"
import { notifyXNewCoin } from "../lib/x-notification"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const HELIUS_API_KEY = process.env.HELIUS_API_KEY
const SOLANA_WSS_ENDPOINT =
  process.env.SOLANA_WSS_ENDPOINT ||
  (HELIUS_API_KEY ? `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}` : undefined)
const SOLANA_RPC_ENDPOINT =
  process.env.SOLANA_RPC_ENDPOINT ||
  (HELIUS_API_KEY ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}` : undefined)

const PUMPPORTAL_WS_URL = "wss://pumpportal.fun/api/data"
const LAUNCH_HOUR_UTC = 10
const MIN_MARKET_CAP = 5_000
const MAX_CONCURRENT = 3
const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS = 30_000

// Pump AMM (PumpSwap) program
const PUMP_AMM_PROGRAM_ID = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"
const SOL_MINT = "So11111111111111111111111111111111111111112"

// Market account layout: discriminator(8) + pool_bump(1) + index(2) + 6×pubkey(192) + lp_supply(8)
const MARKET_ACCOUNT_LENGTH = 8 + 1 + 2 + 32 * 6 + 8 // 203
const MARKET_DISCRIMINATOR = new Uint8Array([0xf1, 0x9a, 0x6d, 0x04, 0x11, 0xb1, 0x6d, 0xbc])

// ---------------------------------------------------------------------------
// Base58
// ---------------------------------------------------------------------------

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return ""
  let zeros = 0
  for (const b of bytes) {
    if (b !== 0) break
    zeros++
  }
  const ZERO = BigInt(0)
  const BASE = BigInt(58)
  const BYTE = BigInt(256)
  let num = ZERO
  for (const b of bytes) num = num * BYTE + BigInt(b)
  const chars: string[] = []
  while (num > ZERO) {
    chars.unshift(BASE58_ALPHABET[Number(num % BASE)])
    num /= BASE
  }
  return "1".repeat(zeros) + chars.join("")
}

// ---------------------------------------------------------------------------
// Ed25519 on-curve check (filters user-created pools from PDA-created ones)
// ---------------------------------------------------------------------------

function isOnCurve(pubkeyBytes: Uint8Array): boolean {
  try {
    ed25519.ExtendedPoint.fromHex(pubkeyBytes)
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** Mints already processed or in-flight (session-level dedup) */
const processedMints = new Set<string>()
/** Known Pump AMM market pubkeys (for programSubscribe dedup) */
const knownMarkets = new Set<string>()

let activeJobs = 0
let shuttingDown = false

// Per-listener reconnect state
let programSubReconnects = 0
let pumpPortalReconnects = 0
let programSubWs: WebSocket | null = null
let pumpPortalWs: WebSocket | null = null

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

async function getRandomUserId(): Promise<string | null> {
  const [row] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.banned, false))
    .orderBy(sql`RANDOM()`)
    .limit(1)

  return row?.id ?? null
}

async function isAlreadyListed(contractAddress: string): Promise<boolean> {
  const existing = await db.query.project.findFirst({
    where: eq(projectTable.contractAddress, contractAddress),
    columns: { id: true },
  })
  return !!existing
}

// ---------------------------------------------------------------------------
// Market account parsing
// ---------------------------------------------------------------------------

interface MarketAccount {
  poolBump: number
  index: number
  creator: string
  creatorBytes: Uint8Array
  baseMint: string
  quoteMint: string
  lpMint: string
  poolBaseTokenAccount: string
  poolQuoteTokenAccount: string
  lpSupply: bigint
}

function parseMarketAccount(data: Buffer): MarketAccount | null {
  if (data.length < MARKET_ACCOUNT_LENGTH) return null

  let offset = 8 // skip discriminator
  const poolBump = data.readUint8(offset)
  offset += 1
  const index = data.readUint16LE(offset)
  offset += 2

  const creatorBytes = data.subarray(offset, offset + 32)
  const creator = base58Encode(creatorBytes)
  offset += 32
  const baseMint = base58Encode(data.subarray(offset, offset + 32))
  offset += 32
  const quoteMint = base58Encode(data.subarray(offset, offset + 32))
  offset += 32
  const lpMint = base58Encode(data.subarray(offset, offset + 32))
  offset += 32
  const poolBaseTokenAccount = base58Encode(data.subarray(offset, offset + 32))
  offset += 32
  const poolQuoteTokenAccount = base58Encode(data.subarray(offset, offset + 32))
  offset += 32
  const lpSupply = data.readBigUInt64LE(offset)

  return {
    poolBump,
    index,
    creator,
    creatorBytes: new Uint8Array(creatorBytes),
    baseMint,
    quoteMint,
    lpMint,
    poolBaseTokenAccount,
    poolQuoteTokenAccount,
    lpSupply,
  }
}

// ---------------------------------------------------------------------------
// Process a single migration event
// ---------------------------------------------------------------------------

async function processMigration(mint: string, source: string) {
  if (processedMints.has(mint)) return
  processedMints.add(mint)

  if (await isAlreadyListed(mint)) {
    log(`[${source}] Already listed, skipping: ${mint}`)
    return
  }

  const coin = await getPumpFunCoin(mint)
  if (!coin) {
    log(`[${source}] Not a PumpFun coin or fetch failed: ${mint}`)
    return
  }

  if (coin.nsfw || coin.is_banned) {
    log(`[${source}] NSFW/banned, skipping: ${coin.name} (${mint})`)
    return
  }

  if (coin.usd_market_cap < MIN_MARKET_CAP) {
    log(`[${source}] Market cap too low ($${coin.usd_market_cap}), skipping: ${coin.name} (${mint})`)
    return
  }

  const enriched = await enrichCoinData(mint, "solana")

  const name = coin.name || enriched.name || coin.symbol
  const slug = await generateUniqueSlug(name)
  const randomUserId = await getRandomUserId()

  const now = new Date()
  const launchDate = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), LAUNCH_HOUR_UTC, 0, 0, 0),
  )

  const projectId = crypto.randomUUID()

  const memeCategory = await db.query.category.findFirst({
    where: eq(categoryTable.name, "Meme"),
  })

  await db.insert(projectTable).values({
    id: projectId,
    name,
    slug,
    description:
      coin.description ||
      enriched.description ||
      `${name} ($${coin.symbol}) — recently migrated from PumpFun.`,
    websiteUrl:
      coin.website || enriched.websiteUrl || `https://pump.fun/coin/${coin.mint}`,
    logoUrl: coin.image_uri || enriched.logoUrl || undefined,
    ticker: coin.symbol || enriched.ticker || undefined,
    chain: "solana",
    coinType: "existing",
    contractAddress: coin.mint,
    pumpfunUrl: `https://pump.fun/coin/${coin.mint}`,
    twitterUrl: coin.twitter || enriched.twitterUrl || undefined,
    telegramUrl: enriched.telegramUrl || undefined,
    dexscreenerUrl: enriched.dexscreenerData
      ? `https://dexscreener.com/solana/${coin.mint}`
      : undefined,
    marketCap: coin.usd_market_cap || enriched.marketCap || undefined,
    athMarketCap: coin.ath_market_cap || enriched.athMarketCap || undefined,
    priceUsd: enriched.priceUsd || undefined,
    priceChange24h: enriched.priceChange24h || undefined,
    volume24h: enriched.volume24h || undefined,
    liquidity: enriched.liquidity || undefined,
    holders: enriched.holders || undefined,
    totalSupply: String(coin.total_supply) || enriched.totalSupply || undefined,
    pumpfunData: coin,
    dexscreenerData: enriched.dexscreenerData || undefined,
    heliusData: enriched.heliusData || undefined,
    lastEnrichedAt: now,
    createdBy: randomUserId,
    autoListed: true,
    scheduledLaunchDate: launchDate,
    launchType: "free",
    launchStatus: launchStatus.ONGOING,
    createdAt: now,
    updatedAt: now,
  })

  if (memeCategory) {
    await db.insert(projectToCategory).values({
      projectId,
      categoryId: memeCategory.id,
    })
  }

  // Update launch quota
  const quotaResult = await db
    .select()
    .from(launchQuota)
    .where(eq(launchQuota.date, launchDate))
    .limit(1)

  if (quotaResult.length === 0) {
    await db.insert(launchQuota).values({
      id: crypto.randomUUID(),
      date: launchDate,
      freeCount: 1,
      premiumCount: 0,
      premiumPlusCount: 0,
      createdAt: now,
      updatedAt: now,
    })
  } else {
    await db
      .update(launchQuota)
      .set({ freeCount: (quotaResult[0].freeCount ?? 0) + 1, updatedAt: now })
      .where(eq(launchQuota.id, quotaResult[0].id))
  }

  notifyXNewCoin({
    name,
    ticker: coin.symbol,
    chain: "solana",
    slug,
    twitterUrl: coin.twitter || enriched.twitterUrl,
    contractAddress: coin.mint,
  }).catch((err) => console.error("[Migration] X notification failed:", err))

  log(`[${source}] Listed: ${name} ($${coin.symbol}) — ${mint}`)
}

/** Wraps processMigration with concurrency control */
async function handleMigration(mint: string, source: string) {
  if (activeJobs >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (activeJobs < MAX_CONCURRENT) {
          clearInterval(interval)
          resolve()
        }
      }, 200)
    })
  }

  activeJobs++
  try {
    await processMigration(mint, source)
  } catch (err) {
    console.error(`[Migration] Error processing ${mint}:`, err)
  } finally {
    activeJobs--
  }
}

// ---------------------------------------------------------------------------
// Solana programSubscribe listener (primary — catches ALL migrations)
// ---------------------------------------------------------------------------

const DISCRIMINATOR_BASE58 = base58Encode(MARKET_DISCRIMINATOR)

/**
 * Fetch all existing Pump AMM market pubkeys so we only process new ones.
 * Uses dataSlice to avoid downloading full account data.
 */
async function fetchExistingMarkets(): Promise<void> {
  if (!SOLANA_RPC_ENDPOINT) return

  log("[programSubscribe] Fetching existing Pump AMM markets...")
  try {
    const res = await fetch(SOLANA_RPC_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getProgramAccounts",
        params: [
          PUMP_AMM_PROGRAM_ID,
          {
            encoding: "base64",
            commitment: "confirmed",
            dataSlice: { offset: 0, length: 0 },
            filters: [
              { dataSize: MARKET_ACCOUNT_LENGTH },
              { memcmp: { offset: 0, bytes: DISCRIMINATOR_BASE58 } },
              { memcmp: { offset: 75, bytes: SOL_MINT } },
            ],
          },
        ],
      }),
    })

    const data = await res.json()
    const accounts = data?.result ?? []
    for (const acc of accounts) {
      knownMarkets.add(acc.pubkey)
    }
    log(`[programSubscribe] Loaded ${knownMarkets.size} existing markets`)
  } catch (err) {
    console.error("[programSubscribe] Failed to fetch existing markets:", err)
  }
}

function connectProgramSubscribe() {
  if (shuttingDown || !SOLANA_WSS_ENDPOINT) return

  log(`[programSubscribe] Connecting to Solana RPC WebSocket...`)
  programSubWs = new WebSocket(SOLANA_WSS_ENDPOINT)

  programSubWs.onopen = () => {
    programSubReconnects = 0
    log("[programSubscribe] Connected. Subscribing to Pump AMM program updates...")
    programSubWs!.send(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "programSubscribe",
        params: [
          PUMP_AMM_PROGRAM_ID,
          {
            commitment: "confirmed",
            encoding: "base64",
            filters: [
              { dataSize: MARKET_ACCOUNT_LENGTH },
              { memcmp: { offset: 0, bytes: DISCRIMINATOR_BASE58 } },
              { memcmp: { offset: 75, bytes: SOL_MINT } },
            ],
          },
        ],
      }),
    )
  }

  programSubWs.onmessage = (event) => {
    try {
      const msg = JSON.parse(String(event.data))

      // Subscription confirmation
      if (msg.id === 1 && msg.result !== undefined) {
        log(`[programSubscribe] Subscription active (id: ${msg.result})`)
        return
      }

      if (msg.method !== "programNotification") return

      const value = msg.params?.result?.value
      if (!value) return

      const pubkey: string = value.pubkey
      if (knownMarkets.has(pubkey)) return // existing market update (swap, etc.)

      const rawData = value.account?.data?.[0]
      if (!rawData) return

      const accountData = Buffer.from(rawData, "base64")
      const market = parseMarketAccount(accountData)
      if (!market) return

      // Filter user-created pools: migration pools are created by a program (PDA = off-curve)
      if (isOnCurve(market.creatorBytes)) {
        return // user-created pool, not a PumpFun migration
      }

      knownMarkets.add(pubkey)
      log(
        `[programSubscribe] New migration detected — mint: ${market.baseMint}, pool: ${pubkey}`,
      )

      handleMigration(market.baseMint, "programSubscribe")
    } catch {
      // Ignore parse errors on heartbeats etc.
    }
  }

  programSubWs.onerror = (event) => {
    console.error("[programSubscribe] WebSocket error:", event)
  }

  programSubWs.onclose = () => {
    if (shuttingDown) return
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** programSubReconnects, RECONNECT_MAX_MS)
    programSubReconnects++
    log(`[programSubscribe] Disconnected. Reconnecting in ${delay / 1000}s...`)
    setTimeout(connectProgramSubscribe, delay)
  }
}

// ---------------------------------------------------------------------------
// PumpPortal listener (secondary — fast relay for most migrations)
// ---------------------------------------------------------------------------

function connectPumpPortal() {
  if (shuttingDown) return

  log(`[pumpPortal] Connecting to ${PUMPPORTAL_WS_URL}...`)
  pumpPortalWs = new WebSocket(PUMPPORTAL_WS_URL)

  pumpPortalWs.onopen = () => {
    pumpPortalReconnects = 0
    log("[pumpPortal] Connected. Subscribing to migration events...")
    pumpPortalWs!.send(JSON.stringify({ method: "subscribeMigration" }))
  }

  pumpPortalWs.onmessage = (event) => {
    try {
      const raw = String(event.data)
      const data = JSON.parse(raw)

      // Debug: log every event so we can see what PumpPortal sends
      log(`[pumpPortal] Event: ${raw.slice(0, 300)}`)

      const mint: string | undefined = data.mint ?? data.token ?? data.address
      if (!mint) {
        if (data.message || data.status) {
          log(`[pumpPortal] Server: ${data.message ?? data.status}`)
        }
        return
      }
      handleMigration(mint, "pumpPortal")
    } catch {
      // Ignore non-JSON messages
    }
  }

  pumpPortalWs.onerror = (event) => {
    console.error("[pumpPortal] WebSocket error:", event)
  }

  pumpPortalWs.onclose = () => {
    if (shuttingDown) return
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** pumpPortalReconnects, RECONNECT_MAX_MS)
    pumpPortalReconnects++
    log(`[pumpPortal] Disconnected. Reconnecting in ${delay / 1000}s...`)
    setTimeout(connectPumpPortal, delay)
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  log("Shutting down...")
  programSubWs?.close()
  pumpPortalWs?.close()
  setTimeout(() => process.exit(0), 2_000)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  log("PumpFun migration listener starting...")
  log(`Min market cap: $${MIN_MARKET_CAP} | Max concurrent: ${MAX_CONCURRENT}`)

  if (SOLANA_WSS_ENDPOINT) {
    await fetchExistingMarkets()
    connectProgramSubscribe()
    log("[programSubscribe] Primary listener active — catches ALL migrations")
  } else {
    log("[programSubscribe] Skipped — set HELIUS_API_KEY or SOLANA_WSS_ENDPOINT to enable")
  }

  connectPumpPortal()
  log("[pumpPortal] Secondary listener active")
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
