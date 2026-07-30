<p align="center">
  <img src="public/images/banner.svg" alt="Memescope Monday" width="900"/>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js"/></a>
  <a href="https://reactjs.org"><img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React"/></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript" alt="TypeScript"/></a>
</p>

<p align="center">
  <strong>The community-driven memecoin directory.</strong><br/>
  Every Monday at 10 AM UTC, the community votes together on the best memecoin plays across Solana, Base, and BNB Chain.<br/>
  Submit your picks, upvote the best, ride together.
</p>

---

## Features

### Core

- **Coin Discovery** — Browse and discover memecoin picks submitted by the community
- **Upvoting** — Vote on the best plays; daily winners get highlighted
- **Rich Coin Pages** — Live market data, DexScreener charts, buy/sell ratios, PumpFun bonding curve status
- **Multi-Chain** — Solana (PumpFun), Base, and BNB Chain support
- **Submit Picks** — Share your memecoin finds with the community
- **Comments** — Discuss plays with other traders
- **Leaderboards** — Today's top picks, yesterday's winners, best of month
- **Launch Countdown** — Live countdown to 10 AM UTC every Monday

### Market Data (Multi-API)

- **PumpFun** — Bonding curve status, reply count, creator info, ATH market cap
- **DexScreener** — Live price, volume, liquidity, buy/sell txns, embedded charts
- **CoinGecko** — Historical data, price changes, market cap, FDV
- **CoinMarketCap** — Additional market data and rankings
- **CryptoPanic** — Aggregated crypto news with sentiment
- **Helius** — Solana token metadata and on-chain data
- **Etherscan** — ERC-20 holder counts

### Safety & Analysis

- **Safety Score (A-F)** — Algorithmic risk assessment based on liquidity, trading activity, buy/sell ratio, pair age, and community votes
- **Social Buzz Score** — Hype indicator (Dead / Low / Moderate / Hot / Viral)
- **News Feed** — Per-coin news with sentiment analysis

### Platform

- **Auth** — Email/password + Google + GitHub sign-in (Better Auth)
- **Admin Panel** — Manage submissions and users
- **Stripe Payments** — Premium launch slots (Expedited Review, Trending Placement)
- **Rate Limiting** — Redis-based anti-spam on votes, comments, and API
- **Discord Notifications** — New submissions and winner announcements
- **Email Notifications** — Transactional emails via Resend
- **Dark/Light Theme** — Full theme support

## Quick Start

The committed lockfile is `bun.lockb`, so [Bun](https://bun.sh) is the package
manager this project installs with.

```bash
# Clone
git clone https://github.com/nirholas/memescope-monday.git
cd memescope-monday

# Install
bun install

# Configure
cp .env.example .env.local
# Edit .env.local with your keys (see Environment Variables below)

# Database: apply the committed migrations in drizzle/migrations/
bun run db:migrate

# Run
bun run dev
```

Visit `http://localhost:3000`

`db:migrate` applies the migrations that are already in the repo, which is what
you want on a fresh clone. Use `db:generate` only after you edit
`drizzle/db/schema.ts`, and `db:push` only to sync a throwaway dev database
without writing a migration. Do not run all three in sequence.

## Environment Variables

### Required

| Variable             | Description                  |
| -------------------- | ---------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Auth secret key              |
| `BETTER_AUTH_URL`    | App URL for auth callbacks   |
| `NEXT_PUBLIC_URL`    | Public app URL               |

### Crypto Data APIs

| Variable              | Description             |
| --------------------- | ----------------------- |
| `HELIUS_API_KEY`      | Solana token metadata   |
| `CMC_API_KEY`         | CoinMarketCap data      |
| `COINGECKO_API_KEY`   | CoinGecko market data   |
| `CRYPTOPANIC_API_KEY` | Crypto news aggregation |
| `ETHERSCAN_API_KEY`   | ERC-20 token data       |

### Services (Optional)

| Variable                | Description               |
| ----------------------- | ------------------------- |
| `STRIPE_SECRET_KEY`     | Payment processing        |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing    |
| `RESEND_API_KEY`        | Transactional emails      |
| `REDIS_URL`             | Rate limiting             |
| `DISCORD_WEBHOOK_URL`   | Notifications             |
| `PLAUSIBLE_SITE_ID`     | Analytics                 |
| `TURNSTILE_SECRET_KEY`  | Cloudflare bot protection |

See [.env.example](.env.example) for the full list.

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Framework      | Next.js 15 + React 19               |
| Language       | TypeScript 5.8                      |
| Styling        | Tailwind CSS + shadcn/ui            |
| Database       | PostgreSQL + Drizzle ORM            |
| Auth           | Better Auth (email, Google, GitHub) |
| Payments       | Stripe                              |
| Cache          | Redis                               |
| Email          | Resend                              |
| Files          | UploadThing                         |
| Bot Protection | Cloudflare Turnstile                |
| Comments       | Fuma Comments                       |

## How Coin Detail Pages Work

When a user submits a coin, they provide the token contract address (or a PumpFun/DexScreener URL). The detail page:

1. **Auto-detects** the token address and chain from the URL
2. **Fetches data in parallel** from PumpFun, DexScreener, CoinGecko, CryptoPanic, and Helius
3. **Merges** into a unified view with live price, market stats, transaction data
4. **Calculates** a Safety Score and Social Buzz Score
5. **Embeds** a DexScreener chart directly on the page
6. **Links** to Solscan/BaseScan/BscScan, Birdeye, PumpFun, and social accounts

Supported URL formats:

- Raw address: `8J69rbLTzWWgUJziFY8jeu5tDwEPBwUz4pKBMr5rpump`
- PumpFun: `https://pump.fun/8J69rb...`
- DexScreener: `https://dexscreener.com/solana/...`
- Solscan: `https://solscan.io/token/...`
- EVM: `0x...` addresses for Base/BNB

## Project Structure

```
app/
├── page.tsx                    # Homepage with countdown & leaderboards
├── (auth)/                     # Auth pages (sign-in, sign-up, reset)
├── dashboard/                  # User dashboard & watchlist
├── projects/[slug]/            # Coin detail pages
├── projects/submit/            # Submit new coins
├── trending/                   # Browse all coins
├── admin/                      # Admin panel
└── api/                        # API routes

components/
├── project/                    # Coin cards, detail views, charts
├── home/                       # Homepage sections & leaderboards
├── layout/                     # Nav, footer, auth components
└── ui/                         # Base UI components (Radix/shadcn)

lib/
├── auth.ts                     # Better Auth server config
├── auth-client.ts              # Better Auth browser client
├── coin-data/                  # Data enrichment (DexScreener, PumpFun, etc.)
├── validations/                # Zod schemas for forms and API input
├── hooks/                      # Shared React hooks
└── constants.ts                # Launch config, pricing, dates

drizzle/
├── db/schema.ts                # Drizzle schema (source of truth)
├── db/index.ts                 # Database client
└── migrations/                 # Generated SQL migrations

mcp/
└── server.ts                   # Model Context Protocol server (bun run mcp)

scripts/
├── seed-coins.ts               # Seed the coin table
├── pumpfun-migration-listener.ts  # Long-running PumpFun migration watcher
├── categories.ts               # Category bootstrap
└── set-admin.mjs               # Promote a user to admin
```

## Scripts

```bash
bun run dev              # Start dev server (Turbopack)
bun run build            # Production build
bun run start            # Start production server
bun run lint             # ESLint
bun run db:generate      # Generate Drizzle migrations from schema.ts
bun run db:migrate       # Apply migrations in drizzle/migrations/
bun run db:push          # Push schema straight to a dev database
bun run db:studio        # Open Drizzle Studio (DB explorer)
bun run db:seed          # Seed the coin table (scripts/seed-coins.ts)
bun run mcp              # Run the MCP server (mcp/server.ts)
bun run update-launches  # Refresh launch data (scripts/update-launches.sh)
```

The PumpFun migration listener runs as a long-lived pm2 process:

```bash
bun run migrations:start   # pm2 start ecosystem.config.cjs
bun run migrations:logs    # tail its output
bun run migrations:stop    # stop it
bun run migrations:listen  # run it in the foreground instead of under pm2
```

## Deployment

There is no public deployment right now; hosting is being migrated. The source
of truth is [github.com/nirholas/memescope-monday](https://github.com/nirholas/memescope-monday).

The build is a standard Next.js server build, so it runs anywhere that can run
Node:

```bash
bun install
bun run build   # emits .next/
bun run start   # serves it on $PORT (default 3000)
```

`bun run build` does **not** require a reachable database. Every database-backed
route, the sitemap included, is server-rendered on demand. `DATABASE_URL` and
the rest of the required variables are needed at runtime, not at build time.

`vercel.json` declares the five cron schedules the app expects
(`/api/cron/auto-list-migrations`, `enrich-coins`, `update-launches`,
`send-ongoing-reminders`, `send-winner-notifications`). On a host without
Vercel Cron, wire those paths to an equivalent scheduler.

## Credits

Built on top of [Open-Launch](https://github.com/openlaunch-org/Open-Launch), an open-source product launch platform.

## License

All rights reserved. See [LICENSE](LICENSE).

## Documentation

Full documentation site: **https://nirholas.github.io/memescope-monday/**

- [Getting started](docs/getting-started.md) covers install and first run.
- [Examples](docs/examples.md) has copy-paste snippets.
