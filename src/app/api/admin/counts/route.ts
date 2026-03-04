import { NextResponse } from "next/server";
import { getAdminCounts } from "@/lib/queries";

export async function GET() {
  const counts = await getAdminCounts();
  return NextResponse.json(counts);
}
