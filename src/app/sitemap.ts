import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { LAUNCH_METROS } from "@/lib/constants";
import { SAMPLE_HOSPITALS, SAMPLE_LISTINGS } from "@/lib/sample-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/map`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/guides/travel-nurse-housing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // City pages
  const cityPages: MetadataRoute.Sitemap = LAUNCH_METROS.map((metro) => ({
    url: `${SITE_URL}/city/${metro.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Hospital pages
  const hospitalPages: MetadataRoute.Sitemap = SAMPLE_HOSPITALS.map((hospital) => {
    const metro = LAUNCH_METROS.find((m) => m.metroId === hospital.metroId);
    return {
      url: `${SITE_URL}/city/${metro?.slug ?? ""}/${hospital.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    };
  }).filter((p) => !p.url.includes("//"));

  // Listing pages
  const listingPages: MetadataRoute.Sitemap = SAMPLE_LISTINGS.map((listing) => ({
    url: `${SITE_URL}/listing/${listing.id}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...cityPages, ...hospitalPages, ...listingPages];
}
