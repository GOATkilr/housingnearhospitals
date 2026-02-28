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
  // CMS enrichment fields
  cmsHcahps?: CmsHcahpsData;
  cmsMortality?: string;
  cmsReadmission?: string;
  edWaitMinutes?: number;
}

export interface CmsHcahpsData {
  overallRating?: number;
  nurseComm?: string;
  doctorComm?: string;
  staffResponsiveness?: string;
  commAboutMeds?: string;
  cleanliness?: string;
  quietness?: string;
  dischargeInfo?: string;
  recommendHospital?: string;
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
  affiliateUrl?: string;
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
  | "apartments_com"
  | "zillow"
  | "furnished_finder"
  | "airbnb";

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
  // Novel scoring fields
  stipendFit?: StipendFitResult;
  hwciScore?: number;
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

// ============================================================
// Novel Data Types — Stipend Fit, GSA, HUD, HWCI
// ============================================================

/** GSA per-diem lodging rate for a specific location */
export interface GsaPerDiemRate {
  fiscalYear: number;
  state: string;
  city: string;
  county: string;
  lodgingRate: number;
  mieRate: number;
  isNonStandard: boolean;
}

/** HUD Small Area Fair Market Rent for a ZIP code */
export interface HudSafmrRate {
  zipCode: string;
  year: number;
  efficiency: number;
  oneBedroom: number;
  twoBedroom: number;
  threeBedroom: number;
  fourBedroom: number;
  metroAreaName?: string;
}

/** Stipend Fit calculation result */
export interface StipendFitResult {
  gsaLodgingNightly: number;
  gsaLodgingMonthly: number;
  gsaMieDaily: number;
  gsaMieMonthly: number;
  listingRent: number;
  monthlySavings: number;
  stipendFitScore: number;
  band: StipendFitBand;
}

export type StipendFitBand =
  | "great_value"
  | "good_fit"
  | "moderate"
  | "tight"
  | "over_budget";

export interface StipendFitBandInfo {
  band: StipendFitBand;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  minScore: number;
}

/** Healthcare Worker Commute Index — composite score */
export interface HwciResult {
  score: number;
  band: ScoreBand;
  components: {
    dayShiftCommute: number;
    nightShiftCommute: number;
    stipendFit: number;
    neighborhoodSafety: number;
    walkTransit: number;
    listingQuality: number;
  };
}

export const HWCI_WEIGHTS = {
  dayShiftCommute: 0.35,
  nightShiftCommute: 0.25,
  stipendFit: 0.15,
  neighborhoodSafety: 0.10,
  walkTransit: 0.10,
  listingQuality: 0.05,
} as const;

/** Affiliate link tracking */
export interface AffiliateLink {
  platform: ListingSource;
  originalUrl: string;
  affiliateUrl: string;
  listingId: string;
  hospitalId?: string;
  metroSlug: string;
}
