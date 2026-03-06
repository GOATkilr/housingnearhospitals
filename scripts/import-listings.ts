/**
 * Import RentCast listings from cached JSON into the Neon database.
 *
 * Reads data/rentcast/{metro}/{zip}.json files, transforms them,
 * deduplicates, and upserts into the listings table.
 *
 * Usage:
 *   npx tsx scripts/import-listings.ts
 *   npx tsx scripts/import-listings.ts --metro nashville-tn
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import * as fs from "fs";
import * as path from "path";
import { neon } from "@neondatabase/serverless";
import {
  transformRentCastListing,
  type RentCastListing,
  type TransformedListing,
} from "./lib/listing-transformer";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Metro slug → metro DB info
const METRO_SLUGS = ["nashville-tn", "houston-tx", "phoenix-az"];

interface ImportStats {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errored: number;
}

async function getMetroIdBySlug(slug: string): Promise<string | null> {
  const rows = await sql`SELECT id FROM metros WHERE slug = ${slug} LIMIT 1`;
  return rows.length > 0 ? (rows[0].id as string) : null;
}

async function upsertListing(listing: TransformedListing, metroId: string): Promise<"created" | "updated" | "skipped"> {
  try {
    const rows = await sql`
      INSERT INTO listings (
        metro_id, external_id, source, source_url, affiliate_url,
        title, property_type, location, address, city, state_code, zip_code,
        bedrooms, bathrooms, sqft, price_monthly,
        is_furnished, lease_min_months, allows_pets, has_parking, has_in_unit_laundry,
        amenities, primary_image_url, image_count, listing_quality_score,
        status, is_verified, available_date
      ) VALUES (
        ${metroId}::uuid,
        ${listing.externalId},
        ${listing.source},
        ${listing.sourceUrl},
        ${listing.affiliateUrl},
        ${listing.title},
        ${listing.propertyType},
        ST_SetSRID(ST_MakePoint(${listing.lng}, ${listing.lat}), 4326)::geography,
        ${listing.address},
        ${listing.city},
        ${listing.stateCode},
        ${listing.zipCode},
        ${listing.bedrooms},
        ${listing.bathrooms},
        ${listing.sqft},
        ${listing.priceMonthly},
        ${listing.isFurnished},
        ${listing.leaseMinMonths},
        ${listing.allowsPets},
        ${listing.hasParking},
        ${listing.hasInUnitLaundry},
        ${JSON.stringify(listing.amenities)}::jsonb,
        ${listing.primaryImageUrl},
        ${listing.imageCount},
        ${listing.listingQualityScore},
        ${listing.status},
        ${listing.isVerified},
        ${listing.availableDate}
      )
      ON CONFLICT (source, external_id) DO UPDATE SET
        title = EXCLUDED.title,
        price_monthly = EXCLUDED.price_monthly,
        affiliate_url = EXCLUDED.affiliate_url,
        listing_quality_score = EXCLUDED.listing_quality_score,
        primary_image_url = EXCLUDED.primary_image_url,
        image_count = EXCLUDED.image_count,
        status = 'active',
        updated_at = NOW()
      RETURNING (xmax = 0) AS is_new
    `;

    if (rows.length === 0) return "skipped";
    return rows[0].is_new ? "created" : "updated";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // If the unique constraint on (source, external_id) doesn't exist yet, fall back
    if (msg.includes("uq_listings_source_external_id")) {
      return "skipped";
    }
    throw err;
  }
}

async function logImport(metro: string, metroId: string | null, stats: ImportStats): Promise<void> {
  try {
    await sql`
      INSERT INTO import_logs (source, entity_type, metro_id, records_total, records_created, records_updated, records_skipped, records_errored, status, completed_at)
      VALUES (
        'rentcast',
        'listing',
        ${metroId}::uuid,
        ${stats.total},
        ${stats.created},
        ${stats.updated},
        ${stats.skipped},
        ${stats.errored},
        'completed',
        NOW()
      )
    `;
  } catch {
    console.warn(`  Warning: Failed to log import for ${metro}`);
  }
}

async function importMetro(metroSlug: string): Promise<ImportStats> {
  const stats: ImportStats = { total: 0, created: 0, updated: 0, skipped: 0, errored: 0 };

  const metroId = await getMetroIdBySlug(metroSlug);
  if (!metroId) {
    console.error(`  Metro not found in DB: ${metroSlug}`);
    return stats;
  }

  const cacheDir = path.join(process.cwd(), "data", "rentcast", metroSlug);
  if (!fs.existsSync(cacheDir)) {
    console.warn(`  No cache directory: ${cacheDir}`);
    return stats;
  }

  const files = fs.readdirSync(cacheDir).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.warn(`  No JSON files in ${cacheDir}`);
    return stats;
  }

  // Collect and deduplicate all listings for this metro
  const seenIds = new Set<string>();
  const allListings: TransformedListing[] = [];

  for (const file of files) {
    const filePath = path.join(cacheDir, file);
    const raw: RentCastListing[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    for (const item of raw) {
      if (!item.id || seenIds.has(item.id)) continue;
      seenIds.add(item.id);

      const transformed = transformRentCastListing(item);
      if (transformed) {
        allListings.push(transformed);
      }
    }
  }

  console.log(`  ${allListings.length} unique listings after dedup (from ${files.length} ZIP files)`);
  stats.total = allListings.length;

  // Upsert each listing
  for (let i = 0; i < allListings.length; i++) {
    try {
      const result = await upsertListing(allListings[i], metroId);
      stats[result]++;
    } catch (err) {
      stats.errored++;
      if (stats.errored <= 5) {
        console.error(`  Error upserting ${allListings[i].externalId}:`, err instanceof Error ? err.message : err);
      }
    }

    // Progress every 50
    if ((i + 1) % 50 === 0) {
      console.log(`  Processed ${i + 1}/${allListings.length}...`);
    }
  }

  await logImport(metroSlug, metroId, stats);
  return stats;
}

async function main() {
  const args = process.argv.slice(2);
  const metroArg = args.find((a) => a.startsWith("--metro"))
    ? args[args.indexOf("--metro") + 1]
    : null;

  const metros = metroArg ? [metroArg] : METRO_SLUGS;

  console.log("=== Import RentCast Listings ===\n");

  const grandTotal: ImportStats = { total: 0, created: 0, updated: 0, skipped: 0, errored: 0 };

  for (const metro of metros) {
    console.log(`\n--- ${metro.toUpperCase()} ---`);
    const stats = await importMetro(metro);
    console.log(`  Results: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped, ${stats.errored} errors`);

    grandTotal.total += stats.total;
    grandTotal.created += stats.created;
    grandTotal.updated += stats.updated;
    grandTotal.skipped += stats.skipped;
    grandTotal.errored += stats.errored;
  }

  console.log(`\n=== IMPORT COMPLETE ===`);
  console.log(`Total: ${grandTotal.total} | Created: ${grandTotal.created} | Updated: ${grandTotal.updated} | Skipped: ${grandTotal.skipped} | Errors: ${grandTotal.errored}`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
