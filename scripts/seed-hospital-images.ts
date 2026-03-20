/**
 * Seed Hospital Images
 *
 * Generates Mapbox Static Images API URLs for all hospitals
 * and updates their image_url in the database.
 *
 * Uses satellite-streets style at zoom 15 for unique aerial views.
 * Free under Mapbox quota (no download — just URL generation).
 *
 * Prerequisites:
 *   - Run migration: database/migrations/001-add-hospital-image.sql
 *   - Set NEXT_PUBLIC_MAPBOX_TOKEN env var
 *
 * Usage:
 *   npx tsx scripts/seed-hospital-images.ts
 *   npx tsx scripts/seed-hospital-images.ts --dry-run
 */

import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}
if (!MAPBOX_TOKEN) {
  console.error("NEXT_PUBLIC_MAPBOX_TOKEN not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const dryRun = process.argv.includes("--dry-run");

function mapboxStaticUrl(lng: number, lat: number): string {
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${lng},${lat},15,0/400x300@2x?access_token=${MAPBOX_TOKEN}`;
}

async function main() {
  const hospitals = await sql`
    SELECT id, name, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
    FROM hospitals
    WHERE is_active = true
  `;

  console.log(`Found ${hospitals.length} active hospitals`);
  if (dryRun) console.log("(DRY RUN — no DB updates)");

  let updated = 0;
  for (const h of hospitals) {
    const url = mapboxStaticUrl(h.lng as number, h.lat as number);

    if (dryRun) {
      console.log(`  [dry-run] ${h.name}: ${url.slice(0, 80)}...`);
    } else {
      await sql`UPDATE hospitals SET image_url = ${url} WHERE id = ${h.id as string}`;
    }
    updated++;
  }

  console.log(`\n${dryRun ? "Would update" : "Updated"} ${updated} hospitals with Mapbox static image URLs`);
}

main().catch(console.error);
