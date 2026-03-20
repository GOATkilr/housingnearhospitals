import { NextRequest, NextResponse } from "next/server";
import { getHospitalById, searchListings } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/search
 *
 * Query params:
 *   hospital_id: string  — Required: Hospital to calculate proximity from
 *   max_price: number    — Max monthly rent
 *   min_bedrooms: number — Min bedrooms (0 = studio)
 *   furnished: boolean   — Furnished only
 *   pets: boolean        — Pet-friendly only
 *   parking: boolean     — Has parking
 *   min_score: number    — Min proximity score (0-100)
 *   sort: string         — "score" | "price_asc" | "price_desc" | "distance"
 *   limit: number        — Max results (default 20)
 *   page: number         — Pagination page (default 1)
 *
 * Returns: SearchResult[]
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hospitalId = searchParams.get("hospital_id");

  if (!hospitalId) {
    return NextResponse.json(
      { error: "hospital_id is required" },
      { status: 400 }
    );
  }

  const hospital = await getHospitalById(hospitalId);
  if (!hospital) {
    return NextResponse.json(
      { error: "Hospital not found" },
      { status: 404 }
    );
  }

  const maxPrice = searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined;
  const minBedrooms = searchParams.get("min_bedrooms") ? Number(searchParams.get("min_bedrooms")) : undefined;
  const isFurnished = searchParams.get("furnished") === "true" || undefined;
  const allowsPets = searchParams.get("pets") === "true" || undefined;
  const hasParking = searchParams.get("parking") === "true" || undefined;
  const minScore = searchParams.get("min_score") ? Number(searchParams.get("min_score")) : undefined;
  const sortBy = (searchParams.get("sort") ?? "score") as "score" | "price_asc" | "price_desc" | "distance";
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);
  const page = Number(searchParams.get("page") ?? "1");

  const { results, total } = await searchListings(hospitalId, {
    maxPrice,
    minBedrooms,
    isFurnished,
    allowsPets,
    hasParking,
    minScore,
    sortBy,
    limit,
    page,
  });

  return NextResponse.json({
    data: results,
    total,
    limit,
    page,
    hospital: {
      id: hospital.id,
      name: hospital.name,
      location: hospital.location,
    },
  });
}
