import Link from "next/link"

export function BoostListing() {
  const tiers = [
    {
      name: "Expedited Review",
      price: "$19",
      description: "Skip the queue. Reviewed within 1 hour.",
      href: "/pricing?plan=expedited",
    },
    {
      name: "Trending Placement",
      price: "$49",
      description: "24h featured in the Trending section.",
      href: "/pricing?plan=trending",
    },
    {
      name: "Bundle (Both)",
      price: "$59",
      description: "Expedited review + 24h trending placement.",
      href: "/pricing?plan=bundle",
      highlight: true,
    },
  ]

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Boost Your Listing</h3>
        <p className="text-muted-foreground mt-0.5 text-xs">Get more visibility for your coin.</p>
      </div>

      <div className="space-y-2">
        {tiers.map((tier) => (
          <Link
            key={tier.name}
            href={tier.href}
            className={`hover:bg-muted/40 block rounded-lg border p-3 transition-colors ${
              tier.highlight ? "border-primary/40 bg-primary/5" : "border-border/60"
            }`}
          >
            <div className="mb-0.5 flex items-center justify-between">
              <span className="text-sm font-medium">{tier.name}</span>
              <span className="text-primary text-sm font-bold">{tier.price}</span>
            </div>
            <p className="text-muted-foreground text-xs">{tier.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
