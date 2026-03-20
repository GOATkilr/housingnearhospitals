import { createOGImage, ogLogo, ogTitle, ogSubtitle, ogFooter, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Best Cities for Travel Nurses";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OGImage() {
  return createOGImage(
    <>
      {ogLogo()}
      {ogTitle("Best Cities for Travel Nurses")}
      {ogSubtitle("Compare metros by rent, hospitals, and quality of life")}
      {ogFooter()}
    </>
  );
}
