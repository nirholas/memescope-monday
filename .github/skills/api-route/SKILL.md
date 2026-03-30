---
name: api-route
description: "Create new Next.js API route handlers with rate limiting, auth, and validation. Use when: adding REST endpoints, webhook handlers, public API routes, or authenticated API routes. Covers GET/POST handlers, rate limiting with Redis, Zod validation, and error responses."
argument-hint: "Describe the API route (e.g., 'GET endpoint to list trending coins')"
---

# API Route

Create Next.js App Router API routes in `app/api/`.

## When to Use

- Adding a new REST endpoint (GET, POST, PUT, DELETE)
- Creating webhook handlers for external services
- Building public or authenticated API routes
- Adding rate-limited endpoints

## Procedure

1. Create `app/api/<route-name>/route.ts`
2. Export named handler functions: `GET`, `POST`, `PUT`, `DELETE`
3. Add rate limiting using Redis via `@/lib/rate-limit`
4. Add Zod validation for request bodies
5. Return `NextResponse.json()` with appropriate status codes

## Public GET Route with Rate Limiting

```ts
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { db } from "@/drizzle/db"
import { project } from "@/drizzle/db/schema"
import { desc } from "drizzle-orm"
import { API_RATE_LIMITS } from "@/lib/constants"
import { checkRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1"

    const rateLimitResult = await checkRateLimit(
      `my-route:${ip}`,
      API_RATE_LIMITS.DEFAULT.REQUESTS, // 10
      API_RATE_LIMITS.DEFAULT.WINDOW,   // 60000ms
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "rate_limit_exceeded",
          message: `Too many requests. Please wait ${rateLimitResult.reset}s.`,
          reset: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": API_RATE_LIMITS.DEFAULT.REQUESTS.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        },
      )
    }

    // Query params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "10", 10)

    // Database query
    const results = await db
      .select()
      .from(project)
      .orderBy(desc(project.createdAt))
      .limit(Math.min(limit, 50))

    return NextResponse.json({ results })
  } catch (error) {
    console.error("[MyRoute API]", error)
    return NextResponse.json(
      { error: "internal_error", message: "An error occurred." },
      { status: 500 },
    )
  }
}
```

## Authenticated POST Route with Validation

```ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/drizzle/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

const inputSchema = z.object({
  name: z.string().min(1).max(100),
  chain: z.enum(["solana", "base", "bnb", "ethereum"]),
})

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate body
    const body = await request.json()
    const parsed = inputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    // Process request
    const { name, chain } = parsed.data
    // ... db operations ...

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("[MyRoute API]", error)
    return NextResponse.json(
      { error: "internal_error", message: "An error occurred." },
      { status: 500 },
    )
  }
}
```

## Rules

- **File location**: `app/api/<route-name>/route.ts`
- **Export** named functions: `GET`, `POST`, `PUT`, `DELETE` (not default)
- **Rate limit** all public endpoints using `checkRateLimit()` from `@/lib/rate-limit`
- **Rate limit keys** format: `route-name:${ip}` — unique per route
- **Include** `X-RateLimit-*` headers in rate-limited responses
- **Validate** request bodies with Zod schemas
- **Auth** via `auth.api.getSession({ headers: await headers() })` for protected routes
- **Error responses** use consistent shape: `{ error: "error_code", message: "Human text" }`
- **Status codes**: 200 success, 201 created, 400 validation, 401 unauthorized, 429 rate limited, 500 server error
- **Log errors** with route prefix: `console.error("[RouteName API]", error)`
- **Cap limits** on user input (e.g., `Math.min(limit, 50)`) to prevent abuse
- **Caching**: use `unstable_cache` from `next/cache` for expensive read queries
