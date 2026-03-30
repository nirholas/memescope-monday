import type { PumpFunCoin } from "./types"

const PUMPFUN_API = "https://frontend-api-v3.pump.fun"

export async function getPumpFunCoin(mint: string): Promise<PumpFunCoin | null> {
  try {
    const res = await fetch(`${PUMPFUN_API}/coins/${mint}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    console.error("PumpFun fetch failed:", e)
    return null
  }
}

/**
 * Fetch recently graduated (migrated) coins from PumpFun.
 * These are coins where the bonding curve completed and they migrated to Raydium/PumpSwap.
 */
export async function getPumpFunGraduatedCoins(limit = 20): Promise<PumpFunCoin[]> {
  try {
    const res = await fetch(
      `${PUMPFUN_API}/coins?sort=last_trade_timestamp&order=desc&limit=${limit}&complete=true&includeNsfw=false`,
      { next: { revalidate: 60 } },
    )
    if (!res.ok) {
      // Fallback: fetch top coins by market cap and filter for completed ones
      const fallbackRes = await fetch(
        `${PUMPFUN_API}/coins?sort=market_cap&order=desc&limit=50&includeNsfw=false`,
        { next: { revalidate: 60 } },
      )
      if (!fallbackRes.ok) return []
      const all: PumpFunCoin[] = await fallbackRes.json()
      return all.filter((c) => c.complete).slice(0, limit)
    }
    return await res.json()
  } catch (e) {
    console.error("PumpFun graduated fetch failed:", e)
    return []
  }
}

export async function searchPumpFunCoins(query: string, limit = 10): Promise<PumpFunCoin[]> {
  try {
    const res = await fetch(
      `${PUMPFUN_API}/coins?search=${encodeURIComponent(query)}&limit=${limit}&sort=market_cap&order=desc`,
      { next: { revalidate: 60 } },
    )
    if (!res.ok) return []
    return await res.json()
  } catch (e) {
    console.error("PumpFun search failed:", e)
    return []
  }
}
