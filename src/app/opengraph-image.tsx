import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Housing Near Hospitals — Live closer. Commute less. Care more.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              backgroundColor: "#2563eb",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
            }}
          >
            🏥
          </div>
          <span
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "white",
            }}
          >
            Housing Near Hospitals
          </span>
        </div>
        <p
          style={{
            fontSize: "28px",
            color: "#93c5fd",
            margin: 0,
          }}
        >
          Live closer. Commute less. Care more.
        </p>
        <p
          style={{
            fontSize: "20px",
            color: "#94a3b8",
            marginTop: "16px",
          }}
        >
          Proximity-scored housing for healthcare workers
        </p>
      </div>
    ),
    { ...size }
  );
}
