import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const bedrooms = searchParams.get("bedrooms") ?? "1";
  const propertyType = searchParams.get("propertyType") ?? "Apartment";

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY;
  if (!RENTCAST_API_KEY) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  // Build RentCast AVM URL
  const url = new URL("https://api.rentcast.io/v1/avm/rent/long-term");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lng);
  url.searchParams.set("bedrooms", bedrooms);
  url.searchParams.set("propertyType", propertyType);
  url.searchParams.set("compCount", "5");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "X-Api-Key": RENTCAST_API_KEY,
        "Accept": "application/json",
      },
      // Cache for 24 hours server-side
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`RentCast AVM error: ${res.status} — ${body.slice(0, 200)}`);
      return NextResponse.json(
        { error: "Failed to fetch rent estimate" },
        { status: res.status === 429 ? 429 : 502 }
      );
    }

    const data = await res.json();

    // Return simplified response
    return NextResponse.json({
      rent: data.rent,
      rentRangeLow: data.rentRangeLow,
      rentRangeHigh: data.rentRangeHigh,
      bedrooms: parseInt(bedrooms),
      propertyType,
      comparables: (data.comparables ?? []).slice(0, 5).map((c: Record<string, unknown>) => ({
        formattedAddress: c.formattedAddress,
        price: c.price,
        bedrooms: c.bedrooms,
        bathrooms: c.bathrooms,
        squareFootage: c.squareFootage,
        distance: c.distance,
      })),
    });
  } catch (err) {
    console.error("Rent estimate error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
