import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://everynth.vercel.app";

// Crawl the shop and the docs. Keep crawlers out of anything that is nobody else's business.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/purchases", "/dashboard", "/admin", "/launch", "/wallet-check", "/p/*/edit"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
