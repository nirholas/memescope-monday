"use client"

import Link from "next/link"

import { launchStatus as launchStatusEnum } from "@/drizzle/db/schema"
import { RiChat3Line } from "@remixicon/react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { UpvoteButton } from "@/components/project/upvote-button"

interface ProjectCardButtonsProps {
  projectPageUrl: string
  commentCount: number
  projectId: string
  upvoteCount: number
  isAuthenticated: boolean
  hasUpvoted: boolean
  launchStatus: string
  projectName: string
}

export function ProjectCardButtons({
  projectPageUrl,
  commentCount,
  projectId,
  upvoteCount,
  isAuthenticated,
  hasUpvoted,
  launchStatus,
  projectName,
}: ProjectCardButtonsProps) {
  const isActiveLaunch = launchStatus === launchStatusEnum.ONGOING

  return (
    <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
      {/* Comment button */}
      <Link
        href={`${projectPageUrl}#comments`}
        className="group/btn hidden h-12 w-12 flex-col items-center justify-center rounded-lg border border-border/60 transition-all hover:border-primary/40 sm:flex"
        aria-label={`View comments for ${projectName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <RiChat3Line className="h-4 w-4 text-muted-foreground group-hover/btn:text-primary transition-colors" />
        <span className="mt-0.5 text-xs font-semibold text-muted-foreground group-hover/btn:text-primary transition-colors">
          {commentCount}
        </span>
      </Link>

      {/* Upvote button */}
      {isActiveLaunch ? (
        <UpvoteButton
          projectId={projectId}
          initialUpvoted={hasUpvoted}
          upvoteCount={upvoteCount}
          isAuthenticated={isAuthenticated}
          variant="compact"
        />
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg border border-dashed border-border/60">
                <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
                <span className="mt-0.5 text-xs font-semibold text-muted-foreground">
                  {upvoteCount}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="z-100 text-xs">
              Upvoting closed
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
