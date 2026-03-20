/**
 * Listing Image Audit
 *
 * Reports how many listings have primary_image_url populated vs null,
 * and HEAD-checks a sample of URLs for validity.
 *
 * Usage:
 *   npx tsx scripts/audit-listing-images.ts
 */

import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  // Count totals
  const [totals] = await sql`
    SELECT
      COUNT(*) AS total,
      COUNT(primary_image_url) AS with_image,
      COUNT(*) - COUNT(primary_image_url) AS without_image
    FROM listings
    WHERE status = 'active' AND deleted_at IS NULL
  `;

  console.log("\n=== Listing Image Audit ===");
  console.log(`Total active listings: ${totals.total}`);
  console.log(`With image URL:        ${totals.with_image} (${((Number(totals.with_image) / Number(totals.total)) * 100).toFixed(1)}%)`);
  console.log(`Without image URL:     ${totals.without_image} (${((Number(totals.without_image) / Number(totals.total)) * 100).toFixed(1)}%)`);

  // Sample up to 20 image URLs and HEAD-check them
  const sample = await sql`
    SELECT id, primary_image_url
    FROM listings
    WHERE status = 'active' AND deleted_at IS NULL AND primary_image_url IS NOT NULL
    ORDER BY RANDOM()
    LIMIT 20
  `;

  if (sample.length === 0) {
    console.log("\nNo image URLs to check.");
    return;
  }

  console.log(`\n=== HEAD-checking ${sample.length} sample URLs ===`);
  let ok = 0;
  let broken = 0;

  for (const row of sample) {
    try {
      const res = await fetch(row.primary_image_url as string, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        ok++;
      } else {
        broken++;
        console.log(`  BROKEN (${res.status}): ${(row.primary_image_url as string).slice(0, 80)}`);
      }
    } catch {
      broken++;
      console.log(`  ERROR: ${(row.primary_image_url as string).slice(0, 80)}`);
    }
  }

  console.log(`\nResults: ${ok} OK, ${broken} broken out of ${sample.length} sampled`);
}

main().catch(console.error);
