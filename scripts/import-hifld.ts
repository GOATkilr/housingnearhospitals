/**
 * HIFLD Hospital Import Script
 *
 * Downloads the HIFLD hospital dataset from ArcGIS and outputs filtered JSON
 * for all configured metros in config/metros.json.
 *
 * Data source: HIFLD Open Data
 * URL: https://hifld-geoplatform.opendata.arcgis.com/datasets/hospitals
 * API: ArcGIS Feature Service (no authentication required)
 *
 * Usage:
 *   npx tsx scripts/import-hifld.ts
 *   npx tsx scripts/import-hifld.ts --metro nashville-tn
 *
 * Output:
 *   data/hospitals.json — all hospitals for configured metros
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

// ArcGIS Feature Service URL for HIFLD Hospitals
const HIFLD_API_BASE =
  "https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/Hospitals_1/FeatureServer/0/query";

// Load metro bounding boxes from config/metros.json
interface MetroConfigEntry {
  metroId: string;
  slug: string;
  name: string;
  boundingBox: { latMin: number; latMax: number; lngMin: number; lngMax: number };
  tier: string;
}

function loadMetroBounds(): Record<
  string,
  { lat: [number, number]; lng: [number, number]; metroId: string; name: string }
> {
  const configPath = path.join(process.cwd(), "src", "config", "metros.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const bounds: Record<string, { lat: [number, number]; lng: [number, number]; metroId: string; name: string }> = {};

  for (const metro of config.metros as MetroConfigEntry[]) {
    if (metro.tier === "disabled") continue;
    bounds[metro.slug] = {
      lat: [metro.boundingBox.latMin, metro.boundingBox.latMax],
      lng: [metro.boundingBox.lngMin, metro.boundingBox.lngMax],
      metroId: metro.metroId,
      name: metro.name,
    };
  }
  return bounds;
}

const METRO_BOUNDS = loadMetroBounds();

interface HifldFeature {
  attributes: {
    OBJECTID: number;
    ID: string;
    NAME: string;
    ADDRESS: string;
    CITY: string;
    STATE: string;
    ZIP: string;
    TELEPHONE: string;
    TYPE: string;
    STATUS: string;
    BEDS: number;
    TRAUMA: string;
    OWNER: string;
    TTL_STAFF: number;
    HELIPAD: string;
    LATITUDE: number;
    LONGITUDE: number;
    WEBSITE: string;
    NAICS_CODE: string;
    NAICS_DESC: string;
    COUNTY: string;
    COUNTYFIPS: string;
    ST_FIPS: string;
    SOURCE: string;
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function mapHospitalType(hifldType: string): string {
  const typeMap: Record<string, string> = {
    "GENERAL ACUTE CARE": "General Acute Care",
    "CRITICAL ACCESS": "Critical Access",
    "PSYCHIATRIC": "Psychiatric",
    "REHABILITATION": "Rehabilitation",
    "LONG TERM CARE": "Long Term Care",
    "CHILDREN": "Children's",
    "CHILDRENS": "Children's",
    "MILITARY": "Military",
    "WOMEN": "General Acute Care",
    "CHRONIC DISEASE": "General Acute Care",
    "SPECIAL": "General Acute Care",
  };
  return typeMap[hifldType?.toUpperCase()] ?? "General Acute Care";
}

function mapOwnership(hifldOwner: string): string {
  const owner = hifldOwner?.toUpperCase() ?? "";
  if (owner.includes("GOVERNMENT") || owner.includes("STATE") || owner.includes("FEDERAL")) {
    return "Government";
  }
  if (owner.includes("NOT-FOR-PROFIT") || owner.includes("NON-PROFIT") || owner.includes("NONPROFIT")) {
    return "Non-Profit";
  }
  if (owner.includes("PROPRIETARY") || owner.includes("FOR-PROFIT") || owner.includes("FOR PROFIT")) {
    return "For-Profit";
  }
  return "Unknown";
}

async function fetchHifldForBounds(
  metroSlug: string,
  bounds: { lat: [number, number]; lng: [number, number] }
): Promise<HifldFeature[]> {
  // Build spatial query: WHERE LATITUDE BETWEEN x AND y AND LONGITUDE BETWEEN x AND y
  const where = [
    `LATITUDE >= ${bounds.lat[0]}`,
    `LATITUDE <= ${bounds.lat[1]}`,
    `LONGITUDE >= ${bounds.lng[0]}`,
    `LONGITUDE <= ${bounds.lng[1]}`,
    `STATUS <> 'CLOSED'`,
  ].join(" AND ");

  const params = new URLSearchParams({
    where,
    outFields: "*",
    f: "json",
    resultRecordCount: "2000",
  });

  const url = `${HIFLD_API_BASE}?${params}`;
  console.log(`  Fetching HIFLD data for ${metroSlug}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HIFLD API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`HIFLD API error: ${data.error.message}`);
  }

  return data.features ?? [];
}

function transformFeature(
  feature: HifldFeature,
  metroId: string
): Record<string, unknown> {
  const a = feature.attributes;
  return {
    id: `hifld-${a.ID || a.OBJECTID}`,
    hifldId: String(a.ID || a.OBJECTID),
    metroId,
    name: a.NAME,
    slug: slugify(a.NAME),
    address: a.ADDRESS,
    city: a.CITY,
    stateCode: a.STATE,
    zipCode: a.ZIP,
    county: a.COUNTY,
    countyFips: a.COUNTYFIPS,
    phone: a.TELEPHONE && a.TELEPHONE !== "NOT AVAILABLE" ? a.TELEPHONE : null,
    website: a.WEBSITE && a.WEBSITE !== "NOT AVAILABLE" ? a.WEBSITE : null,
    location: {
      lat: a.LATITUDE,
      lng: a.LONGITUDE,
    },
    hospitalType: mapHospitalType(a.TYPE),
    ownership: mapOwnership(a.OWNER),
    bedCount: a.BEDS > 0 ? a.BEDS : null,
    totalStaff: a.TTL_STAFF > 0 ? a.TTL_STAFF : null,
    hasEmergency: true, // Default; will be overridden by CMS merge
    traumaLevel:
      a.TRAUMA && a.TRAUMA !== "NOT AVAILABLE" ? a.TRAUMA : null,
    hasHelipad: a.HELIPAD === "Y",
    naicsCode: a.NAICS_CODE,
    source: a.SOURCE,
    isActive: true,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const metroFilter = args.includes("--metro")
    ? args[args.indexOf("--metro") + 1]
    : null;

  console.log("=== HIFLD Hospital Import ===\n");

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const metros = metroFilter ? [metroFilter] : Object.keys(METRO_BOUNDS);
  const allHospitals: Record<string, unknown>[] = [];
  const summary: Record<string, number> = {};

  for (const metroSlug of metros) {
    const config = METRO_BOUNDS[metroSlug];
    if (!config) {
      console.log(`  Unknown metro: ${metroSlug}, skipping`);
      continue;
    }

    try {
      const features = await fetchHifldForBounds(metroSlug, config);
      console.log(`  ${config.name}: ${features.length} hospitals found`);

      const transformed = features.map((f) =>
        transformFeature(f, config.metroId)
      );

      // Print type breakdown
      const types: Record<string, number> = {};
      for (const h of transformed) {
        const t = h.hospitalType as string;
        types[t] = (types[t] ?? 0) + 1;
      }
      for (const [type, count] of Object.entries(types).sort(
        (a, b) => b[1] - a[1]
      )) {
        console.log(`    ${type}: ${count}`);
      }

      const totalBeds = transformed.reduce(
        (sum, h) => sum + ((h.bedCount as number) ?? 0),
        0
      );
      console.log(`    Total beds: ${totalBeds.toLocaleString()}`);

      allHospitals.push(...transformed);
      summary[metroSlug] = features.length;
    } catch (err) {
      console.error(`  Error fetching ${metroSlug}:`, err);
    }
  }

  // Write combined output
  const outputPath = path.join(DATA_DIR, "hospitals.json");
  fs.writeFileSync(outputPath, JSON.stringify(allHospitals, null, 2));
  console.log(`\nWrote ${allHospitals.length} hospitals to ${outputPath}`);

  // Write summary
  console.log("\n--- Summary ---");
  for (const [metro, count] of Object.entries(summary)) {
    console.log(`  ${metro}: ${count} hospitals`);
  }
  console.log(`  Total: ${allHospitals.length}`);
  console.log("\n=== Done ===");
}

main().catch(console.error);
