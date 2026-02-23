// ============================================================
// Proximity Scoring Engine — Housing Near Hospitals
// ============================================================

import type { ScoreBand, ScoreBandInfo } from "@/types";

/**
 * Calculate straight-line distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate drive time from straight-line distance
 * Uses metro-specific circuity factor and speed assumptions
 */
export function estimateDriveTime(
  straightLineMiles: number,
  circuityFactor: number = 1.3,
  avgSpeedMph: number = 25
): number {
  const driveMiles = straightLineMiles * circuityFactor;
  return Math.round((driveMiles / avgSpeedMph) * 60);
}

/**
 * Get average speed based on distance (urban core vs suburban)
 */
export function getAvgSpeed(straightLineMiles: number): number {
  if (straightLineMiles <= 2) return 20; // Urban core
  if (straightLineMiles <= 8) return 25; // Inner suburban
  if (straightLineMiles <= 15) return 35; // Suburban
  return 45; // Highway corridor
}

/**
 * Calculate proximity score from drive time (0-100)
 */
export function proximityScoreFromDriveTime(driveTimeMinutes: number): number {
  if (driveTimeMinutes <= 5) return 100;
  if (driveTimeMinutes <= 10) return 95;
  if (driveTimeMinutes <= 15) return 85;
  if (driveTimeMinutes <= 20) return 75;
  if (driveTimeMinutes <= 25) return 65;
  if (driveTimeMinutes <= 30) return 55;
  if (driveTimeMinutes <= 40) return 40;
  if (driveTimeMinutes <= 50) return 30;
  if (driveTimeMinutes <= 60) return 20;
  if (driveTimeMinutes <= 90) return 10;
  return 0;
}

/**
 * Calculate proximity score from distance (0-100)
 */
export function proximityScoreFromDistance(miles: number): number {
  if (miles <= 0.5) return 100;
  if (miles <= 1) return 95;
  if (miles <= 2) return 85;
  if (miles <= 3) return 75;
  if (miles <= 5) return 65;
  if (miles <= 7) return 55;
  if (miles <= 10) return 40;
  if (miles <= 15) return 25;
  if (miles <= 20) return 15;
  if (miles <= 30) return 5;
  return 0;
}

/**
 * Calculate listing quality score (0-100) based on healthcare worker preferences
 */
export function calculateListingQualityScore(listing: {
  isFurnished: boolean;
  leaseMinMonths?: number;
  allowsPets: boolean;
  hasParking: boolean;
  hasInUnitLaundry: boolean;
  isVerified: boolean;
  avgRating?: number;
}): number {
  let score = 0;

  // Furnished (25 points)
  if (listing.isFurnished) score += 25;

  // Lease flexibility (20 points)
  const lease = listing.leaseMinMonths ?? 12;
  if (lease <= 1) score += 20;
  else if (lease <= 3) score += 15;
  else if (lease <= 6) score += 10;
  else if (lease <= 9) score += 5;
  // 12+ months = 0 points

  // Pet friendly (10 points)
  if (listing.allowsPets) score += 10;

  // Parking (10 points)
  if (listing.hasParking) score += 10;

  // In-unit laundry (10 points)
  if (listing.hasInUnitLaundry) score += 10;

  // Verified (15 points)
  if (listing.isVerified) score += 15;

  // Reviews (10 points)
  if (listing.avgRating) {
    score += Math.round((listing.avgRating / 5) * 10);
  }

  return Math.min(100, score);
}

/**
 * Calculate combined score (proximity 65% + listing quality 35%)
 */
export function calculateCombinedScore(
  proximityScore: number,
  listingQualityScore: number
): number {
  return Math.round(proximityScore * 0.65 + listingQualityScore * 0.35);
}

/**
 * Full proximity score calculation between a hospital and listing
 */
export function calculateFullProximityScore(
  hospitalLat: number,
  hospitalLng: number,
  listingLat: number,
  listingLng: number,
  circuityFactor: number = 1.3
): {
  straightLineMiles: number;
  estimatedDriveMiles: number;
  driveTimeDayMin: number;
  driveTimeNightMin: number;
  scoreDistance: number;
  scoreDriveDay: number;
  scoreDriveNight: number;
  proximityScore: number;
} {
  const straightLineMiles = haversineDistance(
    hospitalLat,
    hospitalLng,
    listingLat,
    listingLng
  );

  const estimatedDriveMiles = Math.round(straightLineMiles * circuityFactor * 100) / 100;
  const avgSpeed = getAvgSpeed(straightLineMiles);

  // Day shift: slightly worse traffic
  const driveTimeDayMin = estimateDriveTime(straightLineMiles, circuityFactor, avgSpeed * 0.85);
  // Night shift: slightly better traffic
  const driveTimeNightMin = estimateDriveTime(straightLineMiles, circuityFactor, avgSpeed * 1.1);

  const scoreDistance = proximityScoreFromDistance(straightLineMiles);
  const scoreDriveDay = proximityScoreFromDriveTime(driveTimeDayMin);
  const scoreDriveNight = proximityScoreFromDriveTime(driveTimeNightMin);

  // Weighted composite: 30% day drive + 20% night drive + 15% distance + 35% placeholder for future factors
  const proximityScore = Math.round(
    scoreDriveDay * 0.35 +
    scoreDriveNight * 0.25 +
    scoreDistance * 0.40
  );

  return {
    straightLineMiles,
    estimatedDriveMiles,
    driveTimeDayMin,
    driveTimeNightMin,
    scoreDistance,
    scoreDriveDay,
    scoreDriveNight,
    proximityScore,
  };
}

// ============================================================
// Score Display Helpers
// ============================================================

export const SCORE_BANDS: ScoreBandInfo[] = [
  { band: "excellent", label: "Walking Distance", color: "#059669", bgColor: "#D1FAE5", minScore: 90 },
  { band: "good", label: "Very Close", color: "#10B981", bgColor: "#ECFDF5", minScore: 75 },
  { band: "fair", label: "Close", color: "#F59E0B", bgColor: "#FEF3C7", minScore: 60 },
  { band: "moderate", label: "Moderate", color: "#F97316", bgColor: "#FFF7ED", minScore: 40 },
  { band: "poor", label: "Far", color: "#EF4444", bgColor: "#FEF2F2", minScore: 20 },
  { band: "bad", label: "Very Far", color: "#DC2626", bgColor: "#FEE2E2", minScore: 0 },
];

export function getScoreBand(score: number): ScoreBandInfo {
  for (const band of SCORE_BANDS) {
    if (score >= band.minScore) return band;
  }
  return SCORE_BANDS[SCORE_BANDS.length - 1];
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return "< 0.1 mi";
  if (miles < 1) return `${miles.toFixed(1)} mi`;
  return `${miles.toFixed(1)} mi`;
}

export function formatDriveTime(minutes: number): string {
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
