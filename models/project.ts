import { Project, ChatMessage } from "@/types/project";
import { getSupabaseClient, isSupabaseConfigured } from "./db";

export enum ProjectStatus {
  Created = "created",
  Pending = "pending",
  Approved = "approved",
  Deleted = "deleted",
}

// Demo data for development without Supabase
const DEMO_COINS: Project[] = [
  {
    uuid: "demo-1",
    name: "gake-coin",
    title: "Gake",
    ticker: "GAKE",
    description: "The cutest dog coin you've ever seen. Born on Memescope Monday, this little pup went from 12k mcap to 26M. Everyone won.",
    chain: "solana",
    category: "Dog",
    coin_type: "existing",
    contract_address: "GaKExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    status: "created",
    is_featured: true,
    votes: 342,
    trending: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    target: "_self",
    sort: 10,
  },
  {
    uuid: "demo-2",
    name: "moon-pepe",
    title: "Moon Pepe",
    ticker: "MPEPE",
    description: "Pepe went to the moon and never came back. The most based frog on Solana. Community-driven memecoin with diamond hand holders.",
    chain: "solana",
    category: "Meme",
    coin_type: "existing",
    contract_address: "MPEPExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    status: "created",
    is_featured: true,
    votes: 218,
    trending: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    target: "_self",
    sort: 9,
  },
  {
    uuid: "demo-3",
    name: "based-cat",
    title: "Based Cat",
    ticker: "BCAT",
    description: "The most based cat on Base chain. Launched by a community of cat lovers who believe felines are superior to dogs (they're wrong but we love them).",
    chain: "base",
    category: "Cat",
    coin_type: "existing",
    contract_address: "0xBCATxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    status: "created",
    is_featured: true,
    votes: 156,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    target: "_self",
    sort: 8,
  },
  {
    uuid: "demo-4",
    name: "ai-degen",
    title: "AI Degen",
    ticker: "AIDGN",
    description: "The first AI-powered degen trading agent that posts its own trades on Twitter. Fully autonomous, fully unhinged. Built on BNB Chain.",
    chain: "bnb",
    category: "AI",
    coin_type: "existing",
    contract_address: "0xAIDGNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    status: "created",
    is_featured: true,
    votes: 89,
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
    target: "_self",
    sort: 7,
  },
  {
    uuid: "demo-5",
    name: "sigma-launch",
    title: "Sigma Protocol",
    ticker: "SIGMA",
    description: "Upcoming launch on Solana. The sigma grindset coin for degens who never stop trading. Pre-launch hype building fast.",
    chain: "solana",
    category: "Culture",
    coin_type: "upcoming",
    launch_date: new Date(Date.now() + 259200000).toISOString(),
    status: "created",
    is_featured: true,
    votes: 67,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    target: "_self",
    sort: 6,
  },
  {
    uuid: "demo-6",
    name: "turbo-frog",
    title: "Turbo Frog",
    ticker: "TFROG",
    description: "The fastest frog in DeFi. Turbo Frog goes brrr. Community of 5000+ diamond hand frogs riding this to Valhalla.",
    chain: "solana",
    category: "Meme",
    coin_type: "existing",
    contract_address: "TFROGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    status: "created",
    is_featured: true,
    votes: 203,
    paid_trending: true,
    created_at: new Date(Date.now() - 43200000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString(),
    target: "_self",
    sort: 5,
  },
];

const DEMO_CHAT: ChatMessage[] = [
  { uuid: "c1", coin_slug: "gake-coin", author: "BasedApe42", text: "LFG this dog is going to 100M", created_at: new Date(Date.now() - 300000).toISOString() },
  { uuid: "c2", coin_slug: "gake-coin", author: "DiamondWhale7", text: "Just aped in with 2 SOL lets ride", created_at: new Date(Date.now() - 240000).toISOString() },
  { uuid: "c3", coin_slug: "gake-coin", author: "MoonFrog99", text: "memescope monday never misses", created_at: new Date(Date.now() - 180000).toISOString() },
  { uuid: "c4", coin_slug: "gake-coin", author: "SigmaBull23", text: "chart looking beautiful rn", created_at: new Date(Date.now() - 60000).toISOString() },
];

export async function insertProject(project: Project) {
  if (!isSupabaseConfigured()) return project;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("projects").insert(project);
  if (error) throw error;
  return data;
}

export async function findProjectByUuid(
  uuid: string
): Promise<Project | undefined> {
  if (!isSupabaseConfigured()) return DEMO_COINS.find((c) => c.uuid === uuid);
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("uuid", uuid)
    .eq("status", ProjectStatus.Created)
    .single();
  if (!data) return undefined;
  return data;
}

export async function findProjectByName(
  name: string
): Promise<Project | undefined> {
  if (!isSupabaseConfigured()) return DEMO_COINS.find((c) => c.name === name);
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("name", name)
    .eq("status", ProjectStatus.Created)
    .single();
  if (!data) return undefined;
  return data;
}

export async function getProjects(
  page: number,
  limit: number
): Promise<Project[]> {
  if (!isSupabaseConfigured()) return DEMO_COINS;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", ProjectStatus.Created)
    .order("votes", { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (error) return [];
  return data;
}

export async function getProjectsCount(): Promise<number> {
  if (!isSupabaseConfigured()) return DEMO_COINS.length;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("count")
    .eq("status", ProjectStatus.Created);
  if (error) return 0;
  return data?.[0]?.count || 0;
}

export async function getProjectsCountByCategory(
  category: string
): Promise<number> {
  if (!isSupabaseConfigured()) return DEMO_COINS.filter((c) => c.category === category).length;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("count")
    .eq("category", category)
    .eq("status", ProjectStatus.Created);
  if (error) return 0;
  return data?.[0]?.count || 0;
}

export async function getProjectsByCategory(
  category: string,
  page: number,
  limit: number
): Promise<Project[]> {
  if (!isSupabaseConfigured()) return DEMO_COINS.filter((c) => c.category === category);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("category", category)
    .eq("status", ProjectStatus.Created)
    .order("votes", { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (error) return [];
  return data;
}

export async function getFeaturedProjects(
  page: number,
  limit: number
): Promise<Project[]> {
  if (!isSupabaseConfigured()) return DEMO_COINS;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_featured", true)
    .eq("status", ProjectStatus.Created)
    .order("votes", { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (error) return [];
  return data;
}

export async function getRandomProjects(
  page: number,
  limit: number
): Promise<Project[]> {
  if (!isSupabaseConfigured()) return DEMO_COINS.sort(() => Math.random() - 0.5);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", ProjectStatus.Created)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (error) return [];
  return data.sort(() => Math.random() - 0.5);
}

export async function getTrendingProjects(
  page: number,
  limit: number
): Promise<Project[]> {
  if (!isSupabaseConfigured()) return DEMO_COINS.filter((c) => c.trending || c.paid_trending);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", ProjectStatus.Created)
    .or("trending.eq.true,paid_trending.eq.true")
    .order("votes", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (error) return [];
  return data;
}

export async function getProjectsWithKeyword(
  keyword: string,
  page: number,
  limit: number
): Promise<Project[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .or(
      `name.ilike.%${keyword}%,title.ilike.%${keyword}%,description.ilike.%${keyword}%,ticker.ilike.%${keyword}%`
    )
    .eq("status", ProjectStatus.Created)
    .order("votes", { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (error) return [];
  return data;
}

export async function upvoteProject(
  name: string
): Promise<number> {
  const supabase = getSupabaseClient();
  const project = await findProjectByName(name);
  if (!project || !project.uuid) throw new Error("Coin not found");
  const newVotes = (project.votes ?? 0) + 1;
  await supabase
    .from("projects")
    .update({ votes: newVotes })
    .eq("uuid", project.uuid);
  return newVotes;
}

export async function updateProject(uuid: string, project: Partial<Project>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .update(project)
    .eq("uuid", uuid);
  if (error) throw error;
  return data;
}

// Chat functions
export async function getChatMessages(
  coinSlug: string,
  limit: number = 100
): Promise<ChatMessage[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("coin_slug", coinSlug)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) return [];
  return data;
}

export async function insertChatMessage(
  message: ChatMessage
): Promise<ChatMessage> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .insert(message)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getProjectsWithoutSummary(
  page: number,
  limit: number
): Promise<Project[]> {
  if (!page) page = 1;
  if (!limit) limit = 20;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .is("summary", null)
    .eq("status", ProjectStatus.Created)
    .range((page - 1) * limit, page * limit - 1);
  if (error) return [];
  return data;
}
