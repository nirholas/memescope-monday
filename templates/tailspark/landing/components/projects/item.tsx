"use client";

import Link from "next/link";
import { Project } from "@/types/project";
import moment from "moment";

const chainStyles: Record<string, { badge: string; icon: string }> = {
  solana: { badge: "chain-badge chain-solana", icon: "◎" },
  base: { badge: "chain-badge chain-base", icon: "🔵" },
  bnb: { badge: "chain-badge chain-bnb", icon: "🟡" },
};

export default ({ project }: { project: Project }) => {
  const chain = project.chain || "solana";
  const style = chainStyles[chain] || chainStyles.solana;

  return (
    <Link href={`/coin/${project.name}`}>
      <div className="mb-4 overflow-hidden rounded-xl border border-[#2a2d3a] bg-[#181a25] p-5 text-left hover:border-[#00ff88]/30 hover:shadow-[0_0_15px_rgba(0,255,136,0.05)] transition-all group">
        <div className="flex items-start gap-4">
          {/* Upvote column */}
          <div className="upvote-btn shrink-0 min-w-[48px]">
            <svg
              className="w-4 h-4 text-[#8b8d98] group-hover:text-[#00ff88]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
            <span className="text-sm font-bold text-white">
              {project.votes ?? 0}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {project.avatar_url && (
                <img
                  src={project.avatar_url}
                  alt={project.title}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-white truncate">
                  {project.title}
                </span>
                {project.ticker && (
                  <span className="text-[#8b8d98] text-sm shrink-0">
                    ${project.ticker}
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-[#8b8d98] line-clamp-2 mb-3">
              {project.description}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <span className={style.badge}>
                {style.icon} {chain.charAt(0).toUpperCase() + chain.slice(1)}
              </span>

              {project.category && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a2d3a] text-[#8b8d98]">
                  {project.category}
                </span>
              )}

              {project.coin_type === "upcoming" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                  Upcoming Launch
                </span>
              )}

              {(project.trending || project.paid_trending) && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#00ff88]/10 text-[#00ff88]">
                  Trending
                </span>
              )}

              <span className="text-xs text-[#8b8d98] ml-auto shrink-0">
                {moment(project.created_at).fromNow()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
