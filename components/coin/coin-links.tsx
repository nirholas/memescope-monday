import { RiExternalLinkLine, RiGlobalLine, RiTwitterFill } from "@remixicon/react"

import { getChainExplorerUrl, getDexScreenerChartUrl, type CoinDetailData } from "@/lib/coin-data"

interface CoinLinksProps {
  data: CoinDetailData
  tokenAddress: string
  chain: string
}

export function CoinLinksPanel({ data, tokenAddress, chain }: CoinLinksProps) {
  const { pumpfun, dexscreener } = data
  const explorerUrl = getChainExplorerUrl(chain, tokenAddress)
  const chartUrl = dexscreener ? getDexScreenerChartUrl(chain, dexscreener.pairAddress) : null

  const links: { label: string; url: string; icon: React.ReactNode }[] = []

  if (chartUrl) {
    links.push({
      label: "DexScreener Chart",
      url: chartUrl,
      icon: <RiExternalLinkLine className="h-4 w-4" />,
    })
  }

  links.push({
    label: chain === "solana" ? "Solscan" : chain === "base" ? "BaseScan" : "BscScan",
    url: explorerUrl,
    icon: <RiExternalLinkLine className="h-4 w-4" />,
  })

  if (chain === "solana") {
    links.push({
      label: "Birdeye",
      url: `https://birdeye.so/token/${tokenAddress}?chain=solana`,
      icon: <RiExternalLinkLine className="h-4 w-4" />,
    })
  }

  if (pumpfun) {
    links.push({
      label: "PumpFun",
      url: `https://pump.fun/${tokenAddress}`,
      icon: <RiExternalLinkLine className="h-4 w-4" />,
    })
    if (pumpfun.twitter) {
      links.push({
        label: "Twitter",
        url: pumpfun.twitter,
        icon: <RiTwitterFill className="h-4 w-4" />,
      })
    }
    if (pumpfun.website) {
      links.push({
        label: "Website",
        url: pumpfun.website,
        icon: <RiGlobalLine className="h-4 w-4" />,
      })
    }
  }

  // Add socials from DexScreener info
  if (dexscreener?.info?.socials) {
    for (const social of dexscreener.info.socials) {
      if (social.type === "twitter" && !links.some((l) => l.label === "Twitter")) {
        links.push({
          label: "Twitter",
          url: social.url,
          icon: <RiTwitterFill className="h-4 w-4" />,
        })
      }
    }
  }
  if (dexscreener?.info?.websites) {
    for (const site of dexscreener.info.websites) {
      if (!links.some((l) => l.label === "Website")) {
        links.push({
          label: "Website",
          url: site.url,
          icon: <RiGlobalLine className="h-4 w-4" />,
        })
      }
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Links</h4>
      <div className="space-y-1">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
          >
            {link.icon}
            <span>{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
