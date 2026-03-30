---
name: database-schema
description: "Add or modify database tables, columns, enums, and relations in Drizzle ORM. Use when: adding new tables, adding columns to existing tables, creating indexes, defining relations, or running migrations. Covers the full workflow: schema edit → generate → migrate."
argument-hint: "Describe the schema change (e.g., 'add a bookmarks table')"
---

# Database Schema

Modify `drizzle/db/schema.ts` and run migrations following project conventions.

## When to Use

- Adding a new table
- Adding columns to existing tables (note: `project` has 100+ columns — check first)
- Creating enums (as const objects, NOT `pgEnum`)
- Defining relations between tables
- Adding indexes

## Procedure

1. Read `drizzle/db/schema.ts` to understand current schema
2. Make changes to `drizzle/db/schema.ts`
3. Run `bun run db:generate` to create migration SQL
4. Run `bun run db:migrate` to apply migration
5. For dev-only quick iteration, `bun run db:push` skips migration files

## New Table Template

```ts
import { pgTable, text, timestamp, boolean, index, primaryKey } from "drizzle-orm/pg-core"

export const bookmark = pgTable(
  "bookmark",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("bookmark_user_idx").on(table.userId),
    projectIdx: index("bookmark_project_idx").on(table.projectId),
  }),
)
```

## Enum Template (Const Object)

```ts
export const myStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
} as const

export type MyStatus = (typeof myStatus)[keyof typeof myStatus]
```

## Junction Table (Many-to-Many)

```ts
export const projectToTag = pgTable(
  "project_to_tag",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.projectId, table.tagId] }),
  }),
)
```

## Rules

- **All tables** go in `drizzle/db/schema.ts` (single schema file)
- **IDs** are `text("id").primaryKey()` — the app generates string IDs
- **Enums** are const objects with `as const`, NOT Drizzle `pgEnum`
- **Column names** use snake_case in the DB: `text("snake_case")`
- **Property names** use camelCase in TypeScript: `myColumn: text("my_column")`
- **Foreign keys** use `.references(() => table.id, { onDelete: "cascade" })` or `"set null"`
- **Timestamps** use `timestamp("created_at").notNull().defaultNow()`
- **Indexes** are defined in the second argument callback of `pgTable`
- **After changes**: run `bun run db:generate` then `bun run db:migrate`
- **Config** is in `drizzle.config.ts` — migrations output to `drizzle/migrations/`
- **DB connection** is in `drizzle/db/index.ts` — import `db` from `@/drizzle/db`
