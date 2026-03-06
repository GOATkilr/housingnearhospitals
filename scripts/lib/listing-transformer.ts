/**
 * Source-agnostic listing transformer pipeline.
 *
 * All listing sources (RentCast, Furnished Finder, etc.) map their raw data
 * to RawListingInput, which then gets transformed into TransformedListing
 * for database insertion.
 */

import { calculateListingQualityScore } from "../../src/lib/scoring";

// ============================================================
// Source-Agnostic Input Interface
// ============================================================

/** All listing sources must map their data to this shape. */
export interface RawListingInput {
  externalId: string;
  source: string;
  title?: string;
  propertyType?: string;
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  stateCode?: string;
  zipCode?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  priceMonthly: number;
  isFurnished?: boolean;
  leaseMinMonths?: number;
  allowsPets?: boolean;
  hasParking?: boolean;
  hasInUnitLaundry?: boolean;
  amenities?: string[];
  primaryImageUrl?: string;
  imageCount?: number;
  affiliateUrl?: string;
  sourceUrl?: string;
  isVerified?: boolean;
  availableDate?: string;
}

// ============================================================
// Transformed Output (ready for DB)
// ============================================================

export interface TransformedListing {
  externalId: string;
  source: string;
  title: string;
  propertyType: string;
  lat: number;
  lng: number;
  address: string | null;
  city: string | null;
  stateCode: string | null;
  zipCode: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  priceMonthly: number;
  isFurnished: boolean;
  leaseMinMonths: number;
  allowsPets: boolean;
  hasParking: boolean;
  hasInUnitLaundry: boolean;
  amenities: string[];
  primaryImageUrl: string | null;
  imageCount: number;
  listingQualityScore: number;
  affiliateUrl: string;
  sourceUrl: string | null;
  status: string;
  isVerified: boolean;
  availableDate: string | null;
}

// ============================================================
// Generic Transformer
// ============================================================

const PROPERTY_TYPE_MAP: Record<string, string> = {
  Apartment: "apartment",
  "Single Family": "house",
  Condo: "condo",
  "Condo/Co-op": "condo",
  Townhouse: "townhouse",
  "Multi Family": "apartment",
  Duplex: "apartment",
  Triplex: "apartment",
  Other: "apartment",
};

function normalizePropertyType(raw?: string): string {
  if (!raw) return "apartment";
  return PROPERTY_TYPE_MAP[raw] ?? raw.toLowerCase();
}

function generateTitle(input: RawListingInput): string {
  if (input.title) return input.title;

  const parts: string[] = [];
  const type = normalizePropertyType(input.propertyType);
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  if (input.bedrooms !== undefined && input.bedrooms !== null) {
    if (input.bedrooms === 0) {
      parts.push("Studio");
    } else {
      parts.push(`${input.bedrooms}BR`);
    }
  }

  parts.push(typeLabel);

  if (input.city) {
    parts.push(`in ${input.city}`);
  }

  return parts.join(" ");
}

function generateDefaultAffiliateUrl(input: RawListingInput): string {
  if (input.affiliateUrl) return input.affiliateUrl;

  const city = input.city ?? "";
  const state = input.stateCode ?? "";

  if (input.isFurnished) {
    const cityFormatted = city.replace(/\s+/g, "");
    return `https://www.furnishedfinder.com/housing/${cityFormatted}--${state}`;
  }

  const citySlug = city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const stateSlug = state.toLowerCase();
  return `https://www.apartments.com/${citySlug}-${stateSlug}/`;
}

/**
 * Transform a source-agnostic listing input into the database-ready format.
 * Returns null if the listing lacks required data (price, coordinates).
 */
export function transformListing(input: RawListingInput): TransformedListing | null {
  if (!input.priceMonthly || input.priceMonthly <= 0) return null;
  if (!input.lat || !input.lng) return null;

  const isFurnished = input.isFurnished ?? false;
  const leaseMinMonths = input.leaseMinMonths ?? 12;
  const allowsPets = input.allowsPets ?? false;
  const hasParking = input.hasParking ?? false;
  const hasInUnitLaundry = input.hasInUnitLaundry ?? false;
  const isVerified = input.isVerified ?? false;

  const qualityScore = calculateListingQualityScore({
    isFurnished,
    leaseMinMonths,
    allowsPets,
    hasParking,
    hasInUnitLaundry,
    isVerified,
  });

  return {
    externalId: input.externalId,
    source: input.source,
    title: generateTitle(input),
    propertyType: normalizePropertyType(input.propertyType),
    lat: input.lat,
    lng: input.lng,
    address: input.address ?? null,
    city: input.city ?? null,
    stateCode: input.stateCode ?? null,
    zipCode: input.zipCode ?? null,
    bedrooms: input.bedrooms ?? null,
    bathrooms: input.bathrooms ?? null,
    sqft: input.sqft ?? null,
    priceMonthly: input.priceMonthly,
    isFurnished,
    leaseMinMonths,
    allowsPets,
    hasParking,
    hasInUnitLaundry,
    amenities: input.amenities ?? [],
    primaryImageUrl: input.primaryImageUrl ?? null,
    imageCount: input.imageCount ?? 0,
    listingQualityScore: qualityScore,
    affiliateUrl: generateDefaultAffiliateUrl(input),
    sourceUrl: input.sourceUrl ?? null,
    status: "active",
    isVerified,
    availableDate: input.availableDate ?? null,
  };
}

// ============================================================
// RentCast Source Adapter
// ============================================================

export interface RentCastListing {
  id: string;
  formattedAddress?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  price?: number;
  listingType?: string;
  listedDate?: string;
  lastSeenDate?: string;
  status?: string;
  daysOnMarket?: number;
  furnished?: boolean;
  petsAllowed?: boolean;
  parkingSpaces?: number;
  laundryType?: string;
  photos?: string[];
}

/** Map RentCast API response to RawListingInput */
export function rentCastToRawInput(raw: RentCastListing): RawListingInput | null {
  if (!raw.price || raw.price <= 0) return null;
  if (!raw.latitude || !raw.longitude) return null;

  const photos = raw.photos ?? [];

  return {
    externalId: raw.id,
    source: "rentcast",
    propertyType: raw.propertyType,
    lat: raw.latitude,
    lng: raw.longitude,
    address: raw.formattedAddress ?? raw.addressLine1,
    city: raw.city,
    stateCode: raw.state,
    zipCode: raw.zipCode,
    bedrooms: raw.bedrooms,
    bathrooms: raw.bathrooms,
    sqft: raw.squareFootage,
    priceMonthly: raw.price,
    isFurnished: raw.furnished,
    allowsPets: raw.petsAllowed,
    hasParking: (raw.parkingSpaces ?? 0) > 0,
    hasInUnitLaundry: raw.laundryType === "In Unit" || raw.laundryType === "In-Unit",
    primaryImageUrl: photos.length > 0 ? photos[0] : undefined,
    imageCount: photos.length,
    availableDate: raw.listedDate,
  };
}

/** Legacy compatibility: transform RentCast directly to TransformedListing */
export function transformRentCastListing(raw: RentCastListing): TransformedListing | null {
  const input = rentCastToRawInput(raw);
  if (!input) return null;
  return transformListing(input);
}

// ============================================================
// Furnished Finder Source Adapter (placeholder for future integration)
// ============================================================

export interface FurnishedFinderListing {
  id: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  imageUrl?: string;
  url?: string;
  petsAllowed?: boolean;
  parkingAvailable?: boolean;
  laundryInUnit?: boolean;
  leaseMinMonths?: number;
}

/** Map Furnished Finder data to RawListingInput */
export function furnishedFinderToRawInput(raw: FurnishedFinderListing): RawListingInput | null {
  if (!raw.rent || !raw.lat || !raw.lng) return null;

  return {
    externalId: raw.id,
    source: "furnished_finder",
    title: raw.title,
    propertyType: "apartment",
    lat: raw.lat,
    lng: raw.lng,
    address: raw.address,
    city: raw.city,
    stateCode: raw.state,
    zipCode: raw.zip,
    bedrooms: raw.bedrooms,
    bathrooms: raw.bathrooms,
    sqft: raw.sqft,
    priceMonthly: raw.rent,
    isFurnished: true, // All Furnished Finder listings are furnished
    leaseMinMonths: raw.leaseMinMonths ?? 1, // Typically short-term
    allowsPets: raw.petsAllowed,
    hasParking: raw.parkingAvailable,
    hasInUnitLaundry: raw.laundryInUnit,
    primaryImageUrl: raw.imageUrl,
    affiliateUrl: raw.url,
    sourceUrl: raw.url,
  };
}
