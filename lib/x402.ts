import type { Resource } from "x402/types"

// x402 payment configuration
// Uses USDC on Base network for payments

export const X402_CONFIG = {
  facilitatorUrl: "https://x402.org/facilitator",
  network: "base" as const,
  receiverAddress: process.env.X402_RECEIVER_ADDRESS as `0x${string}`,
}

// Pricing tiers in USDC (dollar amounts match Stripe tiers)
export const X402_TIERS: Record<string, { price: string; maxTimeoutSeconds: number; description: string }> = {
  fast_track: {
    price: "49",
    maxTimeoutSeconds: 300,
    description: "Fast Track Listing — Priority listing within 12 hours + trending badge for 24h",
  },
  sponsorship: {
    price: "99",
    maxTimeoutSeconds: 300,
    description: "Sponsorship — 7-day featured placement + all Fast Track benefits",
  },
  premium: {
    price: "399",
    maxTimeoutSeconds: 300,
    description: "Premium Sponsorship — 30-day top placement + featured across all pages",
  },
  sponsor_weekly: {
    price: "30",
    maxTimeoutSeconds: 300,
    description: "Weekly Sponsor Slot — 7 days of featured sponsor placement",
  },
  sponsor_monthly: {
    price: "99",
    maxTimeoutSeconds: 300,
    description: "Monthly Sponsor Slot — 30 days of featured sponsor placement",
  },
}

export function getPaymentResource(tier: string): Resource | null {
  const tierConfig = X402_TIERS[tier]
  if (!tierConfig) return null

  return {
    price: tierConfig.price,
    network: X402_CONFIG.network,
    maxTimeoutSeconds: tierConfig.maxTimeoutSeconds,
    description: tierConfig.description,
    resource: `/api/payment/x402/settle`,
    scheme: "exact",
    mimeType: "application/json",
    payTo: X402_CONFIG.receiverAddress,
    maxDeadlineSeconds: 300,
    extra: {},
  }
}
