import { createOGImage, ogLogo, ogTitle, ogSubtitle, ogFooter, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Pet-Friendly Housing Near Hospitals";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OGImage() {
  return createOGImage(
    <>
      {ogLogo()}
      {ogTitle("Pet-Friendly Housing Near Hospitals")}
      {ogSubtitle("Listings that welcome your furry companions")}
      {ogFooter()}
    </>
  );
}
