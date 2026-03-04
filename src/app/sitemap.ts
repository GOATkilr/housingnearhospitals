import type { MetadataRoute } from "next";
import { LAUNCH_METROS } from "@/lib/constants";
import { SAMPLE_HOSPITALS, SAMPLE_LISTINGS } from "@/lib/sample-data";

const BASE_URL = "https://housingnearhospitals.com";

export default function sitemap(): MetadataRoute.Sitemap {
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

  const hospitalPages: MetadataRoute.Sitemap = SAMPLE_HOSPITALS.map((hospital) => {
    const metro = LAUNCH_METROS.find((m) => m.metroId === hospital.metroId);
    return {
      url: `${BASE_URL}/city/${metro?.slug ?? "nashville-tn"}/${hospital.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    };
  });

  const listingPages: MetadataRoute.Sitemap = SAMPLE_LISTINGS.map((listing) => ({
    url: `${BASE_URL}/listing/${listing.id}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...cityPages, ...hospitalPages, ...listingPages];
}
