// Multi-source coin detail aggregation
// Used by the coin detail page to show market data, links, news

export interface CoinMarketData {
  price: number | null
  priceChange24h: number | null
  priceChange7d: number | null
  marketCap: number | null
  volume24h: number | null
  liquidity: number | null
  fdv: number | null
  ath: number | null
  athDate: string | null
  holders: number | null
  totalSupply: number | null
  circulatingSupply: number | null
}

export interface PumpFunData {
  mint: string
  name: string
  symbol: string
  description: string
  imageUri: string
  bannerUri: string | null
  twitter: string | null
  website: string | null
  creator: string
  createdTimestamp: number
  marketCap: number
  usdMarketCap: number
  athMarketCap: number
  athMarketCapTimestamp: number
  replyCount: number
  complete: boolean
  bondingCurve: string
  poolAddress: string | null
  program: string
  nsfw: boolean
}

export interface CoinNews {
  title: string
  url: string
  source: string
  publishedAt: string
  sentiment: string | null
}

export interface HeliusTokenMeta {
  name: string
  symbol: string
  uri: string
  image: string | null
  description: string | null
}

export interface CoinDetailData {
  pumpfun: PumpFunData | null
  dexscreener: import("./types").DexScreenerPair | null
  market: CoinMarketData
  news: CoinNews[]
  heliusMeta: HeliusTokenMeta | null
}

// ── PumpFun ──
async function fetchPumpFunData(mintAddress: string): Promise<PumpFunData | null> {
  try {
    const res = await fetch(`https://frontend-api-v3.pump.fun/coins/${mintAddress}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.mint) return null
    return {
      mint: data.mint,
      name: data.name,
      symbol: data.symbol,
      description: data.description || "",
      imageUri: data.image_uri || "",
      bannerUri: data.banner_uri || null,
      twitter: data.twitter || null,
      website: data.website || null,
      creator: data.creator,
      createdTimestamp: data.created_timestamp,
      marketCap: data.market_cap,
      usdMarketCap: data.usd_market_cap,
      athMarketCap: data.ath_market_cap,
      athMarketCapTimestamp: data.ath_market_cap_timestamp,
      replyCount: data.reply_count,
      complete: data.complete,
      bondingCurve: data.bonding_curve,
      poolAddress: data.pool_address || data.pump_swap_pool || null,
      program: data.program,
      nsfw: data.nsfw,
    }
  } catch {
    return null
  }
}

// ── DexScreener ──
async function fetchDexScreenerData(
  tokenAddress: string,
): Promise<import("./types").DexScreenerPair | null> {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, {
      next: { revalidate: 30 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.pairs || data.pairs.length === 0) return null
    const sorted = data.pairs.sort(
      (a: { liquidity?: { usd?: number } }, b: { liquidity?: { usd?: number } }) =>
        (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0),
    )
    return sorted[0]
  } catch {
    return null
  }
}

// ── CoinGecko (free tier) ──
async function fetchCoinGeckoData(
  tokenAddress: string,
  chain: string = "solana",
): Promise<CoinMarketData | null> {
  const apiKey = process.env.COINGECKO_API_KEY
  try {
    const platform = chain === "base" ? "base" : chain === "bnb" ? "binance-smart-chain" : "solana"
    const headers: Record<string, string> = {}
    if (apiKey) headers["x-cg-demo-api-key"] = apiKey
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${platform}/contract/${tokenAddress}`,
      { headers, next: { revalidate: 120 } },
    )
    if (!res.ok) return null
    const data = await res.json()
    return {
      price: data.market_data?.current_price?.usd ?? null,
      priceChange24h: data.market_data?.price_change_percentage_24h ?? null,
      priceChange7d: data.market_data?.price_change_percentage_7d ?? null,
      marketCap: data.market_data?.market_cap?.usd ?? null,
      volume24h: data.market_data?.total_volume?.usd ?? null,
      liquidity: null,
      fdv: data.market_data?.fully_diluted_valuation?.usd ?? null,
      ath: data.market_data?.ath?.usd ?? null,
      athDate: data.market_data?.ath_date?.usd ?? null,
      holders: null,
      totalSupply: data.market_data?.total_supply ?? null,
      circulatingSupply: data.market_data?.circulating_supply ?? null,
    }
  } catch {
    return null
  }
}

// ── CryptoPanic News ──
async function fetchCryptoNews(symbol: string): Promise<CoinNews[]> {
  const apiKey = process.env.CRYPTOPANIC_API_KEY
  if (!apiKey) return []
  try {
    const res = await fetch(
      `https://cryptopanic.com/api/free/v1/posts/?auth_token=${apiKey}&currencies=${symbol}&kind=news&public=true`,
      { next: { revalidate: 300 } },
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).slice(0, 5).map((item: Record<string, unknown>) => ({
      title: item.title as string,
      url: item.url as string,
      source: (item.source as Record<string, string>)?.title || "Unknown",
      publishedAt: item.published_at as string,
      sentiment:
        (item.votes as Record<string, number>)?.positive >
        (item.votes as Record<string, number>)?.negative
          ? "positive"
          : (item.votes as Record<string, number>)?.negative >
              (item.votes as Record<string, number>)?.positive
            ? "negative"
            : "neutral",
    }))
  } catch {
    return []
  }
}

// ── Helius Token Metadata ──
async function fetchHeliusMetadata(mintAddress: string): Promise<HeliusTokenMeta | null> {
  const apiKey = process.env.HELIUS_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mintAccounts: [mintAddress],
        includeOffChain: true,
      }),
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const token = data[0]
    if (!token) return null
    const offChain = token.offChainMetadata?.metadata
    const onChain = token.onChainMetadata?.metadata?.data
    return {
      name: offChain?.name || onChain?.name || "",
      symbol: offChain?.symbol || onChain?.symbol || "",
      uri: onChain?.uri || "",
      image: offChain?.image || null,
      description: offChain?.description || null,
    }
  } catch {
    return null
  }
}

// ── Aggregate all data for a coin ──
export async function fetchCoinDetail(
  tokenAddress: string,
  chain: string = "solana",
  symbol?: string,
): Promise<CoinDetailData> {
  const isSolana = chain === "solana"

  const [pumpfun, dexscreener, coingecko, news, helius] = await Promise.all([
    isSolana ? fetchPumpFunData(tokenAddress) : Promise.resolve(null),
    fetchDexScreenerData(tokenAddress),
    fetchCoinGeckoData(tokenAddress, chain),
    symbol ? fetchCryptoNews(symbol) : Promise.resolve([]),
    isSolana ? fetchHeliusMetadata(tokenAddress) : Promise.resolve(null),
  ])

  const market: CoinMarketData = {
    price: dexscreener ? parseFloat(dexscreener.priceUsd) : (coingecko?.price ?? null),
    priceChange24h: dexscreener?.priceChange?.h24 ?? coingecko?.priceChange24h ?? null,
    priceChange7d: coingecko?.priceChange7d ?? null,
    marketCap: dexscreener?.marketCap ?? pumpfun?.usdMarketCap ?? coingecko?.marketCap ?? null,
    volume24h: dexscreener?.volume?.h24 ?? coingecko?.volume24h ?? null,
    liquidity: dexscreener?.liquidity?.usd ?? null,
    fdv: dexscreener?.fdv ?? coingecko?.fdv ?? null,
    ath: pumpfun?.athMarketCap ?? coingecko?.ath ?? null,
    athDate: pumpfun?.athMarketCapTimestamp
      ? new Date(pumpfun.athMarketCapTimestamp).toISOString()
      : (coingecko?.athDate ?? null),
    holders: coingecko?.holders ?? null,
    totalSupply: coingecko?.totalSupply ?? null,
    circulatingSupply: coingecko?.circulatingSupply ?? null,
  }

  return {
    pumpfun,
    dexscreener,
    market,
    news,
    heliusMeta: helius,
  }
}

// ── Formatting helpers ──
export function formatUSD(value: number | null): string {
  if (value === null) return "N/A"
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`
  if (value >= 1) return `$${value.toFixed(2)}`
  if (value >= 0.01) return `$${value.toFixed(4)}`
  return `$${value.toFixed(8)}`
}

export function formatNumber(value: number | null): string {
  if (value === null) return "N/A"
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`
  return value.toLocaleString()
}

export function formatPercent(value: number | null): string {
  if (value === null) return "N/A"
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

export function getChainExplorerUrl(chain: string, address: string): string {
  switch (chain) {
    case "solana":
      return `https://solscan.io/token/${address}`
    case "base":
      return `https://basescan.org/token/${address}`
    case "bnb":
      return `https://bscscan.com/token/${address}`
    default:
      return `https://solscan.io/token/${address}`
  }
}

export function getDexScreenerChartUrl(chain: string, pairAddress: string): string {
  const chainId = chain === "base" ? "base" : chain === "bnb" ? "bsc" : "solana"
  return `https://dexscreener.com/${chainId}/${pairAddress}`
}
