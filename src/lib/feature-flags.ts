// ============================================================
// Feature Flags — Housing Near Hospitals
// Toggle monetization features on/off without code changes.
// All flags default to false (off) for initial launch.
// ============================================================

export const FEATURE_FLAGS = {
  /** Google AdSense / Mediavine display ads */
  SHOW_DISPLAY_ADS: false,

  /** Direct-sold staffing agency sponsor placements */
  SHOW_STAFFING_ADS: false,

  /** Featured / premium listing badges and sort priority */
  SHOW_FEATURED_LISTINGS: false,

  /** Adjacent service affiliate links (Lemonade, CORT, etc.) */
  SHOW_ADJACENT_AFFILIATES: false,

  /** Housing platform affiliate links (Apartments.com, VRBO, Booking.com) */
  SHOW_HOUSING_AFFILIATES: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}
