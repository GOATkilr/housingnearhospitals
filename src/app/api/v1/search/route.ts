import { NextRequest, NextResponse } from "next/server";
import { SAMPLE_HOSPITALS, SAMPLE_LISTINGS } from "@/lib/sample-data";
import { getMetroById } from "@/lib/constants";
import { calculateFullProximityScore, calculateCombinedScore } from "@/lib/scoring";

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
 *   offset: number       — Pagination offset
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

  const hospital = SAMPLE_HOSPITALS.find((h) => h.id === hospitalId);
  if (!hospital) {
    return NextResponse.json(
      { error: "Hospital not found" },
      { status: 404 }
    );
  }

  const metro = getMetroById(hospital.metroId);
  const circuityFactor = metro?.circuityFactor ?? 1.3;

  // Parse filters
  const maxPrice = searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined;
  const minBedrooms = searchParams.get("min_bedrooms") ? Number(searchParams.get("min_bedrooms")) : undefined;
  const furnished = searchParams.get("furnished") === "true";
  const pets = searchParams.get("pets") === "true";
  const parking = searchParams.get("parking") === "true";
  const minScore = searchParams.get("min_score") ? Number(searchParams.get("min_score")) : 0;
  const sort = searchParams.get("sort") ?? "score";
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);
  const offset = Number(searchParams.get("offset") ?? "0");

  // Calculate scores for all listings in the same metro
  let results = SAMPLE_LISTINGS
    .filter((l) => l.metroId === hospital.metroId && l.status === "active")
    .map((listing) => {
      const scoreData = calculateFullProximityScore(
        hospital.location.lat,
        hospital.location.lng,
        listing.location.lat,
        listing.location.lng,
        circuityFactor
      );

      const combinedScore = listing.listingQualityScore
        ? calculateCombinedScore(scoreData.proximityScore, listing.listingQualityScore)
        : scoreData.proximityScore;

      return {
        listing,
        hospital: {
          id: hospital.id,
          name: hospital.name,
          slug: hospital.slug,
        },
        score: {
          straightLineMiles: scoreData.straightLineMiles,
          estimatedDriveMiles: scoreData.estimatedDriveMiles,
          driveTimeDayMin: scoreData.driveTimeDayMin,
          driveTimeNightMin: scoreData.driveTimeNightMin,
          proximityScore: scoreData.proximityScore,
          combinedScore,
        },
        metro: metro ? { slug: metro.slug, name: metro.name } : null,
      };
    });

  // Apply filters
  if (maxPrice) results = results.filter((r) => r.listing.priceMonthly <= maxPrice);
  if (minBedrooms !== undefined) results = results.filter((r) => (r.listing.bedrooms ?? 0) >= minBedrooms);
  if (furnished) results = results.filter((r) => r.listing.isFurnished);
  if (pets) results = results.filter((r) => r.listing.allowsPets);
  if (parking) results = results.filter((r) => r.listing.hasParking);
  if (minScore) results = results.filter((r) => r.score.proximityScore >= minScore);

  // Sort
  switch (sort) {
    case "price_asc":
      results.sort((a, b) => a.listing.priceMonthly - b.listing.priceMonthly);
      break;
    case "price_desc":
      results.sort((a, b) => b.listing.priceMonthly - a.listing.priceMonthly);
      break;
    case "distance":
      results.sort((a, b) => a.score.straightLineMiles - b.score.straightLineMiles);
      break;
    default:
      results.sort((a, b) => b.score.combinedScore - a.score.combinedScore);
  }

  const total = results.length;
  results = results.slice(offset, offset + limit);

  return NextResponse.json({
    data: results,
    total,
    limit,
    offset,
    hospital: {
      id: hospital.id,
      name: hospital.name,
      location: hospital.location,
    },
  });
}
