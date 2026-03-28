/**
 * Post a tweet to X using cookie-based auth (X_AUTH_TOKEN + X_CT0).
 * Uses X's internal GraphQL API — no paid Twitter API required.
 */

const BEARER_TOKEN =
  "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"

const CREATE_TWEET_URL = "https://x.com/i/api/graphql/a1p9RWpkYKBjWv_I3WzS-A/CreateTweet"

interface PostTweetResult {
  success: boolean
  tweetId?: string
  error?: string
}

export async function postTweet(text: string): Promise<PostTweetResult> {
  const authToken = process.env.X_AUTH_TOKEN
  const ct0 = process.env.X_CT0

  if (!authToken || !ct0) {
    console.warn("[X Notification] X_AUTH_TOKEN or X_CT0 not set, skipping tweet")
    return { success: false, error: "X credentials not configured" }
  }

  try {
    const res = await fetch(CREATE_TWEET_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${BEARER_TOKEN}`,
        "content-type": "application/json",
        cookie: `auth_token=${authToken}; ct0=${ct0}`,
        "x-csrf-token": ct0,
        "x-twitter-active-user": "yes",
        "x-twitter-auth-type": "OAuth2Session",
      },
      body: JSON.stringify({
        variables: {
          tweet_text: text,
          dark_request: false,
          media: { media_entities: [], possibly_sensitive: false },
          semantic_annotation_ids: [],
        },
        features: {
          communities_web_enable_tweet_community_results_fetch: true,
          c9s_tweet_anatomy_moderator_badge_enabled: true,
          tweetypie_unmention_optimization_enabled: true,
          responsive_web_edit_tweet_api_enabled: true,
          graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
          view_counts_everywhere_api_enabled: true,
          longform_notetweets_consumption_enabled: true,
          responsive_web_twitter_article_tweet_consumption_enabled: true,
          tweet_awards_web_tipping_enabled: false,
          creator_subscriptions_quote_tweet_preview_enabled: false,
          longform_notetweets_rich_text_read_enabled: true,
          longform_notetweets_inline_media_enabled: true,
          articles_preview_enabled: true,
          rweb_video_timestamps_enabled: true,
          rweb_tipjar_consumption_enabled: true,
          responsive_web_graphql_exclude_directive_enabled: true,
          verified_phone_label_enabled: false,
          freedom_of_speech_not_reach_fetch_enabled: true,
          standardized_nudges_misinfo: true,
          tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          responsive_web_graphql_timeline_navigation_enabled: true,
          responsive_web_enhance_cards_enabled: false,
        },
        queryId: "a1p9RWpkYKBjWv_I3WzS-A",
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[X Notification] Tweet failed: ${res.status}`, body)
      return { success: false, error: `HTTP ${res.status}` }
    }

    const data = await res.json()
    const tweetResult = data?.data?.create_tweet?.tweet_results?.result
    const tweetId = tweetResult?.rest_id

    console.log(`[X Notification] Tweet posted: ${tweetId}`)
    return { success: true, tweetId }
  } catch (error) {
    console.error("[X Notification] Error posting tweet:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Post a notification tweet when a new coin is submitted.
 */
export async function notifyXNewCoin({
  name,
  ticker,
  chain,
  slug,
}: {
  name: string
  ticker?: string | null
  chain?: string | null
  slug: string
}): Promise<PostTweetResult> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://memescope-monday.com"
  const url = `${baseUrl}/projects/${slug}`

  const tickerPart = ticker ? ` $${ticker}` : ""
  const chainPart = chain ? ` on ${chain.charAt(0).toUpperCase() + chain.slice(1)}` : ""

  const text = `New coin listed on Memescope Monday:${tickerPart} (${name})${chainPart}\n\nCheck it out: ${url}`

  return postTweet(text)
}
