import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2, MapPin, Bed, Bath, Maximize, Armchair, PawPrint, Car,
  ArrowLeft, Sparkles
} from "lucide-react";
import { SAMPLE_LISTINGS, SAMPLE_HOSPITALS } from "@/lib/sample-data";
import { getMetroById } from "@/lib/constants";
import { calculateFullProximityScore } from "@/lib/scoring";
import { ScoreRing } from "@/components/score/ScoreRing";
import { CommuteBar } from "@/components/score/CommuteBar";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

interface ListingPageProps {
  params: { id: string };
}

export async function generateStaticParams() {
  return SAMPLE_LISTINGS.map((listing) => ({ id: listing.id }));
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const listing = SAMPLE_LISTINGS.find((l) => l.id === params.id);
  if (!listing) return {};
  return {
    title: `${listing.title} | Housing Near Hospitals`,
    description: listing.description ?? `${listing.title} - ${formatPrice(listing.priceMonthly)}/mo in ${listing.city}, ${listing.stateCode}`,
  };
}

export default function ListingPage({ params }: ListingPageProps) {
  const listing = SAMPLE_LISTINGS.find((l) => l.id === params.id);
  if (!listing) {
    notFound();
  }

  const metro = getMetroById(listing.metroId);
  const nearbyHospitals = SAMPLE_HOSPITALS
    .filter((h) => h.metroId === listing.metroId)
    .map((hospital) => {
      const scoreData = calculateFullProximityScore(
        hospital.location.lat,
        hospital.location.lng,
        listing.location.lat,
        listing.location.lng,
        metro?.circuityFactor ?? 1.3
      );
      return { hospital, scoreData };
    })
    .sort((a, b) => b.scoreData.proximityScore - a.scoreData.proximityScore);

  return (
    <div>
      {/* Header */}
      <section className="bg-brand-navy text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/search"
            className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{listing.title}</h1>
          <div className="flex items-center gap-2 mt-2 text-gray-300 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{listing.address}, {listing.city}, {listing.stateCode} {listing.zipCode}</span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Main content */}
          <div className="space-y-6">
            {/* Image placeholder */}
            <div className="bg-brand-light rounded-brand h-72 flex items-center justify-center">
              <Building2 className="w-16 h-16 text-slate-300" />
            </div>

            {/* Details */}
            <div className="bg-white rounded-brand border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold text-brand-navy">
                  {formatPrice(listing.priceMonthly)}<span className="text-base font-normal text-brand-slate">/mo</span>
                </span>
                <div className="flex gap-2">
                  {listing.isVerified && (
                    <span className="badge bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Verified
                    </span>
                  )}
                  {listing.isFurnished && (
                    <span className="badge bg-blue-50 text-brand-blue">Furnished</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-brand-slate mb-4">
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
                <p className="text-brand-slate text-sm leading-relaxed">{listing.description}</p>
              )}
            </div>
          </div>

          {/* Sidebar: Nearby hospitals */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Nearby Hospitals</h2>
            {nearbyHospitals.map(({ hospital, scoreData }) => (
              <Link
                key={hospital.id}
                href={`/city/${metro?.slug ?? ""}/${hospital.slug}`}
                className="block bg-white rounded-brand border border-gray-200 p-4 card-hover"
              >
                <div className="flex items-start gap-3">
                  <ScoreRing score={scoreData.proximityScore} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-brand-navy line-clamp-1">{hospital.name}</p>
                    <CommuteBar
                      driveTimeDayMin={scoreData.driveTimeDayMin}
                      driveTimeNightMin={scoreData.driveTimeNightMin}
                      distanceMiles={scoreData.straightLineMiles}
                      proximityScore={scoreData.proximityScore}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
