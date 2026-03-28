"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { RiExternalLinkLine } from "@remixicon/react"

import { getProjectWebsiteRelAttribute } from "@/lib/link-utils"

import { ProjectCardButtons } from "./project-card-buttons"

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim()
}

interface Category {
  id: string
  name: string
}

interface ProjectCardProps {
  id: string
  slug: string
  name: string
  description: string
  logoUrl: string
  upvoteCount: number
  commentCount: number
  launchStatus: string
  launchType?: string | null
  dailyRanking?: number | null
  index?: number
  userHasUpvoted: boolean
  categories: Category[]
  isAuthenticated: boolean
  websiteUrl?: string
  chain?: string | null
  ticker?: string | null
}

export function ProjectCard({
  id,
  slug,
  name,
  description,
  logoUrl,
  upvoteCount,
  commentCount,
  launchStatus,
  launchType,
  dailyRanking,
  index,
  userHasUpvoted,
  categories,
  isAuthenticated,
  websiteUrl,
  chain,
  ticker,
}: ProjectCardProps) {
  const router = useRouter()
  const projectPageUrl = `/projects/${slug}`

  return (
    <div
      className="group cursor-pointer border-b border-border/50 px-2 py-4 transition-colors hover:bg-muted/40 sm:px-4"
      onClick={(e) => {
        e.stopPropagation()
        router.push(projectPageUrl)
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-border/60 bg-muted/30 sm:h-14 sm:w-14">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${name} logo`}
                fill
                className="object-contain p-1"
                sizes="(max-width: 640px) 48px, 56px"
                unoptimized
              />
            ) : (
              <span className="text-muted-foreground flex h-full w-full items-center justify-center text-lg font-bold">
                {name.charAt(0)}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link href={projectPageUrl} onClick={(e) => e.stopPropagation()}>
              <h3 className="group-hover:text-primary line-clamp-1 text-sm font-semibold transition-colors sm:text-base">
                {typeof index === "number" ? `${index + 1}. ` : ""}
                {name}
              </h3>
            </Link>
            {ticker && (
              <span className="text-muted-foreground text-xs font-medium">${ticker}</span>
            )}
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel={getProjectWebsiteRelAttribute({ launchStatus, launchType, dailyRanking })}
                className="text-muted-foreground hover:text-primary inline-flex transition-colors"
                onClick={(e) => e.stopPropagation()}
                title={`Visit ${name} website`}
              >
                <RiExternalLinkLine className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs sm:text-sm">
            {stripHtml(description)}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs">
            {categories.slice(0, 3).map((cat, i) => (
              <span key={cat.id} className="flex items-center gap-1">
                {i > 0 && <span className="text-muted-foreground/40">·</span>}
                <Link
                  href={`/categories?category=${cat.id}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {cat.name}
                </Link>
              </span>
            ))}
            {chain && (
              <>
                {categories.length > 0 && <span className="text-muted-foreground/40">·</span>}
                <span className={`inline-flex items-center gap-0.5 font-medium ${
                  chain === "solana" ? "text-purple-600 dark:text-purple-400"
                  : chain === "base" ? "text-blue-600 dark:text-blue-400"
                  : chain === "bnb" ? "text-yellow-600 dark:text-yellow-400"
                  : "text-indigo-600 dark:text-indigo-400"
                }`}>
                  {chain.charAt(0).toUpperCase() + chain.slice(1)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Upvote & Comment buttons */}
        <ProjectCardButtons
          projectPageUrl={projectPageUrl}
          commentCount={commentCount}
          projectId={id}
          upvoteCount={upvoteCount}
          isAuthenticated={isAuthenticated}
          hasUpvoted={userHasUpvoted}
          launchStatus={launchStatus}
          projectName={name}
        />
      </div>
    </div>
  )
}
