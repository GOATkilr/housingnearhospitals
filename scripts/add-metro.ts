/**
 * Metro Onboarding Script
 *
 * Adds a new metro to the database with its center coordinates,
 * discovers nearby ZIP codes, and optionally triggers hospital/listing fetches.
 *
 * Usage:
 *   npx tsx scripts/add-metro.ts --name "Atlanta" --state GA --lat 33.749 --lng -84.388
 *   npx tsx scripts/add-metro.ts --name "Atlanta" --state GA --lat 33.749 --lng -84.388 --radius 25 --circuity 1.35
 *   npx tsx scripts/add-metro.ts --name "Atlanta" --state GA --lat 33.749 --lng -84.388 --fetch-hospitals --fetch-listings
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

function slugify(name: string, state: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${state.toLowerCase()}`;
}

function parseArgs() {
  const args = process.argv.slice(2);

  function getArg(flag: string): string | null {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
  }

  function hasFlag(flag: string): boolean {
    return args.includes(flag);
  }

  const name = getArg("--name");
  const state = getArg("--state");
  const lat = getArg("--lat");
  const lng = getArg("--lng");
  const radius = getArg("--radius") ?? "30";
  const circuity = getArg("--circuity") ?? "1.3";
  const timezone = getArg("--timezone") ?? "America/Chicago";
  const pop = getArg("--pop");
  const rent = getArg("--rent");

  if (!name || !state || !lat || !lng) {
    console.error("Usage: npx tsx scripts/add-metro.ts --name <name> --state <ST> --lat <lat> --lng <lng>");
    console.error("Optional: --radius <miles> --circuity <factor> --timezone <tz> --pop <population> --rent <avg1br>");
    process.exit(1);
  }

  return {
    name: `${name}, ${state.toUpperCase()}`,
    state: state.toUpperCase(),
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    radius: parseFloat(radius),
    circuity: parseFloat(circuity),
    timezone,
    pop: pop ? parseInt(pop) : null,
    rent: rent ? parseInt(rent) : null,
    slug: slugify(name, state),
    fetchHospitals: hasFlag("--fetch-hospitals"),
    fetchListings: hasFlag("--fetch-listings"),
  };
}

// Estimate ZIP codes near a center point using a bounding box approach
// Returns ZIP code prefixes that likely overlap with the metro area
async function discoverZipCodes(lat: number, lng: number, radiusMiles: number): Promise<string[]> {
  // Try to find ZIP codes from existing hospital data in nearby areas
  // This is a best-effort approach — actual ZIP codes should be added manually for best results
  const degreeRadius = radiusMiles / 69.0; // ~69 miles per degree latitude

  const rows = await sql`
    SELECT DISTINCT zip_code
    FROM hospitals
    WHERE zip_code IS NOT NULL
      AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusMiles * 1609.34}
      )
    ORDER BY zip_code
  `;

  return rows.map((r) => r.zip_code as string).filter(Boolean);
}

async function main() {
  const opts = parseArgs();

  console.log("=== Metro Onboarding ===\n");
  console.log(`  Name:      ${opts.name}`);
  console.log(`  Slug:      ${opts.slug}`);
  console.log(`  Center:    ${opts.lat}, ${opts.lng}`);
  console.log(`  Radius:    ${opts.radius} miles`);
  console.log(`  Circuity:  ${opts.circuity}`);
  console.log(`  Timezone:  ${opts.timezone}`);

  // Check if metro already exists
  const existing = await sql`SELECT id FROM metros WHERE slug = ${opts.slug} LIMIT 1`;
  if (existing.length > 0) {
    console.log(`\n  Metro "${opts.slug}" already exists (id: ${existing[0].id}).`);
    console.log("  To update, use the admin dashboard or modify directly in the database.");

    // Activate if not active
    await sql`UPDATE metros SET is_active = true WHERE slug = ${opts.slug} AND is_active = false`;
    console.log("  Ensured metro is active.");
    return;
  }

  // Insert metro
  const result = await sql`
    INSERT INTO metros (slug, name, state_code, center, radius_miles, timezone, circuity_factor, is_active, metro_pop, avg_rent_1br)
    VALUES (
      ${opts.slug},
      ${opts.name},
      ${opts.state},
      ST_SetSRID(ST_MakePoint(${opts.lng}, ${opts.lat}), 4326)::geography,
      ${opts.radius},
      ${opts.timezone},
      ${opts.circuity},
      true,
      ${opts.pop},
      ${opts.rent}
    )
    RETURNING id
  `;

  const metroId = result[0].id as string;
  console.log(`\n  Created metro: ${metroId}`);

  // Discover nearby hospitals that might already be in DB
  const nearbyHospitals = await sql`
    SELECT COUNT(*)::int AS count
    FROM hospitals
    WHERE ST_DWithin(
      location,
      ST_SetSRID(ST_MakePoint(${opts.lng}, ${opts.lat}), 4326)::geography,
      ${opts.radius * 1609.34}
    )
    AND metro_id IS NULL
  `;

  const unassignedCount = (nearbyHospitals[0]?.count as number) ?? 0;

  if (unassignedCount > 0) {
    // Assign nearby unassigned hospitals to this metro
    await sql`
      UPDATE hospitals
      SET metro_id = ${metroId}::uuid
      WHERE ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(${opts.lng}, ${opts.lat}), 4326)::geography,
        ${opts.radius * 1609.34}
      )
      AND metro_id IS NULL
    `;
    console.log(`  Assigned ${unassignedCount} nearby hospitals to this metro.`);
  }

  // Also check for hospitals already assigned to this metro
  const totalHospitals = await sql`
    SELECT COUNT(*)::int AS count FROM hospitals WHERE metro_id = ${metroId}::uuid AND is_active = true
  `;
  console.log(`  Total hospitals in metro: ${(totalHospitals[0]?.count as number) ?? 0}`);

  // Discover ZIP codes
  const zips = await discoverZipCodes(opts.lat, opts.lng, opts.radius);
  if (zips.length > 0) {
    console.log(`\n  Discovered ${zips.length} ZIP codes: ${zips.slice(0, 10).join(", ")}${zips.length > 10 ? "..." : ""}`);
  }

  console.log("\n=== NEXT STEPS ===");
  console.log(`  1. Fetch hospitals: npx tsx scripts/seed-hospitals.ts (if not already imported)`);
  console.log(`  2. Fetch listings:  npx tsx scripts/fetch-rentcast-listings.ts --metro ${opts.slug}`);
  console.log(`     (Add ZIP codes to METRO_ZIPS in fetch-rentcast-listings.ts first)`);
  console.log(`  3. Import listings: npx tsx scripts/import-listings.ts --metro ${opts.slug}`);
  console.log(`  4. Score:           npx tsx scripts/calculate-scores.ts --metro ${opts.slug}`);

  if (zips.length > 0) {
    console.log(`\n  Suggested ZIPs for RentCast fetch:`);
    console.log(`    "${opts.slug}": [${zips.slice(0, 10).map(z => `"${z}"`).join(", ")}],`);
  }

  console.log("\n=== DONE ===");
}

main().catch((err) => {
  console.error("Metro onboarding failed:", err);
  process.exit(1);
});
