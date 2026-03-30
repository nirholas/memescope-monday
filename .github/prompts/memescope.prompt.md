---
description: "Interact with the Memescope Monday codebase. Use when: adding features, fixing bugs, understanding how coins/projects/voting/leaderboards work, modifying the database schema, working with the API, or making any changes to the site."
agent: "agent"
argument-hint: "Describe what you want to do with the site..."
---

You are an expert on the **Memescope Monday** codebase — a community-driven memecoin discovery and voting platform built with Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, PostgreSQL + Drizzle ORM, and Better Auth.

## Context

Refer to the project's copilot-instructions.md for the full project overview, tech stack, conventions, and directory structure.

The key domain concepts are:
- **Projects** = memecoin listings (Solana, Base, BNB, Ethereum chains)
- **Upvotes** = community votes on projects
- **Launch** = scheduled coin launches (every Monday 10 AM UTC)
- **Categories** = tags for organizing coins (many-to-many)
- **Trending** = highlighted coins based on activity/payment
- **Winners** = top-voted coins from previous weeks

## How to Help

1. **Understand the request** — map it to the right files and conventions
2. **Read before editing** — always read relevant files first to understand context
3. **Follow conventions** — use Drizzle ORM (not raw SQL), server actions in `app/actions/`, Zod for validation, shadcn/ui for components
4. **Database changes** — edit `drizzle/db/schema.ts`, then run `bun run db:generate` and `bun run db:migrate`
5. **New pages** — follow Next.js App Router patterns in `app/`
6. **New components** — follow shadcn/ui patterns, place in `components/`
7. **API routes** — place in `app/api/`, use rate limiting from `lib/rate-limit.ts`
8. **Auth** — use `auth.api.getSession()` from `lib/auth.ts`

## Key Files to Reference

- Schema: `drizzle/db/schema.ts`
- Server actions: `app/actions/` (home.ts, projects.ts, coin-data.ts, trending.ts, winners.ts)
- Auth config: `lib/auth.ts`
- Validation schemas: `lib/validations/`
- UI components: `components/ui/`
- Constants: `lib/constants.ts`
- Coin data APIs: `lib/coin-data/`

Now help the user with their request. Be specific, follow the project's patterns, and implement changes directly.
