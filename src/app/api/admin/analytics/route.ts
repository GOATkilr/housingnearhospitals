import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [dailyClicks, topHospitals, topListings, totals] = await Promise.all([
      sql`
        SELECT DATE(created_at) AS day, COUNT(*)::int AS clicks
        FROM click_events
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY day DESC
        LIMIT 30
      `,
      sql`
        SELECT ce.hospital_id, h.name AS hospital_name, COUNT(*)::int AS clicks
        FROM click_events ce
        JOIN hospitals h ON h.id = ce.hospital_id
        WHERE ce.hospital_id IS NOT NULL
          AND ce.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY ce.hospital_id, h.name
        ORDER BY clicks DESC
        LIMIT 10
      `,
      sql`
        SELECT ce.listing_id, l.title AS listing_title, l.city, COUNT(*)::int AS clicks
        FROM click_events ce
        JOIN listings l ON l.id = ce.listing_id
        WHERE ce.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY ce.listing_id, l.title, l.city
        ORDER BY clicks DESC
        LIMIT 10
      `,
      sql`
        SELECT
          COUNT(*)::int AS total_clicks,
          COUNT(DISTINCT listing_id)::int AS unique_listings_clicked,
          COUNT(DISTINCT hospital_id)::int AS unique_hospitals,
          COUNT(DISTINCT ip_hash)::int AS unique_visitors
        FROM click_events
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `,
    ]);

    return NextResponse.json({
      dailyClicks: dailyClicks.map((r) => ({
        day: r.day,
        clicks: r.clicks as number,
      })),
      topHospitals: topHospitals.map((r) => ({
        hospitalId: r.hospital_id,
        hospitalName: r.hospital_name,
        clicks: r.clicks as number,
      })),
      topListings: topListings.map((r) => ({
        listingId: r.listing_id,
        listingTitle: r.listing_title,
        city: r.city,
        clicks: r.clicks as number,
      })),
      totals: {
        totalClicks: (totals[0]?.total_clicks as number) ?? 0,
        uniqueListingsClicked: (totals[0]?.unique_listings_clicked as number) ?? 0,
        uniqueHospitals: (totals[0]?.unique_hospitals as number) ?? 0,
        uniqueVisitors: (totals[0]?.unique_visitors as number) ?? 0,
      },
    });
  } catch (err) {
    console.error("Analytics query failed:", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
