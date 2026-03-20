import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listingId, hospitalId, eventType, source, affiliateUrl } = body;

    if (!listingId) {
      return NextResponse.json({ error: "listingId required" }, { status: 400 });
    }

    // Hash IP for privacy
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

    await sql`
      INSERT INTO click_events (listing_id, hospital_id, event_type, source, affiliate_url, ip_hash, user_agent)
      VALUES (
        ${listingId}::uuid,
        ${hospitalId ?? null}::uuid,
        ${eventType ?? "click"},
        ${source ?? null},
        ${affiliateUrl ?? null},
        ${ipHash},
        ${userAgent}
      )
    `;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Fire-and-forget — don't fail the client
  }
}
