"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Building2, MapPin, Bed, Star, Phone, Globe, AlertCircle,
  GraduationCap, ArrowLeft, ExternalLink
} from "lucide-react";
import { SAMPLE_HOSPITALS, SAMPLE_LISTINGS } from "@/lib/sample-data";
import { LAUNCH_METROS } from "@/lib/constants";
import { ListingCard } from "@/components/listing/ListingCard";
import { ScoreRing } from "@/components/score/ScoreRing";
import { calculateFullProximityScore } from "@/lib/scoring";
import { formatNumber } from "@/lib/utils";
import type { HospitalListingScore } from "@/types";

export default function HospitalPage() {
  const params = useParams();
  const slug = params.slug as string;
  const hospitalSlug = params.hospitalSlug as string;

  const metro = LAUNCH_METROS.find((m) => m.slug === slug);
  const hospital = SAMPLE_HOSPITALS.find((h) => h.slug === hospitalSlug);

  const scoredListings = useMemo(() => {
    if (!hospital || !metro) return [];

    return SAMPLE_LISTINGS
      .filter((l) => l.metroId === hospital.metroId)
      .map((listing) => {
        const scoreData = calculateFullProximityScore(
          hospital.location.lat,
          hospital.location.lng,
          listing.location.lat,
          listing.location.lng,
          metro.circuityFactor
        );

        const score: HospitalListingScore = {
          id: `${hospital.id}-${listing.id}`,
          hospitalId: hospital.id,
          listingId: listing.id,
          straightLineMiles: scoreData.straightLineMiles,
          estimatedDriveMiles: scoreData.estimatedDriveMiles,
          driveTimeDayMin: scoreData.driveTimeDayMin,
          driveTimeNightMin: scoreData.driveTimeNightMin,
          proximityScore: scoreData.proximityScore,
          calculationMethod: "haversine",
        };

        return { listing, score };
      })
      .sort((a, b) => b.score.proximityScore - a.score.proximityScore);
  }, [hospital, metro]);

  if (!hospital || !metro) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <h1 className="text-2xl font-bold text-slate-900">Hospital not found</h1>
        <p className="text-slate-500 mt-2">This hospital doesn&apos;t exist in our database yet.</p>
        <Link href={`/city/${slug}`} className="btn-primary inline-block mt-6">
          Back to {metro?.name ?? "city"}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb + Hospital Header */}
      <section className="bg-gradient-to-b from-brand-900 to-brand-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={`/city/${slug}`}
            className="flex items-center gap-1.5 text-blue-300 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {metro.name} Hospitals
          </Link>

          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Hospital info */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">{hospital.name}</h1>

              {hospital.systemName && (
                <p className="text-blue-200 mt-1">{hospital.systemName}</p>
              )}

              <div className="flex items-center gap-2 mt-3 text-sm text-blue-300">
                <MapPin className="w-4 h-4" />
                <span>{hospital.address}, {hospital.city}, {hospital.stateCode} {hospital.zipCode}</span>
              </div>

              {/* Meta badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="badge bg-white/10 text-white">{hospital.hospitalType}</span>
                {hospital.bedCount && (
                  <span className="badge bg-white/10 text-white flex items-center gap-1">
                    <Bed className="w-3 h-3" />
                    {formatNumber(hospital.bedCount)} beds
                  </span>
                )}
                {hospital.traumaLevel && (
                  <span className="badge bg-red-500/20 text-red-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {hospital.traumaLevel}
                  </span>
                )}
                {hospital.teachingStatus === "Major" && (
                  <span className="badge bg-purple-500/20 text-purple-200 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    Teaching Hospital
                  </span>
                )}
                {hospital.cmsOverallRating && (
                  <span className="badge bg-amber-500/20 text-amber-200 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {hospital.cmsOverallRating}/5 CMS Rating
                  </span>
                )}
              </div>

              {/* Contact */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                {hospital.phone && (
                  <a href={`tel:${hospital.phone}`} className="flex items-center gap-1.5 text-blue-200 hover:text-white">
                    <Phone className="w-4 h-4" />
                    {hospital.phone}
                  </a>
                )}
                {hospital.website && (
                  <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-200 hover:text-white">
                    <Globe className="w-4 h-4" />
                    Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Housing near {hospital.name}
            </h2>
            <span className="text-sm text-slate-500">
              {scoredListings.length} {scoredListings.length === 1 ? "listing" : "listings"}
            </span>
          </div>

          {scoredListings.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {scoredListings.map(({ listing, score }) => (
                <ListingCard key={listing.id} listing={listing} score={score} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-50 rounded-xl">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No listings found near this hospital yet.</p>
              <p className="text-sm text-slate-400 mt-1">New listings are added weekly.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
