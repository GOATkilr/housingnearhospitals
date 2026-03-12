import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2, MapPin, Bed, Bath, Maximize, Armchair, PawPrint, Car,
  ArrowLeft, Sparkles, ExternalLink
} from "lucide-react";
import { getListingById, getScoresForListing, getMetroById } from "@/lib/queries";
import { sql } from "@/lib/db";
import { ScoreRing } from "@/components/score/ScoreRing";
import { CommuteBar } from "@/components/score/CommuteBar";
import { TrackListingView } from "@/components/analytics/TrackPageView";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const revalidate = 86400; // Revalidate daily

interface ListingPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const listing = await getListingById(params.id);
  if (!listing) return {};
  const bedLabel = listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bed`;
  const details = [
    bedLabel,
    listing.bathrooms ? `${listing.bathrooms} bath` : null,
    listing.sqft ? `${listing.sqft} sqft` : null,
  ].filter(Boolean).join(" / ");
  const fallback = `${listing.title} — ${formatPrice(listing.priceMonthly)}/mo ${details} in ${listing.city}, ${listing.stateCode}. Proximity-scored for healthcare workers.`;
  return {
    title: `${listing.title} | Housing Near Hospitals`,
    description: listing.description ?? fallback,
    openGraph: {
      images: listing.primaryImageUrl ? [{ url: listing.primaryImageUrl }] : [],
    },
  };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const listing = await getListingById(params.id);
  if (!listing) {
    notFound();
  }

  const [metro, nearbyHospitals] = await Promise.all([
    getMetroById(listing.metroId),
    getScoresForListing(listing.id),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Accommodation",
    name: listing.title,
    description: listing.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: listing.stateCode,
      postalCode: listing.zipCode,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: listing.location.lat,
      longitude: listing.location.lng,
    },
    floorSize: listing.sqft
      ? { "@type": "QuantitativeValue", value: listing.sqft, unitCode: "FTK" }
      : undefined,
    numberOfBedrooms: listing.bedrooms,
    numberOfBathroomsTotal: listing.bathrooms,
    offers: {
      "@type": "Offer",
      price: listing.priceMonthly,
      priceCurrency: "USD",
      unitCode: "MON",
    },
  };

  return (
    <div>
      <TrackListingView listingId={listing.id} priceMonthly={listing.priceMonthly} city={listing.city} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <section className="bg-gradient-to-b from-brand-900 to-brand-800 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/search"
            className="flex items-center gap-1.5 text-blue-300 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">{listing.title}</h1>
          <div className="flex items-center gap-2 mt-2 text-blue-300 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{listing.address}, {listing.city}, {listing.stateCode} {listing.zipCode}</span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Main content */}
          <div className="space-y-6">
            {/* Listing image */}
            <div
              className="bg-slate-100 rounded-xl h-72 bg-cover bg-center"
              style={{ backgroundImage: listing.primaryImageUrl ? `url(${listing.primaryImageUrl})` : undefined }}
            >
              {!listing.primaryImageUrl && (
                <div className="flex items-center justify-center h-full">
                  <Building2 className="w-16 h-16 text-slate-300" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold text-slate-900">
                  {formatPrice(listing.priceMonthly)}<span className="text-base font-normal text-slate-500">/mo</span>
                </span>
                <div className="flex gap-2">
                  {listing.isVerified && (
                    <span className="badge bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Verified
                    </span>
                  )}
                  {listing.isFurnished && (
                    <span className="badge bg-brand-100 text-brand-800">Furnished</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                <span className="flex items-center gap-1">
                  <Bed className="w-4 h-4" />
                  {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bed`}
                </span>
                {listing.bathrooms && (
                  <span className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    {listing.bathrooms} bath
                  </span>
                )}
                {listing.sqft && (
                  <span className="flex items-center gap-1">
                    <Maximize className="w-4 h-4" />
                    {listing.sqft} sqft
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {listing.isFurnished && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    <Armchair className="w-3 h-3" /> Furnished
                  </span>
                )}
                {listing.allowsPets && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    <PawPrint className="w-3 h-3" /> Pets OK
                  </span>
                )}
                {listing.hasParking && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    <Car className="w-3 h-3" /> Parking
                  </span>
                )}
                {listing.leaseMinMonths && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                    {listing.leaseMinMonths}mo min lease
                  </span>
                )}
              </div>

              {listing.description && (
                <p className="text-slate-600 text-sm leading-relaxed">{listing.description}</p>
              )}

              {/* Prominent CTA */}
              {(listing.affiliateUrl ?? listing.sourceUrl) && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <a
                    href={listing.affiliateUrl ?? listing.sourceUrl ?? "#"}
                    target="_blank"
                    rel="noopener sponsored"
                    className="btn-primary w-full text-center block text-lg py-3 flex items-center justify-center gap-2"
                  >
                    View Full Listing
                    <ExternalLink className="w-5 h-5" />
                  </a>
                  <p className="text-xs text-slate-400 text-center mt-2">
                    Opens in a new tab on the listing provider&apos;s site
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Nearby hospitals */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Nearby Hospitals</h2>
            {nearbyHospitals.length > 0 ? (
              nearbyHospitals.map(({ hospital, score }) => (
                <Link
                  key={hospital.id}
                  href={`/city/${metro?.slug ?? ""}/${hospital.slug}`}
                  className="block bg-white rounded-xl border border-slate-200 p-4 card-hover"
                >
                  <div className="flex items-start gap-3">
                    <ScoreRing score={score.proximityScore} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 line-clamp-1">{hospital.name}</p>
                      <CommuteBar
                        driveTimeDayMin={score.driveTimeDayMin ?? 0}
                        driveTimeNightMin={score.driveTimeNightMin ?? 0}
                        distanceMiles={score.straightLineMiles}
                        proximityScore={score.proximityScore}
                      />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-400">No scored hospitals yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Similar Listings */}
        <SimilarListings listingId={listing.id} metroId={listing.metroId} priceMonthly={listing.priceMonthly} bedrooms={listing.bedrooms} />
      </div>
    </div>
  );
}

async function SimilarListings({
  listingId,
  metroId,
  priceMonthly,
  bedrooms,
}: {
  listingId: string;
  metroId: string;
  priceMonthly: number;
  bedrooms?: number;
}) {
  const priceLow = Math.floor(priceMonthly * 0.7);
  const priceHigh = Math.ceil(priceMonthly * 1.3);

  const rows = await sql`
    SELECT *, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
    FROM listings
    WHERE metro_id = ${metroId}
      AND id != ${listingId}
      AND status = 'active'
      AND deleted_at IS NULL
      AND price_monthly BETWEEN ${priceLow} AND ${priceHigh}
      AND (${bedrooms ?? null}::int IS NULL OR bedrooms = ${bedrooms ?? null})
    ORDER BY listing_quality_score DESC NULLS LAST
    LIMIT 6
  `;

  if (rows.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Similar Listings</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rows.map((r) => (
          <Link
            key={r.id as string}
            href={`/listing/${r.id}`}
            className="block bg-white rounded-xl border border-slate-200 overflow-hidden card-hover"
          >
            <div className="relative h-36 bg-slate-100">
              {r.primary_image_url && (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${r.primary_image_url})` }}
                />
              )}
              <div className="absolute bottom-2 left-2">
                <span className="bg-slate-900/80 text-white px-2 py-1 rounded-lg text-sm font-bold backdrop-blur-sm">
                  {formatPrice(r.price_monthly as number)}<span className="text-xs font-normal text-slate-300">/mo</span>
                </span>
              </div>
            </div>
            <div className="p-3">
              <p className="font-semibold text-sm text-slate-900 line-clamp-1">{r.title as string}</p>
              <p className="text-xs text-slate-500 mt-1">
                {r.bedrooms === 0 ? "Studio" : `${r.bedrooms} bed`}
                {r.bathrooms ? ` / ${r.bathrooms} bath` : ""}
                {r.sqft ? ` / ${r.sqft} sqft` : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
