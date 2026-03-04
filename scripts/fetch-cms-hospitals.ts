/**
 * Fetch hospitals from CMS Hospital Compare API and generate static TypeScript data.
 *
 * CMS data has: name, address, city, state, zip, phone, type, ownership, rating, emergency
 * We geocode addresses using the free Nominatim API (OSM).
 *
 * Usage: npx tsx scripts/fetch-cms-hospitals.ts
 */

import * as fs from "fs";
import * as path from "path";

const CMS_API = "https://data.cms.gov/provider-data/api/1/datastore/query/xubh-q36u/0";

// States to fetch and their metro mappings
const STATE_METROS: Record<string, { state: string; cities: Record<string, string> }> = {
  TN: {
    state: "TN",
    cities: {
      // Nashville metro area cities
      NASHVILLE: "metro-nashville",
      FRANKLIN: "metro-nashville",
      MURFREESBORO: "metro-nashville",
      HENDERSONVILLE: "metro-nashville",
      GALLATIN: "metro-nashville",
      LEBANON: "metro-nashville",
      HERMITAGE: "metro-nashville",
      DICKSON: "metro-nashville",
      SMYRNA: "metro-nashville",
      "MT JULIET": "metro-nashville",
      "MOUNT JULIET": "metro-nashville",
      BRENTWOOD: "metro-nashville",
      MADISON: "metro-nashville",
      ANTIOCH: "metro-nashville",
      LAVERGNE: "metro-nashville",
      COLUMBIA: "metro-nashville",
      COOKEVILLE: "metro-nashville",
      SHELBYVILLE: "metro-nashville",
      SPRINGFIELD: "metro-nashville",
      HARTSVILLE: "metro-nashville",
    },
  },
  TX: {
    state: "TX",
    cities: {
      HOUSTON: "metro-houston",
      PASADENA: "metro-houston",
      "SUGAR LAND": "metro-houston",
      BAYTOWN: "metro-houston",
      CONROE: "metro-houston",
      "LEAGUE CITY": "metro-houston",
      "MISSOURI CITY": "metro-houston",
      "THE WOODLANDS": "metro-houston",
      PEARLAND: "metro-houston",
      KATY: "metro-houston",
      "TEXAS CITY": "metro-houston",
      GALVESTON: "metro-houston",
      TOMBALL: "metro-houston",
      HUMBLE: "metro-houston",
      WEBSTER: "metro-houston",
      KINGWOOD: "metro-houston",
      BELLAIRE: "metro-houston",
      CYPRESS: "metro-houston",
      RICHMOND: "metro-houston",
      FRIENDSWOOD: "metro-houston",
      "CLEAR LAKE": "metro-houston",
      ANGLETON: "metro-houston",
      "SPRING": "metro-houston",
      STAFFORD: "metro-houston",
    },
  },
  AZ: {
    state: "AZ",
    cities: {
      PHOENIX: "metro-phoenix",
      SCOTTSDALE: "metro-phoenix",
      MESA: "metro-phoenix",
      TEMPE: "metro-phoenix",
      CHANDLER: "metro-phoenix",
      GLENDALE: "metro-phoenix",
      GILBERT: "metro-phoenix",
      PEORIA: "metro-phoenix",
      SURPRISE: "metro-phoenix",
      GOODYEAR: "metro-phoenix",
      AVONDALE: "metro-phoenix",
      BUCKEYE: "metro-phoenix",
      "CAVE CREEK": "metro-phoenix",
      "FOUNTAIN HILLS": "metro-phoenix",
      "QUEEN CREEK": "metro-phoenix",
      "SUN CITY": "metro-phoenix",
      "SUN CITY WEST": "metro-phoenix",
      WICKENBURG: "metro-phoenix",
      "APACHE JUNCTION": "metro-phoenix",
    },
  },
};

// Bounding boxes for metro areas (for coordinate validation)
const METRO_BOUNDS: Record<string, { lat: [number, number]; lng: [number, number] }> = {
  "metro-nashville": { lat: [35.7, 36.5], lng: [-87.2, -86.3] },
  "metro-houston": { lat: [29.2, 30.3], lng: [-96.0, -94.7] },
  "metro-phoenix": { lat: [33.0, 34.0], lng: [-112.8, -111.3] },
};

interface CmsHospital {
  facility_id: string;
  facility_name: string;
  address: string;
  citytown: string;
  state: string;
  zip_code: string;
  countyparish: string;
  telephone_number: string;
  hospital_type: string;
  hospital_ownership: string;
  emergency_services: string;
  hospital_overall_rating: string;
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
      if (["of", "the", "and", "at", "in", "for", "a"].includes(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ")
    .replace(/^./, (c) => c.toUpperCase());
}

function mapHospitalType(cmsType: string): string {
  const typeMap: Record<string, string> = {
    "Acute Care Hospitals": "General Acute Care",
    "Critical Access Hospitals": "Critical Access",
    "Psychiatric": "Psychiatric",
    "Childrens": "Children's",
    "Children's Hospitals": "Children's",
  };
  return typeMap[cmsType] ?? "General Acute Care";
}

function mapOwnership(cmsOwnership: string): string {
  const o = cmsOwnership.toLowerCase();
  if (o.includes("government") || o.includes("federal") || o.includes("state") || o.includes("tribal"))
    return "Government";
  if (o.includes("church") || o.includes("voluntary") || o.includes("not-for-profit"))
    return "Non-Profit";
  if (o.includes("physician") || o.includes("proprietary") || o.includes("corporation"))
    return "For-Profit";
  return "Unknown";
}

// Simple geocode using Nominatim (OSM) — free, no key needed
// Rate limited to 1 req/sec
async function geocode(
  address: string,
  city: string,
  state: string,
  zip: string
): Promise<{ lat: number; lng: number } | null> {
  const query = `${address}, ${city}, ${state} ${zip}`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "HousingNearHospitals/1.0 (hello@housingnearhospitals.com)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {
    // ignore
  }

  // Fallback: try city + state only
  try {
    const url2 = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${city}, ${state}`)}&format=json&limit=1&countrycodes=us`;
    const res2 = await fetch(url2, {
      headers: { "User-Agent": "HousingNearHospitals/1.0 (hello@housingnearhospitals.com)" },
    });
    if (!res2.ok) return null;
    const data2 = await res2.json();
    if (data2.length > 0) {
      return { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon) };
    }
  } catch {
    // ignore
  }

  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchState(state: string): Promise<CmsHospital[]> {
  const allResults: CmsHospital[] = [];
  let offset = 0;
  const limit = 500;

  while (true) {
    const url = `${CMS_API}?limit=${limit}&offset=${offset}&format=json&conditions[0][property]=state&conditions[0][value]=${state}&conditions[0][operator]=%3D`;
    console.log(`  Fetching ${state} offset=${offset}...`);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`  HTTP ${res.status}`);
      break;
    }
    const data = await res.json();
    const results = data.results ?? [];
    allResults.push(...results);

    if (results.length < limit) break;
    offset += limit;
  }

  return allResults;
}

async function main() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const allHospitals: Record<string, unknown>[] = [];

  for (const [stateCode, config] of Object.entries(STATE_METROS)) {
    console.log(`\n=== ${stateCode} ===`);

    const hospitals = await fetchState(stateCode);
    console.log(`  Total hospitals in ${stateCode}: ${hospitals.length}`);

    // Filter to metro cities
    const metroHospitals = hospitals.filter((h) => {
      const city = h.citytown?.toUpperCase()?.trim();
      return city && config.cities[city];
    });
    console.log(`  Metro hospitals: ${metroHospitals.length}`);

    // Geocode each hospital (rate limited 1/sec)
    for (let i = 0; i < metroHospitals.length; i++) {
      const h = metroHospitals[i];
      const metroId = config.cities[h.citytown?.toUpperCase()?.trim()];
      const rating = parseInt(h.hospital_overall_rating);

      if (i > 0 && i % 1 === 0) await sleep(1100); // Nominatim rate limit

      const geo = await geocode(h.address, h.citytown, h.state, h.zip_code);
      if (!geo) {
        console.log(`  [SKIP] No geocode for: ${h.facility_name}`);
        continue;
      }

      // Validate coordinates are within metro bounds
      const bounds = METRO_BOUNDS[metroId];
      if (bounds) {
        if (geo.lat < bounds.lat[0] || geo.lat > bounds.lat[1] || geo.lng < bounds.lng[0] || geo.lng > bounds.lng[1]) {
          console.log(`  [SKIP] Out of bounds: ${h.facility_name} (${geo.lat}, ${geo.lng})`);
          continue;
        }
      }

      const hospital = {
        id: `cms-${h.facility_id}`,
        metroId,
        name: titleCase(h.facility_name),
        slug: slugify(h.facility_name),
        address: titleCase(h.address),
        city: titleCase(h.citytown),
        stateCode: h.state,
        zipCode: h.zip_code,
        location: geo,
        hospitalType: mapHospitalType(h.hospital_type),
        ownership: mapOwnership(h.hospital_ownership),
        hasEmergency: h.emergency_services === "Yes",
        ...(rating >= 1 && rating <= 5 && { cmsOverallRating: rating }),
        ...(h.telephone_number && { phone: h.telephone_number }),
        isActive: true,
      };

      allHospitals.push(hospital);
      console.log(`  [${i + 1}/${metroHospitals.length}] ${hospital.name} → (${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)})`);
    }
  }

  // Write output
  const outputPath = path.join(dataDir, "cms-hospitals.json");
  fs.writeFileSync(outputPath, JSON.stringify(allHospitals, null, 2));
  console.log(`\nWrote ${allHospitals.length} hospitals to ${outputPath}`);

  // Print summary by metro
  const byMetro: Record<string, number> = {};
  for (const h of allHospitals) {
    const m = h.metroId as string;
    byMetro[m] = (byMetro[m] ?? 0) + 1;
  }
  console.log("\nBy metro:");
  for (const [metro, count] of Object.entries(byMetro)) {
    console.log(`  ${metro}: ${count}`);
  }
}

main().catch(console.error);
