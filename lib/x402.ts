// x402 payment configuration
// Uses USDC on Base network for payments via the x402 HTTP payment protocol

export const X402_CONFIG = {
  facilitatorUrl: "https://x402.org/facilitator",
  network: "base" as const,
  receiverAddress: process.env.X402_RECEIVER_ADDRESS as `0x${string}`,
}

// USDC contract on Base mainnet
export const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const

// Pricing tiers in USDC (dollar amounts match Stripe tiers)
export const X402_TIERS: Record<
  string,
  { priceUsd: number; description: string }
> = {
  fast_track: {
    priceUsd: 49,
    description: "Fast Track Listing — Priority listing within 12 hours + trending badge for 24h",
  },
  sponsorship: {
    priceUsd: 99,
    description: "Sponsorship — 7-day featured placement + all Fast Track benefits",
  },
  premium: {
    priceUsd: 399,
    description: "Premium Sponsorship — 30-day top placement + featured across all pages",
  },
  sponsor_weekly: {
    priceUsd: 30,
    description: "Weekly Sponsor Slot — 7 days of featured sponsor placement",
  },
  sponsor_monthly: {
    priceUsd: 99,
    description: "Monthly Sponsor Slot — 30 days of featured sponsor placement",
  },
}

/** Build x402-compatible payment requirements for a given tier */
export function buildPaymentRequirements(tier: string) {
  const tierConfig = X402_TIERS[tier]
  if (!tierConfig) return null

  return {
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: X402_CONFIG.network,
        maxAmountRequired: String(tierConfig.priceUsd * 1_000_000), // USDC has 6 decimals
        resource: "/api/payment/x402",
        description: tierConfig.description,
        mimeType: "application/json",
        payTo: X402_CONFIG.receiverAddress,
        maxTimeoutSeconds: 300,
        asset: USDC_BASE_ADDRESS,
        extra: {},
      },
    ],
    error: "",
  }
}
