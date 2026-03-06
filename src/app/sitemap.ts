import type { MetadataRoute } from "next";
import { getAllHospitalSlugs, getAllListingIds, getActiveMetroSlugs } from "@/lib/queries";

const BASE_URL = "https://housingnearhospitals.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1.0, lastModified: now },
    { url: `${BASE_URL}/search`, changeFrequency: "weekly", priority: 0.9, lastModified: now },
    { url: `${BASE_URL}/map`, changeFrequency: "weekly", priority: 0.8, lastModified: now },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5, lastModified: now },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.5, lastModified: now },
    { url: `${BASE_URL}/privacy`, changeFrequency: "monthly", priority: 0.3, lastModified: now },
    { url: `${BASE_URL}/terms`, changeFrequency: "monthly", priority: 0.3, lastModified: now },
    { url: `${BASE_URL}/guides/travel-nurse-housing`, changeFrequency: "monthly", priority: 0.7, lastModified: now },
  ];

  const metroSlugs = await getActiveMetroSlugs();
  const cityPages: MetadataRoute.Sitemap = metroSlugs.map((slug) => ({
    url: `${BASE_URL}/city/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.9,
    lastModified: now,
  }));

  const hospitalSlugs = await getAllHospitalSlugs();
  const hospitalPages: MetadataRoute.Sitemap = hospitalSlugs.map((s) => ({
    url: `${BASE_URL}/city/${s.metroSlug}/${s.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
    lastModified: now,
  }));

  const listingIds = await getAllListingIds();
  const listingPages: MetadataRoute.Sitemap = listingIds.map((id) => ({
    url: `${BASE_URL}/listing/${id}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
    lastModified: now,
  }));

  return [...staticPages, ...cityPages, ...hospitalPages, ...listingPages];
}
