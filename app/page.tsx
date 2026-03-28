import { headers } from "next/headers"
import Link from "next/link"

import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CountdownTimer } from "@/components/home/countdown-timer"
import { ProjectSection } from "@/components/home/project-section"
import { getNewlyListedProjects, getTopVotedProjects } from "@/app/actions/home"
import { getTopCategories } from "@/app/actions/projects"

export default async function Home() {
  const topVotedProjects = await getTopVotedProjects()
  const trendingProjects = await getTopVotedProjects(10)
  const newlyListedProjects = await getNewlyListedProjects()
  const topCategories = await getTopCategories(5)

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return (
    <main className="min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 pt-6 pb-12 md:pt-8">
        {/* Countdown Banner */}
        <CountdownTimer />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px] lg:items-start">
          {/* Main Content */}
          <div className="space-y-8">
            <ProjectSection
              title="Top Voted Coins"
              projects={topVotedProjects}
              sortByUpvotes={true}
              isAuthenticated={!!session?.user}
            />

            <ProjectSection
              title="Trending Coins"
              projects={trendingProjects}
              moreHref="/trending"
              sortByUpvotes={true}
              isAuthenticated={!!session?.user}
            />

            <ProjectSection
              title="Newly Listed"
              projects={newlyListedProjects}
              moreHref="/trending?filter=recent"
              sortByUpvotes={false}
              isAuthenticated={!!session?.user}
            />
          </div>

          {/* Sidebar */}
          <aside className="hidden space-y-6 lg:block">
            {/* Top Categories */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
                  Top Categories
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-auto p-0 text-xs"
                  asChild
                >
                  <Link href="/categories">View all</Link>
                </Button>
              </div>
              <div className="space-y-0.5">
                {topCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories?category=${category.id}`}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                      "hover:bg-muted/60",
                    )}
                  >
                    <span>{category.name}</span>
                    <span className="text-muted-foreground text-xs">{category.count}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Access */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-sm font-bold tracking-wider uppercase">
                Quick Access
              </h3>
              <div className="space-y-0.5">
                {session?.user && (
                  <Link
                    href="/dashboard"
                    className="hover:bg-muted/60 flex items-center rounded-lg px-3 py-2 text-sm transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/trending"
                  className="hover:bg-muted/60 flex items-center rounded-lg px-3 py-2 text-sm transition-colors"
                >
                  Top Voted
                </Link>
                <Link
                  href="/trending"
                  className="hover:bg-muted/60 flex items-center rounded-lg px-3 py-2 text-sm transition-colors"
                >
                  Trending Coins
                </Link>
                <Link
                  href="/trending?filter=recent"
                  className="hover:bg-muted/60 flex items-center rounded-lg px-3 py-2 text-sm transition-colors"
                >
                  Newly Listed
                </Link>
                <Link
                  href="/submit"
                  className="text-primary hover:bg-muted/60 flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                >
                  Submit Coin
                </Link>
              </div>
            </div>

            {/* Submit CTA */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-sm font-bold tracking-wider uppercase">
                List Your Coin
              </h3>
              <div className="border-border/60 bg-card rounded-xl border p-4">
                <p className="text-muted-foreground mb-3 text-sm">
                  Get your memecoin in front of the community. Submit for free or boost for more
                  visibility.
                </p>
                <div className="flex gap-2">
                  <Link
                    href="/projects/submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 rounded-lg px-3 py-2 text-center text-xs font-semibold transition-colors"
                  >
                    Submit Free
                  </Link>
                  <Link
                    href="/pricing"
                    className="border-border hover:bg-muted/60 flex-1 rounded-lg border px-3 py-2 text-center text-xs font-semibold transition-colors"
                  >
                    Boost
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
