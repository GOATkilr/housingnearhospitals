/**
 * Fetch hospitals from HIFLD ArcGIS REST API and generate TypeScript data.
 *
 * Usage: npx tsx scripts/fetch-hifld-hospitals.ts
 *
 * Outputs to: data/hifld-hospitals.json
 */

import * as fs from "fs";
import * as path from "path";

const API_URL =
  "https://services1.arcgis.com/Hp6G80Pky0om6HgQ/arcgis/rest/services/Hospitals_1/FeatureServer/0/query";

const METRO_BOUNDS: Record<
  string,
  { lat: [number, number]; lng: [number, number]; metroId: string }
> = {
  "nashville-tn": {
    lat: [35.85, 36.45],
    lng: [-87.15, -86.45],
    metroId: "metro-nashville",
  },
  "houston-tx": {
    lat: [29.4, 30.15],
    lng: [-95.85, -94.9],
    metroId: "metro-houston",
  },
  "phoenix-az": {
    lat: [33.15, 33.85],
    lng: [-112.55, -111.55],
    metroId: "metro-phoenix",
  },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function mapHospitalType(type: string): string {
  const typeMap: Record<string, string> = {
    "GENERAL ACUTE CARE": "General Acute Care",
    "CRITICAL ACCESS": "Critical Access",
    PSYCHIATRIC: "Psychiatric",
    REHABILITATION: "Rehabilitation",
    "LONG TERM CARE": "Long Term Care",
    "CHILDREN": "Children's",
    "CHILDRENS": "Children's",
    MILITARY: "Military",
    VA: "VA",
  };
  return typeMap[type?.toUpperCase()] ?? "General Acute Care";
}

function mapOwnership(owner: string): string {
  const o = owner?.toUpperCase() ?? "";
  if (o.includes("GOVERNMENT") || o.includes("STATE") || o.includes("FEDERAL"))
    return "Government";
  if (o.includes("NOT-FOR-PROFIT") || o.includes("NON-PROFIT") || o.includes("NONPROFIT"))
    return "Non-Profit";
  if (o.includes("PROPRIETARY") || o.includes("FOR-PROFIT") || o.includes("FOR PROFIT"))
    return "For-Profit";
  return "Unknown";
}

function mapTraumaLevel(trauma: string | null): string | undefined {
  if (!trauma || trauma === "NOT AVAILABLE" || trauma === "-999") return undefined;
  const t = trauma.toUpperCase();
  if (t.includes("LEVEL I") && !t.includes("II")) return "Level I";
  if (t.includes("LEVEL II") && !t.includes("III")) return "Level II";
  if (t.includes("LEVEL III") && !t.includes("IV")) return "Level III";
  if (t.includes("LEVEL IV") && !t.includes("V")) return "Level IV";
  if (t.includes("LEVEL V")) return "Level V";
  return undefined;
}

async function fetchMetro(
  metroSlug: string,
  bounds: { lat: [number, number]; lng: [number, number]; metroId: string }
) {
  // Build a spatial query using the bounding box
  const where = `STATUS = 'OPEN' AND LATITUDE >= ${bounds.lat[0]} AND LATITUDE <= ${bounds.lat[1]} AND LONGITUDE >= ${bounds.lng[0]} AND LONGITUDE <= ${bounds.lng[1]}`;

  const params = new URLSearchParams({
    where,
    outFields: "NAME,ADDRESS,CITY,STATE,ZIP,COUNTY,TELEPHONE,TYPE,STATUS,BEDS,TRAUMA,OWNER,LATITUDE,LONGITUDE,WEBSITE,NAICS_DESC",
    returnGeometry: "false",
    f: "json",
    resultRecordCount: "500",
  });

  const url = `${API_URL}?${params}`;
  console.log(`Fetching ${metroSlug}...`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

  const data = await res.json();
  const features = data.features ?? [];
  console.log(`  Got ${features.length} hospitals`);

  return features.map((f: { attributes: Record<string, string | number | null> }) => {
    const a = f.attributes;
    const name = String(a.NAME ?? "");
    const beds = Number(a.BEDS) || null;

    return {
      id: `hifld-${slugify(name)}-${String(a.CITY ?? "").toLowerCase()}`,
      metroId: bounds.metroId,
      name: titleCase(name),
      slug: slugify(name),
      address: titleCase(String(a.ADDRESS ?? "")),
      city: titleCase(String(a.CITY ?? "")),
      stateCode: String(a.STATE ?? ""),
      zipCode: String(a.ZIP ?? "").slice(0, 5),
      location: {
        lat: Number(a.LATITUDE),
        lng: Number(a.LONGITUDE),
      },
      hospitalType: mapHospitalType(String(a.TYPE ?? "")),
      ownership: mapOwnership(String(a.OWNER ?? "")),
      ...(beds && beds > 0 && { bedCount: beds }),
      hasEmergency: true,
      ...(mapTraumaLevel(String(a.TRAUMA ?? "")) && {
        traumaLevel: mapTraumaLevel(String(a.TRAUMA ?? "")),
      }),
      ...(a.TELEPHONE && String(a.TELEPHONE) !== "NOT AVAILABLE" && {
        phone: String(a.TELEPHONE),
      }),
      ...(a.WEBSITE && String(a.WEBSITE) !== "NOT AVAILABLE" && {
        website: String(a.WEBSITE),
      }),
      isActive: true,
    };
  });
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => {
      if (["of", "the", "and", "at", "in", "for"].includes(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ")
    .replace(/^./, (c) => c.toUpperCase());
}

async function main() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const allHospitals: Record<string, unknown>[] = [];

  for (const [metroSlug, bounds] of Object.entries(METRO_BOUNDS)) {
    try {
      const hospitals = await fetchMetro(metroSlug, bounds);

      // Deduplicate by slug
      const seen = new Set<string>();
      const unique = hospitals.filter((h: { slug: string }) => {
        if (seen.has(h.slug)) return false;
        seen.add(h.slug);
        return true;
      });

      console.log(`  ${unique.length} unique hospitals after dedup`);
      allHospitals.push(...unique);
    } catch (err) {
      console.error(`Error fetching ${metroSlug}:`, err);
    }
  }

  const outputPath = path.join(dataDir, "hifld-hospitals.json");
  fs.writeFileSync(outputPath, JSON.stringify(allHospitals, null, 2));
  console.log(`\nWrote ${allHospitals.length} total hospitals to ${outputPath}`);
}

main().catch(console.error);
