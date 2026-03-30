# Memescope Monday — Cursor Rules

You are working on Memescope Monday, a memecoin discovery and voting platform built with Next.js 15, React 19, TypeScript, Tailwind CSS 4, and shadcn/ui.

## Must-Know

- **Bun** is the package manager (not npm/yarn). Use `bun install`, `bun run dev`, etc.
- **Import alias**: Always use `@/` for imports (maps to project root)
- **Database**: PostgreSQL + Drizzle ORM. Schema in `drizzle/db/schema.ts`, connection in `drizzle/db/index.ts`
- **Auth**: Better Auth (`lib/auth.ts`). Server checks: `auth.api.getSession({ headers: await headers() })`. Client: `useSession()` from `@/lib/auth-client`
- **Enums are TS const objects**, not pgEnum — use string literals: `eq(project.chain, "solana")`
- **The `project` table has 100+ columns** — always read the schema before modifying
- **`components/ui/`** = shadcn/ui base components — don't modify these

## Where Things Go

- Server actions: `app/actions/*.ts` with `"use server"` directive
- API routes: `app/api/*/route.ts`
- Zod validation schemas: `lib/validations/`
- Constants (limits, pricing, chains, categories): `lib/constants.ts`
- External crypto API integrations: `lib/coin-data/`
- Components by domain: `components/{coin,project,dashboard,home}/`
- DB schema (single file): `drizzle/db/schema.ts`

## Code Patterns

Server actions follow this shape:
```ts
"use server"
import { auth } from "@/lib/auth"
import { db } from "@/drizzle/db"
import { headers } from "next/headers"

async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function myAction() {
  const session = await getSession()
  if (!session?.user?.id) return { error: "Not authenticated" }
  // Drizzle query...
  revalidatePath("/path")
}
```

DB queries use Drizzle query builder (never raw SQL):
```ts
import { db } from "@/drizzle/db"
import { project } from "@/drizzle/db/schema"
import { eq, desc } from "drizzle-orm"

await db.select().from(project).where(eq(project.chain, "solana"))
await db.query.project.findFirst({ where: eq(project.slug, slug) })
```

## Style

- Tailwind CSS 4 + shadcn/ui components
- Prettier: 100 char width, sorted imports, Tailwind class sorting
- Some comments are in French (original author) — this is normal

## Schema Changes

1. Edit `drizzle/db/schema.ts`
2. `bun run db:generate`
3. `bun run db:migrate`
