import { getListingById } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";
import { createOGImage, ogLogo, ogTitle, ogStat, ogFooter, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Housing Near Hospitals";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OGImage({ params }: { params: { id: string } }) {
  const listing = await getListingById(params.id);

  if (!listing) {
    return createOGImage(
      <>
        {ogLogo()}
        {ogTitle("Housing Near Hospitals")}
        {ogFooter()}
      </>
    );
  }

  const bedLabel = listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} Bed`;
  const location = [listing.city, listing.stateCode].filter(Boolean).join(", ");

  return createOGImage(
    <>
      {ogLogo()}
      {ogTitle(listing.title)}
      {location && (
        <p style={{ fontSize: "24px", color: "#93c5fd", marginTop: "8px" }}>{location}</p>
      )}
      <div style={{ display: "flex", gap: "40px", marginTop: "32px" }}>
        {ogStat(formatPrice(listing.priceMonthly), "Per Month")}
        {ogStat(bedLabel, "Bedrooms")}
        {listing.bathrooms && ogStat(`${listing.bathrooms}`, "Bath")}
        {listing.sqft && ogStat(`${listing.sqft}`, "Sqft")}
      </div>
      {ogFooter()}
    </>
  );
}
