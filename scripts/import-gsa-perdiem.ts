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
 * FY2025/FY2026 GSA Per Diem Rates for all configured metros.
 * Reads from config/metros.json — each metro has a gsa section.
 *
 * Source: https://www.gsa.gov/travel/plan-book/per-diem-rates
 * FY2026 rates = FY2025 (GSA froze rates for cost efficiency).
 * CONUS standard rate: $110/night lodging, $68/day M&IE.
 */
function loadGsaRatesFromConfig(): Array<{
  fiscalYear: number;
  state: string;
  city: string;
  county: string;
  lodgingRate: number;
  mieRate: number;
  isNonStandard: boolean;
  notes: string;
}> {
  const configPath = path.join(process.cwd(), "src", "config", "metros.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const rates: Array<{
    fiscalYear: number;
    state: string;
    city: string;
    county: string;
    lodgingRate: number;
    mieRate: number;
    isNonStandard: boolean;
    notes: string;
  }> = [];

  for (const metro of config.metros) {
    if (metro.tier === "disabled" || !metro.gsa) continue;
    rates.push({
      fiscalYear: 2026,
      state: metro.stateCode,
      city: metro.name.split(",")[0].trim(),
      county: metro.gsa.primaryCounty,
      lodgingRate: metro.gsa.lodgingRate,
      mieRate: metro.gsa.mieRate,
      isNonStandard: metro.gsa.isNonStandard,
      notes: `${metro.name} — ${metro.gsa.isNonStandard ? "Non-standard area" : "CONUS standard"}`,
    });
  }

  return rates;
}

const GSA_RATES = loadGsaRatesFromConfig();

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

  // Show stipend context for first metro
  if (enrichedRates.length > 0) {
    const first = enrichedRates[0];
    console.log(`\n  Stipend context for travel nurses in ${first.city}:`);
    console.log(`    $${first.derived.monthlyLodging}/mo lodging stipend (tax-free)`);
    console.log(`    $${first.derived.monthlyMie}/mo M&IE stipend (tax-free)`);
    console.log(`    $${first.derived.monthlyTotal}/mo total (if agency pays max GSA rates)`);
  }

  console.log("=== Done ===");
}

main().catch(console.error);
