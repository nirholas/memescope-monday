---
name: server-action
description: "Create new server actions following Memescope Monday patterns. Use when: adding data mutations, server-side fetches, authenticated operations, or new app/actions/ files. Handles session checks, Drizzle queries, revalidation, and error returns."
argument-hint: "Describe the server action (e.g., 'toggle bookmark on a project')"
---

# Server Action

Create server actions in `app/actions/` following project conventions.

## When to Use

- Adding a new data mutation (insert, update, delete)
- Creating a server-side fetch for a page or component
- Any authenticated operation that reads/writes to the database

## Procedure

1. Create or edit a file in `app/actions/` with the `"use server"` directive at the top
2. Use the standard session helper pattern
3. Add Drizzle ORM queries (never raw SQL)
4. Return typed results or error objects
5. Call `revalidatePath()` after mutations

## Template

```ts
"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { db } from "@/drizzle/db"
import { project } from "@/drizzle/db/schema"
import { auth } from "@/lib/auth"
import { and, eq, desc } from "drizzle-orm"

async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function myAction(input: string) {
  const session = await getSession()
  if (!session?.user?.id) return { error: "Not authenticated" }

  // Drizzle query
  const result = await db
    .select()
    .from(project)
    .where(eq(project.id, input))

  revalidatePath("/relevant-path")
  return { data: result }
}
```

## Rules

- **Always** start with `"use server"` directive
- **Always** check `session?.user?.id` for auth-required actions
- **Return** `{ error: string }` for failures, not thrown exceptions
- **Return** empty arrays `[]` for unauthenticated read operations
- **Use** Drizzle query builder — never raw SQL
- **Import** from `drizzle-orm` for operators: `eq`, `and`, `or`, `desc`, `count`, `sql`, etc.
- **Import** schema tables from `@/drizzle/db/schema`
- **Call** `revalidatePath()` after any write mutation
- **Use** constants from `@/lib/constants` for limits and settings
- Enums are string literals (e.g., `eq(project.chain, "solana")`)
