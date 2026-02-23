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

export const LAUNCH_METROS = [
  {
    slug: "nashville-tn",
    name: "Nashville, TN",
    stateCode: "TN",
    center: { lat: 36.1627, lng: -86.7816 },
    circuityFactor: 1.3,
    heroImage: "/images/nashville.jpg",
    hospitalCount: 25,
    tagline: "Music City's healthcare hub — HCA headquarters, Vanderbilt, and more",
  },
  {
    slug: "houston-tx",
    name: "Houston, TX",
    stateCode: "TX",
    center: { lat: 29.7604, lng: -95.3698 },
    circuityFactor: 1.4,
    heroImage: "/images/houston.jpg",
    hospitalCount: 40,
    tagline: "Home to Texas Medical Center — the world's largest medical complex",
  },
  {
    slug: "phoenix-az",
    name: "Phoenix, AZ",
    stateCode: "AZ",
    center: { lat: 33.4484, lng: -112.074 },
    circuityFactor: 1.25,
    heroImage: "/images/phoenix.jpg",
    hospitalCount: 30,
    tagline: "Rapidly growing with Banner Health, Mayo Clinic, and HonorHealth",
  },
] as const;

// Map styles
export const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
export const MAP_DEFAULT_ZOOM = 11;
export const HOSPITAL_PIN_COLOR = "#1E40AF";
export const LISTING_PIN_COLOR = "#059669";
