/**
 * Batch Metro Seeder
 *
 * Seeds the next wave of metros into the database.
 * Safe to re-run — skips metros that already exist.
 *
 * Usage:
 *   npx tsx scripts/seed-metros.ts
 *   npx tsx scripts/seed-metros.ts --dry-run
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

interface MetroSeed {
  slug: string;
  name: string;
  stateCode: string;
  lat: number;
  lng: number;
  radiusMiles: number;
  circuityFactor: number;
  timezone: string;
  metroPop: number | null;
  avgRent1br: number | null;
}

const METROS: MetroSeed[] = [
  // Already exist (included for completeness, will be skipped)
  { slug: "nashville-tn", name: "Nashville, TN", stateCode: "TN", lat: 36.1627, lng: -86.7816, radiusMiles: 30, circuityFactor: 1.30, timezone: "America/Chicago", metroPop: 2000000, avgRent1br: 1500 },
  { slug: "houston-tx", name: "Houston, TX", stateCode: "TX", lat: 29.7604, lng: -95.3698, radiusMiles: 30, circuityFactor: 1.40, timezone: "America/Chicago", metroPop: 7100000, avgRent1br: 1200 },
  { slug: "phoenix-az", name: "Phoenix, AZ", stateCode: "AZ", lat: 33.4484, lng: -112.074, radiusMiles: 30, circuityFactor: 1.25, timezone: "America/Phoenix", metroPop: 4900000, avgRent1br: 1250 },

  // Wave 2 — 15 new metros
  { slug: "atlanta-ga", name: "Atlanta, GA", stateCode: "GA", lat: 33.749, lng: -84.388, radiusMiles: 30, circuityFactor: 1.35, timezone: "America/New_York", metroPop: 6100000, avgRent1br: 1550 },
  { slug: "dallas-tx", name: "Dallas, TX", stateCode: "TX", lat: 32.7767, lng: -96.797, radiusMiles: 30, circuityFactor: 1.35, timezone: "America/Chicago", metroPop: 7600000, avgRent1br: 1350 },
  { slug: "denver-co", name: "Denver, CO", stateCode: "CO", lat: 39.7392, lng: -104.9903, radiusMiles: 25, circuityFactor: 1.30, timezone: "America/Denver", metroPop: 2900000, avgRent1br: 1650 },
  { slug: "chicago-il", name: "Chicago, IL", stateCode: "IL", lat: 41.8781, lng: -87.6298, radiusMiles: 30, circuityFactor: 1.40, timezone: "America/Chicago", metroPop: 9500000, avgRent1br: 1700 },
  { slug: "los-angeles-ca", name: "Los Angeles, CA", stateCode: "CA", lat: 34.0522, lng: -118.2437, radiusMiles: 30, circuityFactor: 1.45, timezone: "America/Los_Angeles", metroPop: 13200000, avgRent1br: 2200 },
  { slug: "san-francisco-ca", name: "San Francisco, CA", stateCode: "CA", lat: 37.7749, lng: -122.4194, radiusMiles: 25, circuityFactor: 1.40, timezone: "America/Los_Angeles", metroPop: 4700000, avgRent1br: 2800 },
  { slug: "seattle-wa", name: "Seattle, WA", stateCode: "WA", lat: 47.6062, lng: -122.3321, radiusMiles: 25, circuityFactor: 1.35, timezone: "America/Los_Angeles", metroPop: 4000000, avgRent1br: 2000 },
  { slug: "boston-ma", name: "Boston, MA", stateCode: "MA", lat: 42.3601, lng: -71.0589, radiusMiles: 25, circuityFactor: 1.40, timezone: "America/New_York", metroPop: 4900000, avgRent1br: 2500 },
  { slug: "miami-fl", name: "Miami, FL", stateCode: "FL", lat: 25.7617, lng: -80.1918, radiusMiles: 30, circuityFactor: 1.30, timezone: "America/New_York", metroPop: 6100000, avgRent1br: 1800 },
  { slug: "philadelphia-pa", name: "Philadelphia, PA", stateCode: "PA", lat: 39.9526, lng: -75.1652, radiusMiles: 25, circuityFactor: 1.35, timezone: "America/New_York", metroPop: 6200000, avgRent1br: 1400 },
  { slug: "san-diego-ca", name: "San Diego, CA", stateCode: "CA", lat: 32.7157, lng: -117.1611, radiusMiles: 25, circuityFactor: 1.30, timezone: "America/Los_Angeles", metroPop: 3300000, avgRent1br: 2100 },
  { slug: "minneapolis-mn", name: "Minneapolis, MN", stateCode: "MN", lat: 44.9778, lng: -93.265, radiusMiles: 25, circuityFactor: 1.30, timezone: "America/Chicago", metroPop: 3700000, avgRent1br: 1250 },
  { slug: "orlando-fl", name: "Orlando, FL", stateCode: "FL", lat: 28.5383, lng: -81.3792, radiusMiles: 25, circuityFactor: 1.30, timezone: "America/New_York", metroPop: 2700000, avgRent1br: 1500 },
  { slug: "charlotte-nc", name: "Charlotte, NC", stateCode: "NC", lat: 35.2271, lng: -80.8431, radiusMiles: 25, circuityFactor: 1.30, timezone: "America/New_York", metroPop: 2700000, avgRent1br: 1400 },
  { slug: "tampa-fl", name: "Tampa, FL", stateCode: "FL", lat: 27.9506, lng: -82.4572, radiusMiles: 25, circuityFactor: 1.30, timezone: "America/New_York", metroPop: 3200000, avgRent1br: 1450 },
];

async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log("=== Metro Batch Seeder ===\n");
  if (isDryRun) console.log("  [DRY RUN — no changes will be made]\n");

  let created = 0;
  let skipped = 0;
  let activated = 0;

  for (const metro of METROS) {
    // Check if exists
    const existing = await sql`SELECT id, is_active FROM metros WHERE slug = ${metro.slug} LIMIT 1`;

    if (existing.length > 0) {
      const isActive = existing[0].is_active;
      if (!isActive && !isDryRun) {
        await sql`UPDATE metros SET is_active = true WHERE slug = ${metro.slug}`;
        console.log(`  [ACTIVATED] ${metro.name} (was inactive)`);
        activated++;
      } else {
        console.log(`  [SKIP] ${metro.name} (already exists${isActive ? ", active" : ", inactive"})`);
        skipped++;
      }
      continue;
    }

    console.log(`  [CREATE] ${metro.name} — ${metro.lat}, ${metro.lng} (${metro.timezone})`);

    if (!isDryRun) {
      await sql`
        INSERT INTO metros (slug, name, state_code, center, radius_miles, timezone, circuity_factor, is_active, metro_pop, avg_rent_1br)
        VALUES (
          ${metro.slug},
          ${metro.name},
          ${metro.stateCode},
          ST_SetSRID(ST_MakePoint(${metro.lng}, ${metro.lat}), 4326)::geography,
          ${metro.radiusMiles},
          ${metro.timezone},
          ${metro.circuityFactor},
          true,
          ${metro.metroPop},
          ${metro.avgRent1br}
        )
      `;
    }

    created++;
  }

  // Assign unassigned hospitals to new metros
  if (!isDryRun && created > 0) {
    console.log("\nAssigning hospitals to new metros...");

    for (const metro of METROS) {
      const result = await sql`
        UPDATE hospitals
        SET metro_id = (SELECT id FROM metros WHERE slug = ${metro.slug})
        WHERE metro_id IS NULL
          AND ST_DWithin(
            location,
            ST_SetSRID(ST_MakePoint(${metro.lng}, ${metro.lat}), 4326)::geography,
            ${metro.radiusMiles * 1609.34}
          )
      `;
      // neon returns array, check if any rows affected
      const updated = Array.isArray(result) ? result.length : 0;
      if (updated > 0) {
        console.log(`  ${metro.name}: assigned ${updated} hospitals`);
      }
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`  Created:   ${created}`);
  console.log(`  Activated: ${activated}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Total:     ${METROS.length} metros`);

  if (created > 0 && !isDryRun) {
    console.log("\n=== NEXT STEPS ===");
    console.log("  1. Import hospitals: npx tsx scripts/seed-hospitals.ts");
    console.log("  2. Add ZIP codes to scripts/fetch-rentcast-listings.ts for new metros");
    console.log("  3. Fetch listings:   npx tsx scripts/fetch-rentcast-listings.ts");
    console.log("  4. Import listings:  npx tsx scripts/import-listings.ts");
    console.log("  5. Calculate scores: npx tsx scripts/calculate-scores.ts");
  }
}

main().catch((err) => {
  console.error("Metro seeding failed:", err);
  process.exit(1);
});
