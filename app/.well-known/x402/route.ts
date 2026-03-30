import { NextResponse } from "next/server"

import { X402_CONFIG, X402_TIERS } from "@/lib/x402"

// USDC on Base has 6 decimals
const USDC_DECIMALS = 6
const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"

function toSmallestUnit(priceUsd: number): string {
  return (priceUsd * 10 ** USDC_DECIMALS).toString()
}

export async function GET() {
  const accepts = Object.entries(X402_TIERS).map(([, tier]) => ({
    scheme: "exact",
    network: X402_CONFIG.network,
    maxAmountRequired: toSmallestUnit(tier.priceUsd),
    resource: `/api/payment/x402/settle`,
    description: tier.description,
    mimeType: "application/json",
    payTo: X402_CONFIG.receiverAddress,
    maxTimeoutSeconds: 300,
    asset: USDC_BASE_ADDRESS,
    extra: {},
  }))

  return NextResponse.json(
    {
      x402Version: 1,
      accepts,
      error: "",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  )
}
