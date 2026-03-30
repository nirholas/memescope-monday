/**
 * Post a tweet to X using the official X API v2 with OAuth 1.0a.
 * Requires: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
 */

import crypto from "crypto"

import { enrichCoinData } from "@/lib/coin-data"

const TWEET_URL = "https://api.x.com/2/tweets"

interface PostTweetResult {
  success: boolean
  tweetId?: string
  error?: string
}

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

function generateOAuthHeader(method: string, url: string): string {
  const apiKey = process.env.X_API_KEY!
  const apiSecret = process.env.X_API_SECRET!
  const accessToken = process.env.X_ACCESS_TOKEN!
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET!

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = crypto.randomBytes(16).toString("hex")

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  }

  const sortedParams = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join("&")

  const signatureBase = `${method}&${percentEncode(url)}&${percentEncode(sortedParams)}`
  const signingKey = `${percentEncode(apiSecret)}&${percentEncode(accessTokenSecret)}`
  const signature = crypto.createHmac("sha1", signingKey).update(signatureBase).digest("base64")

  oauthParams.oauth_signature = signature

  const header = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(", ")

  return `OAuth ${header}`
}

export async function postTweet(text: string): Promise<PostTweetResult> {
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET } = process.env

  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_TOKEN_SECRET) {
    console.warn("[X Notification] X API credentials not set, skipping tweet")
    return { success: false, error: "X API credentials not configured" }
  }

  const body = JSON.stringify({ text })

  try {
    const res = await fetch(TWEET_URL, {
      method: "POST",
      headers: {
        Authorization: generateOAuthHeader("POST", TWEET_URL),
        "Content-Type": "application/json",
      },
      body,
    })

    if (!res.ok) {
      const errorBody = await res.text()
      console.error(`[X Notification] Tweet failed: ${res.status}`, errorBody)
      return { success: false, error: `HTTP ${res.status}` }
    }

    const data = await res.json()
    const tweetId = data?.data?.id

    console.log(`[X Notification] Tweet posted: ${tweetId}`)
    return { success: true, tweetId }
  } catch (error) {
    console.error("[X Notification] Error posting tweet:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Extract an @handle from a Twitter/X profile URL.
 * Returns null if the URL can't be parsed.
 */
function parseTwitterHandle(twitterUrl: string | null | undefined): string | null {
  if (!twitterUrl) return null
  try {
    const { pathname } = new URL(twitterUrl)
    const handle = pathname.split("/").filter(Boolean)[0]
    return handle ? `@${handle}` : null
  } catch {
    return null
  }
}

/**
 * Format a number into a compact human-readable string (e.g. 4200000 → "$4.2M").
 */
function formatCompact(value: number, prefix = "$"): string {
  if (value >= 1_000_000_000) return `${prefix}${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(1)}K`
  return `${prefix}${value.toFixed(0)}`
}

/**
 * Post a notification tweet when a new coin is submitted.
 * When a contractAddress is provided, live market data is fetched from
 * DexScreener / PumpFun / Helius / CoinGecko before composing the tweet.
 */
export async function notifyXNewCoin({
  name,
  ticker,
  chain,
  slug,
  twitterUrl,
  contractAddress,
}: {
  name: string
  ticker?: string | null
  chain?: string | null
  slug: string
  twitterUrl?: string | null
  contractAddress?: string | null
}): Promise<PostTweetResult> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://memescope-monday.com"
  const url = `${baseUrl}/projects/${slug}`

  // Fetch live market data when we have a contract address
  let marketCap: number | undefined
  let volume24h: number | undefined
  let holders: number | undefined
  let enrichedTwitterUrl = twitterUrl

  if (contractAddress) {
    try {
      const enriched = await enrichCoinData(contractAddress, chain ?? "solana")
      marketCap = enriched.marketCap
      volume24h = enriched.volume24h
      holders = enriched.holders
      if (!enrichedTwitterUrl && enriched.twitterUrl) enrichedTwitterUrl = enriched.twitterUrl
    } catch (err) {
      console.warn("[X Notification] Enrichment failed, posting without market data:", err)
    }
  }

  const tickerPart = ticker ? ` $${ticker}` : ""
  const chainPart = chain ? ` on ${chain.charAt(0).toUpperCase() + chain.slice(1)}` : ""
  const handle = parseTwitterHandle(enrichedTwitterUrl)
  const handlePart = handle ? ` by ${handle}` : ""

  // Build optional market stats lines
  const stats: string[] = []
  if (marketCap) stats.push(`Market Cap: ${formatCompact(marketCap)}`)
  if (volume24h) stats.push(`24h Vol: ${formatCompact(volume24h)}`)
  if (holders) stats.push(`Holders: ${holders.toLocaleString("en-US")}`)
  const statsPart = stats.length > 0 ? `\n${stats.join(" | ")}\n` : ""

  const text = `New coin listed on Memescope Monday:${tickerPart} (${name})${chainPart}${handlePart}\n${statsPart}\nCheck it out: ${url}`

  return postTweet(text)
}
