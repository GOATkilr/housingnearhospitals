// ============================================================
// SEO Utilities — Housing Near Hospitals
//
// JSON-LD structured data generators and SEO constants.
// Uses schema.org types: WebSite, Hospital, Place, Residence.
// ============================================================

import { SITE_NAME, SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/constants";
import type { Hospital, Listing } from "@/types";
import type { MetroConfig } from "@/lib/metro-config";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://housingnearchospitals.com";

// ============================================================
// JSON-LD Generators
// ============================================================

/** WebSite schema — renders on homepage */
export function generateWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Organization schema — renders on homepage */
export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    slogan: SITE_TAGLINE,
  };
}

/** Hospital schema — renders on hospital detail pages */
export function generateHospitalJsonLd(
  hospital: Hospital,
  metroSlug: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Hospital",
    name: hospital.name,
    url: `${SITE_URL}/city/${metroSlug}/${hospital.slug}`,
    ...(hospital.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: hospital.address,
        addressLocality: hospital.city,
        addressRegion: hospital.stateCode,
        postalCode: hospital.zipCode,
      },
    }),
    geo: {
      "@type": "GeoCoordinates",
      latitude: hospital.location.lat,
      longitude: hospital.location.lng,
    },
    ...(hospital.phone && { telephone: hospital.phone }),
    ...(hospital.website && { sameAs: hospital.website }),
    ...(hospital.cmsOverallRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: hospital.cmsOverallRating,
        bestRating: 5,
        worstRating: 1,
        ratingCount: 1,
      },
    }),
    ...(hospital.bedCount && { numberOfBeds: hospital.bedCount }),
    ...(hospital.systemName && {
      parentOrganization: {
        "@type": "Organization",
        name: hospital.systemName,
      },
    }),
  };
}

/** BreadcrumbList schema — renders on subpages */
export function generateBreadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Place schema — renders on city landing pages */
export function generateCityJsonLd(metro: MetroConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${metro.name} Metro Area`,
    url: `${SITE_URL}/city/${metro.slug}`,
    geo: {
      "@type": "GeoCoordinates",
      latitude: metro.center.lat,
      longitude: metro.center.lng,
    },
    description: metro.tagline,
  };
}

/** Residence schema — renders on listing detail pages */
export function generateListingJsonLd(listing: Listing) {
  return {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: listing.title,
    url: `${SITE_URL}/listing/${listing.id}`,
    ...(listing.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: listing.address,
        addressLocality: listing.city,
        addressRegion: listing.stateCode,
        postalCode: listing.zipCode,
      },
    }),
    geo: {
      "@type": "GeoCoordinates",
      latitude: listing.location.lat,
      longitude: listing.location.lng,
    },
    ...(listing.sqft && {
      floorSize: {
        "@type": "QuantitativeValue",
        value: listing.sqft,
        unitCode: "FTK",
      },
    }),
    ...(listing.bedrooms !== undefined && {
      numberOfRooms: listing.bedrooms,
    }),
    offers: {
      "@type": "Offer",
      price: listing.priceMonthly,
      priceCurrency: "USD",
      availability: listing.status === "active"
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}

/** Article schema — renders on guide pages */
export function generateArticleJsonLd(opts: {
  title: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}
