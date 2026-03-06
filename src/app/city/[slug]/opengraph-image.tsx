import { ImageResponse } from "next/og";
import { getMetroBySlug, getHospitalsByMetro } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";

export const runtime = "edge";
export const alt = "Housing Near Hospitals";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: { slug: string } }) {
  const metro = await getMetroBySlug(params.slug);
  if (!metro) {
    return new ImageResponse(
      (
        <div style={{ background: "#0f172a", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "48px", fontFamily: "sans-serif" }}>
          Housing Near Hospitals
        </div>
      ),
      { ...size }
    );
  }

  const hospitals = await getHospitalsByMetro(metro.slug);
  const avgRent = metro.avgRent1br ? formatPrice(metro.avgRent1br) : null;

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              backgroundColor: "#2563eb",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
            }}
          >
            🏥
          </div>
          <span style={{ fontSize: "24px", fontWeight: 600, color: "#93c5fd" }}>
            Housing Near Hospitals
          </span>
        </div>

        <p style={{ fontSize: "52px", fontWeight: 700, color: "white", margin: 0, textAlign: "center" }}>
          {metro.name}
        </p>

        <div
          style={{
            display: "flex",
            gap: "40px",
            marginTop: "40px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "42px", fontWeight: 700, color: "#34d399" }}>
              {hospitals.length}
            </span>
            <span style={{ fontSize: "18px", color: "#94a3b8", marginTop: "4px" }}>
              Hospitals
            </span>
          </div>
          {avgRent && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "42px", fontWeight: 700, color: "#34d399" }}>
                {avgRent}
              </span>
              <span style={{ fontSize: "18px", color: "#94a3b8", marginTop: "4px" }}>
                Avg 1BR Rent
              </span>
            </div>
          )}
        </div>

        <p style={{ fontSize: "20px", color: "#94a3b8", marginTop: "32px" }}>
          Proximity-scored housing for healthcare workers
        </p>
      </div>
    ),
    { ...size }
  );
}
