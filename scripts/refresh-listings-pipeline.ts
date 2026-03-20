/**
 * Full Listings Pipeline Orchestrator
 *
 * Runs the complete data pipeline in sequence:
 *   1. Fetch listings from RentCast API (cached)
 *   2. Import/upsert into database
 *   3. Calculate proximity scores
 *   4. Expire stale listings (>90 days without update)
 *   5. Fetch market data from RentCast (cached)
 *
 * Usage:
 *   npx tsx scripts/refresh-listings-pipeline.ts
 *   npx tsx scripts/refresh-listings-pipeline.ts --metro nashville-tn
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { execSync } from "child_process";

const args = process.argv.slice(2).join(" ");

function run(label: string, command: string): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`STEP: ${label}`);
  console.log(`${"=".repeat(60)}\n`);

  const start = Date.now();
  try {
    execSync(command, { stdio: "inherit", cwd: process.cwd() });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n[OK] ${label} completed in ${elapsed}s`);
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`\n[FAIL] ${label} failed after ${elapsed}s`);
    throw err;
  }
}

async function expireStaleListings(): Promise<void> {
  console.log(`\n${"=".repeat(60)}`);
  console.log("STEP: Expire stale listings (>90 days)");
  console.log(`${"=".repeat(60)}\n`);

  const { neon } = await import("@neondatabase/serverless");
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.log("  Skipping — no DATABASE_URL");
    return;
  }

  const sql = neon(DATABASE_URL);

  const result = await sql`
    UPDATE listings
    SET status = 'expired', updated_at = NOW()
    WHERE source = 'rentcast'
      AND status = 'active'
      AND updated_at < NOW() - INTERVAL '90 days'
    RETURNING id
  `;

  console.log(`  Expired ${result.length} stale listings.`);
}

async function showSummary(): Promise<void> {
  const { neon } = await import("@neondatabase/serverless");
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) return;

  const sql = neon(DATABASE_URL);

  const [listings, scores, byMetro] = await Promise.all([
    sql`SELECT count(*)::int AS total, count(*) FILTER (WHERE source = 'rentcast')::int AS rentcast FROM listings WHERE status = 'active' AND deleted_at IS NULL`,
    sql`SELECT count(*)::int AS total FROM hospital_listing_scores`,
    sql`SELECT m.slug, count(l.id)::int AS listings FROM metros m LEFT JOIN listings l ON l.metro_id = m.id AND l.status = 'active' AND l.deleted_at IS NULL WHERE m.is_active = true GROUP BY m.slug ORDER BY m.slug`,
  ]);

  console.log(`\n${"=".repeat(60)}`);
  console.log("PIPELINE SUMMARY");
  console.log(`${"=".repeat(60)}`);
  console.log(`Active listings: ${listings[0].total} (${listings[0].rentcast} from RentCast)`);
  console.log(`Score pairs: ${scores[0].total}`);
  console.log(`By metro:`);
  for (const row of byMetro) {
    console.log(`  ${row.slug}: ${row.listings} listings`);
  }
}

async function main() {
  const start = Date.now();
  console.log("=== LISTINGS PIPELINE ===");
  console.log(`Started at ${new Date().toISOString()}\n`);

  const metroFlag = args ? ` ${args}` : "";

  // Step 1: Fetch from RentCast
  run("Fetch RentCast listings", `npx tsx scripts/fetch-rentcast-listings.ts${metroFlag}`);

  // Step 2: Import into database
  run("Import listings to database", `npx tsx scripts/import-listings.ts${metroFlag}`);

  // Step 3: Calculate scores
  run("Calculate proximity scores", `npx tsx scripts/calculate-scores.ts${metroFlag}`);

  // Step 4: Expire stale
  await expireStaleListings();

  // Step 5: Fetch market data
  run("Fetch market data", `npx tsx scripts/fetch-market-data.ts${metroFlag}`);

  // Summary
  await showSummary();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nPipeline finished in ${elapsed}s`);
}

main().catch((err) => {
  console.error("\nPipeline failed:", err);
  process.exit(1);
});
