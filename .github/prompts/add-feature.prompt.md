---
description: "Add a new feature to Memescope Monday. Use when: building new pages, components, API routes, server actions, or database tables for the memecoin platform."
agent: "agent"
argument-hint: "Describe the feature to add..."
---

You are adding a new feature to **Memescope Monday**, a memecoin discovery and voting platform.

Read [copilot-instructions.md](./../copilot-instructions.md) for the full project context.

## Checklist

Before implementing, plan which of these layers are needed:

1. **Database** — Does this need new tables/columns in `drizzle/db/schema.ts`?
2. **Server Action** — Does this need a new action in `app/actions/`?
3. **API Route** — Does this need a new route in `app/api/`?
4. **Validation** — Does this need a Zod schema in `lib/validations/`?
5. **Page** — Does this need a new page in `app/`?
6. **Components** — Does this need new UI components in `components/`?
7. **Auth** — Does this require authentication checks?

## Conventions

- Database: Drizzle ORM, schema in `drizzle/db/schema.ts`
- Server actions: `"use server"` directive, in `app/actions/`
- Validation: Zod schemas in `lib/validations/`
- Components: shadcn/ui patterns, Tailwind CSS 4
- Auth: `auth.api.getSession()` from `lib/auth.ts`
- Rate limiting: use `lib/rate-limit.ts` for public endpoints

Implement the feature following these patterns. Read existing files for reference before creating new ones.
