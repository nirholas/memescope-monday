/**
 * Real-time PumpFun migration listener.
 *
 * Connects to the PumpPortal WebSocket and auto-lists every token that
 * graduates (completes its bonding curve) on PumpFun.
 *
 * Usage:  bun run migrations:listen
 */
import "dotenv/config"

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
import { getPumpFunCoin } from "../lib/coin-data/pumpfun"
import { notifyXNewCoin } from "../lib/x-notification"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WS_URL = "wss://pumpportal.fun/api/data"
const LAUNCH_HOUR_UTC = 10
const MIN_MARKET_CAP = 5_000
const MAX_CONCURRENT = 3
const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS = 30_000

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** Mints we've already processed or are currently processing (session-level dedup) */
const processedMints = new Set<string>()
let activeJobs = 0
let reconnectAttempts = 0
let ws: WebSocket | null = null
let shuttingDown = false

// ---------------------------------------------------------------------------
// Helpers (same as cron route)
// ---------------------------------------------------------------------------

async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  const existing = await db.query.project.findFirst({
    where: eq(projectTable.slug, baseSlug),
  })

  if (!existing) return baseSlug

  const randomSuffix = Math.floor(Math.random() * 10000)
  return `${baseSlug}-${randomSuffix}`
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
// Process a single migration event
// ---------------------------------------------------------------------------

async function processMigration(mint: string) {
  if (processedMints.has(mint)) return
  processedMints.add(mint)

  // DB-level dedup check
  if (await isAlreadyListed(mint)) {
    log(`Already listed, skipping: ${mint}`)
    return
  }

  // Fetch full coin data from PumpFun
  const coin = await getPumpFunCoin(mint)
  if (!coin) {
    log(`Could not fetch coin data for ${mint}, skipping`)
    return
  }

  // Skip NSFW / banned
  if (coin.nsfw || coin.is_banned) {
    log(`NSFW/banned, skipping: ${coin.name} (${mint})`)
    return
  }

  // Skip very low market cap
  if (coin.usd_market_cap < MIN_MARKET_CAP) {
    log(`Market cap too low ($${coin.usd_market_cap}), skipping: ${coin.name} (${mint})`)
    return
  }

  // Enrich from multiple sources
  const enriched = await enrichCoinData(mint, "solana")

  const name = coin.name || enriched.name || coin.symbol
  const slug = await generateUniqueSlug(name)
  const randomUserId = await getRandomUserId()

  const now = new Date()
  const launchDate = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), LAUNCH_HOUR_UTC, 0, 0, 0),
  )

  const projectId = crypto.randomUUID()

  // Find Meme category
  const memeCategory = await db.query.category.findFirst({
    where: eq(categoryTable.name, "Meme"),
  })

  // Insert project
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

  // Link to Meme category
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

  // Post to X (non-blocking)
  notifyXNewCoin({
    name,
    ticker: coin.symbol,
    chain: "solana",
    slug,
    twitterUrl: coin.twitter || enriched.twitterUrl,
    contractAddress: coin.mint,
  }).catch((err) => console.error("[Migration] X notification failed:", err))

  log(`Listed: ${name} ($${coin.symbol}) — ${mint}`)
}

/** Wraps processMigration with concurrency control and error handling */
async function handleMigration(mint: string) {
  if (activeJobs >= MAX_CONCURRENT) {
    // Wait for a slot to free up
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
    await processMigration(mint)
  } catch (err) {
    console.error(`[Migration] Error processing ${mint}:`, err)
  } finally {
    activeJobs--
  }
}

// ---------------------------------------------------------------------------
// WebSocket connection
// ---------------------------------------------------------------------------

function connect() {
  if (shuttingDown) return

  log(`Connecting to ${WS_URL}...`)
  ws = new WebSocket(WS_URL)

  ws.onopen = () => {
    reconnectAttempts = 0
    log("Connected. Subscribing to migration events...")
    ws!.send(JSON.stringify({ method: "subscribeMigration" }))
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(String(event.data))

      // Extract mint from the migration event
      const mint: string | undefined = data.mint ?? data.token ?? data.address
      if (!mint) {
        // Could be a subscription confirmation or heartbeat
        if (data.message || data.status) {
          log(`Server: ${data.message ?? data.status}`)
        }
        return
      }

      // Fire-and-forget — handleMigration manages its own concurrency
      handleMigration(mint)
    } catch {
      // Ignore non-JSON messages (heartbeats, etc.)
    }
  }

  ws.onerror = (event) => {
    console.error("[Migration] WebSocket error:", event)
  }

  ws.onclose = () => {
    if (shuttingDown) return
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempts, RECONNECT_MAX_MS)
    reconnectAttempts++
    log(`Disconnected. Reconnecting in ${delay / 1000}s...`)
    setTimeout(connect, delay)
  }
}

// ---------------------------------------------------------------------------
// Logging & lifecycle
// ---------------------------------------------------------------------------

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  log("Shutting down...")
  ws?.close()
  // Allow in-flight jobs a moment to finish
  setTimeout(() => process.exit(0), 2_000)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

log("PumpFun migration listener starting...")
log(`Min market cap: $${MIN_MARKET_CAP} | Max concurrent: ${MAX_CONCURRENT}`)
connect()
