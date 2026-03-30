import type { MetadataRoute } from "next"

import { eq } from "drizzle-orm"

import { db } from "@/drizzle/db"
import { blogArticle, launchStatus, project, seoArticle } from "@/drizzle/db/schema"

const baseUrl = process.env.NEXT_PUBLIC_URL || "https://memescopemonday.com"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/categories`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/pricing`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/trending`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/winners`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/reviews`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/sponsors`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/developers`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/projects/submit`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/legal`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/legal/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/legal/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/legal/badges`, changeFrequency: "yearly", priority: 0.3 },
  ]

  // Dynamic project pages (only launched/ongoing)
  const projects = await db
    .select({ slug: project.slug, updatedAt: project.updatedAt })
    .from(project)
    .where(eq(project.launchStatus, launchStatus.LAUNCHED))

  const projectPages: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${baseUrl}/projects/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }))

  // Blog articles
  const blogArticles = await db
    .select({ slug: blogArticle.slug, updatedAt: blogArticle.updatedAt })
    .from(blogArticle)

  const blogPages: MetadataRoute.Sitemap = blogArticles.map((a) => ({
    url: `${baseUrl}/blog/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  // SEO / review articles
  const seoArticles = await db
    .select({ slug: seoArticle.slug, updatedAt: seoArticle.updatedAt })
    .from(seoArticle)

  const reviewPages: MetadataRoute.Sitemap = seoArticles.map((a) => ({
    url: `${baseUrl}/reviews/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  return [...staticPages, ...projectPages, ...blogPages, ...reviewPages]
}
