import type { MetadataRoute } from "next";

const baseUrl = "https://www.studiogq.co.za";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: "yearly", priority: 0.7 },
    { url: `${baseUrl}/spaces`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/equipment`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/gallery`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/faq`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${baseUrl}/contact`, changeFrequency: "yearly", priority: 0.9 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
