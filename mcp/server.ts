import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { and, count, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/drizzle/db"
import {
  category,
  launchQuota,
  project,
  projectToCategory,
  sponsorship,
  upvote,
  user,
} from "@/drizzle/db/schema"
import {
  enrichCoinData,
  fetchAllTrending,
  fetchCoinDetail,
  fetchTrendingBySource,
  formatMarketCap,
  formatPercentChange,
  formatPrice,
  getDexScreenerPairs,
  getPumpFunCoin,
  searchPumpFunCoins,
} from "@/lib/coin-data"

const server = new McpServer({
  name: "memescope-monday",
  version: "1.0.0",
})

// ─── Projects ────────────────────────────────────────────────────────────────

server.tool(
  "list_projects",
  "List memecoin projects with optional filters. Returns name, slug, ticker, chain, status, market cap, price, and upvote count.",
  {
    chain: z
      .enum(["solana", "base", "bnb", "ethereum"])
      .optional()
      .describe("Filter by blockchain chain"),
    status: z
      .enum(["payment_pending", "payment_failed", "scheduled", "ongoing", "launched"])
      .optional()
      .describe("Filter by launch status"),
    weekLabel: z
      .string()
      .optional()
      .describe('Filter by voting week label, e.g. "2025-W13"'),
    trending: z.boolean().optional().describe("Filter for trending projects only"),
    limit: z.number().min(1).max(100).default(20).describe("Max results (default 20)"),
    offset: z.number().min(0).default(0).describe("Offset for pagination"),
  },
  async ({ chain, status, weekLabel, trending, limit, offset }) => {
    const conditions = []
    if (chain) conditions.push(eq(project.chain, chain))
    if (status) conditions.push(eq(project.launchStatus, status))
    if (weekLabel) conditions.push(eq(project.weekLabel, weekLabel))
    if (trending) conditions.push(eq(project.trending, true))

    const rows = await db
      .select({
        id: project.id,
        name: project.name,
        slug: project.slug,
        ticker: project.ticker,
        chain: project.chain,
        launchStatus: project.launchStatus,
        launchType: project.launchType,
        marketCap: project.marketCap,
        priceUsd: project.priceUsd,
        priceChange24h: project.priceChange24h,
        volume24h: project.volume24h,
        holders: project.holders,
        trending: project.trending,
        weekLabel: project.weekLabel,
        createdAt: project.createdAt,
        upvotes: count(upvote.id),
      })
      .from(project)
      .leftJoin(upvote, eq(project.id, upvote.projectId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(project.id)
      .orderBy(desc(project.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      content: [{ type: "text" as const, text: JSON.stringify(rows, null, 2) }],
    }
  },
)

server.tool(
  "get_project",
  "Get full details for a single project by slug or ID, including categories and upvote count.",
  {
    slug: z.string().optional().describe("Project slug"),
    id: z.string().optional().describe("Project ID"),
  },
  async ({ slug, id }) => {
    if (!slug && !id) {
      return { content: [{ type: "text" as const, text: "Provide either slug or id" }] }
    }

    const condition = slug ? eq(project.slug, slug) : eq(project.id, id!)

    const [row] = await db
      .select({
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        ticker: project.ticker,
        chain: project.chain,
        contractAddress: project.contractAddress,
        websiteUrl: project.websiteUrl,
        logoUrl: project.logoUrl,
        twitterUrl: project.twitterUrl,
        telegramUrl: project.telegramUrl,
        pumpfunUrl: project.pumpfunUrl,
        dexscreenerUrl: project.dexscreenerUrl,
        githubUrl: project.githubUrl,
        launchStatus: project.launchStatus,
        launchType: project.launchType,
        coinType: project.coinType,
        marketCap: project.marketCap,
        athMarketCap: project.athMarketCap,
        priceUsd: project.priceUsd,
        priceChange24h: project.priceChange24h,
        volume24h: project.volume24h,
        holders: project.holders,
        liquidity: project.liquidity,
        trending: project.trending,
        paidExpedited: project.paidExpedited,
        paidTrending: project.paidTrending,
        weekLabel: project.weekLabel,
        scheduledLaunchDate: project.scheduledLaunchDate,
        lastEnrichedAt: project.lastEnrichedAt,
        createdAt: project.createdAt,
        createdBy: project.createdBy,
        upvotes: count(upvote.id),
      })
      .from(project)
      .leftJoin(upvote, eq(project.id, upvote.projectId))
      .where(condition)
      .groupBy(project.id)

    if (!row) {
      return { content: [{ type: "text" as const, text: "Project not found" }] }
    }

    // Fetch categories
    const categories = await db
      .select({ name: category.name })
      .from(projectToCategory)
      .innerJoin(category, eq(projectToCategory.categoryId, category.id))
      .where(eq(projectToCategory.projectId, row.id))

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { ...row, categories: categories.map((c) => c.name) },
            null,
            2,
          ),
        },
      ],
    }
  },
)

server.tool(
  "search_projects",
  "Search projects by name, ticker, or description. Returns matching projects with basic info.",
  {
    query: z.string().min(2).describe("Search term (min 2 chars)"),
    limit: z.number().min(1).max(50).default(10).describe("Max results"),
  },
  async ({ query, limit }) => {
    const searchTerm = `%${query}%`

    const rows = await db
      .select({
        id: project.id,
        name: project.name,
        slug: project.slug,
        ticker: project.ticker,
        chain: project.chain,
        launchStatus: project.launchStatus,
        marketCap: project.marketCap,
        priceUsd: project.priceUsd,
      })
      .from(project)
      .where(
        or(
          ilike(project.name, searchTerm),
          ilike(project.ticker, searchTerm),
          ilike(project.description, searchTerm),
        ),
      )
      .orderBy(desc(project.createdAt))
      .limit(limit)

    return {
      content: [{ type: "text" as const, text: JSON.stringify(rows, null, 2) }],
    }
  },
)

// ─── Categories ──────────────────────────────────────────────────────────────

server.tool(
  "list_categories",
  "List all memecoin categories with project counts.",
  {},
  async () => {
    const rows = await db
      .select({
        id: category.id,
        name: category.name,
        projectCount: count(projectToCategory.projectId),
      })
      .from(category)
      .leftJoin(projectToCategory, eq(category.id, projectToCategory.categoryId))
      .groupBy(category.id)
      .orderBy(desc(count(projectToCategory.projectId)))

    return {
      content: [{ type: "text" as const, text: JSON.stringify(rows, null, 2) }],
    }
  },
)

// ─── Stats ───────────────────────────────────────────────────────────────────

server.tool(
  "get_platform_stats",
  "Get overall platform statistics: total projects, users, upvotes, projects by chain, and projects by status.",
  {},
  async () => {
    const [projectCount] = await db.select({ count: count() }).from(project)
    const [userCount] = await db.select({ count: count() }).from(user)
    const [upvoteCount] = await db.select({ count: count() }).from(upvote)

    const byChain = await db
      .select({ chain: project.chain, count: count() })
      .from(project)
      .groupBy(project.chain)

    const byStatus = await db
      .select({ status: project.launchStatus, count: count() })
      .from(project)
      .groupBy(project.launchStatus)

    const byLaunchType = await db
      .select({ type: project.launchType, count: count() })
      .from(project)
      .groupBy(project.launchType)

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              totalProjects: projectCount.count,
              totalUsers: userCount.count,
              totalUpvotes: upvoteCount.count,
              projectsByChain: byChain,
              projectsByStatus: byStatus,
              projectsByLaunchType: byLaunchType,
            },
            null,
            2,
          ),
        },
      ],
    }
  },
)

// ─── Top Voted / Winners ────────────────────────────────────────────────────

server.tool(
  "get_top_voted",
  "Get top voted projects, optionally filtered by date or week label.",
  {
    weekLabel: z.string().optional().describe('Week label e.g. "2025-W13"'),
    status: z
      .enum(["ongoing", "launched"])
      .optional()
      .describe("Filter by status (default: ongoing)"),
    limit: z.number().min(1).max(50).default(10),
  },
  async ({ weekLabel, status, limit }) => {
    const conditions = []
    if (weekLabel) conditions.push(eq(project.weekLabel, weekLabel))
    if (status) conditions.push(eq(project.launchStatus, status))

    const rows = await db
      .select({
        id: project.id,
        name: project.name,
        slug: project.slug,
        ticker: project.ticker,
        chain: project.chain,
        marketCap: project.marketCap,
        priceUsd: project.priceUsd,
        weekLabel: project.weekLabel,
        dailyRanking: project.dailyRanking,
        upvotes: count(upvote.id),
      })
      .from(project)
      .leftJoin(upvote, eq(project.id, upvote.projectId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(project.id)
      .orderBy(desc(count(upvote.id)))
      .limit(limit)

    return {
      content: [{ type: "text" as const, text: JSON.stringify(rows, null, 2) }],
    }
  },
)

// ─── Launch Availability ────────────────────────────────────────────────────

server.tool(
  "get_launch_availability",
  "Check launch slot availability for a given date. Shows free, premium, and premium_plus counts vs limits.",
  {
    date: z.string().describe("Date in YYYY-MM-DD format"),
  },
  async ({ date }) => {
    const targetDate = new Date(date)
    targetDate.setUTCHours(0, 0, 0, 0)

    const [quota] = await db
      .select()
      .from(launchQuota)
      .where(eq(launchQuota.date, targetDate))

    const FREE_LIMIT = 10
    const PREMIUM_LIMIT = 20
    const TOTAL_LIMIT = 30

    const freeUsed = quota?.freeCount ?? 0
    const premiumUsed = quota?.premiumCount ?? 0
    const premiumPlusUsed = quota?.premiumPlusCount ?? 0
    const totalUsed = freeUsed + premiumUsed + premiumPlusUsed

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              date,
              free: { used: freeUsed, limit: FREE_LIMIT, available: FREE_LIMIT - freeUsed },
              premium: {
                used: premiumUsed,
                limit: PREMIUM_LIMIT,
                available: PREMIUM_LIMIT - premiumUsed,
              },
              premiumPlus: { used: premiumPlusUsed },
              total: { used: totalUsed, limit: TOTAL_LIMIT, available: TOTAL_LIMIT - totalUsed },
            },
            null,
            2,
          ),
        },
      ],
    }
  },
)

// ─── Coin Data (External APIs) ──────────────────────────────────────────────

server.tool(
  "lookup_token",
  "Look up a token by contract address using PumpFun, DexScreener, and Helius. Returns name, ticker, market data, and metadata.",
  {
    contractAddress: z.string().describe("Token contract/mint address"),
    chain: z
      .enum(["solana", "base", "bnb", "ethereum"])
      .default("solana")
      .describe("Blockchain (default: solana)"),
  },
  async ({ contractAddress, chain }) => {
    const data = await enrichCoinData(contractAddress, chain)
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  "get_coin_detail",
  "Get comprehensive coin detail data including market data, PumpFun/DexScreener data, holder info, and news.",
  {
    contractAddress: z.string().describe("Token contract/mint address"),
    chain: z
      .enum(["solana", "base", "bnb", "ethereum"])
      .default("solana")
      .describe("Blockchain"),
    symbol: z.string().optional().describe("Token symbol (for news lookup)"),
  },
  async ({ contractAddress, chain, symbol }) => {
    const data = await fetchCoinDetail(contractAddress, chain, symbol ?? "")
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  "get_trending_tokens",
  "Fetch trending tokens from CoinGecko, DexScreener, PumpFun, and/or Birdeye.",
  {
    source: z
      .enum(["coingecko", "dexscreener", "pumpfun", "birdeye", "all"])
      .default("all")
      .describe("Trending source (default: all)"),
  },
  async ({ source }) => {
    if (source === "all") {
      const data = await fetchAllTrending()
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      }
    }
    const data = await fetchTrendingBySource(source)
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  "search_pumpfun",
  "Search for tokens on PumpFun by name or ticker.",
  {
    query: z.string().describe("Search query"),
    limit: z.number().min(1).max(50).default(10),
  },
  async ({ query, limit }) => {
    const results = await searchPumpFunCoins(query, limit)
    return {
      content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
    }
  },
)

server.tool(
  "get_dexscreener_pairs",
  "Get all trading pairs for a token from DexScreener.",
  {
    contractAddress: z.string().describe("Token contract address"),
  },
  async ({ contractAddress }) => {
    const pairs = await getDexScreenerPairs(contractAddress)
    return {
      content: [{ type: "text" as const, text: JSON.stringify(pairs, null, 2) }],
    }
  },
)

// ─── Users ──────────────────────────────────────────────────────────────────

server.tool(
  "list_users",
  "List users with basic info. Excludes sensitive fields like passwords and tokens.",
  {
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
    role: z.string().optional().describe('Filter by role (e.g. "admin")'),
  },
  async ({ limit, offset, role }) => {
    const conditions = []
    if (role) conditions.push(eq(user.role, role))

    const rows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      content: [{ type: "text" as const, text: JSON.stringify(rows, null, 2) }],
    }
  },
)

// ─── Sponsorships ───────────────────────────────────────────────────────────

server.tool(
  "list_sponsorships",
  "List sponsorships with optional status filter.",
  {
    status: z
      .enum(["active", "expired", "cancelled"])
      .optional()
      .describe("Filter by status"),
    limit: z.number().min(1).max(50).default(10),
  },
  async ({ status, limit }) => {
    const conditions = []
    if (status) conditions.push(eq(sponsorship.status, status))

    const rows = await db
      .select()
      .from(sponsorship)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(sponsorship.createdAt))
      .limit(limit)

    return {
      content: [{ type: "text" as const, text: JSON.stringify(rows, null, 2) }],
    }
  },
)

// ─── Leaderboard ────────────────────────────────────────────────────────────

server.tool(
  "get_leaderboard",
  "Get user leaderboard ranked by total upvotes received on their submitted projects.",
  {
    limit: z.number().min(1).max(50).default(10),
  },
  async ({ limit }) => {
    const rows = await db
      .select({
        userId: user.id,
        userName: user.name,
        totalUpvotes: count(upvote.id),
        projectCount: sql<number>`count(distinct ${project.id})`,
      })
      .from(user)
      .innerJoin(project, eq(user.id, project.createdBy))
      .innerJoin(upvote, eq(project.id, upvote.projectId))
      .groupBy(user.id, user.name)
      .orderBy(desc(count(upvote.id)))
      .limit(limit)

    return {
      content: [{ type: "text" as const, text: JSON.stringify(rows, null, 2) }],
    }
  },
)

// ─── Start server ───────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error("MCP server error:", err)
  process.exit(1)
})
