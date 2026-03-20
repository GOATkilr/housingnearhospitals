import { getHospitalBySlug, getMetroBySlug, getScoresForHospital } from "@/lib/queries";
import { formatNumber, formatPrice } from "@/lib/utils";
import { createOGImage, ogLogo, ogTitle, ogStat, ogFooter, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Housing Near Hospitals";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OGImage({
  params,
}: {
  params: { slug: string; hospitalSlug: string };
}) {
  const [hospital, metro] = await Promise.all([
    getHospitalBySlug(params.hospitalSlug),
    getMetroBySlug(params.slug),
  ]);

  if (!hospital || !metro) {
    return createOGImage(
      <>
        {ogLogo()}
        {ogTitle("Housing Near Hospitals")}
        {ogFooter()}
      </>
    );
  }

  const scoredListings = await getScoresForHospital(hospital.id);
  const prices = scoredListings.map(({ listing }) => listing.priceMonthly).filter(Boolean);
  const minPrice = prices.length > 0 ? formatPrice(Math.min(...prices)) : null;

  return createOGImage(
    <>
      {ogLogo()}
      {ogTitle(hospital.name)}
      <p style={{ fontSize: "24px", color: "#93c5fd", marginTop: "8px" }}>
        {metro.name}
      </p>
      <div style={{ display: "flex", gap: "40px", marginTop: "32px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "22px", color: "white", fontWeight: 600 }}>
            {hospital.hospitalType}
          </span>
          <span style={{ fontSize: "16px", color: "#94a3b8", marginTop: "4px" }}>Type</span>
        </div>
        {hospital.bedCount && ogStat(formatNumber(hospital.bedCount), "Beds")}
        {hospital.cmsOverallRating && ogStat(`${hospital.cmsOverallRating}/5`, "CMS Rating")}
        {scoredListings.length > 0 && ogStat(String(scoredListings.length), "Listings")}
        {minPrice && ogStat(minPrice, "From/mo")}
      </div>
      {ogFooter()}
    </>
  );
}
