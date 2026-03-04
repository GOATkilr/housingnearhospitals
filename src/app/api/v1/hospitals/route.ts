import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * GET /api/v1/hospitals
 *
 * Query params:
 *   metro: string  — Filter by metro slug (e.g., "nashville-tn")
 *   q: string      — Search by name (fuzzy)
 *   type: string   — Filter by hospital type
 *   limit: number  — Max results (default 50)
 *
 * Returns: Hospital[] (with metroSlug added)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const metro = searchParams.get("metro");
  const query = searchParams.get("q");
  const type = searchParams.get("type");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const rows = await sql`
    SELECT
      h.*,
      ST_Y(h.location::geometry) AS lat,
      ST_X(h.location::geometry) AS lng,
      m.slug AS metro_slug,
      m.name AS metro_name
    FROM hospitals h
    JOIN metros m ON m.id = h.metro_id
    WHERE h.is_active = true
      AND (${metro ?? null}::text IS NULL OR m.slug = ${metro ?? null})
      AND (${query ?? null}::text IS NULL OR (
        h.name ILIKE '%' || ${query ?? ''} || '%'
        OR h.system_name ILIKE '%' || ${query ?? ''} || '%'
        OR h.city ILIKE '%' || ${query ?? ''} || '%'
      ))
      AND (${type ?? null}::text IS NULL OR h.hospital_type = ${type ?? null})
    ORDER BY h.name
    LIMIT ${limit}
  `;

  const data = rows.map((r) => ({
    id: r.id,
    metroId: r.metro_id,
    metroSlug: r.metro_slug,
    metroName: r.metro_name,
    cmsCcn: r.cms_ccn,
    hifldId: r.hifld_id,
    name: r.name,
    slug: r.slug,
    address: r.address,
    city: r.city,
    stateCode: r.state_code,
    zipCode: r.zip_code,
    phone: r.phone,
    website: r.website,
    location: { lat: r.lat, lng: r.lng },
    hospitalType: r.hospital_type,
    ownership: r.ownership,
    systemName: r.system_name,
    bedCount: r.bed_count,
    hasEmergency: r.has_emergency,
    traumaLevel: r.trauma_level,
    teachingStatus: r.teaching_status,
    cmsOverallRating: r.cms_overall_rating,
    isActive: r.is_active,
  }));

  return NextResponse.json({
    data,
    total: data.length,
    limit,
  });
}
