---
description: "Modify the database schema for Memescope Monday. Use when: adding tables, columns, indexes, or enums to the PostgreSQL database via Drizzle ORM."
agent: "agent"
argument-hint: "Describe the schema change..."
---

You are modifying the database schema for **Memescope Monday**.

## Schema Location

The full schema is in `drizzle/db/schema.ts`. Read it first to understand the existing tables.

## Current Tables

- **user** — accounts (id, name, email, stripeCustomerId, role, banned)
- **session** / **account** / **verification** — Better Auth tables
- **project** — memecoin listings (name, slug, chain, contractAddress, marketCap, volume24h, etc.)
- **category** — coin categories
- **projectToCategory** — many-to-many junction
- **upvote** — user votes on projects
- **launchQuota** — daily launch slot tracking

## Steps

1. Read `drizzle/db/schema.ts` to understand the current schema
2. Make the schema change following Drizzle ORM patterns
3. If adding enums, use the `as const` object pattern (not pgEnum)
4. After editing, remind the user to run:
   ```bash
   bun run db:generate   # Generate migration SQL
   bun run db:migrate    # Apply migration
   ```
5. Update any affected server actions in `app/actions/`
6. Update any affected Zod schemas in `lib/validations/`

Follow existing patterns in the schema file. Use appropriate column types, indexes, and foreign key constraints.
