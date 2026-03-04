import { NextResponse } from "next/server";
import { getAllListings } from "@/lib/queries";

export async function GET() {
  const listings = await getAllListings();
  return NextResponse.json({
    data: listings,
    total: listings.length,
  });
}
