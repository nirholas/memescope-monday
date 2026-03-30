import { eq } from "drizzle-orm"

import { db } from "@/drizzle/db"
import { project as projectTable } from "@/drizzle/db/schema"

/**
 * Generate a unique slug for a project.
 * Retries with incrementing random suffixes until a unique slug is found.
 */
export async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  let slug = baseSlug

  for (let attempt = 0; attempt < 10; attempt++) {
    const existing = await db.query.project.findFirst({
      where: eq(projectTable.slug, slug),
      columns: { id: true },
    })

    if (!existing) return slug

    const randomSuffix = Math.floor(Math.random() * 100000)
    slug = `${baseSlug}-${randomSuffix}`
  }

  // Fallback: use timestamp to guarantee uniqueness
  return `${baseSlug}-${Date.now()}`
}
