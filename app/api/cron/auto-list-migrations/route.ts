import { NextRequest, NextResponse } from "next/server"

import { db } from "@/drizzle/db"
import {
  category as categoryTable,
  launchQuota,
  launchStatus,
  project as projectTable,
  projectToCategory,
  user as userTable,
} from "@/drizzle/db/schema"
import { ed25519 } from "@noble/curves/ed25519"
import { eq, inArray, sql } from "drizzle-orm"

import { LAUNCH_SETTINGS } from "@/lib/constants"
import { getPumpFunCoin, getPumpFunGraduatedCoins } from "@/lib/coin-data/pumpfun"
import { enrichCoinData } from "@/lib/coin-data/enrichment"
import { notifyXNewCoin } from "@/lib/x-notification"
import { generateUniqueSlug } from "@/lib/slug"

// Vercel cron sends CRON_SECRET; also support legacy CRON_API_KEY
const CRON_SECRET = process.env.CRON_SECRET
const CRON_API_KEY = process.env.CRON_API_KEY
const BATCH_SIZE = 20

// Allow up to 60s on Vercel Pro
export const maxDuration = 60

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pick a random user ID from the database */
async function getRandomUserId(): Promise<string | null> {
  const [row] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.banned, false))
    .orderBy(sql`RANDOM()`)
    .limit(1)

  return row?.id ?? null
}

/** Check if a coin with this contract address is already listed */
async function isAlreadyListed(contractAddress: string): Promise<boolean> {
  const existing = await db.query.project.findFirst({
    where: eq(projectTable.contractAddress, contractAddress),
    columns: { id: true },
  })
  return !!existing
}

// ---------------------------------------------------------------------------
// GET /api/cron/auto-list-migrations
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Pump AMM RPC — fetch new market mints directly from Solana
// ---------------------------------------------------------------------------

const PUMP_AMM_PROGRAM_ID = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"

// PumpSwap Pool layout: discriminator(8) pool_bump(1) index(2) creator(32 @ 11)
// base_mint(32 @ 43) quote_mint(32 @ 75) ... A pool is 211 to 287 bytes depending
// on its age, or 300+ once grown by extend_account, so the scan filters by
// discriminator, never by size.
const POOL_CREATOR_OFFSET = 11
const POOL_CREATOR_AND_BASE_MINT_LENGTH = 64

// Postgres caps a statement at 65535 bind parameters; stay well under it.
const LISTED_LOOKUP_CHUNK = 1_000

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

const DISCRIMINATOR_BASE58 = base58Encode(
  new Uint8Array([0xf1, 0x9a, 0x6d, 0x04, 0x11, 0xb1, 0x6d, 0xbc]),
)

/** Pump migration pools are created by Pump's pool-authority PDA, which is off the ed25519 curve. */
function isOnCurve(pubkeyBytes: Uint8Array): boolean {
  try {
    ed25519.ExtendedPoint.fromHex(pubkeyBytes)
    return true
  } catch {
    return false
  }
}

/** Return the subset of `mints` that already has a project row. */
async function findListedMints(mints: string[]): Promise<Set<string>> {
  const listed = new Set<string>()
  for (let i = 0; i < mints.length; i += LISTED_LOOKUP_CHUNK) {
    const chunk = mints.slice(i, i + LISTED_LOOKUP_CHUNK)
    const rows = await db
      .select({ contractAddress: projectTable.contractAddress })
      .from(projectTable)
      .where(inArray(projectTable.contractAddress, chunk))
    for (const row of rows) {
      if (row.contractAddress) listed.add(row.contractAddress)
    }
  }
  return listed
}

/**
 * Fetch base mints of Pump migration pools on PumpSwap via Solana RPC.
 * Uses dataSlice to download only creator + base_mint (offsets 11..75) and
 * keeps pools whose creator is a PDA (Pump's pool authority), so pools users
 * opened by hand are skipped. Every quote mint is included: since the October
 * 2026 Pump upgrade a coin can be quoted in SOL, USDC or another pump coin and
 * migrates into a pool in that quote.
 * Returns mints that are NOT already in our project table.
 */
async function fetchNewMarketMintsFromRPC(): Promise<string[]> {
  const apiKey = process.env.HELIUS_API_KEY
  if (!apiKey) return []

  const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`

  try {
    // Fetch only the creator + base_mint slice of every PumpSwap pool, then
    // cross-reference the base mints with the project table
    const res = await fetch(rpcUrl, {
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
            dataSlice: {
              offset: POOL_CREATOR_OFFSET,
              length: POOL_CREATOR_AND_BASE_MINT_LENGTH,
            },
            filters: [{ memcmp: { offset: 0, bytes: DISCRIMINATOR_BASE58 } }],
          },
        ],
      }),
    })

    const json = await res.json()
    const accounts = json?.result ?? []

    if (accounts.length === 0) return []

    // Decode creator (bytes 0..32) and base_mint (bytes 32..64) from each slice
    const migratedMints = new Set<string>()
    for (const acc of accounts as { pubkey: string; account: { data: [string, string] } }[]) {
      const raw = Buffer.from(acc.account.data[0], "base64")
      if (raw.length < POOL_CREATOR_AND_BASE_MINT_LENGTH) continue
      if (isOnCurve(raw.subarray(0, 32))) continue // user-created pool, not a Pump migration
      migratedMints.add(base58Encode(raw.subarray(32, 64)))
    }
    const allMints = [...migratedMints]

    // Batch-check which mints are NOT in our DB
    const existingSet = await findListedMints(allMints)
    return allMints.filter((m: string) => !existingSet.has(m))
  } catch (err) {
    console.error("[Auto-List] RPC market fetch failed:", err)
    return []
  }
}

// ---------------------------------------------------------------------------
// List a single coin (shared between both sources)
// ---------------------------------------------------------------------------

async function listCoin(
  mint: string,
  memeCategory: { id: string } | undefined,
  source: string,
): Promise<boolean> {
  if (await isAlreadyListed(mint)) return false

  const coin = await getPumpFunCoin(mint)
  if (!coin) return false
  if (coin.nsfw || coin.is_banned) return false
  if (coin.usd_market_cap < 5000) return false

  const enriched = await enrichCoinData(mint, "solana")
  const name = coin.name || enriched.name || coin.symbol
  const slug = await generateUniqueSlug(name)
  const randomUserId = await getRandomUserId()

  const now = new Date()
  const launchDate = new Date(
    Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      LAUNCH_SETTINGS.LAUNCH_HOUR_UTC,
      0,
      0,
      0,
    ),
  )

  const projectId = crypto.randomUUID()

  await db.insert(projectTable).values({
    id: projectId,
    name,
    slug,
    description:
      coin.description ||
      enriched.description ||
      `${name} ($${coin.symbol}) — recently migrated from PumpFun.`,
    websiteUrl: coin.website || enriched.websiteUrl || `https://pump.fun/coin/${coin.mint}`,
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
    await db.insert(projectToCategory).values({ projectId, categoryId: memeCategory.id })
  }

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
  }).catch((err) => console.error("[Auto-List] X notification failed:", err))

  console.log(`[Auto-List] [${source}] Listed ${name} ($${coin.symbol}) — ${mint}`)
  return true
}

// ---------------------------------------------------------------------------
// GET /api/cron/auto-list-migrations
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    // Auth: Vercel cron sends CRON_SECRET; also accept legacy CRON_API_KEY
    const authHeader = request.headers.get("authorization")
    const providedKey = authHeader?.replace("Bearer ", "")
    const validKey = CRON_SECRET || CRON_API_KEY

    if (!validKey || providedKey !== validKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const memeCategory = await db.query.category.findFirst({
      where: eq(categoryTable.name, "Meme"),
    })

    let listed = 0
    let skipped = 0

    // ── Source 1: PumpFun graduated coins API ─────────────────────────
    const graduatedCoins = await getPumpFunGraduatedCoins(BATCH_SIZE * 3)

    for (const coin of graduatedCoins) {
      if (listed >= BATCH_SIZE) break
      if (!coin.mint || coin.nsfw || coin.is_banned || coin.usd_market_cap < 5000) {
        skipped++
        continue
      }
      try {
        const didList = await listCoin(coin.mint, memeCategory, "pumpfun-api")
        if (didList) listed++
        else skipped++
      } catch (e) {
        console.error(`[Auto-List] Failed to list ${coin.name} (${coin.mint}):`, e)
      }
    }

    // ── Source 2: Solana RPC — new Pump AMM markets ──────────────────
    // Catches migrations the PumpFun API might miss (truncated logs, etc.)
    const rpcMints = await fetchNewMarketMintsFromRPC()
    let rpcListed = 0

    for (const mint of rpcMints.slice(0, 10)) {
      if (listed + rpcListed >= BATCH_SIZE) break
      try {
        const didList = await listCoin(mint, memeCategory, "rpc")
        if (didList) rpcListed++
      } catch (e) {
        console.error(`[Auto-List] RPC mint failed: ${mint}`, e)
      }
    }

    console.log(
      `[${new Date().toISOString()}] Auto-list migrations: ${listed + rpcListed} listed (${listed} api, ${rpcListed} rpc), ${skipped} skipped`,
    )

    return NextResponse.json({
      message: "Auto-list migrations completed",
      details: {
        listed: listed + rpcListed,
        listedFromApi: listed,
        listedFromRpc: rpcListed,
        skipped,
        candidatesFound: graduatedCoins.length,
        rpcCandidates: rpcMints.length,
      },
    })
  } catch (error) {
    console.error("Error in auto-list migrations:", error)
    return NextResponse.json({ error: "Auto-list failed" }, { status: 500 })
  }
}
