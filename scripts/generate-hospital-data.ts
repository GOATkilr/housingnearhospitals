/**
 * Fetch hospitals from CMS API and generate TypeScript for sample-data.ts.
 * Uses zip code centroids for approximate coordinates.
 *
 * Usage: npx tsx scripts/generate-hospital-data.ts
 * Output: data/generated-hospitals.ts (copy to sample-data.ts)
 */

import * as fs from "fs";
import * as path from "path";

const CMS_API = "https://data.cms.gov/provider-data/api/1/datastore/query/xubh-q36u/0";

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

// Metro city lists
const METRO_CITIES: Record<string, string[]> = {
  "metro-nashville": [
    "NASHVILLE", "FRANKLIN", "MURFREESBORO", "HENDERSONVILLE",
    "GALLATIN", "LEBANON", "HERMITAGE", "DICKSON", "SMYRNA",
    "BRENTWOOD", "MADISON", "ANTIOCH", "LAVERGNE", "COLUMBIA",
    "COOKEVILLE", "SHELBYVILLE", "SPRINGFIELD", "HARTSVILLE",
  ],
  "metro-houston": [
    "HOUSTON", "PASADENA", "SUGAR LAND", "BAYTOWN", "CONROE",
    "LEAGUE CITY", "MISSOURI CITY", "THE WOODLANDS", "PEARLAND",
    "KATY", "TEXAS CITY", "GALVESTON", "TOMBALL", "HUMBLE",
    "WEBSTER", "BELLAIRE", "CYPRESS", "RICHMOND", "FRIENDSWOOD",
    "SPRING", "STAFFORD", "ANGLETON", "DEER PARK", "NASSAU BAY",
    "CLEAR LAKE", "CROSBY", "DAYTON", "WHARTON", "BAY CITY",
  ],
  "metro-phoenix": [
    "PHOENIX", "SCOTTSDALE", "MESA", "TEMPE", "CHANDLER",
    "GLENDALE", "GILBERT", "PEORIA", "SURPRISE", "GOODYEAR",
    "AVONDALE", "BUCKEYE", "CAVE CREEK", "FOUNTAIN HILLS",
    "QUEEN CREEK", "SUN CITY", "SUN CITY WEST", "WICKENBURG",
    "APACHE JUNCTION",
  ],
};

// Approximate zip-code centroid coords for known hospital zips (pre-calculated)
// This avoids needing an API for geocoding
const ZIP_COORDS: Record<string, { lat: number; lng: number }> = {
  // Nashville TN metro
  "37203": { lat: 36.1513, lng: -86.7906 },
  "37205": { lat: 36.1261, lng: -86.8625 },
  "37207": { lat: 36.2098, lng: -86.7575 },
  "37209": { lat: 36.1555, lng: -86.8505 },
  "37211": { lat: 36.0660, lng: -86.7225 },
  "37212": { lat: 36.1363, lng: -86.8042 },
  "37215": { lat: 36.1033, lng: -86.8322 },
  "37216": { lat: 36.2066, lng: -86.7333 },
  "37217": { lat: 36.1113, lng: -86.6666 },
  "37218": { lat: 36.2202, lng: -86.8475 },
  "37228": { lat: 36.1932, lng: -86.8058 },
  "37232": { lat: 36.1425, lng: -86.8026 },
  "37027": { lat: 36.0290, lng: -86.7828 },
  "37064": { lat: 35.9226, lng: -86.8689 },
  "37067": { lat: 35.9476, lng: -86.8094 },
  "37072": { lat: 36.3406, lng: -86.5978 },
  "37075": { lat: 36.3115, lng: -86.6207 },
  "37115": { lat: 36.2620, lng: -86.7102 },
  "37128": { lat: 35.8014, lng: -86.4220 },
  "37129": { lat: 35.8685, lng: -86.3720 },
  "37130": { lat: 35.8456, lng: -86.3925 },
  "37138": { lat: 36.2117, lng: -86.6169 },
  "37143": { lat: 36.3900, lng: -87.0556 },
  "37160": { lat: 35.4840, lng: -86.4610 },
  "37167": { lat: 35.9640, lng: -86.5180 },
  "37172": { lat: 36.5094, lng: -86.8850 },
  "37174": { lat: 35.7812, lng: -86.9004 },
  "37087": { lat: 36.2075, lng: -86.2947 },
  "37055": { lat: 36.0752, lng: -87.3876 },
  "37066": { lat: 36.3833, lng: -86.4514 },
  "37048": { lat: 36.3907, lng: -86.1639 },
  "37086": { lat: 36.0278, lng: -86.5831 },
  "37404": { lat: 35.0367, lng: -85.2697 },
  "37208": { lat: 36.1742, lng: -86.8096 },
  "37076": { lat: 36.1609, lng: -86.5897 },
  "37074": { lat: 36.3907, lng: -86.1639 },
  "37214": { lat: 36.1601, lng: -86.6615 },
  "38501": { lat: 36.1628, lng: -85.5016 },
  "38401": { lat: 35.6150, lng: -87.0353 },
  // Houston TX metro
  "77001": { lat: 29.7604, lng: -95.3698 },
  "77002": { lat: 29.7545, lng: -95.3630 },
  "77004": { lat: 29.7195, lng: -95.3625 },
  "77005": { lat: 29.7171, lng: -95.4210 },
  "77006": { lat: 29.7382, lng: -95.3958 },
  "77008": { lat: 29.7914, lng: -95.4176 },
  "77009": { lat: 29.7982, lng: -95.3544 },
  "77011": { lat: 29.7292, lng: -95.3038 },
  "77015": { lat: 29.7607, lng: -95.1771 },
  "77018": { lat: 29.8296, lng: -95.4269 },
  "77019": { lat: 29.7560, lng: -95.4099 },
  "77021": { lat: 29.6996, lng: -95.3517 },
  "77024": { lat: 29.7735, lng: -95.5172 },
  "77025": { lat: 29.6874, lng: -95.4319 },
  "77026": { lat: 29.7889, lng: -95.3249 },
  "77027": { lat: 29.7405, lng: -95.4508 },
  "77030": { lat: 29.7095, lng: -95.3985 },
  "77034": { lat: 29.6181, lng: -95.2144 },
  "77036": { lat: 29.7015, lng: -95.5303 },
  "77040": { lat: 29.8579, lng: -95.5530 },
  "77042": { lat: 29.7329, lng: -95.5614 },
  "77043": { lat: 29.7913, lng: -95.5663 },
  "77047": { lat: 29.6182, lng: -95.3381 },
  "77054": { lat: 29.6917, lng: -95.3981 },
  "77056": { lat: 29.7496, lng: -95.4828 },
  "77057": { lat: 29.7439, lng: -95.5089 },
  "77058": { lat: 29.5549, lng: -95.1007 },
  "77060": { lat: 29.9154, lng: -95.3983 },
  "77065": { lat: 29.9200, lng: -95.5883 },
  "77070": { lat: 29.9637, lng: -95.5530 },
  "77074": { lat: 29.6856, lng: -95.5194 },
  "77075": { lat: 29.6245, lng: -95.2680 },
  "77079": { lat: 29.7712, lng: -95.5813 },
  "77082": { lat: 29.7242, lng: -95.6044 },
  "77084": { lat: 29.8237, lng: -95.6594 },
  "77089": { lat: 29.5887, lng: -95.2278 },
  "77090": { lat: 29.9549, lng: -95.4433 },
  "77094": { lat: 29.7740, lng: -95.6741 },
  "77098": { lat: 29.7349, lng: -95.4192 },
  "77099": { lat: 29.6699, lng: -95.5747 },
  "77339": { lat: 30.0093, lng: -95.2629 },
  "77301": { lat: 30.3116, lng: -95.4560 },
  "77304": { lat: 30.3495, lng: -95.5206 },
  "77338": { lat: 29.9990, lng: -95.2671 },
  "77346": { lat: 30.0060, lng: -95.1868 },
  "77351": { lat: 30.4879, lng: -95.2014 },
  "77375": { lat: 30.0893, lng: -95.6137 },
  "77380": { lat: 30.1741, lng: -95.4613 },
  "77381": { lat: 30.1996, lng: -95.4947 },
  "77386": { lat: 30.1727, lng: -95.3559 },
  "77401": { lat: 29.7051, lng: -95.4602 },
  "77450": { lat: 29.7900, lng: -95.7364 },
  "77459": { lat: 29.5361, lng: -95.5119 },
  "77469": { lat: 29.5814, lng: -95.7610 },
  "77478": { lat: 29.6268, lng: -95.6269 },
  "77479": { lat: 29.5670, lng: -95.6364 },
  "77502": { lat: 29.6914, lng: -95.2089 },
  "77504": { lat: 29.6563, lng: -95.1881 },
  "77505": { lat: 29.6355, lng: -95.1536 },
  "77520": { lat: 29.7520, lng: -94.9703 },
  "77521": { lat: 29.7946, lng: -94.9288 },
  "77539": { lat: 29.4016, lng: -95.1337 },
  "77546": { lat: 29.5452, lng: -95.3255 },
  "77550": { lat: 29.2949, lng: -94.7905 },
  "77551": { lat: 29.2684, lng: -94.8295 },
  "77566": { lat: 29.1630, lng: -95.4069 },
  "77573": { lat: 29.5001, lng: -95.0880 },
  "77581": { lat: 29.5584, lng: -95.2851 },
  "77584": { lat: 29.5252, lng: -95.3271 },
  "77586": { lat: 29.5244, lng: -95.1276 },
  "77590": { lat: 29.3890, lng: -94.9282 },
  "77555": { lat: 29.3130, lng: -94.7776 },
  "77414": { lat: 28.9730, lng: -95.9560 },
  "77598": { lat: 29.5600, lng: -95.1040 },
  "77494": { lat: 29.7830, lng: -95.8040 },
  "77384": { lat: 30.2040, lng: -95.4820 },
  "77081": { lat: 29.7120, lng: -95.5030 },
  "77429": { lat: 29.9530, lng: -95.6640 },
  "77407": { lat: 29.6930, lng: -95.7120 },
  "77080": { lat: 29.8210, lng: -95.5360 },
  "77498": { lat: 29.6050, lng: -95.5670 },
  "77385": { lat: 30.2300, lng: -95.4110 },
  "77072": { lat: 29.6930, lng: -95.5720 },
  "77049": { lat: 29.8070, lng: -95.1690 },
  // Phoenix AZ metro
  "85003": { lat: 33.4493, lng: -112.0823 },
  "85004": { lat: 33.4491, lng: -112.0693 },
  "85006": { lat: 33.4575, lng: -112.0450 },
  "85008": { lat: 33.4609, lng: -112.0076 },
  "85009": { lat: 33.4499, lng: -112.1206 },
  "85012": { lat: 33.5073, lng: -112.0733 },
  "85013": { lat: 33.5120, lng: -112.0829 },
  "85014": { lat: 33.5073, lng: -112.0558 },
  "85015": { lat: 33.5073, lng: -112.1029 },
  "85016": { lat: 33.5073, lng: -112.0283 },
  "85018": { lat: 33.5073, lng: -111.9833 },
  "85020": { lat: 33.5676, lng: -112.0558 },
  "85021": { lat: 33.5676, lng: -112.0893 },
  "85022": { lat: 33.6269, lng: -112.0439 },
  "85023": { lat: 33.6130, lng: -112.0990 },
  "85027": { lat: 33.6645, lng: -112.0990 },
  "85028": { lat: 33.5806, lng: -111.9953 },
  "85029": { lat: 33.6047, lng: -112.1100 },
  "85032": { lat: 33.6120, lng: -111.9833 },
  "85037": { lat: 33.4479, lng: -112.1779 },
  "85040": { lat: 33.3956, lng: -112.0173 },
  "85041": { lat: 33.3834, lng: -112.0833 },
  "85042": { lat: 33.3625, lng: -112.0290 },
  "85044": { lat: 33.3300, lng: -111.9833 },
  "85050": { lat: 33.6800, lng: -111.9833 },
  "85051": { lat: 33.5614, lng: -112.1188 },
  "85054": { lat: 33.6620, lng: -111.9490 },
  "85201": { lat: 33.4233, lng: -111.8226 },
  "85202": { lat: 33.3916, lng: -111.8612 },
  "85204": { lat: 33.3996, lng: -111.7792 },
  "85205": { lat: 33.4356, lng: -111.7325 },
  "85206": { lat: 33.3816, lng: -111.7192 },
  "85210": { lat: 33.3856, lng: -111.8479 },
  "85224": { lat: 33.2964, lng: -111.8600 },
  "85225": { lat: 33.3213, lng: -111.8127 },
  "85226": { lat: 33.3000, lng: -111.9100 },
  "85233": { lat: 33.3258, lng: -111.7514 },
  "85234": { lat: 33.3786, lng: -111.7374 },
  "85251": { lat: 33.4941, lng: -111.9237 },
  "85254": { lat: 33.5939, lng: -111.9226 },
  "85255": { lat: 33.6697, lng: -111.8563 },
  "85258": { lat: 33.5441, lng: -111.8946 },
  "85259": { lat: 33.5736, lng: -111.8450 },
  "85260": { lat: 33.6220, lng: -111.8870 },
  "85281": { lat: 33.4142, lng: -111.9252 },
  "85282": { lat: 33.3830, lng: -111.9252 },
  "85283": { lat: 33.3640, lng: -111.9252 },
  "85301": { lat: 33.5353, lng: -112.1860 },
  "85302": { lat: 33.5543, lng: -112.1980 },
  "85304": { lat: 33.5730, lng: -112.1870 },
  "85305": { lat: 33.5050, lng: -112.2460 },
  "85306": { lat: 33.6100, lng: -112.1800 },
  "85308": { lat: 33.6300, lng: -112.1800 },
  "85338": { lat: 33.4364, lng: -112.3583 },
  "85339": { lat: 33.3690, lng: -112.1793 },
  "85345": { lat: 33.5866, lng: -112.2504 },
  "85351": { lat: 33.6156, lng: -112.2810 },
  "85355": { lat: 33.5630, lng: -112.3270 },
  "85374": { lat: 33.6490, lng: -112.3490 },
  "85375": { lat: 33.6708, lng: -112.2766 },
  "85377": { lat: 33.8025, lng: -111.9545 },
  "85379": { lat: 33.6370, lng: -112.3430 },
  "85381": { lat: 33.5954, lng: -112.2395 },
  "85382": { lat: 33.6387, lng: -112.2460 },
  "85383": { lat: 33.6780, lng: -112.2570 },
  "85388": { lat: 33.6640, lng: -112.3870 },
  "85392": { lat: 33.4580, lng: -112.3630 },
  "85395": { lat: 33.5300, lng: -112.3900 },
  "85396": { lat: 33.2500, lng: -111.6300 },
  "85120": { lat: 33.4057, lng: -111.5491 },
  "85142": { lat: 33.2770, lng: -111.6390 },
  "85143": { lat: 33.2210, lng: -111.5520 },
  "85297": { lat: 33.2780, lng: -111.7400 },
  "85209": { lat: 33.3930, lng: -111.6640 },
  "85140": { lat: 33.2830, lng: -111.5430 },
  "85212": { lat: 33.3610, lng: -111.6170 },
  "85085": { lat: 33.7460, lng: -112.0420 },
  "85295": { lat: 33.2900, lng: -111.7700 },
  "85390": { lat: 33.9686, lng: -112.7295 },
  "85007": { lat: 33.4410, lng: -112.0960 },
  "85378": { lat: 33.6240, lng: -112.3200 },
  "85248": { lat: 33.2500, lng: -111.8000 },
  "85249": { lat: 33.2500, lng: -111.7500 },
  "85286": { lat: 33.3400, lng: -111.9060 },
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function titleCase(str: string): string {
  return str.toLowerCase().split(" ")
    .map((w) => ["of", "the", "and", "at", "in", "for", "a"].includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .replace(/^./, (c) => c.toUpperCase());
}

function mapHospitalType(cmsType: string): string {
  if (cmsType.includes("Acute")) return "General Acute Care";
  if (cmsType.includes("Critical")) return "Critical Access";
  if (cmsType.includes("Psychiatric")) return "Psychiatric";
  if (cmsType.includes("Children")) return "Children's";
  return "General Acute Care";
}

function mapOwnership(o: string): string {
  const lc = o.toLowerCase();
  if (lc.includes("government") || lc.includes("federal") || lc.includes("state") || lc.includes("tribal")) return "Government";
  if (lc.includes("church") || lc.includes("voluntary") || lc.includes("not-for-profit")) return "Non-Profit";
  if (lc.includes("physician") || lc.includes("proprietary") || lc.includes("corporation")) return "For-Profit";
  return "Unknown";
}

async function fetchState(state: string): Promise<CmsHospital[]> {
  const all: CmsHospital[] = [];
  let offset = 0;
  while (true) {
    const url = `${CMS_API}?limit=500&offset=${offset}&format=json&conditions[0][property]=state&conditions[0][value]=${state}&conditions[0][operator]=%3D`;
    const res = await fetch(url);
    const data = await res.json();
    const results = data.results ?? [];
    all.push(...results);
    if (results.length < 500) break;
    offset += 500;
  }
  return all;
}

async function main() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const allHospitals: Record<string, unknown>[] = [];
  const slugsSeen = new Set<string>();

  for (const [metroId, cities] of Object.entries(METRO_CITIES)) {
    const stateCode = metroId === "metro-nashville" ? "TN" : metroId === "metro-houston" ? "TX" : "AZ";
    console.log(`\n=== ${metroId} (${stateCode}) ===`);

    const hospitals = await fetchState(stateCode);
    console.log(`  Total in ${stateCode}: ${hospitals.length}`);

    const citySet = new Set(cities.map((c) => c.toUpperCase()));
    const metroHospitals = hospitals.filter((h) => citySet.has(h.citytown?.toUpperCase()?.trim()));
    console.log(`  In metro cities: ${metroHospitals.length}`);

    for (const h of metroHospitals) {
      const zip = h.zip_code?.slice(0, 5);
      const coords = ZIP_COORDS[zip];
      if (!coords) {
        console.log(`  [SKIP] No coords for zip ${zip}: ${h.facility_name}`);
        continue;
      }

      let slug = slugify(h.facility_name);
      if (slugsSeen.has(slug)) slug = `${slug}-${h.facility_id}`;
      slugsSeen.add(slug);

      const rating = parseInt(h.hospital_overall_rating);

      allHospitals.push({
        id: `cms-${h.facility_id}`,
        metroId,
        name: titleCase(h.facility_name),
        slug,
        address: titleCase(h.address),
        city: titleCase(h.citytown),
        stateCode: h.state,
        zipCode: zip,
        location: coords,
        hospitalType: mapHospitalType(h.hospital_type),
        ownership: mapOwnership(h.hospital_ownership),
        hasEmergency: h.emergency_services === "Yes",
        ...(rating >= 1 && rating <= 5 && { cmsOverallRating: rating }),
        ...(h.telephone_number && { phone: h.telephone_number }),
        isActive: true,
      });
    }

    console.log(`  Added: ${allHospitals.filter((h) => h.metroId === metroId).length}`);
  }

  // Write JSON
  const jsonPath = path.join(dataDir, "cms-metro-hospitals.json");
  fs.writeFileSync(jsonPath, JSON.stringify(allHospitals, null, 2));
  console.log(`\nWrote ${allHospitals.length} hospitals to ${jsonPath}`);

  // Generate TypeScript
  const tsLines = allHospitals.map((h) => {
    const lines = [
      `  {`,
      `    id: ${JSON.stringify(h.id)},`,
      `    metroId: ${JSON.stringify(h.metroId)},`,
      `    name: ${JSON.stringify(h.name)},`,
      `    slug: ${JSON.stringify(h.slug)},`,
      `    address: ${JSON.stringify(h.address)},`,
      `    city: ${JSON.stringify(h.city)},`,
      `    stateCode: ${JSON.stringify(h.stateCode)},`,
      `    zipCode: ${JSON.stringify(h.zipCode)},`,
      `    location: { lat: ${(h.location as { lat: number }).lat}, lng: ${(h.location as { lng: number }).lng} },`,
      `    hospitalType: ${JSON.stringify(h.hospitalType)},`,
      `    ownership: ${JSON.stringify(h.ownership)},`,
      `    hasEmergency: ${h.hasEmergency},`,
    ];
    if (h.cmsOverallRating) lines.push(`    cmsOverallRating: ${h.cmsOverallRating},`);
    if (h.phone) lines.push(`    phone: ${JSON.stringify(h.phone)},`);
    lines.push(`    isActive: true,`);
    lines.push(`  },`);
    return lines.join("\n");
  });

  const tsContent = `// Auto-generated from CMS Hospital Compare API\n// ${allHospitals.length} hospitals across 3 metros\n\nexport const CMS_HOSPITALS: Hospital[] = [\n${tsLines.join("\n")}\n];\n`;
  const tsPath = path.join(dataDir, "generated-hospitals.ts");
  fs.writeFileSync(tsPath, tsContent);
  console.log(`Wrote TypeScript to ${tsPath}`);
}

main().catch(console.error);
