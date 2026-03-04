// ============================================================
// Core Domain Types — Housing Near Hospitals
// ============================================================

export interface Metro {
  id: string;
  slug: string;
  name: string;
  stateCode: string;
  center: { lat: number; lng: number };
  radiusMiles: number;
  timezone: string;
  circuityFactor: number;
  isActive: boolean;
  metroPop?: number;
  avgRent1br?: number;
  costOfLiving?: number;
}

export interface Hospital {
  id: string;
  metroId: string;
  cmsCcn?: string;
  hifldId?: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  stateCode?: string;
  zipCode?: string;
  phone?: string;
  website?: string;
  location: { lat: number; lng: number };
  hospitalType: HospitalType;
  ownership?: string;
  systemName?: string;
  bedCount?: number;
  hasEmergency: boolean;
  traumaLevel?: string;
  teachingStatus?: string;
  cmsOverallRating?: number;
  cmsPatientExp?: number;
  cmsSafetyRating?: number;
  isActive: boolean;
}

export type HospitalType =
  | "General Acute Care"
  | "Critical Access"
  | "Psychiatric"
  | "Rehabilitation"
  | "Long Term Care"
  | "Children's"
  | "VA"
  | "Military";

export interface Listing {
  id: string;
  metroId: string;
  neighborhoodId?: string;
  externalId?: string;
  source: ListingSource;
  sourceUrl?: string;
  isFeatured: boolean;
  featuredUntil?: string;
  title: string;
  description?: string;
  propertyType: PropertyType;
  location: { lat: number; lng: number };
  address?: string;
  city?: string;
  stateCode?: string;
  zipCode?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  priceMonthly: number;
  isFurnished: boolean;
  leaseMinMonths?: number;
  allowsPets: boolean;
  hasParking: boolean;
  hasInUnitLaundry: boolean;
  amenities: string[];
  primaryImageUrl?: string;
  imageCount: number;
  listingQualityScore?: number;
  status: ListingStatus;
  isVerified: boolean;
  availableDate?: string;
}

export type ListingSource =
  | "manual"
  | "self_serve"
  | "aggregated"
  | "imported";

export type PropertyType =
  | "apartment"
  | "house"
  | "condo"
  | "townhouse"
  | "room"
  | "studio";

export type ListingStatus = "active" | "pending" | "expired" | "removed";

export interface HospitalListingScore {
  id: string;
  hospitalId: string;
  listingId: string;
  straightLineMiles: number;
  estimatedDriveMiles?: number;
  driveTimeDayMin?: number;
  driveTimeNightMin?: number;
  proximityScore: number;
  combinedScore?: number;
  calculationMethod: "haversine" | "osrm" | "google";
}

export interface SearchResult {
  listing: Listing;
  hospital: Hospital;
  score: HospitalListingScore;
  metro: Pick<Metro, "slug" | "name">;
  neighborhoodName?: string;
}

export interface SearchFilters {
  hospitalId?: string;
  metroSlug?: string;
  maxPrice?: number;
  minBedrooms?: number;
  isFurnished?: boolean;
  allowsPets?: boolean;
  hasParking?: boolean;
  minScore?: number;
  maxDriveTime?: number;
  sortBy?: "score" | "price_asc" | "price_desc" | "distance";
  page?: number;
  limit?: number;
}

export interface Neighborhood {
  id: string;
  metroId: string;
  name: string;
  slug: string;
  center?: { lat: number; lng: number };
  walkScore?: number;
  transitScore?: number;
  safetyScore?: number;
  medianRent?: number;
}

export interface Review {
  id: string;
  userId: string;
  listingId?: string;
  hospitalId?: string;
  rating: number;
  title?: string;
  body?: string;
  commuteRating?: number;
  safetyRating?: number;
  valueRating?: number;
  isVerified: boolean;
  createdAt: string;
  userName?: string;
}

// Score display helpers
export type ScoreBand = "excellent" | "good" | "fair" | "moderate" | "poor" | "bad";

export interface ScoreBandInfo {
  band: ScoreBand;
  label: string;
  color: string;
  bgColor: string;
  minScore: number;
}

// Ad placement types
export type AdType = "banner" | "sidebar" | "interstitial" | "sponsor" | "native";
export type AdPlacementZone = "header" | "sidebar" | "listing_feed" | "hospital_page" | "footer";

export interface AdPlacement {
  id: string;
  advertiserName: string;
  adType: AdType;
  placementZone: AdPlacementZone;
  title?: string;
  description?: string;
  imageUrl?: string;
  clickUrl: string;
  altText?: string;
  metroId?: string;
  isActive: boolean;
  priority: number;
}
