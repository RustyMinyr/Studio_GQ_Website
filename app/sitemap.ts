import type { MetadataRoute } from "next";

import { resourceArticles } from "@/lib/resources";
import { studioServices } from "@/lib/services";
import { siteUrl } from "@/lib/site-content";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/services`, changeFrequency: "monthly", priority: 0.9 },
    ...studioServices.map((service) => ({
      url: `${siteUrl}/services/${service.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${siteUrl}/resources`,
      lastModified: "2026-07-31",
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...resourceArticles.map((article) => ({
      url: `${siteUrl}/resources/${article.slug}`,
      lastModified: article.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    { url: `${siteUrl}/booking`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
