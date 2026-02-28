// ============================================================
// Metro Configuration — Housing Near Hospitals
//
// Single source of truth for all metro definitions.
// Reads from config/metros.json at build time.
//
// Replaces the hardcoded LAUNCH_METROS constant.
// Adding a new metro = adding an entry to config/metros.json.
// ============================================================

import metroData from "@/config/metros.json";

export interface MetroConfig {
  metroId: string;
  slug: string;
  name: string;
  stateCode: string;
  center: { lat: number; lng: number };
  boundingBox: {
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
  };
  radiusMiles: number;
  timezone: string;
  circuityFactor: number;
  cbsaCode: string;
  fipsCountyCodes: string[];
  tier: "active" | "coming_soon" | "passive" | "disabled";
  wave: number;
  heroImage: string;
  tagline: string;
  hospitalCount: number;
  metroPop: number;
  avgRent1br: number;
  costOfLiving: number;
  gsa: {
    primaryCounty: string;
    lodgingRate: number;
    mieRate: number;
    isNonStandard: boolean;
  };
  featureFlags: {
    stipendFitEnabled: boolean;
    hwciEnabled: boolean;
    affiliateLinksEnabled: boolean;
  };
}

// ============================================================
// Core Metro Collections
// ============================================================

/** All configured metros (any tier) */
export const ALL_METROS: MetroConfig[] = metroData.metros as MetroConfig[];

/** Active metros — fully launched with hospital data and listings */
export const ACTIVE_METROS: MetroConfig[] = ALL_METROS.filter(
  (m) => m.tier === "active"
);

/** Visible metros — active + coming soon (shown on site) */
export const VISIBLE_METROS: MetroConfig[] = ALL_METROS.filter(
  (m) => m.tier === "active" || m.tier === "coming_soon"
);

/** Navigation metros — top metros shown in header/footer (max 8) */
export const NAV_METROS: MetroConfig[] = ACTIVE_METROS
  .sort((a, b) => b.metroPop - a.metroPop)
  .slice(0, 8);

// ============================================================
// Lookup Functions
// ============================================================

/** Find a metro by its metroId (e.g., "metro-nashville") */
export function getMetroConfigById(
  metroId: string
): MetroConfig | undefined {
  return ALL_METROS.find((m) => m.metroId === metroId);
}

/** Find a metro by its URL slug (e.g., "nashville-tn") */
export function getMetroConfigBySlug(
  slug: string
): MetroConfig | undefined {
  return ALL_METROS.find((m) => m.slug === slug);
}

/** Find a metro by CBSA code */
export function getMetroConfigByCbsa(
  cbsaCode: string
): MetroConfig | undefined {
  return ALL_METROS.find((m) => m.cbsaCode === cbsaCode);
}

/** Check if a feature is enabled for a metro */
export function isMetroFeatureEnabled(
  metroId: string,
  feature: keyof MetroConfig["featureFlags"]
): boolean {
  const metro = getMetroConfigById(metroId);
  return metro?.featureFlags[feature] ?? false;
}

/** Get all unique state codes across active metros */
export function getActiveStatesCodes(): string[] {
  const states = new Set(ACTIVE_METROS.map((m) => m.stateCode));
  return Array.from(states);
}

/** Get bounding boxes for import scripts */
export function getMetroBounds(): Record<
  string,
  { lat: [number, number]; lng: [number, number]; metroId: string; name: string }
> {
  const bounds: Record<
    string,
    { lat: [number, number]; lng: [number, number]; metroId: string; name: string }
  > = {};

  for (const metro of ACTIVE_METROS) {
    bounds[metro.slug] = {
      lat: [metro.boundingBox.latMin, metro.boundingBox.latMax],
      lng: [metro.boundingBox.lngMin, metro.boundingBox.lngMax],
      metroId: metro.metroId,
      name: metro.name,
    };
  }

  return bounds;
}

// ============================================================
// Backward Compatibility — LAUNCH_METROS shape
//
// Components that currently import LAUNCH_METROS from constants.ts
// can use this until fully migrated.
// ============================================================

export const LAUNCH_METROS = ACTIVE_METROS.map((m) => ({
  metroId: m.metroId,
  slug: m.slug,
  name: m.name,
  stateCode: m.stateCode,
  center: m.center,
  circuityFactor: m.circuityFactor,
  heroImage: m.heroImage,
  hospitalCount: m.hospitalCount,
  tagline: m.tagline,
}));
