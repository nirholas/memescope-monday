import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/drizzle/db"
import {
  category as categoryTable,
  launchQuota,
  launchStatus,
  project as projectTable,
  projectToCategory,
} from "@/drizzle/db/schema"
import { eq } from "drizzle-orm"

import { LAUNCH_SETTINGS } from "@/lib/constants"
import { notifyXNewCoin } from "@/lib/x-notification"
import { checkRateLimit } from "@/lib/rate-limit"

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const submitProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  ticker: z
    .string()
    .min(1, "Ticker is required")
    .max(20, "Ticker must be 20 characters or less"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description must be 5000 characters or less"),
  websiteUrl: z.string().url("Must be a valid URL"),
  logoUrl: z.string().url().nullish(),
  productImage: z.string().url().nullish(),
  categories: z
    .array(z.string())
    .max(3, "Maximum 3 categories")
    .default([]),
  techStack: z
    .array(z.string())
    .max(5, "Maximum 5 technologies")
    .default([]),
  platforms: z
    .array(z.string())
    .default([]),
  pricing: z
    .enum(["free", "freemium", "paid"])
    .default("free"),
  chain: z
    .enum(["solana", "base", "bnb", "ethereum"])
    .default("solana"),
  coinType: z
    .enum(["existing", "upcoming"])
    .default("existing"),
  contractAddress: z.string().max(256).nullish(),
  githubUrl: z.string().url().nullish(),
  twitterUrl: z.string().url().nullish(),
  telegramUrl: z.string().url().nullish(),
  pumpfunUrl: z.string().url().nullish(),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  const existing = await db.query.project.findFirst({
    where: eq(projectTable.slug, baseSlug),
  })

  if (!existing) return baseSlug

  const randomSuffix = Math.floor(Math.random() * 10000)
  return `${baseSlug}-${randomSuffix}`
}

function authenticateApiKey(request: NextRequest): boolean {
  const apiKey = process.env.SUBMIT_API_KEY
  if (!apiKey) return false

  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return false

  // Constant-time comparison to prevent timing attacks
  const provided = authHeader.slice(7)
  if (provided.length !== apiKey.length) return false

  let mismatch = 0
  for (let i = 0; i < apiKey.length; i++) {
    mismatch |= apiKey.charCodeAt(i) ^ provided.charCodeAt(i)
  }
  return mismatch === 0
}

// ---------------------------------------------------------------------------
// POST /api/projects/submit
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // 1. Auth
  if (!authenticateApiKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid Bearer token in the Authorization header." },
      { status: 401 },
    )
  }

  // 2. Rate limit — 30 submissions per hour per API key
  const { success: rlOk } = await checkRateLimit("api-submit", 30, 60 * 60 * 1000)
  if (!rlOk) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 },
    )
  }

  // 3. Parse & validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = submitProjectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    )
  }

  const data = parsed.data

  try {
    // 4. Check for duplicate website URL
    const normalizedUrl = data.websiteUrl.toLowerCase().replace(/\/$/, "")
    const [existingProject] = await db
      .select({ id: projectTable.id, launchStatus: projectTable.launchStatus })
      .from(projectTable)
      .where(eq(projectTable.websiteUrl, normalizedUrl))

    if (
      existingProject &&
      existingProject.launchStatus !== "payment_pending" &&
      existingProject.launchStatus !== "payment_failed"
    ) {
      return NextResponse.json(
        { error: "A project with this website URL already exists." },
        { status: 409 },
      )
    }

    // 5. Validate category IDs exist
    if (data.categories.length > 0) {
      const validCategories = await db
        .select({ id: categoryTable.id })
        .from(categoryTable)

      const validIds = new Set(validCategories.map((c: { id: string }) => c.id))
      const invalidIds = data.categories.filter((id: string) => !validIds.has(id))

      if (invalidIds.length > 0) {
        // Also try matching by name for convenience
        const categoriesByName = await db
          .select({ id: categoryTable.id, name: categoryTable.name })
          .from(categoryTable)

        const nameToId = new Map<string, string>(categoriesByName.map((c: { id: string; name: string }) => [c.name.toLowerCase(), c.id]))
        const resolvedCategories: string[] = []

        for (const cat of data.categories) {
          if (validIds.has(cat)) {
            resolvedCategories.push(cat)
          } else if (nameToId.has(cat.toLowerCase())) {
            resolvedCategories.push(nameToId.get(cat.toLowerCase())!)
          } else {
            return NextResponse.json(
              {
                error: `Invalid category: "${cat}". Use GET /api/projects/submit to list valid categories.`,
              },
              { status: 422 },
            )
          }
        }

        data.categories = resolvedCategories
      }
    }

    // 6. Generate slug
    const slug = await generateUniqueSlug(data.name)

    // 7. Insert project
    const [newProject] = await db
      .insert(projectTable)
      .values({
        id: crypto.randomUUID(),
        name: data.name,
        slug,
        description: data.description,
        websiteUrl: normalizedUrl,
        logoUrl: data.logoUrl ?? undefined,
        productImage: data.productImage ?? undefined,
        techStack: data.techStack.length > 0 ? data.techStack : undefined,
        platforms: data.platforms.length > 0 ? data.platforms : undefined,
        pricing: data.pricing,
        githubUrl: data.githubUrl ?? undefined,
        twitterUrl: data.twitterUrl ?? undefined,
        ticker: data.ticker,
        chain: data.chain,
        coinType: data.coinType,
        contractAddress: data.contractAddress ?? undefined,
        telegramUrl: data.telegramUrl ?? undefined,
        pumpfunUrl: data.pumpfunUrl ?? undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: projectTable.id, slug: projectTable.slug })

    // 8. Link categories
    if (data.categories.length > 0) {
      await db.insert(projectToCategory).values(
        data.categories.map((categoryId: string) => ({
          projectId: newProject.id,
          categoryId,
        })),
      )
    }

    // 9. Auto-schedule for today (free tier, status = ongoing)
    try {
      const now = new Date()
      const launchDate = new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), LAUNCH_SETTINGS.LAUNCH_HOUR_UTC, 0, 0, 0),
      )

      await db
        .update(projectTable)
        .set({
          scheduledLaunchDate: launchDate,
          launchType: "free",
          launchStatus: launchStatus.ONGOING,
          updatedAt: new Date(),
        })
        .where(eq(projectTable.id, newProject.id))

      // Update or create daily quota
      const quotaResult = await db
        .select()
        .from(launchQuota)
        .where(eq(launchQuota.date, launchDate))
        .limit(1)

      if (quotaResult.length === 0) {
        await db.insert(launchQuota).values({
          id: crypto.randomUUID(),
          date: launchDate,
          freeCount: 1,
          premiumCount: 0,
          premiumPlusCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      } else {
        await db
          .update(launchQuota)
          .set({ freeCount: (quotaResult[0].freeCount ?? 0) + 1, updatedAt: new Date() })
          .where(eq(launchQuota.id, quotaResult[0].id))
      }
    } catch (scheduleError) {
      console.error("[API Submit] Auto-schedule failed:", scheduleError)
      // Project was still created — non-blocking
    }

    // 10. Background notifications (non-blocking)
    notifyXNewCoin({
      name: data.name,
      ticker: data.ticker,
      chain: data.chain,
      slug: newProject.slug,
    }).catch((err: unknown) => console.error("[X Notification] Failed:", err))

    // 11. Return success
    return NextResponse.json(
      {
        success: true,
        project: {
          id: newProject.id,
          slug: newProject.slug,
          url: `${process.env.NEXT_PUBLIC_URL || ""}/projects/${newProject.slug}`,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[API Submit] Error:", error)
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// GET /api/projects/submit — returns schema info & valid categories
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!authenticateApiKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid Bearer token in the Authorization header." },
      { status: 401 },
    )
  }

  const categories = await db
    .select({ id: categoryTable.id, name: categoryTable.name })
    .from(categoryTable)
    .orderBy(categoryTable.name)

  return NextResponse.json({
    description: "Memescope Monday — Project Submission API",
    endpoints: {
      "POST /api/projects/submit": "Create a new project listing",
      "GET /api/projects/submit": "This endpoint — returns schema & categories",
    },
    categories,
    chains: ["solana", "base", "bnb", "ethereum"],
    pricingOptions: ["free", "freemium", "paid"],
    coinTypes: ["existing", "upcoming"],
    schema: {
      name: { type: "string", required: true, maxLength: 100 },
      ticker: { type: "string", required: true, maxLength: 20 },
      description: { type: "string", required: true, maxLength: 5000 },
      websiteUrl: { type: "string (URL)", required: true },
      logoUrl: { type: "string (URL)", required: false },
      productImage: { type: "string (URL)", required: false },
      categories: { type: "string[] (category IDs or names)", required: false, max: 3 },
      techStack: { type: "string[]", required: false, max: 5 },
      platforms: { type: "string[]", required: false, values: ["web", "mobile", "desktop", "api", "other"] },
      pricing: { type: "string", required: false, default: "free", values: ["free", "freemium", "paid"] },
      chain: { type: "string", required: false, default: "solana", values: ["solana", "base", "bnb", "ethereum"] },
      coinType: { type: "string", required: false, default: "existing", values: ["existing", "upcoming"] },
      contractAddress: { type: "string", required: false },
      githubUrl: { type: "string (URL)", required: false },
      twitterUrl: { type: "string (URL)", required: false },
      telegramUrl: { type: "string (URL)", required: false },
      pumpfunUrl: { type: "string (URL)", required: false },
    },
  })
}
