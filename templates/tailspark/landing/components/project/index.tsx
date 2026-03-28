"use client";

import { Category } from "@/types/category";
import Crumb from "./crumb";
import { Project } from "@/types/project";
import Projects from "../projects";
import moment from "moment";
import { useState, useEffect, useRef } from "react";

const chainStyles: Record<string, { badge: string; icon: string; name: string }> = {
  solana: { badge: "chain-badge chain-solana", icon: "◎", name: "Solana" },
  base: { badge: "chain-badge chain-base", icon: "🔵", name: "Base" },
  bnb: { badge: "chain-badge chain-bnb", icon: "🟡", name: "BNB Chain" },
};

const ANON_ADJECTIVES = ["Based", "Diamond", "Moon", "Degen", "Alpha", "Sigma", "Chad", "Giga", "Turbo", "Ultra", "Mega", "Super", "Hyper", "Cosmic"];
const ANON_NOUNS = ["Ape", "Bull", "Frog", "Whale", "Shark", "Pepe", "Wojak", "Doge", "Cat", "Bear", "Fox", "Hawk", "Wolf", "Lion"];

function generateAnonName(): string {
  const adj = ANON_ADJECTIVES[Math.floor(Math.random() * ANON_ADJECTIVES.length)];
  const noun = ANON_NOUNS[Math.floor(Math.random() * ANON_NOUNS.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${noun}${num}`;
}

function getDexScreenerUrl(chain: string, address: string): string {
  const prefixes: Record<string, string> = { solana: "solana", base: "base", bnb: "bsc" };
  return `https://dexscreener.com/${prefixes[chain] || "solana"}/${address}?embed=1&theme=dark&info=0`;
}

interface ChatMsg {
  id: string;
  author: string;
  text: string;
  created_at: string;
}

export default ({
  category,
  project,
  more_projects,
}: {
  category?: Category;
  project: Project;
  more_projects?: Project[];
}) => {
  const chain = project.chain || "solana";
  const style = chainStyles[chain] || chainStyles.solana;
  const [votes, setVotes] = useState(project.votes ?? 0);
  const [voted, setVoted] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [anonName] = useState(generateAnonName);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatLoading, setChatLoading] = useState(false);

  // Load chat messages
  useEffect(() => {
    if (!project.name) return;
    fetch(`/api/chat/${project.name}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setChatMessages(d.data);
      })
      .catch(() => {});
  }, [project.name]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleUpvote = async () => {
    if (voted) return;
    try {
      const res = await fetch(`/api/vote/${project.name}`, { method: "POST" });
      const data = await res.json();
      if (data.data?.votes !== undefined) {
        setVotes(data.data.votes);
        setVoted(true);
      }
    } catch {}
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    setChatLoading(true);
    try {
      const res = await fetch(`/api/chat/${project.name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: anonName, text: chatInput.slice(0, 280) }),
      });
      const data = await res.json();
      if (data.data) {
        setChatMessages((prev) => [...prev, data.data]);
        setChatInput("");
      }
    } catch {}
    setChatLoading(false);
  };

  const hasChart = project.coin_type === "existing" && project.contract_address;

  // Launch countdown for upcoming coins
  const isUpcoming = project.coin_type === "upcoming" && project.launch_date;
  const [launchCountdown, setLaunchCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, passed: false });

  useEffect(() => {
    if (!isUpcoming) return;
    const update = () => {
      const target = new Date(project.launch_date!);
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setLaunchCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, passed: true });
        return;
      }
      setLaunchCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        passed: false,
      });
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [isUpcoming, project.launch_date]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-4 md:px-10 md:py-4 lg:py-4">
      <Crumb category={category} project={project} />

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <button
              onClick={handleUpvote}
              className={`upvote-btn shrink-0 ${voted ? "voted" : ""}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              <span className="text-lg font-bold text-white">{votes}</span>
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {project.avatar_url && (
                  <img src={project.avatar_url} alt={project.title} className="w-12 h-12 rounded-full object-cover" />
                )}
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {project.title}
                    {project.ticker && (
                      <span className="text-[#8b8d98] text-xl ml-2">${project.ticker}</span>
                    )}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={style.badge}>{style.icon} {style.name}</span>
                    {project.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a2d3a] text-[#8b8d98]">
                        {project.category}
                      </span>
                    )}
                    {(project.trending || project.paid_trending) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#00ff88]/10 text-[#00ff88]">
                        Trending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-[#8b8d98] mt-3">{project.description}</p>

              <div className="flex items-center gap-2 mt-3 text-xs text-[#8b8d98]">
                <span>Submitted {moment(project.created_at).fromNow()}</span>
                {project.market_cap && (
                  <>
                    <span className="text-[#2a2d3a]">|</span>
                    <span>MCap: {project.market_cap}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming launch countdown */}
          {isUpcoming && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-6 mb-6 text-center">
              {launchCountdown.passed ? (
                <p className="text-[#00ff88] text-xl font-bold">LAUNCHED!</p>
              ) : (
                <>
                  <p className="text-yellow-400 text-sm uppercase tracking-widest mb-3">
                    Launch Countdown
                  </p>
                  <div className="flex justify-center gap-4">
                    {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
                      <div key={unit} className="flex flex-col items-center">
                        <span className="text-3xl font-bold font-mono text-yellow-400">
                          {String(launchCountdown[unit]).padStart(2, "0")}
                        </span>
                        <span className="text-xs text-[#8b8d98] uppercase">{unit}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Contract address */}
          {project.contract_address && (
            <div className="rounded-xl border border-[#2a2d3a] bg-[#181a25] p-4 mb-6">
              <p className="text-xs text-[#8b8d98] mb-1">Contract Address</p>
              <p className="text-sm text-white font-mono break-all">{project.contract_address}</p>
            </div>
          )}

          {/* Chart embed */}
          {hasChart && (
            <div className="rounded-xl border border-[#2a2d3a] overflow-hidden mb-6">
              <iframe
                src={getDexScreenerUrl(chain, project.contract_address!)}
                className="w-full h-[400px] border-0"
                title="DexScreener Chart"
              />
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-3 mb-6">
            {project.website_url && (
              <a href={project.website_url} target="_blank" className="px-4 py-2 rounded-lg border border-[#2a2d3a] bg-[#181a25] text-sm text-white hover:border-[#00ff88]/30 transition-colors">
                Website
              </a>
            )}
            {project.twitter_url && (
              <a href={project.twitter_url} target="_blank" className="px-4 py-2 rounded-lg border border-[#2a2d3a] bg-[#181a25] text-sm text-white hover:border-[#00ff88]/30 transition-colors">
                Twitter
              </a>
            )}
            {project.telegram_url && (
              <a href={project.telegram_url} target="_blank" className="px-4 py-2 rounded-lg border border-[#2a2d3a] bg-[#181a25] text-sm text-white hover:border-[#00ff88]/30 transition-colors">
                Telegram
              </a>
            )}
            {project.pumpfun_url && (
              <a href={project.pumpfun_url} target="_blank" className="px-4 py-2 rounded-lg border border-[#2a2d3a] bg-[#181a25] text-sm text-white hover:border-[#00ff88]/30 transition-colors">
                PumpFun
              </a>
            )}
            {project.dexscreener_url && (
              <a href={project.dexscreener_url} target="_blank" className="px-4 py-2 rounded-lg border border-[#2a2d3a] bg-[#181a25] text-sm text-white hover:border-[#00ff88]/30 transition-colors">
                DexScreener
              </a>
            )}
            {project.url && (
              <a href={project.url} target="_blank" className="px-4 py-2 rounded-lg bg-[#00ff88] text-[#0a0b0f] text-sm font-semibold hover:bg-[#00cc6e] transition-colors">
                View Project
              </a>
            )}
          </div>

          {/* Tags */}
          {project.tags && (
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tags.split(",").map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 rounded-full bg-[#2a2d3a] text-[#8b8d98]">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Trollbox Chat */}
        <div className="lg:col-span-1">
          <div className="trollbox sticky top-4">
            <div className="px-4 py-3 border-b border-[#2a2d3a] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00ff88] pulse-live" />
              <span className="text-white font-semibold text-sm">Trollbox</span>
              <span className="text-[#8b8d98] text-xs ml-auto">
                as {anonName}
              </span>
            </div>

            <div className="h-[400px] overflow-y-auto">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[#8b8d98] text-sm">
                  No messages yet. Be the first degen to post!
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={msg.id || i} className="trollbox-message">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[#00ff88] text-xs font-medium">
                        {msg.author}
                      </span>
                      <span className="text-[#8b8d98] text-[10px]">
                        {moment(msg.created_at).fromNow()}
                      </span>
                    </div>
                    <p className="text-white text-sm">{msg.text}</p>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t border-[#2a2d3a]">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#0a0b0f] border border-[#2a2d3a] text-white text-sm placeholder-[#8b8d98] focus:outline-none focus:border-[#00ff88]/50"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChat();
                    }
                  }}
                  maxLength={280}
                />
                <button
                  onClick={handleSendChat}
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-3 py-2 rounded-lg bg-[#00ff88] text-[#0a0b0f] font-semibold text-sm hover:bg-[#00cc6e] disabled:opacity-50 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* More coins */}
      <div className="w-full text-center mt-16">
        <p className="text-white font-bold text-2xl mb-4">More Coins</p>
        {more_projects && <Projects projects={more_projects} />}
      </div>
    </div>
  );
};
