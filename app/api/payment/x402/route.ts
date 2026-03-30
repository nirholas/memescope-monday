import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { db } from "@/drizzle/db"
import {
  launchQuota,
  launchStatus,
  launchType,
  project,
  sponsorship,
} from "@/drizzle/db/schema"
import { eq, sql } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { buildPaymentRequirements, X402_CONFIG, X402_TIERS } from "@/lib/x402"

/**
 * x402 payment endpoint.
 *
 * Flow:
 * 1. Client POSTs with { tier, projectId?, sponsorName?, ... }
 * 2. If no X-PAYMENT header → return 402 with payment requirements
 * 3. If X-PAYMENT header present → verify via facilitator, process purchase
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!X402_CONFIG.receiverAddress) {
      return NextResponse.json(
        { error: "x402 payments are not configured" },
        { status: 500 },
      )
    }

    const body = await request.json()
    const { tier, projectId, sponsorName, sponsorWebsite, sponsorDescription } = body

    if (!tier || !X402_TIERS[tier]) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
    }

    // Validate sponsor-specific fields
    const isSponsorTier = tier === "sponsor_weekly" || tier === "sponsor_monthly"
    if (isSponsorTier && (!sponsorName || !sponsorWebsite)) {
      return NextResponse.json(
        { error: "Sponsor name and website are required" },
        { status: 400 },
      )
    }

    // Check for x402 payment header
    const paymentHeader = request.headers.get("x-payment")

    if (!paymentHeader) {
      // No payment yet — return 402 with payment requirements
      const requirements = buildPaymentRequirements(tier)
      return NextResponse.json(requirements, {
        status: 402,
        headers: {
          "X-PAYMENT": JSON.stringify(requirements),
        },
      })
    }

    // Verify payment via facilitator
    const paymentPayload = JSON.parse(paymentHeader)
    const requirements = buildPaymentRequirements(tier)

    const verifyResponse = await fetch(`${X402_CONFIG.facilitatorUrl}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentPayload,
        paymentRequirements: requirements,
      }),
    })

    if (!verifyResponse.ok) {
      const err = await verifyResponse.text()
      console.error("x402 verification failed:", err)
      return NextResponse.json({ error: "Payment verification failed" }, { status: 402 })
    }

    // Settle payment via facilitator
    const settleResponse = await fetch(`${X402_CONFIG.facilitatorUrl}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentPayload,
        paymentRequirements: requirements,
      }),
    })

    if (!settleResponse.ok) {
      const err = await settleResponse.text()
      console.error("x402 settlement failed:", err)
      return NextResponse.json({ error: "Payment settlement failed" }, { status: 500 })
    }

    const settlementData = await settleResponse.json()

    // Payment verified + settled — process the purchase
    if (isSponsorTier) {
      return await processSponsorPurchase({
        tier,
        sponsorName,
        sponsorWebsite,
        sponsorDescription,
        userId: session.user.id,
        txHash: settlementData.txHash,
      })
    }

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required for listing tiers" }, { status: 400 })
    }

    return await processProjectPurchase({
      projectId,
      tier,
      userId: session.user.id,
      txHash: settlementData.txHash,
    })
  } catch (error) {
    console.error("x402 payment error:", error)
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 })
  }
}

async function processProjectPurchase({
  projectId,
  _tier,
  _userId,
  txHash,
}: {
  projectId: string
  _tier: string
  _userId: string
  txHash?: string
}) {
  const [projectData] = await db
    .select({
      id: project.id,
      slug: project.slug,
      launchType: project.launchType,
      scheduledLaunchDate: project.scheduledLaunchDate,
    })
    .from(project)
    .where(eq(project.id, projectId))

  if (!projectData) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  if (!projectData.scheduledLaunchDate) {
    return NextResponse.json({ error: "Project data incomplete" }, { status: 400 })
  }

  // Update project status to scheduled
  await db
    .update(project)
    .set({
      launchStatus: launchStatus.SCHEDULED,
      featuredOnHomepage: projectData.launchType === launchType.PREMIUM_PLUS,
      updatedAt: new Date(),
    })
    .where(eq(project.id, projectId))

  // Update launch quota for this date
  const launchDate = projectData.scheduledLaunchDate
  const quotaResult = await db
    .select()
    .from(launchQuota)
    .where(eq(launchQuota.date, launchDate))
    .limit(1)

  if (quotaResult.length === 0) {
    await db.insert(launchQuota).values({
      id: crypto.randomUUID(),
      date: launchDate,
      freeCount: 0,
      premiumCount: projectData.launchType === launchType.PREMIUM ? 1 : 0,
      premiumPlusCount: projectData.launchType === launchType.PREMIUM_PLUS ? 1 : 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  } else {
    await db
      .update(launchQuota)
      .set({
        premiumCount:
          projectData.launchType === launchType.PREMIUM
            ? sql`${launchQuota.premiumCount} + 1`
            : launchQuota.premiumCount,
        premiumPlusCount:
          projectData.launchType === launchType.PREMIUM_PLUS
            ? sql`${launchQuota.premiumPlusCount} + 1`
            : launchQuota.premiumPlusCount,
        updatedAt: new Date(),
      })
      .where(eq(launchQuota.id, quotaResult[0].id))
  }

  revalidatePath("/projects")

  return NextResponse.json({
    success: true,
    projectId: projectData.id,
    projectSlug: projectData.slug,
    txHash,
  })
}

async function processSponsorPurchase({
  tier,
  sponsorName,
  sponsorWebsite,
  sponsorDescription,
  _userId,
  txHash,
}: {
  tier: string
  sponsorName: string
  sponsorWebsite: string
  sponsorDescription?: string
  _userId: string
  txHash?: string
}) {
  const now = new Date()
  const durationDays = tier === "sponsor_weekly" ? 7 : 30
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

  await db.insert(sponsorship).values({
    id: crypto.randomUUID(),
    name: sponsorName,
    description: sponsorDescription || null,
    websiteUrl: sponsorWebsite,
    tier: tier === "sponsor_weekly" ? "weekly" : "monthly",
    status: "active",
    stripeSessionId: `x402_${txHash || crypto.randomUUID()}`,
    stripeCustomerEmail: null,
    amountPaid: X402_TIERS[tier].priceUsd * 100, // store in cents for consistency
    startsAt: now,
    expiresAt,
    createdAt: now,
    updatedAt: now,
  })

  revalidatePath("/")
  revalidatePath("/sponsors")

  return NextResponse.json({
    success: true,
    type: "sponsor",
    sponsorName,
    txHash,
  })
}
