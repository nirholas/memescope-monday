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
import { eq, sql } from "drizzle-orm"

import { LAUNCH_SETTINGS } from "@/lib/constants"
import { getPumpFunGraduatedCoins } from "@/lib/coin-data/pumpfun"
import { enrichCoinData } from "@/lib/coin-data/enrichment"
import { notifyXNewCoin } from "@/lib/x-notification"

const API_KEY = process.env.CRON_API_KEY
const BATCH_SIZE = 10

// ---------------------------------------------------------------------------
// Helpers
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

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const providedKey = authHeader?.replace("Bearer ", "")

    if (!API_KEY || providedKey !== API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Fetch recently graduated coins from PumpFun
    const graduatedCoins = await getPumpFunGraduatedCoins(BATCH_SIZE * 2)

    if (graduatedCoins.length === 0) {
      return NextResponse.json({
        message: "No graduated coins found",
        details: { listed: 0 },
      })
    }

    // 2. Find the "Meme" category for auto-listed coins
    const memeCategory = await db.query.category.findFirst({
      where: eq(categoryTable.name, "Meme"),
    })

    let listed = 0
    let skipped = 0

    for (const coin of graduatedCoins) {
      if (listed >= BATCH_SIZE) break

      // Skip coins without a mint address
      if (!coin.mint) {
        skipped++
        continue
      }

      // Skip NSFW or banned coins
      if (coin.nsfw || coin.is_banned) {
        skipped++
        continue
      }

      // Skip coins already in the database
      if (await isAlreadyListed(coin.mint)) {
        skipped++
        continue
      }

      // Skip coins with very low market cap (likely not real migrations)
      if (coin.usd_market_cap < 5000) {
        skipped++
        continue
      }

      try {
        // 3. Pick a random user as the "submitter"
        const randomUserId = await getRandomUserId()

        // 4. Enrich coin data from multiple sources
        const enriched = await enrichCoinData(coin.mint, "solana")

        // 5. Generate slug and insert project
        const name = coin.name || enriched.name || coin.symbol
        const slug = await generateUniqueSlug(name)

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
          websiteUrl:
            coin.website ||
            enriched.websiteUrl ||
            `https://pump.fun/coin/${coin.mint}`,
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

        // 6. Link to Meme category if it exists
        if (memeCategory) {
          await db.insert(projectToCategory).values({
            projectId,
            categoryId: memeCategory.id,
          })
        }

        // 7. Update daily launch quota
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
            .set({
              freeCount: (quotaResult[0].freeCount ?? 0) + 1,
              updatedAt: now,
            })
            .where(eq(launchQuota.id, quotaResult[0].id))
        }

        // Post to X in the background (don't block listing)
        notifyXNewCoin({
          name,
          ticker: coin.symbol,
          chain: "solana",
          slug,
          twitterUrl: coin.twitter || enriched.twitterUrl,
          contractAddress: coin.mint,
        }).catch((err) => console.error("[Auto-List] X notification failed:", err))

        listed++
        console.log(
          `[Auto-List] Listed ${name} ($${coin.symbol}) — mint: ${coin.mint}, assigned to user: ${randomUserId}`,
        )
      } catch (e) {
        console.error(`[Auto-List] Failed to list ${coin.name} (${coin.mint}):`, e)
      }
    }

    console.log(
      `[${new Date().toISOString()}] Auto-list migrations completed: ${listed} listed, ${skipped} skipped`,
    )

    return NextResponse.json({
      message: "Auto-list migrations completed",
      details: { listed, skipped, candidatesFound: graduatedCoins.length },
    })
  } catch (error) {
    console.error("Error in auto-list migrations:", error)
    return NextResponse.json({ error: "Auto-list failed" }, { status: 500 })
  }
}
