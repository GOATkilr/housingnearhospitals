import { NextRequest, NextResponse } from "next/server";
import { SAMPLE_HOSPITALS } from "@/lib/sample-data";

/**
 * GET /api/v1/hospitals
 *
 * Query params:
 *   metro: string  — Filter by metro slug (e.g., "nashville-tn")
 *   q: string      — Search by name (fuzzy)
 *   type: string   — Filter by hospital type
 *   limit: number  — Max results (default 50)
 *
 * Returns: Hospital[]
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const metro = searchParams.get("metro");
  const query = searchParams.get("q")?.toLowerCase();
  const type = searchParams.get("type");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  let results = SAMPLE_HOSPITALS;

  // Filter by metro
  if (metro) {
    const metroId = `metro-${metro.split("-")[0]}`;
    results = results.filter((h) => h.metroId === metroId);
  }

  // Search by name
  if (query) {
    results = results.filter(
      (h) =>
        h.name.toLowerCase().includes(query) ||
        h.systemName?.toLowerCase().includes(query) ||
        h.city?.toLowerCase().includes(query)
    );
  }

  // Filter by type
  if (type) {
    results = results.filter((h) => h.hospitalType === type);
  }

  return NextResponse.json({
    data: results.slice(0, limit),
    total: results.length,
    limit,
  });
}
