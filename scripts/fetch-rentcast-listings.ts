/**
 * Fetch rental listings from RentCast API by ZIP code.
 *
 * Caches raw JSON to data/rentcast/{metro}/{zip}.json to avoid repeat API calls.
 * RentCast free tier: 50 calls/month, up to 500 results per call.
 *
 * SAFETY: Hard cap at 25 API calls per run (half the monthly quota).
 * Cached responses (< 7 days old) don't count toward this cap.
 *
 * Usage:
 *   npx tsx scripts/fetch-rentcast-listings.ts
 *   npx tsx scripts/fetch-rentcast-listings.ts --metro nashville-tn
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import * as fs from "fs";
import * as path from "path";

const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY;
if (!RENTCAST_API_KEY) {
  console.error("RENTCAST_API_KEY is not set. Add it to .env.local or your environment.");
  process.exit(1);
}

const RENTCAST_BASE = "https://api.rentcast.io/v1/listings/rental/long-term";
const CACHE_MAX_AGE_DAYS = 7;
const API_CALL_LIMIT = 25; // Hard cap per run — half the monthly free tier quota

// Strategic ZIPs near hospital clusters per metro
const METRO_ZIPS: Record<string, string[]> = {
  // Original 3 metros
  "nashville-tn": ["37203", "37212", "37209", "37232", "37204", "37215", "37206", "37208"],
  "houston-tx": ["77030", "77054", "77021", "77004", "77025", "77005", "77002", "77019"],
  "phoenix-az": ["85006", "85008", "85054", "85251", "85016", "85014", "85004", "85013"],

  // Wave 2 metros — ZIPs near major hospital clusters
  "atlanta-ga": ["30322", "30303", "30308", "30342", "30309", "30324"],
  "dallas-tx": ["75235", "75390", "75246", "75231", "75230", "75204"],
  "denver-co": ["80204", "80218", "80220", "80045", "80210", "80206"],
  "chicago-il": ["60612", "60611", "60637", "60615", "60622", "60614"],
  "los-angeles-ca": ["90033", "90024", "90027", "90048", "90095", "90057"],
  "san-francisco-ca": ["94122", "94143", "94115", "94110", "94103", "94158"],
  "seattle-wa": ["98104", "98195", "98122", "98109", "98112", "98105"],
  "boston-ma": ["02115", "02114", "02120", "02215", "02135", "02130"],
  "miami-fl": ["33136", "33101", "33125", "33140", "33139", "33133"],
  "philadelphia-pa": ["19104", "19107", "19141", "19140", "19146", "19102"],
  "san-diego-ca": ["92103", "92123", "92120", "92037", "92101", "92108"],
  "minneapolis-mn": ["55455", "55404", "55407", "55414", "55408", "55416"],
  "orlando-fl": ["32806", "32803", "32804", "32801", "32805", "32808"],
  "charlotte-nc": ["28203", "28204", "28207", "28209", "28210", "28232"],
  "tampa-fl": ["33606", "33613", "33612", "33610", "33602", "33609"],
};

let apiCallsMade = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCachePath(cacheDir: string, zip: string): string {
  return path.join(cacheDir, `${zip}.json`);
}

function isCacheValid(cachePath: string): boolean {
  if (!fs.existsSync(cachePath)) return false;
  const ageMs = Date.now() - fs.statSync(cachePath).mtimeMs;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays < CACHE_MAX_AGE_DAYS;
}

async function fetchZip(zip: string, cacheDir: string): Promise<{ listings: number; fromCache: boolean }> {
  const cachePath = getCachePath(cacheDir, zip);

  // Use cache if fresh enough
  if (isCacheValid(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    const ageDays = (Date.now() - fs.statSync(cachePath).mtimeMs) / (1000 * 60 * 60 * 24);
    console.log(`  [CACHE] ${zip}: ${cached.length} listings (${ageDays.toFixed(1)} days old)`);
    return { listings: cached.length, fromCache: true };
  }

  // Check API call budget BEFORE making the request
  if (apiCallsMade >= API_CALL_LIMIT) {
    console.warn(`  [SKIP] ${zip}: API call limit reached (${API_CALL_LIMIT}). Use cache or wait.`);
    return { listings: 0, fromCache: false };
  }

  const url = `${RENTCAST_BASE}?zipCode=${zip}&limit=500&status=Active`;
  console.log(`  [FETCH] ${zip} (API call ${apiCallsMade + 1}/${API_CALL_LIMIT})...`);
  apiCallsMade++;

  const res = await fetch(url, {
    headers: {
      "X-Api-Key": RENTCAST_API_KEY!,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`  [ERROR] ${zip}: HTTP ${res.status} — ${body.slice(0, 200)}`);

    // If we hit rate limit (429), stop immediately
    if (res.status === 429) {
      console.error("\n  Rate limited by RentCast! Stopping to preserve quota.");
      apiCallsMade = API_CALL_LIMIT; // Prevent further calls
    }

    return { listings: 0, fromCache: false };
  }

  const data = await res.json();
  const listings = Array.isArray(data) ? data : [];

  // Cache raw response
  fs.writeFileSync(cachePath, JSON.stringify(listings, null, 2));
  console.log(`  [OK] ${zip}: ${listings.length} listings`);

  return { listings: listings.length, fromCache: false };
}

async function main() {
  const args = process.argv.slice(2);
  const metroArg = args.find((a) => a.startsWith("--metro"))
    ? args[args.indexOf("--metro") + 1]
    : null;

  const metros = metroArg ? { [metroArg]: METRO_ZIPS[metroArg] } : METRO_ZIPS;

  if (metroArg && !METRO_ZIPS[metroArg]) {
    console.error(`Unknown metro: ${metroArg}. Available: ${Object.keys(METRO_ZIPS).join(", ")}`);
    process.exit(1);
  }

  // Count how many API calls we'll need (non-cached ZIPs)
  let uncachedCount = 0;
  for (const [metro, zips] of Object.entries(metros)) {
    if (!zips) continue;
    const cacheDir = path.join(process.cwd(), "data", "rentcast", metro);
    for (const zip of zips) {
      if (!isCacheValid(getCachePath(cacheDir, zip))) uncachedCount++;
    }
  }

  console.log(`=== RentCast Fetch ===`);
  console.log(`ZIPs to fetch: ${uncachedCount} uncached (limit: ${API_CALL_LIMIT}/run, 50/month)`);
  if (uncachedCount > API_CALL_LIMIT) {
    console.warn(`WARNING: ${uncachedCount} uncached ZIPs exceeds per-run limit of ${API_CALL_LIMIT}.`);
    console.warn(`Only the first ${API_CALL_LIMIT} will be fetched. Run again for the rest.`);
  }

  let totalListings = 0;

  for (const [metro, zips] of Object.entries(metros)) {
    if (!zips) continue;
    console.log(`\n=== ${metro.toUpperCase()} ===`);

    const cacheDir = path.join(process.cwd(), "data", "rentcast", metro);
    fs.mkdirSync(cacheDir, { recursive: true });

    for (const zip of zips) {
      const result = await fetchZip(zip, cacheDir);
      totalListings += result.listings;

      // Rate limit: 1 second between actual API calls
      if (!result.fromCache && apiCallsMade < API_CALL_LIMIT) {
        await sleep(1000);
      }
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total listings fetched: ${totalListings}`);
  console.log(`API calls made this run: ${apiCallsMade}`);
  console.log(`Remaining budget this run: ${Math.max(0, API_CALL_LIMIT - apiCallsMade)}`);
  console.log(`Cache dir: data/rentcast/`);
}

main().catch((err) => {
  console.error("Fetch failed:", err);
  process.exit(1);
});
