/**
 * Hospital Data Ingestion Script
 *
 * Downloads hospital data from HIFLD Open Data and imports into PostgreSQL.
 *
 * Data source: HIFLD Hospitals Dataset
 * URL: https://hifld-geoplatform.opendata.arcgis.com/datasets/hospitals
 * Format: CSV with lat/lng
 *
 * Usage:
 *   npx tsx scripts/seed-hospitals.ts
 *   npx tsx scripts/seed-hospitals.ts --metro nashville-tn
 *   npx tsx scripts/seed-hospitals.ts --metro houston-tx
 *
 * Requires:
 *   DATABASE_URL environment variable
 *   CSV file at data/hospitals.csv (download from HIFLD)
 */

import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";

// Metro bounding boxes for filtering hospitals
const METRO_BOUNDS: Record<string, { lat: [number, number]; lng: [number, number]; metroId: string }> = {
  "nashville-tn": {
    lat: [35.85, 36.45],
    lng: [-87.15, -86.45],
    metroId: "metro-nashville",
  },
  "houston-tx": {
    lat: [29.40, 30.15],
    lng: [-95.85, -94.90],
    metroId: "metro-houston",
  },
  "phoenix-az": {
    lat: [33.15, 33.85],
    lng: [-112.55, -111.55],
    metroId: "metro-phoenix",
  },
};

interface HifldHospitalRow {
  ID: string;
  NAME: string;
  ADDRESS: string;
  CITY: string;
  STATE: string;
  ZIP: string;
  COUNTY: string;
  TELEPHONE: string;
  TYPE: string;
  STATUS: string;
  BEDS: string;
  TRAUMA: string;
  OWNER: string;
  LATITUDE: string;
  LONGITUDE: string;
  WEBSITE?: string;
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
    "VA": "VA",
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

async function main() {
  const args = process.argv.slice(2);
  const metroFilter = args.includes("--metro") ? args[args.indexOf("--metro") + 1] : null;

  const csvPath = path.join(process.cwd(), "data", "hospitals.csv");

  if (!fs.existsSync(csvPath)) {
    console.log("=== Hospital Data Ingestion ===\n");
    console.log("CSV file not found at data/hospitals.csv");
    console.log("\nTo download the HIFLD hospital dataset:");
    console.log("1. Visit: https://hifld-geoplatform.opendata.arcgis.com/datasets/hospitals");
    console.log("2. Click 'Download' → 'Spreadsheet' (CSV)");
    console.log("3. Save as data/hospitals.csv\n");
    console.log("Alternatively, the sample data in src/lib/sample-data.ts");
    console.log("contains real hospital records for development.\n");

    // Create data directory with a README
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(dataDir, "README.md"),
      `# Hospital Data

## Download Instructions

### HIFLD Hospital Dataset (Primary)
1. Visit: https://hifld-geoplatform.opendata.arcgis.com/datasets/hospitals
2. Click "Download" → "Spreadsheet" (CSV)
3. Save as \`hospitals.csv\` in this directory

### CMS Hospital General Information (Supplementary)
1. Visit: https://data.cms.gov/provider-data/dataset/xubh-q36u
2. Download CSV
3. Save as \`cms-hospitals.csv\` in this directory

### CMS Hospital Compare Ratings (Supplementary)
1. Visit: https://data.cms.gov/provider-data/topics/hospitals
2. Download the "Hospital General Information" CSV
3. Save as \`cms-ratings.csv\` in this directory

## Fields Used

From HIFLD:
- NAME, ADDRESS, CITY, STATE, ZIP, COUNTY
- LATITUDE, LONGITUDE (pre-geocoded)
- TYPE, STATUS, BEDS, TRAUMA, OWNER
- TELEPHONE

From CMS:
- Overall hospital rating (1-5 stars)
- Patient experience rating
- Safety rating
- Emergency services (yes/no)
`
    );

    console.log("Created data/README.md with download instructions.");
    return;
  }

  console.log("=== Hospital Data Ingestion ===\n");
  console.log(`Reading ${csvPath}...`);

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as HifldHospitalRow[];

  console.log(`Parsed ${records.length} total hospital records\n`);

  // Filter to active hospitals only
  const activeRecords = records.filter((r) => r.STATUS?.toUpperCase() !== "CLOSED");
  console.log(`${activeRecords.length} active hospitals (excluding closed)\n`);

  // Filter by metro if specified
  const metros = metroFilter ? [metroFilter] : Object.keys(METRO_BOUNDS);

  for (const metroSlug of metros) {
    const bounds = METRO_BOUNDS[metroSlug];
    if (!bounds) {
      console.log(`Unknown metro: ${metroSlug}`);
      continue;
    }

    const metroHospitals = activeRecords.filter((r) => {
      const lat = parseFloat(r.LATITUDE);
      const lng = parseFloat(r.LONGITUDE);
      return (
        lat >= bounds.lat[0] &&
        lat <= bounds.lat[1] &&
        lng >= bounds.lng[0] &&
        lng <= bounds.lng[1]
      );
    });

    console.log(`\n--- ${metroSlug} ---`);
    console.log(`Found ${metroHospitals.length} hospitals in metro area\n`);

    const transformed = metroHospitals.map((row) => ({
      hifld_id: row.ID,
      metro_id: bounds.metroId,
      name: row.NAME,
      slug: slugify(row.NAME),
      address: row.ADDRESS,
      city: row.CITY,
      state_code: row.STATE,
      zip_code: row.ZIP,
      county: row.COUNTY,
      phone: row.TELEPHONE,
      latitude: parseFloat(row.LATITUDE),
      longitude: parseFloat(row.LONGITUDE),
      hospital_type: mapHospitalType(row.TYPE),
      ownership: mapOwnership(row.OWNER),
      bed_count: parseInt(row.BEDS) || null,
      trauma_level: row.TRAUMA && row.TRAUMA !== "NOT AVAILABLE" ? row.TRAUMA : null,
      website: row.WEBSITE || null,
    }));

    // Print summary
    const types: Record<string, number> = {};
    for (const h of transformed) {
      types[h.hospital_type] = (types[h.hospital_type] ?? 0) + 1;
    }
    console.log("By type:");
    for (const [type, count] of Object.entries(types).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${type}: ${count}`);
    }

    const totalBeds = transformed.reduce((sum, h) => sum + (h.bed_count ?? 0), 0);
    console.log(`\nTotal beds: ${totalBeds.toLocaleString()}`);

    // Log sample SQL for reference
    console.log("\nSample INSERT statement:");
    if (transformed.length > 0) {
      const h = transformed[0];
      console.log(`  INSERT INTO hospitals (hifld_id, metro_id, name, slug, address, city, state_code, zip_code, phone, location, hospital_type, ownership, bed_count, trauma_level)`);
      console.log(`  VALUES ('${h.hifld_id}', '${h.metro_id}', '${h.name}', '${h.slug}', '${h.address}', '${h.city}', '${h.state_code}', '${h.zip_code}', '${h.phone}',`);
      console.log(`    ST_SetSRID(ST_MakePoint(${h.longitude}, ${h.latitude}), 4326)::GEOGRAPHY,`);
      console.log(`    '${h.hospital_type}', '${h.ownership}', ${h.bed_count}, ${h.trauma_level ? `'${h.trauma_level}'` : "NULL"});`);
    }

    // Write transformed data to JSON for reference
    const outputPath = path.join(process.cwd(), "data", `hospitals-${metroSlug}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(transformed, null, 2));
    console.log(`\nWrote ${transformed.length} records to ${outputPath}`);
  }

  console.log("\n=== Done ===");
  console.log("\nTo import into PostgreSQL, run the schema first:");
  console.log("  psql $DATABASE_URL -f database/schema.sql");
  console.log("\nThen use the generated JSON files with your preferred import method.");
}

main().catch(console.error);
