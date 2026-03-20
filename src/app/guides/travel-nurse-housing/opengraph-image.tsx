import { createOGImage, ogLogo, ogTitle, ogSubtitle, ogFooter, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Travel Nurse Housing Guide";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OGImage() {
  return createOGImage(
    <>
      {ogLogo()}
      {ogTitle("Travel Nurse Housing Guide")}
      {ogSubtitle("Stipends, furnished rentals, and neighborhoods")}
      {ogFooter()}
    </>
  );
}
