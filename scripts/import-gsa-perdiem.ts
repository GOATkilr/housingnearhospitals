/**
 * GSA Per Diem Rate Import Script
 *
 * Downloads GSA lodging and M&IE rates for our launch metro areas.
 * These rates are the basis for travel nurse housing stipend calculations.
 *
 * Data source: GSA Per Diem API
 * URL: https://www.gsa.gov/travel/plan-book/per-diem-rates
 * API: https://api.gsa.gov/travel/perdiem/v2/
 *
 * The GSA API is free and requires an API key (register at api.data.gov).
 * For the MVP, we use hardcoded FY2026 rates from the GSA website since
 * FY2026 rates = FY2025 rates (GSA froze rates for cost efficiency).
 *
 * Usage:
 *   npx tsx scripts/import-gsa-perdiem.ts
 *
 * Output:
 *   data/gsa-perdiem.json
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

/**
 * FY2025/FY2026 GSA Per Diem Rates for our launch metros.
 *
 * Source: https://www.gsa.gov/travel/plan-book/per-diem-rates
 * Looked up 2024-10 through 2025-09 (FY2025) for each metro.
 * FY2026 rates are identical per GSA announcement.
 *
 * CONUS standard rate: $110/night lodging, $68/day M&IE
 * Non-standard areas have higher rates.
 */
const GSA_RATES = [
  // Nashville, TN — Davidson County
  {
    fiscalYear: 2026,
    state: "TN",
    city: "Nashville",
    county: "Davidson",
    lodgingRate: 164, // Non-standard area — higher than $110
    mieRate: 74,
    isNonStandard: true,
    notes: "Nashville is a designated non-standard area (NSA)",
  },
  // Also include Williamson County (Franklin, south of Nashville)
  {
    fiscalYear: 2026,
    state: "TN",
    city: "Franklin",
    county: "Williamson",
    lodgingRate: 164,
    mieRate: 74,
    isNonStandard: true,
    notes: "Part of Nashville NSA",
  },

  // Houston, TX — Harris County
  {
    fiscalYear: 2026,
    state: "TX",
    city: "Houston",
    county: "Harris",
    lodgingRate: 138,
    mieRate: 74,
    isNonStandard: true,
    notes: "Houston is a designated non-standard area (NSA)",
  },
  // Fort Bend County (Sugar Land, southwest of Houston)
  {
    fiscalYear: 2026,
    state: "TX",
    city: "Sugar Land",
    county: "Fort Bend",
    lodgingRate: 138,
    mieRate: 74,
    isNonStandard: true,
    notes: "Part of Houston NSA",
  },

  // Phoenix, AZ — Maricopa County
  {
    fiscalYear: 2026,
    state: "AZ",
    city: "Phoenix",
    county: "Maricopa",
    lodgingRate: 158,
    mieRate: 74,
    isNonStandard: true,
    notes: "Phoenix/Scottsdale is a designated non-standard area",
  },
  // Scottsdale is in Maricopa but sometimes listed separately
  {
    fiscalYear: 2026,
    state: "AZ",
    city: "Scottsdale",
    county: "Maricopa",
    lodgingRate: 158,
    mieRate: 74,
    isNonStandard: true,
    notes: "Part of Phoenix NSA",
  },
];

/**
 * Compute derived stipend values used in the Stipend Fit Score.
 */
function enrichRate(rate: (typeof GSA_RATES)[number]) {
  const monthlyLodging = rate.lodgingRate * 30;
  const monthlyMie = rate.mieRate * 30;
  const monthlyTotal = monthlyLodging + monthlyMie;
  const annualTotal = monthlyTotal * 12;
  const weeklyLodging = rate.lodgingRate * 7;

  return {
    ...rate,
    derived: {
      monthlyLodging,
      monthlyMie,
      monthlyTotal,
      annualTotal,
      weeklyLodging,
      dailyTotal: rate.lodgingRate + rate.mieRate,
    },
  };
}

async function main() {
  console.log("=== GSA Per Diem Rate Import ===\n");

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const enrichedRates = GSA_RATES.map(enrichRate);

  // Print summary
  for (const rate of enrichedRates) {
    console.log(`  ${rate.city}, ${rate.state} (${rate.county} County)`);
    console.log(`    Lodging: $${rate.lodgingRate}/night ($${rate.derived.monthlyLodging}/mo)`);
    console.log(`    M&IE:    $${rate.mieRate}/day ($${rate.derived.monthlyMie}/mo)`);
    console.log(`    Total:   $${rate.derived.dailyTotal}/day ($${rate.derived.monthlyTotal}/mo)`);
    console.log(`    ${rate.isNonStandard ? "Non-standard area (higher than CONUS default)" : "CONUS standard rate"}`);
    console.log();
  }

  // Also include CONUS standard for reference
  const output = {
    fiscalYear: 2026,
    effectiveDate: "2025-10-01",
    endDate: "2026-09-30",
    conusStandard: {
      lodgingRate: 110,
      mieRate: 68,
      monthlyLodging: 110 * 30,
      monthlyMie: 68 * 30,
      monthlyTotal: (110 + 68) * 30,
    },
    metroRates: enrichedRates,
    lookupByState: {} as Record<string, Record<string, (typeof enrichedRates)[number]>>,
  };

  // Build lookup index: state → county → rate
  for (const rate of enrichedRates) {
    if (!output.lookupByState[rate.state]) {
      output.lookupByState[rate.state] = {};
    }
    output.lookupByState[rate.state][rate.county] = rate;
  }

  const outputPath = path.join(DATA_DIR, "gsa-perdiem.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Wrote GSA per diem rates to ${outputPath}`);

  console.log("\n  Stipend context for travel nurses:");
  console.log("  A nurse in Nashville could receive up to:");
  const nash = enrichedRates.find((r) => r.city === "Nashville")!;
  console.log(`    $${nash.derived.monthlyLodging}/mo lodging stipend (tax-free)`);
  console.log(`    $${nash.derived.monthlyMie}/mo M&IE stipend (tax-free)`);
  console.log(`    $${nash.derived.monthlyTotal}/mo total (if agency pays max GSA rates)`);
  console.log(`  A $1,500/mo apartment would save ~$${nash.derived.monthlyLodging - 1500}/mo vs stipend\n`);

  console.log("=== Done ===");
}

main().catch(console.error);
