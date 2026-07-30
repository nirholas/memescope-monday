# memescope-monday examples

The community-driven memecoin directory. Every Monday at 10 AM UTC, the community votes together on the best memecoin plays across Solana, Base, and BNB Chain. Submit your picks, upvote the best, ride together.

## Example 1

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

## Example 2

```text
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

## Example 3

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

## Example 4

```bash
bun run migrations:start   # pm2 start ecosystem.config.cjs
bun run migrations:logs    # tail its output
bun run migrations:stop    # stop it
bun run migrations:listen  # run it in the foreground instead of under pm2
```

## Example 5

```bash
bun install
bun run build   # emits .next/
bun run start   # serves it on $PORT (default 3000)
```


Every snippet above is taken from the [repository documentation](https://github.com/nirholas/memescope-monday#readme).
