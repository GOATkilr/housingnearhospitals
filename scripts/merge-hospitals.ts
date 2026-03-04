/**
 * Merges CMS hospital data with existing curated sample data.
 * Keeps original 12 curated hospitals, adds new CMS hospitals.
 * Outputs the merged SAMPLE_HOSPITALS array to data/merged-hospitals.ts
 */

import * as fs from "fs";
import * as path from "path";

const cmsData = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data", "cms-metro-hospitals.json"), "utf-8")
);

// Original curated hospital slugs (keep these as-is)
const ORIGINAL_SLUGS = new Set([
  "vanderbilt-university-medical-center",
  "tristar-centennial-medical-center",
  "ascension-saint-thomas-west",
  "monroe-carell-childrens-hospital",
  "tristar-skyline-medical-center",
  "houston-methodist-hospital",
  "memorial-hermann-texas-medical-center",
  "md-anderson-cancer-center",
  "ben-taub-hospital",
  "mayo-clinic-hospital-phoenix",
  "banner-university-medical-center-phoenix",
  "honorhealth-scottsdale-osborn",
]);

// Filter to new-only hospitals
const newHospitals = cmsData.filter(
  (h: { slug: string }) => !ORIGINAL_SLUGS.has(h.slug)
);

console.log(`Original curated: ${ORIGINAL_SLUGS.size}`);
console.log(`CMS total: ${cmsData.length}`);
console.log(`CMS overlapping with original: ${cmsData.length - newHospitals.length}`);
console.log(`New hospitals to add: ${newHospitals.length}`);

// Group by metro
const byMetro: Record<string, number> = {};
for (const h of newHospitals) {
  byMetro[h.metroId] = (byMetro[h.metroId] ?? 0) + 1;
}
console.log("New by metro:", byMetro);

// Generate TypeScript for new hospitals
const lines = newHospitals.map((h: Record<string, unknown>) => {
  const loc = h.location as { lat: number; lng: number };
  const parts = [
    `  {`,
    `    id: ${JSON.stringify(h.id)},`,
    `    metroId: ${JSON.stringify(h.metroId)},`,
    `    name: ${JSON.stringify(h.name)},`,
    `    slug: ${JSON.stringify(h.slug)},`,
    `    address: ${JSON.stringify(h.address)},`,
    `    city: ${JSON.stringify(h.city)},`,
    `    stateCode: ${JSON.stringify(h.stateCode)},`,
    `    zipCode: ${JSON.stringify(h.zipCode)},`,
    `    location: { lat: ${loc.lat}, lng: ${loc.lng} },`,
    `    hospitalType: ${JSON.stringify(h.hospitalType)},`,
    `    ownership: ${JSON.stringify(h.ownership)},`,
    `    hasEmergency: ${h.hasEmergency},`,
  ];
  if (h.cmsOverallRating) parts.push(`    cmsOverallRating: ${h.cmsOverallRating},`);
  if (h.phone) parts.push(`    phone: ${JSON.stringify(h.phone)},`);
  parts.push(`    isActive: true,`);
  parts.push(`  },`);
  return parts.join("\n");
});

const output = `// === CMS Hospital Compare Data ===\n// ${newHospitals.length} additional hospitals from CMS API\n// Append these to the SAMPLE_HOSPITALS array after the original 12 curated hospitals\n\n${lines.join("\n")}`;

const outputPath = path.join(process.cwd(), "data", "new-hospitals-snippet.ts");
fs.writeFileSync(outputPath, output);
console.log(`\nWrote snippet to ${outputPath}`);
