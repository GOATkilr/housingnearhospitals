// ============================================================
// Healthcare Worker Commute Index (HWCI) — Housing Near Hospitals
//
// A composite score unique to our platform that answers:
// "How good is this listing for a healthcare worker at this hospital?"
//
// Components:
//   35% — Day Shift Commute Score (proximity at 6:30 AM)
//   25% — Night Shift Commute Score (proximity at 6:45 PM / 10:45 PM)
//   15% — Stipend Fit Score (does the rent fit the GSA per-diem?)
//   10% — Neighborhood Safety Score (crime/safety index)
//   10% — Walk/Transit Score (walkability & transit access)
//   05% — Listing Quality Score (furnished, parking, lease flex, etc.)
//
// This is a NOVEL feature — no competitor computes a score that
// combines commute, budget, safety, and livability for healthcare workers.
// ============================================================

import type { HwciResult, ScoreBand } from "@/types";
import { HWCI_WEIGHTS } from "@/types";
import { getScoreBand } from "@/lib/scoring";

/**
 * Calculate the Healthcare Worker Commute Index.
 *
 * All component scores should be 0-100. If a component is unavailable,
 * pass null and the weight will be redistributed proportionally.
 */
export function calculateHwci(components: {
  dayShiftCommute: number | null;
  nightShiftCommute: number | null;
  stipendFit: number | null;
  neighborhoodSafety: number | null;
  walkTransit: number | null;
  listingQuality: number | null;
}): HwciResult {
  const weights = { ...HWCI_WEIGHTS };

  // Build array of available components with their weights
  const available: { key: keyof typeof weights; value: number; weight: number }[] = [];
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights) as [keyof typeof weights, number][]) {
    const value = components[key];
    if (value !== null && value !== undefined) {
      available.push({ key, value, weight });
      totalWeight += weight;
    }
  }

  // If nothing is available, return a zero score
  if (available.length === 0 || totalWeight === 0) {
    return {
      score: 0,
      band: "bad" as ScoreBand,
      components: {
        dayShiftCommute: 0,
        nightShiftCommute: 0,
        stipendFit: 0,
        neighborhoodSafety: 0,
        walkTransit: 0,
        listingQuality: 0,
      },
    };
  }

  // Calculate weighted score with redistributed weights
  let score = 0;
  for (const item of available) {
    const normalizedWeight = item.weight / totalWeight;
    score += item.value * normalizedWeight;
  }

  score = Math.round(Math.max(0, Math.min(100, score)));

  const bandInfo = getScoreBand(score);

  return {
    score,
    band: bandInfo.band,
    components: {
      dayShiftCommute: components.dayShiftCommute ?? 0,
      nightShiftCommute: components.nightShiftCommute ?? 0,
      stipendFit: components.stipendFit ?? 0,
      neighborhoodSafety: components.neighborhoodSafety ?? 0,
      walkTransit: components.walkTransit ?? 0,
      listingQuality: components.listingQuality ?? 0,
    },
  };
}

/**
 * Calculate HWCI for a hospital-listing pair using available data.
 *
 * This is the convenience wrapper that takes raw score data and computes
 * the composite HWCI. In the MVP, we may only have commute scores and
 * stipend fit — safety and walkability come in Phase 2.
 */
export function calculateHwciForListing(params: {
  scoreDriveDay: number;
  scoreDriveNight: number;
  stipendFitScore?: number;
  safetyScore?: number;
  walkScore?: number;
  listingQualityScore?: number;
}): HwciResult {
  return calculateHwci({
    dayShiftCommute: params.scoreDriveDay,
    nightShiftCommute: params.scoreDriveNight,
    stipendFit: params.stipendFitScore ?? null,
    neighborhoodSafety: params.safetyScore ?? null,
    walkTransit: params.walkScore ?? null,
    listingQuality: params.listingQualityScore ?? null,
  });
}

/**
 * Get a human-readable description of what drives the HWCI score.
 */
export function getHwciInsight(result: HwciResult): string {
  const { components } = result;

  // Find strongest and weakest components
  const entries = Object.entries(components)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  if (entries.length === 0) return "No data available to compute score";

  const strongest = entries[0];
  const weakest = entries[entries.length - 1];

  const labels: Record<string, string> = {
    dayShiftCommute: "day shift commute",
    nightShiftCommute: "night shift commute",
    stipendFit: "stipend fit",
    neighborhoodSafety: "neighborhood safety",
    walkTransit: "walkability",
    listingQuality: "listing quality",
  };

  if (result.score >= 75) {
    return `Strong ${labels[strongest[0]]} drives this high score`;
  }
  if (result.score >= 50) {
    return `Good overall, but ${labels[weakest[0]]} could be better`;
  }
  return `${labels[weakest[0]]} pulls this score down`;
}
