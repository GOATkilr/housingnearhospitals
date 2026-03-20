import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const BG_GRADIENT = "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)";
const BRAND_BLUE = "#2563eb";
const EMERALD = "#34d399";
const LIGHT_BLUE = "#93c5fd";
const SLATE = "#94a3b8";

export function ogBackground(): React.CSSProperties {
  return {
    background: BG_GRADIENT,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "60px",
    fontFamily: "sans-serif",
  };
}

export function ogLogo(): JSX.Element {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
      <div
        style={{
          width: "48px",
          height: "48px",
          backgroundColor: BRAND_BLUE,
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
        }}
      >
        🏥
      </div>
      <span style={{ fontSize: "22px", fontWeight: 600, color: LIGHT_BLUE }}>
        Housing Near Hospitals
      </span>
    </div>
  );
}

export function ogTitle(text: string): JSX.Element {
  return (
    <p style={{ fontSize: "48px", fontWeight: 700, color: "white", margin: 0, lineHeight: 1.2 }}>
      {text}
    </p>
  );
}

export function ogSubtitle(text: string): JSX.Element {
  return (
    <p style={{ fontSize: "24px", color: LIGHT_BLUE, marginTop: "16px" }}>
      {text}
    </p>
  );
}

export function ogStat(value: string, label: string): JSX.Element {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{ fontSize: "40px", fontWeight: 700, color: EMERALD }}>{value}</span>
      <span style={{ fontSize: "16px", color: SLATE, marginTop: "4px" }}>{label}</span>
    </div>
  );
}

export function ogFooter(): JSX.Element {
  return (
    <p style={{ fontSize: "18px", color: SLATE, marginTop: "auto" }}>
      Proximity-scored housing for healthcare workers
    </p>
  );
}

export function createOGImage(children: JSX.Element): ImageResponse {
  return new ImageResponse(
    <div style={ogBackground()}>{children}</div>,
    { ...OG_SIZE }
  );
}
