/**
 * Batch Score Calculator
 *
 * Calculates proximity scores for all hospital-listing pairs within a metro.
 * Designed to be run as a scheduled job or after new listings are imported.
 *
 * Usage:
 *   npx tsx scripts/calculate-scores.ts
 *   npx tsx scripts/calculate-scores.ts --metro nashville-tn
 *
 * Algorithm:
 *   1. For each metro, fetch all active hospitals and listings
 *   2. For each hospital, find listings within 30-mile radius
 *   3. Calculate proximity scores using Haversine + circuity estimation
 *   4. Upsert scores into hospital_listing_scores table
 *   5. Refresh materialized search view
 */

import {
  haversineDistance,
  calculateFullProximityScore,
  calculateListingQualityScore,
  calculateCombinedScore,
} from "../src/lib/scoring";

// Demo: Calculate scores for sample data to verify algorithm
function demo() {
  console.log("=== Proximity Score Calculator ===\n");
  console.log("Running in demo mode with sample coordinates.\n");

  // Vanderbilt University Medical Center
  const hospital = {
    name: "Vanderbilt University Medical Center",
    lat: 36.1425,
    lng: -86.8026,
  };

  // Sample listings at various distances
  const listings = [
    { name: "Midtown Apartment (0.6 mi)", lat: 36.1520, lng: -86.7970 },
    { name: "Music Row Studio (0.8 mi)", lat: 36.1495, lng: -86.7928 },
    { name: "Sylvan Park House (2.3 mi)", lat: 36.1380, lng: -86.8360 },
    { name: "The Gulch Luxury (1.2 mi)", lat: 36.1510, lng: -86.7870 },
    { name: "West End Room (0.9 mi)", lat: 36.1465, lng: -86.8140 },
    { name: "Berry Hill Townhouse (3.2 mi)", lat: 36.1200, lng: -86.7650 },
    { name: "East Nashville (5.1 mi)", lat: 36.1800, lng: -86.7400 },
    { name: "Brentwood (8.5 mi)", lat: 36.0300, lng: -86.7800 },
    { name: "Murfreesboro (30 mi)", lat: 35.8456, lng: -86.3903 },
  ];

  console.log(`Hospital: ${hospital.name}`);
  console.log(`Location: ${hospital.lat}, ${hospital.lng}\n`);
  console.log("-".repeat(100));
  console.log(
    "Listing".padEnd(35) +
    "Distance".padEnd(12) +
    "Drive(Day)".padEnd(12) +
    "Drive(Night)".padEnd(14) +
    "Score".padEnd(8) +
    "Band"
  );
  console.log("-".repeat(100));

  for (const listing of listings) {
    const result = calculateFullProximityScore(
      hospital.lat,
      hospital.lng,
      listing.lat,
      listing.lng,
      1.3 // Nashville circuity factor
    );

    const band =
      result.proximityScore >= 90 ? "Walking Distance" :
      result.proximityScore >= 75 ? "Very Close" :
      result.proximityScore >= 60 ? "Close" :
      result.proximityScore >= 40 ? "Moderate" :
      result.proximityScore >= 20 ? "Far" : "Very Far";

    console.log(
      listing.name.padEnd(35) +
      `${result.straightLineMiles} mi`.padEnd(12) +
      `${result.driveTimeDayMin} min`.padEnd(12) +
      `${result.driveTimeNightMin} min`.padEnd(14) +
      `${result.proximityScore}`.padEnd(8) +
      band
    );
  }

  console.log("-".repeat(100));

  // Demo listing quality scoring
  console.log("\n\n=== Listing Quality Score Demo ===\n");

  const sampleListings = [
    {
      name: "Fully loaded furnished apt",
      isFurnished: true,
      leaseMinMonths: 1,
      allowsPets: true,
      hasParking: true,
      hasInUnitLaundry: true,
      isVerified: true,
      avgRating: 4.5,
    },
    {
      name: "Basic unfurnished apt",
      isFurnished: false,
      leaseMinMonths: 12,
      allowsPets: false,
      hasParking: false,
      hasInUnitLaundry: false,
      isVerified: false,
    },
    {
      name: "Furnished, short-term, verified",
      isFurnished: true,
      leaseMinMonths: 3,
      allowsPets: false,
      hasParking: true,
      hasInUnitLaundry: false,
      isVerified: true,
    },
  ];

  for (const listing of sampleListings) {
    const qualityScore = calculateListingQualityScore(listing);
    console.log(`${listing.name}: ${qualityScore}/100`);

    // Combined with a sample proximity score of 75
    const combined = calculateCombinedScore(75, qualityScore);
    console.log(`  Combined (with proximity 75): ${combined}/100\n`);
  }

  console.log("\n=== SQL for Production ===\n");
  console.log(`-- Calculate and insert scores for all hospital-listing pairs within 30 miles`);
  console.log(`INSERT INTO hospital_listing_scores (hospital_id, listing_id, straight_line_miles, estimated_drive_miles, drive_time_day_min, drive_time_night_min, proximity_score, combined_score, calculation_method)`);
  console.log(`SELECT`);
  console.log(`  h.id AS hospital_id,`);
  console.log(`  l.id AS listing_id,`);
  console.log(`  distance_miles(h.location, l.location) AS straight_line_miles,`);
  console.log(`  ROUND(distance_miles(h.location, l.location) * m.circuity_factor, 2) AS estimated_drive_miles,`);
  console.log(`  estimated_drive_time(distance_miles(h.location, l.location), m.circuity_factor) AS drive_time_day_min,`);
  console.log(`  estimated_drive_time(distance_miles(h.location, l.location), m.circuity_factor, 30) AS drive_time_night_min,`);
  console.log(`  proximity_score_from_drive_time(estimated_drive_time(distance_miles(h.location, l.location), m.circuity_factor)) AS proximity_score,`);
  console.log(`  NULL AS combined_score,`);
  console.log(`  'haversine' AS calculation_method`);
  console.log(`FROM hospitals h`);
  console.log(`CROSS JOIN listings l`);
  console.log(`JOIN metros m ON m.id = h.metro_id`);
  console.log(`WHERE h.metro_id = l.metro_id`);
  console.log(`  AND h.is_active = true`);
  console.log(`  AND l.status = 'active'`);
  console.log(`  AND ST_DWithin(h.location, l.location, 30 * 1609.344)  -- 30 miles`);
  console.log(`ON CONFLICT (hospital_id, listing_id) DO UPDATE SET`);
  console.log(`  straight_line_miles = EXCLUDED.straight_line_miles,`);
  console.log(`  estimated_drive_miles = EXCLUDED.estimated_drive_miles,`);
  console.log(`  drive_time_day_min = EXCLUDED.drive_time_day_min,`);
  console.log(`  drive_time_night_min = EXCLUDED.drive_time_night_min,`);
  console.log(`  proximity_score = EXCLUDED.proximity_score,`);
  console.log(`  calculated_at = NOW();`);
  console.log(`\n-- Then refresh the materialized view`);
  console.log(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_search_results;`);
}

demo();
