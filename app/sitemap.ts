import type { MetadataRoute } from "next";
import { query } from "@/lib/db";
import { DOCS } from "@/lib/docs";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://everynth.org";

// Static pages, every doc permalink, and every live product.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await query<{ id: string; created_at: Date }>(
    `select id, created_at from products where status = 'live' order by created_at desc limit 5000`,
  ).catch(() => []);

  return [
    { url: SITE, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE}/landing.html`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE}/stats`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE}/launchpad`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/developers`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/docs`, changeFrequency: "weekly", priority: 0.8 },
    ...DOCS.map((d) => ({ url: `${SITE}/docs/${d.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...products.map((p) => ({ url: `${SITE}/p/${p.id}`, lastModified: p.created_at, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
