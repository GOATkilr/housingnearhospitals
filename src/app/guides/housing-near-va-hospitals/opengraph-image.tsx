import { createOGImage, ogLogo, ogTitle, ogSubtitle, ogFooter, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Housing Near VA Hospitals";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OGImage() {
  return createOGImage(
    <>
      {ogLogo()}
      {ogTitle("Housing Near VA Hospitals")}
      {ogSubtitle("Apartments and rentals near Veterans Affairs medical centers")}
      {ogFooter()}
    </>
  );
}
