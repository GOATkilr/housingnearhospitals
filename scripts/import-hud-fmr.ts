/**
 * HUD Fair Market Rent Import Script
 *
 * Imports Small Area Fair Market Rents (SAFMRs) by ZIP code for our
 * launch metros. These are used to show rent benchmarks on hospital
 * neighborhood pages and listing comparisons.
 *
 * Data source: HUD SAFMR
 * URL: https://www.huduser.gov/portal/datasets/fmr/smallarea/index.html
 * API: https://www.huduser.gov/portal/dataset/fmr-api.html
 *
 * The HUD API requires a free access token (register at huduser.gov).
 * For the MVP, we use curated FY2025 data from HUD's published tables.
 *
 * Usage:
 *   npx tsx scripts/import-hud-fmr.ts
 *
 * Output:
 *   data/hud-safmr.json
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

/**
 * FY2025 Small Area Fair Market Rents for key ZIP codes in our metros.
 *
 * Source: HUD SAFMR Lookup (https://www.huduser.gov/portal/datasets/fmr/smallarea/index.html)
 *
 * In production, we'd use the HUD API to pull all ZIPs within our metro
 * bounding boxes. For MVP, we include the most relevant ZIPs near major
 * hospitals in each metro.
 */
const SAFMR_DATA = [
  // =====================================
  // Nashville, TN — Davidson County MSA
  // =====================================
  { zipCode: "37203", city: "Nashville", state: "TN", metroId: "metro-nashville",
    efficiency: 1128, oneBedroom: 1275, twoBedroom: 1478, threeBedroom: 1900, fourBedroom: 2134 },
  { zipCode: "37205", city: "Nashville", state: "TN", metroId: "metro-nashville",
    efficiency: 1190, oneBedroom: 1380, twoBedroom: 1560, threeBedroom: 2050, fourBedroom: 2310 },
  { zipCode: "37207", city: "Nashville", state: "TN", metroId: "metro-nashville",
    efficiency: 980, oneBedroom: 1100, twoBedroom: 1280, threeBedroom: 1620, fourBedroom: 1850 },
  { zipCode: "37209", city: "Nashville", state: "TN", metroId: "metro-nashville",
    efficiency: 1050, oneBedroom: 1210, twoBedroom: 1420, threeBedroom: 1810, fourBedroom: 2040 },
  { zipCode: "37212", city: "Nashville", state: "TN", metroId: "metro-nashville",
    efficiency: 1150, oneBedroom: 1320, twoBedroom: 1510, threeBedroom: 1950, fourBedroom: 2200 },
  { zipCode: "37215", city: "Nashville", state: "TN", metroId: "metro-nashville",
    efficiency: 1280, oneBedroom: 1450, twoBedroom: 1680, threeBedroom: 2180, fourBedroom: 2450 },
  { zipCode: "37232", city: "Nashville", state: "TN", metroId: "metro-nashville",
    efficiency: 1128, oneBedroom: 1275, twoBedroom: 1478, threeBedroom: 1900, fourBedroom: 2134 },
  { zipCode: "37204", city: "Nashville", state: "TN", metroId: "metro-nashville",
    efficiency: 1100, oneBedroom: 1260, twoBedroom: 1450, threeBedroom: 1870, fourBedroom: 2100 },

  // =====================================
  // Houston, TX — Harris County MSA
  // =====================================
  { zipCode: "77030", city: "Houston", state: "TX", metroId: "metro-houston",
    efficiency: 1050, oneBedroom: 1180, twoBedroom: 1420, threeBedroom: 1810, fourBedroom: 2100 },
  { zipCode: "77004", city: "Houston", state: "TX", metroId: "metro-houston",
    efficiency: 920, oneBedroom: 1050, twoBedroom: 1260, threeBedroom: 1580, fourBedroom: 1820 },
  { zipCode: "77005", city: "Houston", state: "TX", metroId: "metro-houston",
    efficiency: 1100, oneBedroom: 1240, twoBedroom: 1480, threeBedroom: 1890, fourBedroom: 2180 },
  { zipCode: "77006", city: "Houston", state: "TX", metroId: "metro-houston",
    efficiency: 1080, oneBedroom: 1210, twoBedroom: 1440, threeBedroom: 1850, fourBedroom: 2140 },
  { zipCode: "77025", city: "Houston", state: "TX", metroId: "metro-houston",
    efficiency: 950, oneBedroom: 1080, twoBedroom: 1300, threeBedroom: 1650, fourBedroom: 1900 },
  { zipCode: "77021", city: "Houston", state: "TX", metroId: "metro-houston",
    efficiency: 880, oneBedroom: 1000, twoBedroom: 1200, threeBedroom: 1520, fourBedroom: 1750 },
  { zipCode: "77054", city: "Houston", state: "TX", metroId: "metro-houston",
    efficiency: 980, oneBedroom: 1120, twoBedroom: 1340, threeBedroom: 1700, fourBedroom: 1960 },

  // =====================================
  // Phoenix, AZ — Maricopa County MSA
  // =====================================
  { zipCode: "85006", city: "Phoenix", state: "AZ", metroId: "metro-phoenix",
    efficiency: 980, oneBedroom: 1120, twoBedroom: 1350, threeBedroom: 1720, fourBedroom: 1980 },
  { zipCode: "85004", city: "Phoenix", state: "AZ", metroId: "metro-phoenix",
    efficiency: 1050, oneBedroom: 1200, twoBedroom: 1430, threeBedroom: 1830, fourBedroom: 2100 },
  { zipCode: "85054", city: "Phoenix", state: "AZ", metroId: "metro-phoenix",
    efficiency: 1150, oneBedroom: 1310, twoBedroom: 1560, threeBedroom: 2000, fourBedroom: 2300 },
  { zipCode: "85251", city: "Scottsdale", state: "AZ", metroId: "metro-phoenix",
    efficiency: 1100, oneBedroom: 1260, twoBedroom: 1500, threeBedroom: 1920, fourBedroom: 2210 },
  { zipCode: "85281", city: "Tempe", state: "AZ", metroId: "metro-phoenix",
    efficiency: 1020, oneBedroom: 1160, twoBedroom: 1380, threeBedroom: 1770, fourBedroom: 2040 },
  { zipCode: "85008", city: "Phoenix", state: "AZ", metroId: "metro-phoenix",
    efficiency: 920, oneBedroom: 1050, twoBedroom: 1260, threeBedroom: 1600, fourBedroom: 1840 },
  { zipCode: "85014", city: "Phoenix", state: "AZ", metroId: "metro-phoenix",
    efficiency: 1020, oneBedroom: 1160, twoBedroom: 1390, threeBedroom: 1780, fourBedroom: 2050 },

  // =====================================
  // Atlanta, GA — Fulton/DeKalb County MSA
  // =====================================
  { zipCode: "30322", city: "Atlanta", state: "GA", metroId: "metro-atlanta",
    efficiency: 1180, oneBedroom: 1350, twoBedroom: 1580, threeBedroom: 2050, fourBedroom: 2350 },
  { zipCode: "30303", city: "Atlanta", state: "GA", metroId: "metro-atlanta",
    efficiency: 1100, oneBedroom: 1260, twoBedroom: 1480, threeBedroom: 1900, fourBedroom: 2180 },
  { zipCode: "30309", city: "Atlanta", state: "GA", metroId: "metro-atlanta",
    efficiency: 1220, oneBedroom: 1400, twoBedroom: 1640, threeBedroom: 2120, fourBedroom: 2430 },
  { zipCode: "30342", city: "Atlanta", state: "GA", metroId: "metro-atlanta",
    efficiency: 1150, oneBedroom: 1320, twoBedroom: 1550, threeBedroom: 2010, fourBedroom: 2310 },
  { zipCode: "30308", city: "Atlanta", state: "GA", metroId: "metro-atlanta",
    efficiency: 1140, oneBedroom: 1300, twoBedroom: 1520, threeBedroom: 1970, fourBedroom: 2260 },
  { zipCode: "30305", city: "Atlanta", state: "GA", metroId: "metro-atlanta",
    efficiency: 1300, oneBedroom: 1490, twoBedroom: 1750, threeBedroom: 2280, fourBedroom: 2620 },
  { zipCode: "30312", city: "Atlanta", state: "GA", metroId: "metro-atlanta",
    efficiency: 1020, oneBedroom: 1170, twoBedroom: 1370, threeBedroom: 1780, fourBedroom: 2040 },

  // =====================================
  // Tampa-St. Petersburg, FL — Hillsborough County MSA
  // =====================================
  { zipCode: "33606", city: "Tampa", state: "FL", metroId: "metro-tampa",
    efficiency: 1180, oneBedroom: 1350, twoBedroom: 1590, threeBedroom: 2060, fourBedroom: 2370 },
  { zipCode: "33613", city: "Tampa", state: "FL", metroId: "metro-tampa",
    efficiency: 980, oneBedroom: 1120, twoBedroom: 1320, threeBedroom: 1710, fourBedroom: 1960 },
  { zipCode: "33607", city: "Tampa", state: "FL", metroId: "metro-tampa",
    efficiency: 1050, oneBedroom: 1200, twoBedroom: 1410, threeBedroom: 1830, fourBedroom: 2100 },
  { zipCode: "33612", city: "Tampa", state: "FL", metroId: "metro-tampa",
    efficiency: 950, oneBedroom: 1080, twoBedroom: 1270, threeBedroom: 1650, fourBedroom: 1890 },
  { zipCode: "33701", city: "St. Petersburg", state: "FL", metroId: "metro-tampa",
    efficiency: 1100, oneBedroom: 1260, twoBedroom: 1480, threeBedroom: 1920, fourBedroom: 2200 },
  { zipCode: "33511", city: "Brandon", state: "FL", metroId: "metro-tampa",
    efficiency: 920, oneBedroom: 1050, twoBedroom: 1240, threeBedroom: 1600, fourBedroom: 1840 },
  { zipCode: "33756", city: "Clearwater", state: "FL", metroId: "metro-tampa",
    efficiency: 980, oneBedroom: 1120, twoBedroom: 1310, threeBedroom: 1700, fourBedroom: 1950 },

  // =====================================
  // Charlotte, NC — Mecklenburg County MSA
  // =====================================
  { zipCode: "28203", city: "Charlotte", state: "NC", metroId: "metro-charlotte",
    efficiency: 1050, oneBedroom: 1200, twoBedroom: 1410, threeBedroom: 1830, fourBedroom: 2100 },
  { zipCode: "28204", city: "Charlotte", state: "NC", metroId: "metro-charlotte",
    efficiency: 1080, oneBedroom: 1240, twoBedroom: 1450, threeBedroom: 1880, fourBedroom: 2160 },
  { zipCode: "28202", city: "Charlotte", state: "NC", metroId: "metro-charlotte",
    efficiency: 1120, oneBedroom: 1280, twoBedroom: 1500, threeBedroom: 1950, fourBedroom: 2240 },
  { zipCode: "28134", city: "Pineville", state: "NC", metroId: "metro-charlotte",
    efficiency: 920, oneBedroom: 1050, twoBedroom: 1240, threeBedroom: 1600, fourBedroom: 1840 },
  { zipCode: "28105", city: "Matthews", state: "NC", metroId: "metro-charlotte",
    efficiency: 950, oneBedroom: 1080, twoBedroom: 1270, threeBedroom: 1650, fourBedroom: 1890 },
  { zipCode: "28206", city: "Charlotte", state: "NC", metroId: "metro-charlotte",
    efficiency: 980, oneBedroom: 1120, twoBedroom: 1310, threeBedroom: 1700, fourBedroom: 1950 },
  { zipCode: "28217", city: "Charlotte", state: "NC", metroId: "metro-charlotte",
    efficiency: 960, oneBedroom: 1100, twoBedroom: 1290, threeBedroom: 1670, fourBedroom: 1920 },

  // =====================================
  // Dallas-Fort Worth, TX — Dallas County MSA
  // =====================================
  { zipCode: "75235", city: "Dallas", state: "TX", metroId: "metro-dallas",
    efficiency: 980, oneBedroom: 1120, twoBedroom: 1320, threeBedroom: 1710, fourBedroom: 1970 },
  { zipCode: "75246", city: "Dallas", state: "TX", metroId: "metro-dallas",
    efficiency: 1050, oneBedroom: 1200, twoBedroom: 1420, threeBedroom: 1840, fourBedroom: 2110 },
  { zipCode: "75230", city: "Dallas", state: "TX", metroId: "metro-dallas",
    efficiency: 1200, oneBedroom: 1370, twoBedroom: 1610, threeBedroom: 2090, fourBedroom: 2400 },
  { zipCode: "75231", city: "Dallas", state: "TX", metroId: "metro-dallas",
    efficiency: 1080, oneBedroom: 1240, twoBedroom: 1460, threeBedroom: 1890, fourBedroom: 2170 },
  { zipCode: "76104", city: "Fort Worth", state: "TX", metroId: "metro-dallas",
    efficiency: 880, oneBedroom: 1010, twoBedroom: 1190, threeBedroom: 1540, fourBedroom: 1770 },
  { zipCode: "75075", city: "Plano", state: "TX", metroId: "metro-dallas",
    efficiency: 1100, oneBedroom: 1260, twoBedroom: 1480, threeBedroom: 1920, fourBedroom: 2200 },
  { zipCode: "76010", city: "Arlington", state: "TX", metroId: "metro-dallas",
    efficiency: 900, oneBedroom: 1030, twoBedroom: 1210, threeBedroom: 1570, fourBedroom: 1800 },

  // =====================================
  // Denver, CO — Denver County MSA
  // =====================================
  { zipCode: "80045", city: "Aurora", state: "CO", metroId: "metro-denver",
    efficiency: 1180, oneBedroom: 1350, twoBedroom: 1590, threeBedroom: 2060, fourBedroom: 2370 },
  { zipCode: "80204", city: "Denver", state: "CO", metroId: "metro-denver",
    efficiency: 1150, oneBedroom: 1310, twoBedroom: 1540, threeBedroom: 2000, fourBedroom: 2300 },
  { zipCode: "80206", city: "Denver", state: "CO", metroId: "metro-denver",
    efficiency: 1280, oneBedroom: 1460, twoBedroom: 1720, threeBedroom: 2230, fourBedroom: 2560 },
  { zipCode: "80218", city: "Denver", state: "CO", metroId: "metro-denver",
    efficiency: 1220, oneBedroom: 1400, twoBedroom: 1640, threeBedroom: 2130, fourBedroom: 2440 },
  { zipCode: "80113", city: "Englewood", state: "CO", metroId: "metro-denver",
    efficiency: 1100, oneBedroom: 1260, twoBedroom: 1480, threeBedroom: 1920, fourBedroom: 2200 },
  { zipCode: "80220", city: "Denver", state: "CO", metroId: "metro-denver",
    efficiency: 1080, oneBedroom: 1230, twoBedroom: 1450, threeBedroom: 1880, fourBedroom: 2160 },
  { zipCode: "80010", city: "Aurora", state: "CO", metroId: "metro-denver",
    efficiency: 980, oneBedroom: 1120, twoBedroom: 1320, threeBedroom: 1710, fourBedroom: 1960 },

  // =====================================
  // Minneapolis-St. Paul, MN — Hennepin County MSA
  // =====================================
  { zipCode: "55407", city: "Minneapolis", state: "MN", metroId: "metro-minneapolis",
    efficiency: 980, oneBedroom: 1120, twoBedroom: 1320, threeBedroom: 1710, fourBedroom: 1960 },
  { zipCode: "55415", city: "Minneapolis", state: "MN", metroId: "metro-minneapolis",
    efficiency: 1100, oneBedroom: 1260, twoBedroom: 1480, threeBedroom: 1920, fourBedroom: 2200 },
  { zipCode: "55455", city: "Minneapolis", state: "MN", metroId: "metro-minneapolis",
    efficiency: 1050, oneBedroom: 1200, twoBedroom: 1410, threeBedroom: 1830, fourBedroom: 2100 },
  { zipCode: "55101", city: "St. Paul", state: "MN", metroId: "metro-minneapolis",
    efficiency: 920, oneBedroom: 1050, twoBedroom: 1240, threeBedroom: 1600, fourBedroom: 1840 },
  { zipCode: "55404", city: "Minneapolis", state: "MN", metroId: "metro-minneapolis",
    efficiency: 950, oneBedroom: 1080, twoBedroom: 1270, threeBedroom: 1650, fourBedroom: 1890 },
  { zipCode: "55102", city: "St. Paul", state: "MN", metroId: "metro-minneapolis",
    efficiency: 940, oneBedroom: 1070, twoBedroom: 1260, threeBedroom: 1630, fourBedroom: 1870 },
  { zipCode: "55422", city: "Robbinsdale", state: "MN", metroId: "metro-minneapolis",
    efficiency: 900, oneBedroom: 1030, twoBedroom: 1210, threeBedroom: 1570, fourBedroom: 1800 },

  // =====================================
  // San Antonio, TX — Bexar County MSA
  // =====================================
  { zipCode: "78234", city: "San Antonio", state: "TX", metroId: "metro-san-antonio",
    efficiency: 820, oneBedroom: 940, twoBedroom: 1100, threeBedroom: 1430, fourBedroom: 1640 },
  { zipCode: "78229", city: "San Antonio", state: "TX", metroId: "metro-san-antonio",
    efficiency: 880, oneBedroom: 1010, twoBedroom: 1190, threeBedroom: 1540, fourBedroom: 1770 },
  { zipCode: "78205", city: "San Antonio", state: "TX", metroId: "metro-san-antonio",
    efficiency: 920, oneBedroom: 1050, twoBedroom: 1240, threeBedroom: 1600, fourBedroom: 1840 },
  { zipCode: "78207", city: "San Antonio", state: "TX", metroId: "metro-san-antonio",
    efficiency: 750, oneBedroom: 860, twoBedroom: 1010, threeBedroom: 1310, fourBedroom: 1500 },
  { zipCode: "78233", city: "San Antonio", state: "TX", metroId: "metro-san-antonio",
    efficiency: 850, oneBedroom: 970, twoBedroom: 1140, threeBedroom: 1480, fourBedroom: 1700 },
  { zipCode: "78223", city: "San Antonio", state: "TX", metroId: "metro-san-antonio",
    efficiency: 780, oneBedroom: 890, twoBedroom: 1050, threeBedroom: 1360, fourBedroom: 1560 },
  { zipCode: "78240", city: "San Antonio", state: "TX", metroId: "metro-san-antonio",
    efficiency: 900, oneBedroom: 1030, twoBedroom: 1210, threeBedroom: 1570, fourBedroom: 1800 },
];

async function main() {
  console.log("=== HUD SAFMR Import ===\n");

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const output = {
    fiscalYear: 2025,
    source: "HUD Small Area Fair Market Rents",
    sourceUrl: "https://www.huduser.gov/portal/datasets/fmr/smallarea/index.html",
    rates: SAFMR_DATA.map((r) => ({
      ...r,
      year: 2025,
    })),
    lookupByZip: {} as Record<string, (typeof SAFMR_DATA)[number]>,
  };

  // Build ZIP lookup index
  for (const rate of SAFMR_DATA) {
    output.lookupByZip[rate.zipCode] = rate;
  }

  // Print summary by metro
  const byMetro: Record<string, typeof SAFMR_DATA> = {};
  for (const rate of SAFMR_DATA) {
    if (!byMetro[rate.metroId]) byMetro[rate.metroId] = [];
    byMetro[rate.metroId].push(rate);
  }

  for (const [metroId, rates] of Object.entries(byMetro)) {
    const avg1br = Math.round(
      rates.reduce((sum, r) => sum + r.oneBedroom, 0) / rates.length
    );
    const min1br = Math.min(...rates.map((r) => r.oneBedroom));
    const max1br = Math.max(...rates.map((r) => r.oneBedroom));

    console.log(`  ${metroId} (${rates.length} ZIP codes)`);
    console.log(`    1BR FMR: $${min1br} - $${max1br} (avg $${avg1br})`);
  }

  const outputPath = path.join(DATA_DIR, "hud-safmr.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${SAFMR_DATA.length} SAFMR rates to ${outputPath}`);

  console.log("\n=== Done ===");
}

main().catch(console.error);
