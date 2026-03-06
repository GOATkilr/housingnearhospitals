/**
 * Fetch hospitals from HIFLD ArcGIS REST API and insert into database.
 *
 * Dynamically reads active metros from the database, computes bounding boxes
 * from center + radius, fetches hospitals from the HIFLD API, and inserts
 * them directly into the hospitals table.
 *
 * Usage:
 *   npx tsx scripts/fetch-hifld-hospitals.ts
 *   npx tsx scripts/fetch-hifld-hospitals.ts --metro atlanta-ga
 *   npx tsx scripts/fetch-hifld-hospitals.ts --dry-run
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

const API_URL =
  "https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/Hospitals2/FeatureServer/0/query";

interface MetroRow {
  id: string;
  slug: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_miles: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => {
      if (["of", "the", "and", "at", "in", "for"].includes(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ")
    .replace(/^./, (c) => c.toUpperCase());
}

function mapHospitalType(type: string): string {
  const typeMap: Record<string, string> = {
    "GENERAL ACUTE CARE": "General Acute Care",
    "CRITICAL ACCESS": "Critical Access",
    PSYCHIATRIC: "Psychiatric",
    REHABILITATION: "Rehabilitation",
    "LONG TERM CARE": "Long Term Care",
    CHILDREN: "Children's",
    CHILDRENS: "Children's",
    MILITARY: "Military",
    VA: "VA",
  };
  return typeMap[type?.toUpperCase()] ?? "General Acute Care";
}

function mapOwnership(owner: string): string {
  const o = owner?.toUpperCase() ?? "";
  if (o.includes("GOVERNMENT") || o.includes("STATE") || o.includes("FEDERAL"))
    return "Government";
  if (o.includes("NOT-FOR-PROFIT") || o.includes("NON-PROFIT") || o.includes("NONPROFIT"))
    return "Non-Profit";
  if (o.includes("PROPRIETARY") || o.includes("FOR-PROFIT") || o.includes("FOR PROFIT"))
    return "For-Profit";
  return "Unknown";
}

function mapTraumaLevel(trauma: string | null): string | null {
  if (!trauma || trauma === "NOT AVAILABLE" || trauma === "-999") return null;
  const t = trauma.toUpperCase();
  if (t.includes("LEVEL I") && !t.includes("II")) return "Level I";
  if (t.includes("LEVEL II") && !t.includes("III")) return "Level II";
  if (t.includes("LEVEL III") && !t.includes("IV")) return "Level III";
  if (t.includes("LEVEL IV") && !t.includes("V")) return "Level IV";
  if (t.includes("LEVEL V")) return "Level V";
  return null;
}

/** Compute bounding box from center + radius in miles */
function boundingBox(lat: number, lng: number, radiusMiles: number) {
  const latDeg = radiusMiles / 69.0; // ~69 miles per degree latitude
  const lngDeg = radiusMiles / (69.0 * Math.cos((lat * Math.PI) / 180));
  return {
    latMin: lat - latDeg,
    latMax: lat + latDeg,
    lngMin: lng - lngDeg,
    lngMax: lng + lngDeg,
  };
}

async function fetchMetroHospitals(metro: MetroRow) {
  const bounds = boundingBox(metro.center_lat, metro.center_lng, metro.radius_miles);

  const where = `STATUS = 'OPEN' AND LATITUDE >= ${bounds.latMin} AND LATITUDE <= ${bounds.latMax} AND LONGITUDE >= ${bounds.lngMin} AND LONGITUDE <= ${bounds.lngMax}`;

  const params = new URLSearchParams({
    where,
    outFields:
      "NAME,ADDRESS,CITY,STATE,ZIP,COUNTY,TELEPHONE,TYPE,STATUS,BEDS,TRAUMA,OWNER,LATITUDE,LONGITUDE,WEBSITE,NAICS_DESC",
    returnGeometry: "false",
    f: "json",
    resultRecordCount: "1000",
  });

  const url = `${API_URL}?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

  const data = await res.json();
  const features = data.features ?? [];

  return features.map(
    (f: { attributes: Record<string, string | number | null> }) => {
      const a = f.attributes;
      const name = titleCase(String(a.NAME ?? ""));
      const beds = Number(a.BEDS) || null;
      const phone = String(a.TELEPHONE ?? "");
      const website = String(a.WEBSITE ?? "");

      return {
        metroId: metro.id,
        name,
        slug: slugify(name),
        address: titleCase(String(a.ADDRESS ?? "")),
        city: titleCase(String(a.CITY ?? "")),
        stateCode: String(a.STATE ?? ""),
        zipCode: String(a.ZIP ?? "").slice(0, 5),
        county: titleCase(String(a.COUNTY ?? "")),
        phone: phone && phone !== "NOT AVAILABLE" ? phone : null,
        website: website && website !== "NOT AVAILABLE" ? website : null,
        lat: Number(a.LATITUDE),
        lng: Number(a.LONGITUDE),
        hospitalType: mapHospitalType(String(a.TYPE ?? "")),
        ownership: mapOwnership(String(a.OWNER ?? "")),
        bedCount: beds && beds > 0 ? beds : null,
        traumaLevel: mapTraumaLevel(String(a.TRAUMA ?? "")),
      };
    }
  );
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const metroFilter = args.includes("--metro")
    ? args[args.indexOf("--metro") + 1]
    : null;

  console.log("=== HIFLD Hospital Fetcher ===\n");
  if (isDryRun) console.log("  [DRY RUN — no changes will be made]\n");

  // Get active metros from DB
  let metros: MetroRow[];
  if (metroFilter) {
    metros = await sql`
      SELECT id, slug, name,
        ST_Y(center::geometry) AS center_lat,
        ST_X(center::geometry) AS center_lng,
        radius_miles
      FROM metros WHERE slug = ${metroFilter} AND is_active = true
    ` as MetroRow[];
    if (metros.length === 0) {
      console.error(`Metro "${metroFilter}" not found or inactive.`);
      process.exit(1);
    }
  } else {
    metros = await sql`
      SELECT id, slug, name,
        ST_Y(center::geometry) AS center_lat,
        ST_X(center::geometry) AS center_lng,
        radius_miles
      FROM metros WHERE is_active = true ORDER BY name
    ` as MetroRow[];
  }

  console.log(`Found ${metros.length} active metro(s)\n`);

  let totalCreated = 0;
  let totalSkipped = 0;
  let totalErrored = 0;

  for (const metro of metros) {
    console.log(`\n--- ${metro.name} (${metro.slug}) ---`);
    console.log(
      `  Center: ${metro.center_lat.toFixed(4)}, ${metro.center_lng.toFixed(4)} | Radius: ${metro.radius_miles} mi`
    );

    let hospitals;
    try {
      hospitals = await fetchMetroHospitals(metro);
    } catch (err) {
      console.error(`  ERROR fetching from HIFLD:`, err);
      totalErrored++;
      continue;
    }

    // Deduplicate by slug
    const seen = new Set<string>();
    const unique = hospitals.filter(
      (h: { slug: string }) => {
        if (seen.has(h.slug)) return false;
        seen.add(h.slug);
        return true;
      }
    );

    console.log(`  Fetched ${hospitals.length} hospitals (${unique.length} unique)`);

    let created = 0;
    let skipped = 0;

    for (const h of unique) {
      if (isDryRun) {
        console.log(`  [DRY] ${h.name} — ${h.city}, ${h.stateCode}`);
        created++;
        continue;
      }

      try {
        const result = await sql`
          INSERT INTO hospitals (
            metro_id, name, slug, address, city, state_code, zip_code, county,
            phone, website, location, hospital_type, ownership, bed_count,
            trauma_level, has_emergency, is_active, data_source
          ) VALUES (
            ${h.metroId}::uuid,
            ${h.name},
            ${h.slug},
            ${h.address},
            ${h.city},
            ${h.stateCode},
            ${h.zipCode},
            ${h.county},
            ${h.phone},
            ${h.website},
            ST_SetSRID(ST_MakePoint(${h.lng}, ${h.lat}), 4326)::geography,
            ${h.hospitalType},
            ${h.ownership},
            ${h.bedCount},
            ${h.traumaLevel},
            true,
            true,
            'hifld'
          )
          ON CONFLICT (slug, metro_id) DO NOTHING
        `;
        // Check if row was inserted
        const inserted = Array.isArray(result) ? result.length : 0;
        if (inserted === 0) {
          skipped++;
        } else {
          created++;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // Duplicate slug — skip
        if (msg.includes("duplicate") || msg.includes("unique")) {
          skipped++;
        } else {
          console.error(`  ERROR inserting ${h.name}:`, msg);
          totalErrored++;
        }
      }
    }

    console.log(`  Created: ${created} | Skipped: ${skipped}`);
    totalCreated += created;
    totalSkipped += skipped;
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`  Created:  ${totalCreated}`);
  console.log(`  Skipped:  ${totalSkipped}`);
  console.log(`  Errored:  ${totalErrored}`);
  console.log(`  Metros:   ${metros.length}`);

  if (totalCreated > 0 && !isDryRun) {
    console.log("\n=== NEXT STEPS ===");
    console.log("  1. Fetch listings:   npx tsx scripts/fetch-rentcast-listings.ts");
    console.log("  2. Import listings:  npx tsx scripts/import-listings.ts");
    console.log("  3. Calculate scores: npx tsx scripts/calculate-scores.ts");
  }
}

main().catch((err) => {
  console.error("Hospital fetch failed:", err);
  process.exit(1);
});
