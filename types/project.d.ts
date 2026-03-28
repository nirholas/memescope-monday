export type Chain = "solana" | "base" | "bnb";
export type CoinType = "existing" | "upcoming";
export type SubmissionStatus = "pending" | "approved" | "featured" | "rejected";

export interface Project {
  uuid?: string;
  name?: string;
  title: string;
  ticker?: string;
  description?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
  author_name?: string;
  author_avatar_url?: string;
  tags?: string;
  category?: string;
  is_featured?: boolean;
  sort?: number;
  url?: string;
  target?: "_blank" | "_self";
  content?: string;
  summary?: string;
  img_url?: string;
  // Coin-specific fields
  chain?: Chain;
  coin_type?: CoinType;
  contract_address?: string;
  website_url?: string;
  twitter_url?: string;
  telegram_url?: string;
  pumpfun_url?: string;
  dexscreener_url?: string;
  market_cap?: string;
  votes?: number;
  launch_date?: string;
  trending?: boolean;
  paid_expedited?: boolean;
  paid_trending?: boolean;
  week_label?: string;
  submitter_email?: string;
}

export interface ChatMessage {
  id?: number;
  uuid?: string;
  coin_slug: string;
  author: string;
  text: string;
  created_at?: string;
}
