import type { MetadataRoute } from "next"

const baseUrl = process.env.NEXT_PUBLIC_URL || "https://memescopemonday.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/settings", "/admin", "/payment/", "/verify-email/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
