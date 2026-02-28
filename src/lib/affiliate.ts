// ============================================================
// Affiliate Link Infrastructure — Housing Near Hospitals
//
// Generates trackable outbound links to partner listing platforms.
// Supports Zillow, Apartments.com, Furnished Finder, and more.
//
// Revenue model: we earn referral fees when users click through
// to partner sites and convert (apply, book, etc.).
// ============================================================

import type { ListingSource } from "@/types";

/**
 * Affiliate partner configuration.
 * In production, these would include real affiliate IDs from partner programs.
 */
const AFFILIATE_CONFIG: Record<
  string,
  {
    name: string;
    baseUrl: string;
    affiliateParam?: string;
    affiliateId?: string;
    utm: { source: string; medium: string; campaign: string };
  }
> = {
  zillow: {
    name: "Zillow",
    baseUrl: "https://www.zillow.com",
    // Zillow uses their own affiliate/partner program
    utm: {
      source: "housingnearhospitals",
      medium: "referral",
      campaign: "hospital-housing",
    },
  },
  apartments_com: {
    name: "Apartments.com",
    baseUrl: "https://www.apartments.com",
    utm: {
      source: "housingnearhospitals",
      medium: "referral",
      campaign: "hospital-housing",
    },
  },
  furnished_finder: {
    name: "Furnished Finder",
    baseUrl: "https://www.furnishedfinder.com",
    // Furnished Finder has a partner/affiliate program
    utm: {
      source: "housingnearhospitals",
      medium: "referral",
      campaign: "hospital-housing",
    },
  },
  airbnb: {
    name: "Airbnb",
    baseUrl: "https://www.airbnb.com",
    utm: {
      source: "housingnearhospitals",
      medium: "referral",
      campaign: "hospital-housing",
    },
  },
};

/**
 * Generate an affiliate-tagged URL for an external listing.
 *
 * Appends UTM parameters for tracking, and affiliate IDs when available.
 */
export function generateAffiliateUrl(
  originalUrl: string,
  source: ListingSource,
  context?: {
    hospitalId?: string;
    metroSlug?: string;
    listingId?: string;
  }
): string {
  if (!originalUrl) return "";

  try {
    const url = new URL(originalUrl);
    const config = AFFILIATE_CONFIG[source];

    if (config) {
      // Add UTM tracking params
      url.searchParams.set("utm_source", config.utm.source);
      url.searchParams.set("utm_medium", config.utm.medium);
      url.searchParams.set("utm_campaign", config.utm.campaign);

      // Add context for our own analytics
      if (context?.hospitalId) {
        url.searchParams.set("utm_content", context.hospitalId);
      }
      if (context?.metroSlug) {
        url.searchParams.set("utm_term", context.metroSlug);
      }

      // Add affiliate ID if we have one
      if (config.affiliateParam && config.affiliateId) {
        url.searchParams.set(config.affiliateParam, config.affiliateId);
      }
    }

    return url.toString();
  } catch {
    // If URL parsing fails, return original
    return originalUrl;
  }
}

/**
 * Get the display name for a listing source platform.
 */
export function getSourceDisplayName(source: ListingSource): string {
  const config = AFFILIATE_CONFIG[source];
  if (config) return config.name;

  const names: Record<string, string> = {
    manual: "Direct",
    apartments_com: "Apartments.com",
    zillow: "Zillow",
    furnished_finder: "Furnished Finder",
    airbnb: "Airbnb",
  };
  return names[source] ?? source;
}

/**
 * Check if a listing source has an affiliate program configured.
 */
export function hasAffiliateProgram(source: ListingSource): boolean {
  return source in AFFILIATE_CONFIG;
}

/**
 * Generate a search URL on a partner platform for a given location.
 * Used when we don't have direct listing URLs but want to link to
 * the partner's search results for a hospital area.
 */
export function generatePartnerSearchUrl(
  platform: ListingSource,
  params: {
    city: string;
    stateCode: string;
    zipCode?: string;
    isFurnished?: boolean;
  }
): string {
  const config = AFFILIATE_CONFIG[platform];
  if (!config) return "";

  let searchUrl: string;

  switch (platform) {
    case "zillow":
      searchUrl = `${config.baseUrl}/homes/for_rent/${params.city}-${params.stateCode}${
        params.zipCode ? `-${params.zipCode}` : ""
      }/`;
      break;

    case "apartments_com":
      searchUrl = `${config.baseUrl}/${params.city.toLowerCase().replace(/\s+/g, "-")}-${params.stateCode.toLowerCase()}/`;
      break;

    case "furnished_finder": {
      const citySlug = params.city.toLowerCase().replace(/\s+/g, "-");
      searchUrl = `${config.baseUrl}/furnished-rentals/${params.stateCode.toLowerCase()}/${citySlug}`;
      break;
    }

    default:
      searchUrl = config.baseUrl;
  }

  // Add UTM params
  try {
    const url = new URL(searchUrl);
    url.searchParams.set("utm_source", config.utm.source);
    url.searchParams.set("utm_medium", config.utm.medium);
    url.searchParams.set("utm_campaign", config.utm.campaign);
    return url.toString();
  } catch {
    return searchUrl;
  }
}
