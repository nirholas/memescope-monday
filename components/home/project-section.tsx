"use client"

import Link from "next/link"

import { RiArrowRightLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"

import { ProjectCard } from "./project-card"

interface Project {
  id: string
  slug: string
  name: string
  description: string | null
  logoUrl: string
  websiteUrl?: string | null
  upvoteCount: number
  commentCount?: number | null
  launchStatus: string
  launchType?: string | null
  scheduledLaunchDate?: Date | string | null
  createdAt: Date | string
  userHasUpvoted?: boolean
  categories?: { id: string; name: string }[]
  dailyRanking?: number | null
  chain?: string | null
  ticker?: string | null
}

interface ProjectSectionProps {
  title: string
  projects: Project[]
  moreHref?: string
  sortByUpvotes?: boolean
  isAuthenticated: boolean
}

export function ProjectSection({
  title,
  projects,
  moreHref,
  sortByUpvotes = false,
  isAuthenticated,
}: ProjectSectionProps) {
  const sortedProjects = sortByUpvotes
    ? [...projects].sort((a, b) => (b.upvoteCount ?? 0) - (a.upvoteCount ?? 0))
    : projects

  return (
    <section>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {moreHref && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" asChild>
            <Link href={moreHref} className="flex items-center gap-1">
              View all <RiArrowRightLine className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </div>

      {sortedProjects.length > 0 ? (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          {sortedProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              slug={project.slug}
              description={project.description || ""}
              logoUrl={project.logoUrl}
              upvoteCount={project.upvoteCount ?? 0}
              commentCount={project.commentCount ?? 0}
              launchStatus={project.launchStatus}
              launchType={project.launchType}
              dailyRanking={project.dailyRanking}
              userHasUpvoted={project.userHasUpvoted ?? false}
              categories={project.categories ?? []}
              isAuthenticated={isAuthenticated}
              index={index}
              websiteUrl={project.websiteUrl ?? undefined}
              chain={project.chain}
              ticker={project.ticker}
            />
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground rounded-xl border border-dashed border-border/60 bg-card py-8 text-center text-sm">
          No coins found
        </div>
      )}
    </section>
  )
}
