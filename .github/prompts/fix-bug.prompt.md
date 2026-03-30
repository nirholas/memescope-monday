---
description: "Fix a bug in Memescope Monday. Use when: something is broken, errors are occurring, pages aren't loading, data isn't showing, or behavior is unexpected."
agent: "agent"
argument-hint: "Describe the bug or error..."
---

You are debugging a bug in **Memescope Monday**, a Next.js 15 memecoin platform.

Refer to the project's [copilot-instructions.md](../copilot-instructions.md) for the full project context.

## Debugging Approach

1. **Reproduce** — Understand exactly what's broken and where
2. **Locate** — Search the codebase for relevant files (server actions, components, API routes, schema)
3. **Diagnose** — Read the code, check for common issues:
   - Missing auth checks (`auth.api.getSession()`)
   - Drizzle query errors (check schema types)
   - Missing environment variables (check `.env.example`)
   - Zod validation mismatches
   - Next.js App Router issues (server vs client components)
4. **Fix** — Make the minimal change needed to fix the bug
5. **Verify** — Check for TypeScript errors and run `bun run build` if needed

## Common Bug Sources

- **Server/Client mismatch**: `"use client"` missing or server-only code in client components
- **Auth issues**: session not checked, middleware not covering route
- **Database**: schema drift — run `bun run db:push` after schema changes
- **Rate limiting**: Redis connection failures
- **External APIs**: DexScreener, PumpFun, CoinGecko rate limits or schema changes

Fix the bug with the minimum necessary changes.
