import Link from "next/link"

import { CheckoutButton } from "@/components/pricing/checkout-button"

export function BoostListing() {
  const tiers = [
    {
      name: "Fast Track",
      price: "$49",
      description: "Listed within 12 hours + trending badge.",
      stripeTier: "fast_track",
    },
    {
      name: "Sponsorship",
      price: "$99",
      description: "7-day featured placement on homepage.",
      stripeTier: "sponsorship",
    },
    {
      name: "Premium",
      price: "$399",
      description: "30-day top placement across all pages.",
      stripeTier: "premium",
      highlight: true,
    },
  ]

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Boost Your Listing</h3>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Get more visibility for your coin.{" "}
          <Link href="/pricing" className="hover:text-foreground underline">
            See all plans
          </Link>
        </p>
      </div>

      <div className="space-y-2">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-lg border p-3 ${
              tier.highlight ? "border-primary/40 bg-primary/5" : "border-border/60"
            }`}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium">{tier.name}</span>
              <span className="text-primary text-sm font-bold">{tier.price}</span>
            </div>
            <p className="text-muted-foreground mb-2 text-xs">{tier.description}</p>
            <CheckoutButton
              tier={tier.stripeTier}
              label={`Pay ${tier.price}`}
              highlighted={tier.highlight}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
