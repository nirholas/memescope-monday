# Memescope Monday — Copilot Instructions

## What This Project Is

Memescope Monday is a community-driven memecoin discovery and voting platform. Every Monday at 10 AM UTC, users vote on the best memecoin picks across Solana, Base, BNB, and Ethereum chains. Users submit coins, upvote picks, and compete on leaderboards.

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack) + React 19 + TypeScript 5.8
- **Styling**: Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **Database**: PostgreSQL with Drizzle ORM (`drizzle/db/schema.ts`)
- **Auth**: Better Auth (`lib/auth.ts`) — email/password + Google + GitHub
- **Payments**: Stripe via @better-auth/stripe plugin
- **File Upload**: UploadThing
- **Email**: Resend (`lib/email.ts`)
- **Rate Limiting**: Redis via ioredis (`lib/rate-limit.ts`)
- **Analytics**: Plausible (self-hosted)
- **Package Manager**: Bun

## Key Directories

| Path | Purpose |
|------|---------|
| `app/actions/` | Server actions (data mutations, fetching) |
| `app/api/` | API routes (auth, coins, comments, cron, payments) |
| `app/(auth)/` | Auth pages (sign-in, sign-up, forgot/reset password) |
| `components/` | React components (ui/, coin/, project/, home/, layout/) |
| `drizzle/db/schema.ts` | Database schema — all tables and enums |
| `drizzle/migrations/` | Generated SQL migrations |
| `lib/` | Shared utilities, auth config, rate limiting, email |
| `lib/coin-data/` | External API integrations (DexScreener, PumpFun, CoinGecko) |
| `lib/validations/` | Zod schemas for form/API validation |
| `scripts/` | DB seed scripts, admin setup |

## Database Schema (main tables)

- **user** — accounts with stripe ID, role, ban info
- **project** — memecoin listings with market data, chain, contract address, enrichment data
- **category** / **projectToCategory** — coin categories (many-to-many)
- **upvote** — user votes on projects
- **launchQuota** — daily launch slot tracking by tier (free/premium/premium_plus)

## Conventions

- Server actions live in `app/actions/` and use `"use server"` directive
- Components use shadcn/ui patterns — check `components/ui/` for base components
- Form validation uses Zod schemas from `lib/validations/`
- Database queries use Drizzle ORM query builder (not raw SQL)
- Auth checks use `auth.api.getSession()` from `lib/auth.ts`
- Environment variables are in `.env` (see `.env.example` for reference)
- Run `bun install` to install dependencies, `bun run dev` to start dev server

## Common Commands

```bash
bun install                    # Install dependencies
bun run dev                    # Start dev server (Turbopack)
bun run build                  # Production build
bun run db:generate            # Generate Drizzle migrations
bun run db:migrate             # Run migrations
bun run db:push                # Push schema to dev DB
bun run db:studio              # Open Drizzle Studio
bun run db:seed                # Seed database
```
