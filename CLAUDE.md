# CLAUDE.md — AI Assistant Guide for Memescope Monday

## Quick Reference

```bash
bun install          # Install deps
bun run dev          # Dev server (Turbopack, port 3000)
bun run build        # Production build — use to verify changes compile
bun run lint         # ESLint
bun run db:generate  # Generate Drizzle migrations after schema changes
bun run db:migrate   # Run pending migrations
bun run db:push      # Push schema directly to dev DB (no migration file)
bun run db:seed      # Seed database
```

**Package manager is Bun, not npm or yarn.**

## What This Is

Memescoin discovery + voting platform. Every Monday at 10 AM UTC, users vote on memecoin picks across Solana, Base, BNB, and Ethereum. Users submit coins, upvote, compete on leaderboards.

## Architecture at a Glance

- **Next.js 15** App Router + **React 19** + **TypeScript 5.8**
- **Tailwind CSS 4** + **shadcn/ui** (Radix primitives in `components/ui/`)
- **PostgreSQL** + **Drizzle ORM** (schema at `drizzle/db/schema.ts`, connection at `drizzle/db/index.ts`)
- **Better Auth** (`lib/auth.ts`) — email/password + Google + GitHub OAuth
- **Stripe** payments via Better Auth plugin
- **Redis** rate limiting (`lib/rate-limit.ts`)
- **UploadThing** file uploads
- **Resend** transactional email

## Key Patterns

### Server Actions (`app/actions/`)
All data mutations and server-side fetches live here. Pattern:
```ts
"use server"
import { auth } from "@/lib/auth"
import { db } from "@/drizzle/db"
import { headers } from "next/headers"

async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function doSomething() {
  const session = await getSession()
  if (!session?.user?.id) return { error: "Not authenticated" }
  // ... Drizzle query ...
  revalidatePath("/relevant-path")
}
```

### Database Queries (Drizzle ORM)
Always use the query builder — never raw SQL. Import from `drizzle-orm`:
```ts
import { db } from "@/drizzle/db"
import { project, upvote } from "@/drizzle/db/schema"
import { eq, desc, and, or, count, sql } from "drizzle-orm"

// Select
const rows = await db.select().from(project).where(eq(project.chain, "solana"))

// Relational query
const result = await db.query.project.findFirst({ where: eq(project.slug, slug) })

// Join
await db.select({ ... }).from(upvote).innerJoin(project, eq(upvote.projectId, project.id))
```

### Auth Checks
- Server-side: `auth.api.getSession({ headers: await headers() })`
- Client-side: `useSession()` from `@/lib/auth-client`
- Middleware protects `/dashboard` and `/settings` only (redirects to `/` if no session)

### Validation
Zod schemas in `lib/validations/`. Used for forms and API input:
```ts
import { signUpSchema } from "@/lib/validations/auth"
const parsed = signUpSchema.safeParse(data)
```

### Components
- Base UI: `components/ui/` (shadcn/ui — Button, Card, Dialog, Input, etc.)
- Feature components organized by domain: `components/coin/`, `components/project/`, `components/home/`, `components/dashboard/`
- Use `@/` path alias for all imports

## Database Schema (key tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user` | Accounts | id, name, email, role, stripeCustomerId, banned |
| `project` | Memecoin listings | id, name, slug, ticker, chain, contractAddress, marketCap, launchStatus, launchType, weekLabel, createdBy |
| `category` | Coin categories | id, name |
| `projectToCategory` | M2M junction | projectId, categoryId (composite PK) |
| `upvote` | User votes | id, userId, projectId |
| `launchQuota` | Daily slot tracking | id, date, freeCount, premiumCount, premiumPlusCount |

### Enums (defined as const objects, not pgEnum)
- `launchStatus`: payment_pending, payment_failed, scheduled, ongoing, launched
- `chainType`: solana, base, bnb, ethereum
- `coinType`: existing, upcoming
- `launchType`: free, premium, premium_plus

### After Schema Changes
1. Edit `drizzle/db/schema.ts`
2. Run `bun run db:generate` to create migration
3. Run `bun run db:migrate` to apply

## File Organization

| Path | What goes here |
|------|---------------|
| `app/actions/*.ts` | Server actions — `"use server"` directive |
| `app/api/*/route.ts` | API route handlers (GET, POST, etc.) |
| `app/(auth)/` | Auth pages (sign-in, sign-up, forgot/reset password) |
| `components/ui/` | shadcn/ui base components — don't modify these |
| `components/{domain}/` | Feature components by domain |
| `lib/validations/` | Zod schemas |
| `lib/coin-data/` | External API integrations (DexScreener, PumpFun, CoinGecko, etc.) |
| `lib/constants.ts` | App-wide constants (limits, pricing, categories, chains) |
| `drizzle/db/schema.ts` | Single file for all DB tables |
| `scripts/` | One-off scripts (seeding, admin setup) |

## Important Constants (`lib/constants.ts`)

- Daily launch limits: FREE=10, PREMIUM=20, TOTAL=30
- User limit: 3 launches/day
- Upvote rate limit: 100 per 5min, 2s between actions
- API rate limits: search=15 req/min, default=10 req/min
- Paid features: expedited=$19, trending=$49, bundle=$59
- Supported chains: Solana, Base, BNB, Ethereum
- Categories: Meme, Dog, Cat, AI, Gaming, DeFi, Culture, Celebrity, Political, Other

## Gotchas

- The `project` table has 100+ columns — check the schema before adding fields
- Enums are plain TS const objects, not Drizzle `pgEnum` — filtering uses string literals like `eq(project.chain, "solana")`
- `weekLabel` on projects is a string like `"2025-W13"` used to group by Monday voting weeks
- Some code comments are in French (original author) — this is normal
- `prettier` config: 100 char print width, sorted imports, Tailwind class sorting
- Import paths use `@/` alias (maps to project root)
- The `fumaComments`/`fumaRoles`/`fumaRates` tables are for the Fuma comment library — this is a third-party integration
