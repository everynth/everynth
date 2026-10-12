import type { MetadataRoute } from "next";
import { query } from "@/lib/db";
import { DOCS } from "@/lib/docs";
import { APP, SITE } from "@/lib/site";

// Each page is listed once, under the host it belongs to: the pitch and the docs on everynth.org,
// everything you actually do on app.everynth.org.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await query<{ id: string; created_at: Date }>(
    `select id, created_at from products where status = 'live' order by created_at desc limit 5000`,
  ).catch(() => []);

  return [
    { url: SITE, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/docs`, changeFrequency: "weekly", priority: 0.9 },
    ...DOCS.map((d) => ({ url: `${SITE}/docs/${d.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: `${SITE}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/developers`, changeFrequency: "monthly", priority: 0.5 },
    { url: APP, changeFrequency: "hourly", priority: 0.9 },
    { url: `${APP}/stats`, changeFrequency: "daily", priority: 0.6 },
    { url: `${APP}/launchpad`, changeFrequency: "monthly", priority: 0.5 },
    ...products.map((p) => ({ url: `${APP}/p/${p.id}`, lastModified: p.created_at, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
