import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return [
    { url: base.href, changeFrequency: "monthly", priority: 1 },
    { url: new URL("/resume", base).href, changeFrequency: "monthly", priority: 0.9 },
  ];
}
