import { createOGImage, ogLogo, ogTitle, ogSubtitle, ogFooter, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Housing Near Teaching Hospitals";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OGImage() {
  return createOGImage(
    <>
      {ogLogo()}
      {ogTitle("Housing Near Teaching Hospitals")}
      {ogSubtitle("Find housing near major teaching hospitals for residents and fellows")}
      {ogFooter()}
    </>
  );
}
