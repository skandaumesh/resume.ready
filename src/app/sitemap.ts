import type { MetadataRoute } from "next";
import { allExampleSlugs } from "@/lib/roleExamples";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, priority: 1 },
    { url: `${BASE}/ats-check`, lastModified: now, priority: 0.9 },
    { url: `${BASE}/roast`, lastModified: now, priority: 0.9 },
    { url: `${BASE}/linkedin-check`, lastModified: now, priority: 0.9 },
    { url: `${BASE}/examples`, lastModified: now, priority: 0.8 },
  ];
  const examples: MetadataRoute.Sitemap = allExampleSlugs().map((slug) => ({
    url: `${BASE}/examples/${slug}`,
    lastModified: now,
    priority: 0.7,
  }));
  return [...staticPages, ...examples];
}
