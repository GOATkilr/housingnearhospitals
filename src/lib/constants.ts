// ============================================================
// Application Constants
// ============================================================

export const SITE_NAME = "Housing Near Hospitals";
export const SITE_TAGLINE = "Live closer. Commute less. Care more.";
export const SITE_DESCRIPTION =
  "Find housing scored by commute time to your hospital. Built for travel nurses, residents, and healthcare workers.";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_SEARCH_RADIUS_MILES = 30;

export const HOSPITAL_TYPES = [
  "General Acute Care",
  "Critical Access",
  "Psychiatric",
  "Rehabilitation",
  "Long Term Care",
  "Children's",
  "VA",
  "Military",
] as const;

export const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "room", label: "Room" },
  { value: "studio", label: "Studio" },
] as const;

export const SORT_OPTIONS = [
  { value: "score", label: "Best Match" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "distance", label: "Distance: Nearest" },
] as const;

// Metro configuration — now driven by config/metros.json
// Re-exported from metro-config.ts for backward compatibility
export {
  LAUNCH_METROS,
  ACTIVE_METROS,
  NAV_METROS,
  getMetroConfigById as getMetroById,
  getMetroConfigBySlug as getMetroBySlug,
} from "@/lib/metro-config";

// Map styles
export const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
export const MAP_DEFAULT_ZOOM = 11;
export const HOSPITAL_PIN_COLOR = "#1E40AF";
export const LISTING_PIN_COLOR = "#059669";
