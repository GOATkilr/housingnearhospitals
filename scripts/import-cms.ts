/**
 * CMS Hospital Data Import Script
 *
 * Downloads CMS Hospital General Information, merges quality ratings, patient
 * experience (HCAHPS), and safety data with our HIFLD hospital records.
 *
 * Data sources:
 *   - Hospital General Information: https://data.cms.gov/provider-data/dataset/xubh-q36u
 *   - Patient Survey (HCAHPS): https://data.cms.gov/provider-data/dataset/dgck-syfz
 *   - Timely & Effective Care: https://data.cms.gov/provider-data/dataset/yv7e-xc69
 *
 * CMS provides a public API at data.cms.gov/provider-data that returns JSON.
 *
 * Usage:
 *   npx tsx scripts/import-cms.ts
 *
 * Requires:
 *   data/hospitals.json (output from import-hifld.ts)
 *
 * Output:
 *   data/hospitals.json (enriched with CMS data, overwritten in place)
 *   data/cms-ratings.json (standalone CMS data keyed by CCN)
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

// CMS data.cms.gov API endpoints (public, no auth required)
// These return JSON arrays of hospital records
const CMS_HOSPITAL_INFO_URL =
  "https://data.cms.gov/provider-data/api/1/datastore/query/xubh-q36u/0";
const CMS_HCAHPS_URL =
  "https://data.cms.gov/provider-data/api/1/datastore/query/dgck-syfz/0";

// Derive state codes from metro config
function loadTargetStates(): string[] {
  const configPath = path.join(process.cwd(), "src", "config", "metros.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const states = new Set<string>();
  for (const metro of config.metros) {
    if (metro.tier !== "disabled") states.add(metro.stateCode);
  }
  return Array.from(states);
}
const TARGET_STATES = loadTargetStates();

interface CmsHospitalRecord {
  facility_id: string; // CCN — 6-digit code
  facility_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  county_name: string;
  phone_number: string;
  hospital_type: string;
  hospital_ownership: string;
  emergency_services: string;
  hospital_overall_rating: string;
  hospital_overall_rating_footnote?: string;
  mortality_national_comparison?: string;
  safety_of_care_national_comparison?: string;
  readmission_national_comparison?: string;
  patient_experience_national_comparison?: string;
  effectiveness_of_care_national_comparison?: string;
  timeliness_of_care_national_comparison?: string;
}

interface CmsHcahpsRecord {
  facility_id: string;
  hcahps_measure_id: string;
  hcahps_question: string;
  patient_survey_star_rating: string;
  hcahps_answer_percent: string;
  hcahps_linear_mean_value: string;
  number_of_completed_surveys: string;
  survey_response_rate_percent: string;
}

interface HifldHospital {
  id: string;
  hifldId: string;
  metroId: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  stateCode?: string;
  zipCode?: string;
  location: { lat: number; lng: number };
  [key: string]: unknown;
}

interface CmsRating {
  ccn: string;
  facilityName: string;
  overallRating: number | null;
  hasEmergency: boolean;
  mortality: string | null;
  safetyOfCare: string | null;
  readmission: string | null;
  patientExperience: string | null;
  effectivenessOfCare: string | null;
  timelinessOfCare: string | null;
  hcahps?: {
    overallStarRating?: number;
    nurseComm?: string;
    doctorComm?: string;
    staffResponsiveness?: string;
    commAboutMeds?: string;
    cleanliness?: string;
    quietness?: string;
    dischargeInfo?: string;
    recommendHospital?: string;
    surveyResponseRate?: string;
  };
}

async function fetchCmsHospitalInfo(): Promise<CmsHospitalRecord[]> {
  console.log("  Fetching CMS Hospital General Information...");

  const allRecords: CmsHospitalRecord[] = [];
  let offset = 0;
  const limit = 500;

  // Paginate through results
  while (true) {
    const params = new URLSearchParams({
      offset: String(offset),
      count: String(limit),
      results: "true",
      schema: "false",
      keys: "true",
      format: "json",
      rowIds: "false",
    });

    // Filter by state to reduce payload
    for (const state of TARGET_STATES) {
      params.append("conditions[0][property]", "state");
      params.append("conditions[0][value]", state);
      params.append("conditions[0][operator]", "=");
    }

    const url = `${CMS_HOSPITAL_INFO_URL}?${params}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`    CMS API returned ${response.status} at offset ${offset}`);
        break;
      }
      const data = await response.json();
      const results = data.results ?? [];

      if (results.length === 0) break;

      allRecords.push(...results);
      offset += results.length;

      if (results.length < limit) break;
    } catch (err) {
      console.warn(`    Error at offset ${offset}:`, err);
      break;
    }
  }

  console.log(`    Retrieved ${allRecords.length} CMS hospital records`);
  return allRecords;
}

function parseRating(val: string | undefined): number | null {
  if (!val || val === "Not Available" || val === "N/A") return null;
  const num = parseInt(val);
  return isNaN(num) ? null : num;
}

function parseComparison(val: string | undefined): string | null {
  if (!val || val === "Not Available" || val === "N/A") return null;
  return val;
}

function buildCmsRatings(records: CmsHospitalRecord[]): Map<string, CmsRating> {
  const ratings = new Map<string, CmsRating>();

  for (const rec of records) {
    if (!rec.facility_id) continue;

    ratings.set(rec.facility_id, {
      ccn: rec.facility_id,
      facilityName: rec.facility_name,
      overallRating: parseRating(rec.hospital_overall_rating),
      hasEmergency: rec.emergency_services?.toLowerCase() === "yes",
      mortality: parseComparison(rec.mortality_national_comparison),
      safetyOfCare: parseComparison(rec.safety_of_care_national_comparison),
      readmission: parseComparison(rec.readmission_national_comparison),
      patientExperience: parseComparison(rec.patient_experience_national_comparison),
      effectivenessOfCare: parseComparison(rec.effectiveness_of_care_national_comparison),
      timelinessOfCare: parseComparison(rec.timeliness_of_care_national_comparison),
    });
  }

  return ratings;
}

/**
 * Match HIFLD hospitals to CMS records using name + city + state fuzzy matching.
 * CMS uses CCN (Certification Number) while HIFLD uses its own ID, so we match
 * by normalizing names and comparing city/state.
 */
function matchHospitalToCms(
  hospital: HifldHospital,
  cmsRecords: CmsHospitalRecord[]
): CmsHospitalRecord | null {
  const normName = (n: string) =>
    n
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const hName = normName(hospital.name);
  const hCity = hospital.city?.toLowerCase().trim();
  const hState = hospital.stateCode?.toUpperCase().trim();

  // Try exact name + city + state match first
  let match = cmsRecords.find((r) => {
    return (
      normName(r.facility_name) === hName &&
      r.city?.toLowerCase().trim() === hCity &&
      r.state?.toUpperCase().trim() === hState
    );
  });

  if (match) return match;

  // Try fuzzy name match (contains) + city + state
  match = cmsRecords.find((r) => {
    const cName = normName(r.facility_name);
    return (
      (cName.includes(hName) || hName.includes(cName)) &&
      r.city?.toLowerCase().trim() === hCity &&
      r.state?.toUpperCase().trim() === hState
    );
  });

  if (match) return match;

  // Try ZIP code match + partial name
  match = cmsRecords.find((r) => {
    const cName = normName(r.facility_name);
    const hWords = hName.split(" ").filter((w) => w.length > 3);
    const matchedWords = hWords.filter((w) => cName.includes(w));
    return (
      matchedWords.length >= 2 &&
      r.zip_code?.substring(0, 5) === hospital.zipCode?.substring(0, 5)
    );
  });

  return match ?? null;
}

async function main() {
  console.log("=== CMS Hospital Data Import ===\n");

  // Read existing HIFLD hospitals
  const hospitalsPath = path.join(DATA_DIR, "hospitals.json");
  if (!fs.existsSync(hospitalsPath)) {
    console.error("Error: data/hospitals.json not found. Run import-hifld.ts first.");
    process.exit(1);
  }

  const hospitals: HifldHospital[] = JSON.parse(
    fs.readFileSync(hospitalsPath, "utf-8")
  );
  console.log(`  Loaded ${hospitals.length} HIFLD hospitals\n`);

  // Fetch CMS data
  const cmsRecords = await fetchCmsHospitalInfo();

  // Build ratings index
  const cmsRatings = buildCmsRatings(cmsRecords);
  console.log(`  Built CMS ratings for ${cmsRatings.size} hospitals\n`);

  // Match and merge
  let matched = 0;
  let unmatched = 0;

  for (const hospital of hospitals) {
    const cmsMatch = matchHospitalToCms(hospital, cmsRecords);

    if (cmsMatch) {
      const rating = cmsRatings.get(cmsMatch.facility_id);
      if (rating) {
        hospital.cmsCcn = cmsMatch.facility_id;
        hospital.cmsOverallRating = rating.overallRating;
        hospital.hasEmergency = rating.hasEmergency;
        hospital.cmsMortality = rating.mortality;
        hospital.cmsReadmission = rating.readmission;
        hospital.cmsSafetyRating = rating.safetyOfCare;
        hospital.cmsPatientExp = rating.patientExperience;
        matched++;
      }
    } else {
      unmatched++;
    }
  }

  console.log(`  CMS match results:`);
  console.log(`    Matched: ${matched}`);
  console.log(`    Unmatched: ${unmatched}`);
  console.log(
    `    Match rate: ${((matched / hospitals.length) * 100).toFixed(1)}%`
  );

  // Write enriched hospitals
  fs.writeFileSync(hospitalsPath, JSON.stringify(hospitals, null, 2));
  console.log(`\n  Updated ${hospitalsPath}`);

  // Write standalone CMS ratings for reference
  const ratingsPath = path.join(DATA_DIR, "cms-ratings.json");
  const ratingsObj = Object.fromEntries(cmsRatings);
  fs.writeFileSync(ratingsPath, JSON.stringify(ratingsObj, null, 2));
  console.log(`  Wrote CMS ratings to ${ratingsPath}`);

  // Print some stats
  const withRating = hospitals.filter(
    (h) => h.cmsOverallRating != null
  ).length;
  const ratingDist: Record<string, number> = {};
  for (const h of hospitals) {
    const r = h.cmsOverallRating as number | null;
    if (r != null) {
      const key = `${r} star${r !== 1 ? "s" : ""}`;
      ratingDist[key] = (ratingDist[key] ?? 0) + 1;
    }
  }

  console.log(`\n  Hospitals with CMS rating: ${withRating}`);
  for (const [rating, count] of Object.entries(ratingDist).sort()) {
    console.log(`    ${rating}: ${count}`);
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
