/**
 * Batch Score Calculator — Production
 *
 * Calculates proximity scores for all hospital-listing pairs from the database.
 * Uses PostGIS ST_DWithin for spatial filtering and Haversine for scoring.
 *
 * Usage:
 *   npx tsx scripts/calculate-scores.ts
 *   npx tsx scripts/calculate-scores.ts --metro nashville-tn
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import {
  calculateFullProximityScore,
  calculateListingQualityScore,
  calculateCombinedScore,
} from "../src/lib/scoring";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const MAX_DISTANCE_MILES = 15;

interface DbHospital {
  id: string;
  metro_id: string;
  lat: number;
  lng: number;
  circuity_factor: number;
}

interface DbListing {
  id: string;
  metro_id: string;
  lat: number;
  lng: number;
  is_furnished: boolean;
  lease_min_months: number | null;
  allows_pets: boolean;
  has_parking: boolean;
  has_in_unit_laundry: boolean;
  is_verified: boolean;
}

async function calculateForMetro(metroSlug: string): Promise<number> {
  console.log(`\n--- ${metroSlug.toUpperCase()} ---`);

  // Fetch hospitals with their metro's circuity factor
  const hospitals: DbHospital[] = (await sql`
    SELECT h.id, h.metro_id,
           ST_Y(h.location::geometry) AS lat,
           ST_X(h.location::geometry) AS lng,
           m.circuity_factor
    FROM hospitals h
    JOIN metros m ON m.id = h.metro_id
    WHERE m.slug = ${metroSlug} AND h.is_active = true
  `) as unknown as DbHospital[];

  console.log(`  Hospitals: ${hospitals.length}`);

  // Fetch all active listings for this metro
  const listings: DbListing[] = (await sql`
    SELECT l.id, l.metro_id,
           ST_Y(l.location::geometry) AS lat,
           ST_X(l.location::geometry) AS lng,
           l.is_furnished, l.lease_min_months, l.allows_pets,
           l.has_parking, l.has_in_unit_laundry, l.is_verified
    FROM listings l
    JOIN metros m ON m.id = l.metro_id
    WHERE m.slug = ${metroSlug} AND l.status = 'active' AND l.deleted_at IS NULL
  `) as unknown as DbListing[];

  console.log(`  Listings: ${listings.length}`);

  if (hospitals.length === 0 || listings.length === 0) {
    console.log("  Skipping — no data to score.");
    return 0;
  }

  const BATCH_SIZE = 75;
  let scoreCount = 0;
  let batch: Array<{
    hospitalId: string;
    listingId: string;
    straightLineMiles: number;
    estimatedDriveMiles: number;
    driveTimeDayMin: number;
    driveTimeNightMin: number;
    scoreDriveDay: number;
    scoreDriveNight: number;
    scoreDistance: number;
    proximityScore: number;
    combinedScore: number;
  }> = [];

  async function flushBatch() {
    if (batch.length === 0) return;

    // Use Promise.all with smaller chunks for parallel upserts
    // Neon tagged templates don't support dynamic VALUES, so we batch via Promise.all
    const promises = batch.map((row) =>
      sql`
        INSERT INTO hospital_listing_scores (
          hospital_id, listing_id, straight_line_miles, estimated_drive_miles,
          drive_time_day_min, drive_time_night_min,
          score_drive_day, score_drive_night, score_distance,
          proximity_score, combined_score, calculation_method
        ) VALUES (
          ${row.hospitalId}::uuid, ${row.listingId}::uuid,
          ${row.straightLineMiles}, ${row.estimatedDriveMiles},
          ${row.driveTimeDayMin}, ${row.driveTimeNightMin},
          ${row.scoreDriveDay}, ${row.scoreDriveNight}, ${row.scoreDistance},
          ${row.proximityScore}, ${row.combinedScore}, 'haversine'
        )
        ON CONFLICT (hospital_id, listing_id) DO UPDATE SET
          straight_line_miles = EXCLUDED.straight_line_miles,
          estimated_drive_miles = EXCLUDED.estimated_drive_miles,
          drive_time_day_min = EXCLUDED.drive_time_day_min,
          drive_time_night_min = EXCLUDED.drive_time_night_min,
          score_drive_day = EXCLUDED.score_drive_day,
          score_drive_night = EXCLUDED.score_drive_night,
          score_distance = EXCLUDED.score_distance,
          proximity_score = EXCLUDED.proximity_score,
          combined_score = EXCLUDED.combined_score,
          calculated_at = NOW()
      `
    );

    await Promise.all(promises);
    batch = [];
  }

  for (const hospital of hospitals) {
    const circuityFactor = Number(hospital.circuity_factor) || 1.3;

    for (const listing of listings) {
      // Quick pre-filter: rough lat/lng delta (15 miles ≈ 0.22 degrees lat)
      const dlat = Math.abs(Number(hospital.lat) - Number(listing.lat));
      const dlng = Math.abs(Number(hospital.lng) - Number(listing.lng));
      if (dlat > 0.25 || dlng > 0.3) continue;

      const result = calculateFullProximityScore(
        Number(hospital.lat),
        Number(hospital.lng),
        Number(listing.lat),
        Number(listing.lng),
        circuityFactor
      );

      if (result.straightLineMiles > MAX_DISTANCE_MILES) continue;

      const qualityScore = calculateListingQualityScore({
        isFurnished: listing.is_furnished,
        leaseMinMonths: listing.lease_min_months ?? 12,
        allowsPets: listing.allows_pets,
        hasParking: listing.has_parking,
        hasInUnitLaundry: listing.has_in_unit_laundry,
        isVerified: listing.is_verified,
      });

      const combinedScore = calculateCombinedScore(result.proximityScore, qualityScore);

      batch.push({
        hospitalId: hospital.id,
        listingId: listing.id,
        straightLineMiles: result.straightLineMiles,
        estimatedDriveMiles: result.estimatedDriveMiles,
        driveTimeDayMin: result.driveTimeDayMin,
        driveTimeNightMin: result.driveTimeNightMin,
        scoreDriveDay: result.scoreDriveDay,
        scoreDriveNight: result.scoreDriveNight,
        scoreDistance: result.scoreDistance,
        proximityScore: result.proximityScore,
        combinedScore,
      });

      scoreCount++;

      if (batch.length >= BATCH_SIZE) {
        await flushBatch();
      }

      if (scoreCount % 500 === 0) {
        console.log(`  Scored ${scoreCount} pairs...`);
      }
    }
  }

  // Flush remaining
  await flushBatch();

  console.log(`  Total score pairs: ${scoreCount}`);
  return scoreCount;
}

async function main() {
  const args = process.argv.slice(2);
  const metroArg = args.find((a) => a.startsWith("--metro"))
    ? args[args.indexOf("--metro") + 1]
    : null;

  let metros: string[];
  if (metroArg) {
    metros = [metroArg];
  } else {
    // Fetch all active metros from DB
    const rows = await sql`SELECT slug FROM metros WHERE is_active = true ORDER BY name`;
    metros = rows.map((r) => r.slug as string);
    if (metros.length === 0) {
      console.log("No active metros found. Add metros first with add-metro.ts.");
      return;
    }
  }

  console.log("=== Proximity Score Calculator ===\n");

  let totalScores = 0;
  for (const metro of metros) {
    totalScores += await calculateForMetro(metro);
  }

  // Refresh materialized view
  console.log("\nRefreshing materialized view mv_search_results...");
  await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_search_results`;
  console.log("  Done.");

  console.log(`\n=== COMPLETE: ${totalScores} score pairs calculated ===`);
}

main().catch((err) => {
  console.error("Score calculation failed:", err);
  process.exit(1);
});
