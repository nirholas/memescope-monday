---
name: coin-integration
description: "Add new external coin/token data API integrations. Use when: integrating DexScreener, PumpFun, CoinGecko, or any new blockchain data API. Covers fetch patterns, response types, caching, error handling, and chain mapping."
argument-hint: "Describe the integration (e.g., 'add Birdeye API for Solana token data')"
---

# Coin Data Integration

Add external blockchain/token data API integrations in `lib/coin-data/`.

## When to Use

- Integrating a new token data API (price feeds, market data, holder info)
- Adding a new data source for coin enrichment
- Building chain-specific data fetchers

## Procedure

1. Create a new file in `lib/coin-data/` (e.g., `birdeye.ts`)
2. Define response types/interfaces
3. Implement fetch functions with error handling and caching
4. Add chain mapping if the API uses different chain identifiers
5. Export functions for use in server actions or API routes

## Template

```ts
// lib/coin-data/my-api.ts

const MY_API_BASE = "https://api.example.com/v1"

// Response types
interface MyApiTokenData {
  address: string
  symbol: string
  name: string
  priceUsd: number
  marketCap: number
  volume24h: number
  holders: number
}

// Chain identifier mapping (APIs use different chain names)
const CHAIN_MAP: Record<string, string> = {
  solana: "solana",
  base: "base",
  bnb: "bsc",
  ethereum: "ethereum",
}

// Main fetch function
export async function getTokenData(
  chain: string,
  contractAddress: string,
): Promise<MyApiTokenData | null> {
  const apiChain = CHAIN_MAP[chain]
  if (!apiChain) return null

  try {
    const headers: Record<string, string> = {
      accept: "application/json",
    }

    // Optional API key from env
    const apiKey = process.env.MY_API_KEY
    if (apiKey) headers["X-API-Key"] = apiKey

    const res = await fetch(
      `${MY_API_BASE}/tokens/${apiChain}/${contractAddress}`,
      {
        headers,
        next: { revalidate: 60 }, // ISR cache: 60 seconds
      },
    )

    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error("MyAPI fetch failed:", error)
    return null // Graceful degradation — never throw
  }
}

// URL builder for embeds/links
export function getMyApiUrl(chain: string, contractAddress: string): string {
  const apiChain = CHAIN_MAP[chain] || "solana"
  return `https://example.com/${apiChain}/${contractAddress}`
}
```

## Rules

- **File location**: `lib/coin-data/<api-name>.ts`
- **Never throw** — return `null` or `[]` on failure (graceful degradation)
- **Log errors** with `console.error("ApiName fetch failed:", error)`
- **Cache responses** with `next: { revalidate: N }` in fetch options
- **API keys** from `process.env` — add optional header if key exists
- **Chain mapping** — always map internal chain names (`solana`, `base`, `bnb`, `ethereum`) to API-specific identifiers
- **Type responses** — define interfaces for API response data
- **Supported chains**: solana, base, bnb, ethereum (from `lib/constants.ts`)
- **Existing integrations** to reference: `dexscreener.ts`, `coingecko.ts`, `pumpfun.ts`
