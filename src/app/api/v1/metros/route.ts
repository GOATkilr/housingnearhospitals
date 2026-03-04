import { NextResponse } from "next/server";
import { getMetros } from "@/lib/queries";

export async function GET() {
  const metros = await getMetros();
  return NextResponse.json({
    data: metros,
    total: metros.length,
  });
}
