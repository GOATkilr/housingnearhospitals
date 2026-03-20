/**
 * Fetch market data from RentCast API by ZIP code.
 *
 * Caches raw JSON to data/rentcast-markets/{zip}.json to avoid repeat API calls.
 * Cache TTL: 30 days (market data changes slowly).
 *
 * SAFETY: Hard cap at 200 API calls per run.
 * Cached responses (< 30 days old) don't count toward this cap.
 *
 * Usage:
 *   npx tsx scripts/fetch-market-data.ts
 *   npx tsx scripts/fetch-market-data.ts --metro nashville-tn
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import * as fs from "fs";
import * as path from "path";
import { neon } from "@neondatabase/serverless";

const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY;
if (!RENTCAST_API_KEY) {
  console.error("RENTCAST_API_KEY is not set. Add it to .env.local or your environment.");
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local or your environment.");
  process.exit(1);
}

const RENTCAST_MARKETS_BASE = "https://api.rentcast.io/v1/markets";
const CACHE_MAX_AGE_DAYS = 30;
const API_CALL_LIMIT = 200;

// Strategic ZIPs near hospital clusters per metro — mirrors fetch-rentcast-listings.ts
const METRO_ZIPS: Record<string, string[]> = {
  // Original 3 metros
  "nashville-tn": [
    "37203", "37212", "37209", "37232", "37204", "37215", "37206",
    "37208", "37207", "37216", "37013", "37211", "37217", "37218",
  ],

  "houston-tx": [
    "77030", "77054", "77021", "77004", "77025", "77005", "77002",
    "77019", "77027", "77007", "77006", "77098", "77401", "77096",
    "77051",
  ],

  "phoenix-az": [
    "85006", "85008", "85054", "85251", "85016", "85014", "85004",
    "85013", "85012", "85015", "85017", "85032", "85028", "85018",
    "85259",
  ],

  // Wave 2 metros
  "atlanta-ga": [
    "30322", "30303", "30308", "30342", "30309", "30324", "30306",
    "30307", "30312", "30311", "30318", "30345", "30033", "30329",
  ],

  "dallas-tx": [
    "75235", "75390", "75246", "75231", "75230", "75204", "75219",
    "75201", "75205", "75206", "75214", "75218", "75220", "75247",
    "75208",
  ],

  "denver-co": [
    "80204", "80218", "80220", "80045", "80210", "80206", "80203",
    "80209", "80205", "80207", "80222", "80246", "80012", "80010",
  ],

  "chicago-il": [
    "60612", "60611", "60637", "60615", "60622", "60614", "60657",
    "60640", "60625", "60660", "60608", "60616", "60601", "60610",
    "60647",
  ],

  "los-angeles-ca": [
    "90033", "90024", "90027", "90048", "90095", "90057", "90026",
    "90029", "90004", "90005", "90019", "90034", "90035", "90064",
    "90025",
  ],

  "san-francisco-ca": [
    "94122", "94143", "94115", "94110", "94103", "94158", "94117",
    "94102", "94107", "94109", "94114", "94131", "94134", "94112",
  ],

  "seattle-wa": [
    "98104", "98195", "98122", "98109", "98112", "98105", "98102",
    "98101", "98107", "98103", "98115", "98116", "98118", "98144",
    "98199",
  ],

  "boston-ma": [
    "02115", "02114", "02120", "02215", "02135", "02130", "02116",
    "02118", "02119", "02125", "02126", "02124", "02121", "02127",
    "02134",
  ],

  "miami-fl": [
    "33136", "33101", "33125", "33140", "33139", "33133", "33130",
    "33132", "33137", "33138", "33127", "33128", "33129", "33143",
    "33146",
  ],

  "philadelphia-pa": [
    "19104", "19107", "19141", "19140", "19146", "19102", "19103",
    "19130", "19123", "19125", "19147", "19148", "19106", "19145",
    "19143",
  ],

  "san-diego-ca": [
    "92103", "92123", "92120", "92037", "92101", "92108", "92116",
    "92104", "92105", "92115", "92122", "92107", "92106", "92110",
    "92111",
  ],

  "minneapolis-mn": [
    "55455", "55404", "55407", "55414", "55408", "55416", "55403",
    "55405", "55406", "55409", "55411", "55412", "55418", "55419",
    "55422",
  ],

  "orlando-fl": [
    "32806", "32803", "32804", "32801", "32805", "32808", "32789",
    "32792", "32817", "32826", "32839", "32822", "32824", "32819",
    "32810",
  ],

  "charlotte-nc": [
    "28203", "28204", "28207", "28209", "28210", "28232", "28205",
    "28206", "28208", "28211", "28212", "28213", "28214", "28216",
  ],

  "tampa-fl": [
    "33606", "33613", "33612", "33610", "33602", "33609", "33605",
    "33603", "33604", "33607", "33614", "33619", "33629", "33616",
    "33611",
  ],

  // Wave 3 metros
  "new-york-ny": [
    "10016", "10029", "10032", "10065", "10003", "10021", "10019",
    "10025", "10031", "10037", "10456", "10461", "11201", "11203",
    "11355",
  ],

  "washington-dc": [
    "20007", "20010", "20037", "22042", "22030", "20002", "20009",
    "20011", "20012", "20016", "20001", "20003", "20017", "20032",
    "22204",
  ],

  "baltimore-md": [
    "21205", "21287", "21201", "21218", "21224", "21202", "21211",
    "21210", "21215", "21216", "21217", "21223", "21225", "21228",
  ],

  "detroit-mi": [
    "48202", "48201", "48073", "48109", "48197", "48180", "48203",
    "48205", "48206", "48207", "48208", "48209", "48236", "48334",
  ],

  "san-antonio-tx": [
    "78229", "78207", "78204", "78212", "78215", "78240", "78201",
    "78209", "78210", "78217", "78218", "78228", "78230", "78232",
    "78216",
  ],

  "austin-tx": [
    "78701", "78705", "78712", "78756", "78731", "78745", "78702",
    "78703", "78704", "78723", "78727", "78729", "78748", "78741",
    "78746",
  ],

  "portland-or": [
    "97239", "97210", "97201", "97232", "97213", "97202", "97203",
    "97206", "97211", "97212", "97214", "97215", "97217", "97219",
    "97266",
  ],

  "st-louis-mo": [
    "63110", "63104", "63108", "63130", "63139", "63109", "63111",
    "63112", "63113", "63116", "63117", "63118", "63119", "63122",
    "63141",
  ],

  "pittsburgh-pa": [
    "15213", "15261", "15212", "15224", "15206", "15232", "15201",
    "15202", "15203", "15204", "15205", "15208", "15217", "15219",
    "15222",
  ],

  "raleigh-nc": [
    "27710", "27599", "27610", "27607", "27609", "27601", "27603",
    "27604", "27605", "27606", "27608", "27612", "27613", "27614",
    "27703",
  ],

  "columbus-oh": [
    "43210", "43205", "43215", "43202", "43201", "43206", "43203",
    "43204", "43207", "43209", "43211", "43212", "43213", "43214",
    "43228",
  ],

  "cleveland-oh": [
    "44195", "44106", "44109", "44104", "44103", "44113", "44107",
    "44108", "44112", "44114", "44115", "44118", "44120", "44122",
    "44130",
  ],
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

interface RentCastMarketResponse {
  zipCode?: string;
  medianRent?: number;
  averageRent?: number;
  rentByBedroom?: Record<string, number>;
  averageSquareFootage?: number;
  vacancyRate?: number;
  totalListings?: number;
  [key: string]: unknown;
}

interface MarketRecord {
  zip: string;
  medianRent: number | null;
  rentStudio: number | null;
  rent1br: number | null;
  rent2br: number | null;
  rent3br: number | null;
  rent4br: number | null;
  avgSqft: number | null;
  vacancyRate: number | null;
  listingsCount: number | null;
}

function parseMarketResponse(data: RentCastMarketResponse, zip: string): MarketRecord {
  const rbb = data.rentByBedroom ?? {};
  return {
    zip,
    medianRent: data.medianRent ?? null,
    rentStudio: rbb["0"] ?? null,
    rent1br: rbb["1"] ?? null,
    rent2br: rbb["2"] ?? null,
    rent3br: rbb["3"] ?? null,
    rent4br: rbb["4"] ?? null,
    avgSqft: data.averageSquareFootage ? Math.round(data.averageSquareFootage) : null,
    vacancyRate: data.vacancyRate != null ? Math.round(data.vacancyRate * 10000) / 100 : null,
    listingsCount: data.totalListings ?? null,
  };
}

async function fetchMarketForZip(
  zip: string,
  cacheDir: string
): Promise<{ record: MarketRecord | null; fromCache: boolean }> {
  const cachePath = getCachePath(cacheDir, zip);

  if (isCacheValid(cachePath)) {
    const cached: RentCastMarketResponse = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    const ageDays = (Date.now() - fs.statSync(cachePath).mtimeMs) / (1000 * 60 * 60 * 24);
    console.log(`  [CACHE] ${zip} (${ageDays.toFixed(1)} days old)`);
    return { record: parseMarketResponse(cached, zip), fromCache: true };
  }

  if (apiCallsMade >= API_CALL_LIMIT) {
    console.warn(`  [SKIP] ${zip}: API call limit reached (${API_CALL_LIMIT}).`);
    return { record: null, fromCache: false };
  }

  const url = `${RENTCAST_MARKETS_BASE}?zipCode=${zip}`;
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

    if (res.status === 429) {
      console.error("\n  Rate limited by RentCast! Stopping to preserve quota.");
      apiCallsMade = API_CALL_LIMIT;
    }

    return { record: null, fromCache: false };
  }

  const data: RentCastMarketResponse = await res.json();

  // Cache raw response
  fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
  console.log(`  [OK] ${zip}: medianRent=${data.medianRent ?? "n/a"}`);

  return { record: parseMarketResponse(data, zip), fromCache: false };
}

async function upsertMarketData(
  records: MarketRecord[],
  zipToMetro: Map<string, string>,
  metroSlugToId: Map<string, string>
): Promise<void> {
  const sql = neon(DATABASE_URL!);

  console.log(`\nUpserting ${records.length} records into market_data...`);

  for (const r of records) {
    const metroSlug = zipToMetro.get(r.zip);
    const metroId = metroSlug ? (metroSlugToId.get(metroSlug) ?? null) : null;

    await sql`
      INSERT INTO market_data (
        zip_code, metro_id,
        median_rent, rent_studio, rent_1br, rent_2br, rent_3br, rent_4br,
        avg_sqft, vacancy_rate, listings_count, fetched_at
      ) VALUES (
        ${r.zip}, ${metroId},
        ${r.medianRent}, ${r.rentStudio}, ${r.rent1br}, ${r.rent2br}, ${r.rent3br}, ${r.rent4br},
        ${r.avgSqft}, ${r.vacancyRate}, ${r.listingsCount}, NOW()
      )
      ON CONFLICT (zip_code) DO UPDATE SET
        metro_id       = EXCLUDED.metro_id,
        median_rent    = EXCLUDED.median_rent,
        rent_studio    = EXCLUDED.rent_studio,
        rent_1br       = EXCLUDED.rent_1br,
        rent_2br       = EXCLUDED.rent_2br,
        rent_3br       = EXCLUDED.rent_3br,
        rent_4br       = EXCLUDED.rent_4br,
        avg_sqft       = EXCLUDED.avg_sqft,
        vacancy_rate   = EXCLUDED.vacancy_rate,
        listings_count = EXCLUDED.listings_count,
        fetched_at     = NOW()
    `;
  }

  console.log(`Upsert complete.`);
}

async function loadMetroIds(slugs: string[]): Promise<Map<string, string>> {
  const sql = neon(DATABASE_URL!);
  const map = new Map<string, string>();

  for (const slug of slugs) {
    const rows = await sql`SELECT id FROM metros WHERE slug = ${slug} LIMIT 1`;
    if (rows.length > 0) {
      map.set(slug, rows[0].id as string);
    } else {
      console.warn(`  [WARN] Metro not found in DB: ${slug}`);
    }
  }

  return map;
}

async function main() {
  const args = process.argv.slice(2);
  const metroArg = args.includes("--metro") ? args[args.indexOf("--metro") + 1] : null;

  const metros = metroArg ? { [metroArg]: METRO_ZIPS[metroArg] } : METRO_ZIPS;

  if (metroArg && !METRO_ZIPS[metroArg]) {
    console.error(`Unknown metro: ${metroArg}. Available: ${Object.keys(METRO_ZIPS).join(", ")}`);
    process.exit(1);
  }

  // Build ZIP -> metro slug lookup
  const zipToMetro = new Map<string, string>();
  for (const [slug, zips] of Object.entries(metros)) {
    if (!zips) continue;
    for (const zip of zips) {
      zipToMetro.set(zip, slug);
    }
  }

  // Count uncached ZIPs
  const cacheBaseDir = path.join(process.cwd(), "data", "rentcast-markets");
  fs.mkdirSync(cacheBaseDir, { recursive: true });

  let uncachedCount = 0;
  for (const zip of zipToMetro.keys()) {
    if (!isCacheValid(getCachePath(cacheBaseDir, zip))) uncachedCount++;
  }

  console.log(`=== RentCast Market Data Fetch ===`);
  console.log(`Metros: ${Object.keys(metros).join(", ")}`);
  console.log(`ZIPs to fetch: ${uncachedCount} uncached (limit: ${API_CALL_LIMIT}/run)`);
  if (uncachedCount > API_CALL_LIMIT) {
    console.warn(`WARNING: ${uncachedCount} uncached ZIPs exceeds per-run limit of ${API_CALL_LIMIT}.`);
    console.warn(`Only the first ${API_CALL_LIMIT} will be fetched. Run again for the rest.`);
  }

  // Load metro IDs from DB
  const metroSlugs = Object.keys(metros).filter((s) => METRO_ZIPS[s]);
  console.log(`\nLooking up metro IDs from database...`);
  const metroSlugToId = await loadMetroIds(metroSlugs);

  const allRecords: MarketRecord[] = [];

  for (const [metroSlug, zips] of Object.entries(metros)) {
    if (!zips) continue;
    console.log(`\n=== ${metroSlug.toUpperCase()} ===`);

    for (const zip of zips) {
      const result = await fetchMarketForZip(zip, cacheBaseDir);

      if (result.record) {
        allRecords.push(result.record);
      }

      // Rate limit: 1 second between actual API calls
      if (!result.fromCache && apiCallsMade < API_CALL_LIMIT) {
        await sleep(1000);
      }
    }
  }

  // Upsert all fetched records to DB
  if (allRecords.length > 0) {
    await upsertMarketData(allRecords, zipToMetro, metroSlugToId);
  } else {
    console.log("\nNo records to upsert.");
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Records upserted: ${allRecords.length}`);
  console.log(`API calls made this run: ${apiCallsMade}`);
  console.log(`Remaining budget this run: ${Math.max(0, API_CALL_LIMIT - apiCallsMade)}`);
  console.log(`Cache dir: data/rentcast-markets/`);
}

main().catch((err) => {
  console.error("Fetch failed:", err);
  process.exit(1);
});
