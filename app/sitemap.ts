import type { MetadataRoute } from "next";

import { resourceArticles } from "@/lib/resources";
import { studioServices } from "@/lib/services";
import { seoContentUpdatedAt, siteUrl } from "@/lib/site-content";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, lastModified: seoContentUpdatedAt, changeFrequency: "monthly", priority: 1 },
    {
      url: `${siteUrl}/services`,
      lastModified: seoContentUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...studioServices.map((service) => ({
      url: `${siteUrl}/services/${service.slug}`,
      lastModified: seoContentUpdatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${siteUrl}/resources`,
      lastModified: seoContentUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...resourceArticles.map((article) => ({
      url: `${siteUrl}/resources/${article.slug}`,
      lastModified: article.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    {
      url: `${siteUrl}/booking`,
      lastModified: seoContentUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: "2026-07-31",
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: "2026-07-31",
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
