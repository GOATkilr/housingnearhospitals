/**
 * Seed the Neon Postgres database from sample-data.ts arrays.
 *
 * Usage:
 *   npx tsx scripts/seed-database.ts
 *
 * Requires DATABASE_URL in .env.local or environment.
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { SAMPLE_METROS, SAMPLE_HOSPITALS, SAMPLE_LISTINGS } from "../src/lib/sample-data";
import {
  haversineDistance,
  estimateDriveTime,
  getAvgSpeed,
  proximityScoreFromDriveTime,
  calculateCombinedScore,
  calculateListingQualityScore,
} from "../src/lib/scoring";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local or your environment.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Maps sample string IDs → real UUID from Postgres
const metroIdMap = new Map<string, string>();
const hospitalIdMap = new Map<string, string>();
const listingIdMap = new Map<string, string>();

async function seed() {
  console.log("Seeding database...\n");

  // ---------- METROS ----------
  console.log(`Inserting ${SAMPLE_METROS.length} metros...`);
  for (const m of SAMPLE_METROS) {
    const rows = await sql`
      INSERT INTO metros (slug, name, state_code, center, radius_miles, timezone, circuity_factor, is_active, metro_pop, avg_rent_1br, cost_of_living)
      VALUES (
        ${m.slug},
        ${m.name},
        ${m.stateCode},
        ST_SetSRID(ST_MakePoint(${m.center.lng}, ${m.center.lat}), 4326)::geography,
        ${m.radiusMiles},
        ${m.timezone},
        ${m.circuityFactor},
        ${m.isActive},
        ${m.metroPop ?? null},
        ${m.avgRent1br ?? null},
        ${m.costOfLiving ?? null}
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        is_active = EXCLUDED.is_active,
        metro_pop = EXCLUDED.metro_pop,
        avg_rent_1br = EXCLUDED.avg_rent_1br,
        cost_of_living = EXCLUDED.cost_of_living,
        updated_at = NOW()
      RETURNING id
    `;
    metroIdMap.set(m.id, rows[0].id as string);
  }
  console.log("  Done.\n");

  // ---------- HOSPITALS ----------
  console.log(`Inserting ${SAMPLE_HOSPITALS.length} hospitals...`);
  for (const h of SAMPLE_HOSPITALS) {
    const dbMetroId = metroIdMap.get(h.metroId);
    if (!dbMetroId) {
      console.warn(`  Skipping hospital ${h.name}: metro ${h.metroId} not found`);
      continue;
    }

    const rows = await sql`
      INSERT INTO hospitals (metro_id, cms_ccn, hifld_id, name, slug, address, city, state_code, zip_code, phone, website, location, hospital_type, ownership, system_name, bed_count, has_emergency, trauma_level, teaching_status, cms_overall_rating, cms_patient_exp, cms_safety_rating, is_active)
      VALUES (
        ${dbMetroId}::uuid,
        ${h.cmsCcn ?? null},
        ${h.hifldId ?? null},
        ${h.name},
        ${h.slug},
        ${h.address ?? null},
        ${h.city ?? null},
        ${h.stateCode ?? null},
        ${h.zipCode ?? null},
        ${h.phone ?? null},
        ${h.website ?? null},
        ST_SetSRID(ST_MakePoint(${h.location.lng}, ${h.location.lat}), 4326)::geography,
        ${h.hospitalType},
        ${h.ownership ?? null},
        ${h.systemName ?? null},
        ${h.bedCount ?? null},
        ${h.hasEmergency},
        ${h.traumaLevel ?? null},
        ${h.teachingStatus ?? null},
        ${h.cmsOverallRating ?? null},
        ${h.cmsPatientExp ?? null},
        ${h.cmsSafetyRating ?? null},
        ${h.isActive}
      )
      ON CONFLICT (slug, metro_id) DO UPDATE SET
        name = EXCLUDED.name,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
      RETURNING id
    `;
    hospitalIdMap.set(h.id, rows[0].id as string);
  }
  console.log("  Done.\n");

  // ---------- LISTINGS ----------
  console.log(`Inserting ${SAMPLE_LISTINGS.length} listings...`);
  for (const l of SAMPLE_LISTINGS) {
    const dbMetroId = metroIdMap.get(l.metroId);
    if (!dbMetroId) {
      console.warn(`  Skipping listing ${l.title}: metro ${l.metroId} not found`);
      continue;
    }

    const qualityScore = calculateListingQualityScore({
      isFurnished: l.isFurnished,
      leaseMinMonths: l.leaseMinMonths,
      allowsPets: l.allowsPets,
      hasParking: l.hasParking,
      hasInUnitLaundry: l.hasInUnitLaundry,
      isVerified: l.isVerified,
    });

    const rows = await sql`
      INSERT INTO listings (metro_id, external_id, source, source_url, is_featured, title, description, property_type, location, address, city, state_code, zip_code, bedrooms, bathrooms, sqft, price_monthly, is_furnished, lease_min_months, allows_pets, has_parking, has_in_unit_laundry, amenities, primary_image_url, image_count, listing_quality_score, status, is_verified, available_date)
      VALUES (
        ${dbMetroId}::uuid,
        ${l.externalId ?? l.id},
        ${l.source},
        ${l.sourceUrl ?? null},
        ${l.isFeatured ?? false},
        ${l.title},
        ${l.description ?? null},
        ${l.propertyType},
        ST_SetSRID(ST_MakePoint(${l.location.lng}, ${l.location.lat}), 4326)::geography,
        ${l.address ?? null},
        ${l.city ?? null},
        ${l.stateCode ?? null},
        ${l.zipCode ?? null},
        ${l.bedrooms ?? null},
        ${l.bathrooms ?? null},
        ${l.sqft ?? null},
        ${l.priceMonthly},
        ${l.isFurnished},
        ${l.leaseMinMonths ?? null},
        ${l.allowsPets},
        ${l.hasParking},
        ${l.hasInUnitLaundry},
        ${JSON.stringify(l.amenities)}::jsonb,
        ${l.primaryImageUrl ?? null},
        ${l.imageCount},
        ${qualityScore},
        ${l.status},
        ${l.isVerified},
        ${l.availableDate ?? null}
      )
      RETURNING id
    `;
    listingIdMap.set(l.id, rows[0].id as string);
  }
  console.log("  Done.\n");

  // ---------- HOSPITAL-LISTING SCORES ----------
  console.log("Computing hospital-listing proximity scores...");
  let scoreCount = 0;
  const MAX_DISTANCE_MILES = 15;

  for (const hospital of SAMPLE_HOSPITALS) {
    const dbHospitalId = hospitalIdMap.get(hospital.id);
    if (!dbHospitalId) continue;

    const metro = SAMPLE_METROS.find((m) => m.id === hospital.metroId);
    const circuityFactor = metro?.circuityFactor ?? 1.3;
    const metroListings = SAMPLE_LISTINGS.filter((l) => l.metroId === hospital.metroId);

    for (const listing of metroListings) {
      const dbListingId = listingIdMap.get(listing.id);
      if (!dbListingId) continue;

      const straightLineMiles = haversineDistance(
        hospital.location.lat,
        hospital.location.lng,
        listing.location.lat,
        listing.location.lng
      );

      if (straightLineMiles > MAX_DISTANCE_MILES) continue;

      const estimatedDriveMiles = Math.round(straightLineMiles * circuityFactor * 100) / 100;
      const avgSpeed = getAvgSpeed(straightLineMiles);
      const driveTimeDayMin = estimateDriveTime(straightLineMiles, circuityFactor, avgSpeed * 0.85);
      const driveTimeNightMin = estimateDriveTime(straightLineMiles, circuityFactor, avgSpeed * 1.1);
      const proximityScore = proximityScoreFromDriveTime(driveTimeDayMin);

      const qualityScore = calculateListingQualityScore({
        isFurnished: listing.isFurnished,
        leaseMinMonths: listing.leaseMinMonths,
        allowsPets: listing.allowsPets,
        hasParking: listing.hasParking,
        hasInUnitLaundry: listing.hasInUnitLaundry,
        isVerified: listing.isVerified,
      });
      const combinedScore = calculateCombinedScore(proximityScore, qualityScore);

      await sql`
        INSERT INTO hospital_listing_scores (hospital_id, listing_id, straight_line_miles, estimated_drive_miles, drive_time_day_min, drive_time_night_min, score_drive_day, score_drive_night, score_distance, proximity_score, combined_score, calculation_method)
        VALUES (
          ${dbHospitalId}::uuid,
          ${dbListingId}::uuid,
          ${straightLineMiles},
          ${estimatedDriveMiles},
          ${driveTimeDayMin},
          ${driveTimeNightMin},
          ${proximityScoreFromDriveTime(driveTimeDayMin)},
          ${proximityScoreFromDriveTime(driveTimeNightMin)},
          ${proximityScore},
          ${proximityScore},
          ${combinedScore},
          'haversine'
        )
        ON CONFLICT (hospital_id, listing_id) DO UPDATE SET
          straight_line_miles = EXCLUDED.straight_line_miles,
          estimated_drive_miles = EXCLUDED.estimated_drive_miles,
          drive_time_day_min = EXCLUDED.drive_time_day_min,
          drive_time_night_min = EXCLUDED.drive_time_night_min,
          proximity_score = EXCLUDED.proximity_score,
          combined_score = EXCLUDED.combined_score,
          calculated_at = NOW()
      `;
      scoreCount++;
    }
  }
  console.log(`  Inserted ${scoreCount} score pairs.\n`);

  // ---------- REFRESH MATERIALIZED VIEW ----------
  console.log("Refreshing materialized view mv_search_results...");
  await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_search_results`;
  console.log("  Done.\n");

  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
