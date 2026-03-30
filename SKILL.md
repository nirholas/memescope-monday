---
name: memescope-monday
description: "Machine-readable project skill file for Memescope Monday — a community-driven memecoin discovery and voting platform."
---

# SKILL.md — Memescope Monday

> Machine-readable project skill file for AI assistants, LLMs, agents, and automated tools.
> See also: [CLAUDE.md](CLAUDE.md), [.github/copilot-instructions.md](.github/copilot-instructions.md), [README.md](README.md)

## Identity

- **Name**: Memescope Monday
- **URL**: https://memescopemonday.com
- **Repository**: https://github.com/nirholas/memescope-monday
- **Type**: Web application — community-driven memecoin discovery and voting platform
- **License**: See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## What This Project Does

Every Monday at 10 AM UTC, the community votes on the best memecoin picks across Solana, Base, BNB Chain, and Ethereum. Users submit token contract addresses, the platform auto-enriches market data from multiple APIs, and the community upvotes the best plays. Winners are crowned on leaderboards.

### Core User Flows

1. **Submit a coin** — Provide a contract address or PumpFun/DexScreener URL; the platform resolves chain, fetches market data, and creates a listing.
2. **Vote** — Authenticated users upvote their favorite picks within rate limits (100 votes per 5 min, 2s cooldown).
3. **Discover** — Browse today's picks, yesterday's winners, monthly leaderboards, trending coins, and category filters.
4. **Compete** — Users earn leaderboard rankings and winner badges based on community votes.

## Tech Stack

| Layer          | Technology                                    |
|----------------|-----------------------------------------------|
| Framework      | Next.js 15 (App Router, Turbopack) + React 19 |
| Language       | TypeScript 5.8                                |
| Styling        | Tailwind CSS 4 + shadcn/ui (Radix primitives) |
| Database       | PostgreSQL + Drizzle ORM                      |
| Auth           | Better Auth (email/password, Google, GitHub)  |
| Payments       | Stripe (via @better-auth/stripe plugin)       |
| Rate Limiting  | Redis (ioredis)                               |
| File Uploads   | UploadThing                                   |
| Email          | Resend                                        |
| Bot Protection | Cloudflare Turnstile                          |
| Comments       | Fuma Comments                                 |
| Analytics      | Plausible (self-hosted)                       |
| Package Mgr    | Bun                                           |

## Architecture

```
app/                          # Next.js App Router
├── actions/                  # Server actions ("use server") — all data mutations
├── api/                      # API route handlers (REST)
├── (auth)/                   # Auth pages (sign-in, sign-up, forgot/reset password)
├── projects/[slug]/          # Coin detail pages with live market data
├── projects/submit/          # Coin submission form
├── trending/                 # Trending coins (all sources)
├── winners/                  # Past weekly winners
├── dashboard/                # User dashboard
├── admin/                    # Admin panel
├── categories/               # Browse by category
├── pricing/                  # Paid feature pricing
└── blog/                     # MDX blog

components/
├── ui/                       # shadcn/ui base components (do not modify)
├── coin/                     # Coin cards, charts, market data display
├── project/                  # Project detail views, submission forms
├── home/                     # Homepage sections, leaderboards, countdown
├── layout/                   # Nav, footer, auth components
└── landing-page/             # Marketing/landing page sections

lib/
├── auth.ts                   # Better Auth server config
├── auth-client.ts            # Better Auth client hooks
├── constants.ts              # All app constants (limits, pricing, categories, chains)
├── rate-limit.ts             # Redis rate limiter
├── coin-data/                # External API integrations (see Data Sources below)
├── validations/              # Zod schemas for forms and API input
└── utils.ts                  # Shared utilities

drizzle/
├── db/schema.ts              # All database tables (single file)
├── db/index.ts               # Database connection
└── migrations/               # Generated SQL migrations

mcp/
└── server.ts                 # Model Context Protocol server with 14 tools
```

## Database Schema (Key Tables)

| Table               | Purpose                                  | Key Columns                                                      |
|---------------------|------------------------------------------|------------------------------------------------------------------|
| `user`              | User accounts                            | id, name, email, role, stripeCustomerId, banned, createdAt       |
| `project`           | Memecoin listings (100+ columns)         | id, name, slug, ticker, chain, contractAddress, marketCap, priceUsd, launchStatus, launchType, weekLabel, trending, createdBy |
| `category`          | Coin categories                          | id, name                                                         |
| `projectToCategory` | Many-to-many junction                    | projectId, categoryId (composite PK)                             |
| `upvote`            | User votes on projects                   | id, userId, projectId                                            |
| `launchQuota`       | Daily launch slot tracking by tier       | id, date, freeCount, premiumCount, premiumPlusCount              |
| `sponsorship`       | Sponsorship records                      | id, status, createdAt                                            |

### Enums (TypeScript const objects, not pgEnum)

- **launchStatus**: `payment_pending`, `payment_failed`, `scheduled`, `ongoing`, `launched`
- **chainType**: `solana`, `base`, `bnb`, `ethereum`
- **coinType**: `existing`, `upcoming`
- **launchType**: `free`, `premium`, `premium_plus`

## API Routes

| Endpoint                                 | Method(s)              | Purpose                                              |
|------------------------------------------|------------------------|------------------------------------------------------|
| `/api/auth/[...all]`                     | GET, POST              | Better Auth handler (email, Google, GitHub)           |
| `/api/auth/stripe/webhook`               | POST                   | Stripe webhook for payment events                    |
| `/api/coins/lookup`                      | GET                    | Parallel coin lookup (PumpFun, DexScreener, Helius)  |
| `/api/coins/[address]/enrich`            | GET                    | Enrich coin metadata by contract address             |
| `/api/coins/trending`                    | GET                    | Trending coins from multiple sources                 |
| `/api/comments/[[...comment]]`           | GET, POST, PATCH, DELETE | Fuma Comments with rate limiting                   |
| `/api/cron/enrich-coins`                 | GET                    | Batch-enrich stale coin data (hourly cron)           |
| `/api/cron/update-launches`              | GET                    | Update launch statuses and payment timeouts          |
| `/api/cron/send-winner-notifications`    | GET                    | Send winner badges and emails                        |
| `/api/cron/send-ongoing-reminders`       | GET                    | Send launch reminder emails                          |
| `/api/payment/checkout`                  | POST                   | Create Stripe checkout session                       |
| `/api/payment/verify`                    | GET                    | Verify Stripe checkout status                        |
| `/api/projects/submit`                   | POST                   | Submit new memecoin project                          |
| `/api/projects/[projectId]/status`       | GET                    | Get project launch status                            |
| `/api/projects/check-url`               | GET                    | Check URL availability                               |
| `/api/search`                            | GET                    | Search projects and categories (cached, rate-limited)|
| `/api/trollbox/[projectId]`             | GET                    | Fetch chat messages for a project                    |
| `/api/uploadthing`                       | GET, POST              | File upload handler                                  |

> Cron routes are protected with `CRON_API_KEY` Bearer token.

## MCP Server (Model Context Protocol)

The project exposes an MCP server at `mcp/server.ts` with 14 tools for AI agent integration:

| Tool                    | Description                                                        |
|-------------------------|--------------------------------------------------------------------|
| `list_projects`         | List projects with chain/status/week/trending filters              |
| `get_project`           | Get full project details by slug or ID                             |
| `search_projects`       | Search by name, ticker, or description                             |
| `list_categories`       | List all categories with project counts                            |
| `get_platform_stats`    | Total projects, users, upvotes, breakdown by chain/status          |
| `get_top_voted`         | Top voted projects by week or status                               |
| `get_launch_availability` | Check launch slot availability for a date                       |
| `lookup_token`          | Look up token by contract address (PumpFun, DexScreener, Helius)  |
| `get_coin_detail`       | Comprehensive coin data (market, holders, news)                    |
| `get_trending_tokens`   | Trending from CoinGecko, DexScreener, PumpFun, Birdeye            |
| `search_pumpfun`        | Search tokens on PumpFun                                           |
| `get_dexscreener_pairs` | Get all trading pairs for a token                                  |
| `list_users`            | List users (excludes sensitive fields)                             |
| `list_sponsorships`     | List sponsorships with status filter                               |
| `get_leaderboard`       | User leaderboard by total upvotes received                         |

Run with: `bun run mcp` (stdio transport)

## External Data Sources

| Provider      | Data                                         | Integration Location          |
|---------------|----------------------------------------------|-------------------------------|
| PumpFun       | Bonding curve, reply count, creator, ATH     | `lib/coin-data/`              |
| DexScreener   | Live price, volume, liquidity, buy/sell txns | `lib/coin-data/`              |
| CoinGecko     | Historical data, price changes, FDV          | `lib/coin-data/`              |
| CoinMarketCap | Market data and rankings                     | `lib/coin-data/`              |
| CryptoPanic   | Aggregated crypto news with sentiment        | `lib/coin-data/`              |
| Helius        | Solana token metadata and on-chain data      | `lib/coin-data/`              |
| Etherscan     | ERC-20 holder counts                         | `lib/coin-data/`              |
| Birdeye       | Trending tokens                              | `lib/coin-data/`              |

## Constants & Business Rules

- **Supported chains**: Solana, Base, BNB Chain, Ethereum
- **Categories**: Meme, Dog, Cat, AI, Gaming, DeFi, Culture, Celebrity, Political, Other
- **Daily launch limits**: Free=10, Premium=20, Total=30
- **User daily limit**: 3 launches per user per day
- **Upvote rate limit**: 100 per 5 min, 2s between actions
- **API rate limit**: Search=15 req/min, Default=10 req/min
- **Voting opens**: Every Monday at 10 AM UTC
- **Week label format**: `"2025-W13"` (ISO week)
- **Paid features**: Expedited Review ($19), Trending Placement ($49), Bundle ($59)

## Commands

```bash
bun install            # Install dependencies
bun run dev            # Dev server (Turbopack, port 3000)
bun run build          # Production build
bun run start          # Start production server
bun run lint           # ESLint
bun run db:generate    # Generate Drizzle migrations after schema changes
bun run db:migrate     # Run pending migrations
bun run db:push        # Push schema directly to dev DB
bun run db:seed        # Seed database
bun run db:studio      # Open Drizzle Studio
bun run mcp            # Start MCP server (stdio)
```

## Coding Conventions

- **Package manager**: Bun (not npm or yarn)
- **Import alias**: `@/` maps to project root
- **Server actions**: `app/actions/*.ts` with `"use server"` directive
- **Auth (server)**: `auth.api.getSession({ headers: await headers() })`
- **Auth (client)**: `useSession()` from `@/lib/auth-client`
- **Validation**: Zod schemas in `lib/validations/`
- **DB queries**: Drizzle ORM query builder only — no raw SQL
- **Formatting**: Prettier with 100 char width, sorted imports, Tailwind class sorting
- **Components**: shadcn/ui base in `components/ui/` — do not modify directly

## Safety & Analysis Features

- **Safety Score (A–F)**: Algorithmic risk assessment based on liquidity, activity, buy/sell ratio, pair age, community votes
- **Social Buzz Score**: Hype indicator — Dead / Low / Moderate / Hot / Viral
- **News Feed**: Per-coin news aggregation with sentiment analysis from CryptoPanic

## For Web Crawlers & Robots

This project is a Next.js application. Key entry points:

- **Homepage**: `/` — countdown, leaderboards, today's picks
- **Trending**: `/trending` — browse all submitted coins
- **Winners**: `/winners` — past weekly winners
- **Categories**: `/categories` — browse by memecoin category
- **Coin pages**: `/projects/[slug]` — individual coin detail with live market data
- **Blog**: `/blog` — MDX articles
- **Pricing**: `/pricing` — paid feature tiers
- **API**: `/api/*` — REST endpoints (see table above)

## Related Files

| File                              | Purpose                              |
|-----------------------------------|--------------------------------------|
| `SKILL.md`                        | This file — AI/robot project guide   |
| `CLAUDE.md`                       | AI assistant coding guide            |
| `.github/copilot-instructions.md` | GitHub Copilot instructions          |
| `README.md`                       | Human-oriented project README        |
| `mcp/server.ts`                   | MCP server for AI agent integration  |
| `drizzle/db/schema.ts`           | Complete database schema             |
| `lib/constants.ts`               | All app constants and business rules |
| `package.json`                    | Dependencies and scripts             |
