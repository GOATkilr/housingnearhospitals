// ============================================================
// Stipend Fit Score — Housing Near Hospitals
//
// Calculates how well a listing's rent fits within a travel
// nurse's GSA per-diem housing stipend for a given metro.
//
// This is a NOVEL feature — no competitor combines GSA rates
// with listing prices to show real stipend savings.
// ============================================================

import type {
  StipendFitResult,
  StipendFitBand,
  StipendFitBandInfo,
  GsaPerDiemRate,
} from "@/types";
import { ALL_METROS } from "@/lib/metro-config";

// ============================================================
// GSA Per Diem Rates by Metro — loaded from config/metros.json
// Source: https://www.gsa.gov/travel/plan-book/per-diem-rates
// ============================================================

const GSA_RATES_BY_METRO: Record<string, GsaPerDiemRate> = {};
for (const metro of ALL_METROS) {
  GSA_RATES_BY_METRO[metro.metroId] = {
    fiscalYear: 2026,
    state: metro.stateCode,
    city: metro.name.split(",")[0].trim(),
    county: metro.gsa.primaryCounty,
    lodgingRate: metro.gsa.lodgingRate,
    mieRate: metro.gsa.mieRate,
    isNonStandard: metro.gsa.isNonStandard,
  };
}

// CONUS standard (fallback for unknown metros)
const CONUS_STANDARD: GsaPerDiemRate = {
  fiscalYear: 2026,
  state: "",
  city: "",
  county: "",
  lodgingRate: 110,
  mieRate: 68,
  isNonStandard: false,
};

// ============================================================
// Stipend Fit Score Bands
// ============================================================

export const STIPEND_FIT_BANDS: StipendFitBandInfo[] = [
  {
    band: "great_value",
    label: "Great Value",
    description: "Rent is well under your stipend — significant savings",
    color: "#059669",
    bgColor: "#D1FAE5",
    minScore: 90,
  },
  {
    band: "good_fit",
    label: "Good Fit",
    description: "Comfortable margin between rent and stipend",
    color: "#10B981",
    bgColor: "#ECFDF5",
    minScore: 70,
  },
  {
    band: "moderate",
    label: "Moderate",
    description: "Rent uses a fair portion of your stipend",
    color: "#F59E0B",
    bgColor: "#FEF3C7",
    minScore: 50,
  },
  {
    band: "tight",
    label: "Tight Fit",
    description: "Rent takes most of your housing stipend",
    color: "#F97316",
    bgColor: "#FFF7ED",
    minScore: 30,
  },
  {
    band: "over_budget",
    label: "Over Budget",
    description: "Rent exceeds your housing stipend",
    color: "#DC2626",
    bgColor: "#FEE2E2",
    minScore: 0,
  },
];

// ============================================================
// Core Calculation
// ============================================================

/**
 * Get GSA per-diem rates for a metro area.
 */
export function getGsaRate(metroId: string): GsaPerDiemRate {
  return GSA_RATES_BY_METRO[metroId] ?? CONUS_STANDARD;
}

/**
 * Calculate Stipend Fit Score for a listing in a given metro.
 *
 * Formula:
 *   GSA lodging rate × 30 = Monthly stipend cap
 *   (Stipend cap - Rent) / Stipend cap × 100 = Stipend Fit Score
 *
 * Score bands:
 *   90+  = "Great value" (rent < 10% of stipend)
 *   70-89 = "Good fit" (rent 10-30% of stipend)
 *   50-69 = "Moderate" (rent 30-50% of stipend)
 *   30-49 = "Tight" (rent 50-70% of stipend)
 *   <30   = "Over budget" (rent > 70% of stipend or exceeds it)
 */
export function calculateStipendFit(
  listingRentMonthly: number,
  metroId: string
): StipendFitResult {
  const gsaRate = getGsaRate(metroId);

  const gsaLodgingMonthly = gsaRate.lodgingRate * 30;
  const gsaMieMonthly = gsaRate.mieRate * 30;

  // Stipend Fit is based on lodging portion only
  // (M&IE is separate and always pocketed)
  const monthlySavings = gsaLodgingMonthly - listingRentMonthly;

  // Score: what percentage of your stipend is left after rent
  let stipendFitScore: number;
  if (gsaLodgingMonthly <= 0) {
    stipendFitScore = 0;
  } else {
    stipendFitScore = Math.round(
      (Math.max(0, monthlySavings) / gsaLodgingMonthly) * 100
    );
  }

  // Clamp to 0-100
  stipendFitScore = Math.max(0, Math.min(100, stipendFitScore));

  const band = getStipendFitBand(stipendFitScore);

  return {
    gsaLodgingNightly: gsaRate.lodgingRate,
    gsaLodgingMonthly,
    gsaMieDaily: gsaRate.mieRate,
    gsaMieMonthly,
    listingRent: listingRentMonthly,
    monthlySavings,
    stipendFitScore,
    band: band.band,
  };
}

/**
 * Get the Stipend Fit band for a given score.
 */
export function getStipendFitBand(score: number): StipendFitBandInfo {
  for (const band of STIPEND_FIT_BANDS) {
    if (score >= band.minScore) return band;
  }
  return STIPEND_FIT_BANDS[STIPEND_FIT_BANDS.length - 1];
}

/**
 * Format monthly savings for display.
 * Example: "$2,070" or "-$230" if over budget
 */
export function formatMonthlySavings(savings: number): string {
  const abs = Math.abs(savings);
  const formatted = abs.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  return savings >= 0 ? formatted : `-${formatted}`;
}

/**
 * Get a human-readable summary for a listing's stipend fit.
 * Example: "Save ~$2,070/mo on your housing stipend"
 * Example: "Rent exceeds GSA stipend by $230/mo"
 */
export function getStipendFitSummary(result: StipendFitResult): string {
  if (result.monthlySavings > 0) {
    return `Save ~${formatMonthlySavings(result.monthlySavings)}/mo on your housing stipend`;
  }
  if (result.monthlySavings === 0) {
    return "Rent matches your GSA housing stipend exactly";
  }
  return `Rent exceeds GSA stipend by ${formatMonthlySavings(Math.abs(result.monthlySavings))}/mo`;
}
