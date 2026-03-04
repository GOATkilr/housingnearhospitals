import type { MetadataRoute } from "next";
import { LAUNCH_METROS } from "@/lib/constants";
import { getAllHospitalSlugs, getAllListingIds } from "@/lib/queries";

const BASE_URL = "https://housingnearhospitals.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/search`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/map`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/guides/travel-nurse-housing`, changeFrequency: "monthly", priority: 0.7 },
  ];

  const cityPages: MetadataRoute.Sitemap = LAUNCH_METROS.map((metro) => ({
    url: `${BASE_URL}/city/${metro.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const hospitalSlugs = await getAllHospitalSlugs();
  const hospitalPages: MetadataRoute.Sitemap = hospitalSlugs.map((s) => ({
    url: `${BASE_URL}/city/${s.metroSlug}/${s.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const listingIds = await getAllListingIds();
  const listingPages: MetadataRoute.Sitemap = listingIds.map((id) => ({
    url: `${BASE_URL}/listing/${id}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...cityPages, ...hospitalPages, ...listingPages];
}
