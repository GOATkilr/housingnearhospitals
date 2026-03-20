"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Bed, Bath, Maximize, Armchair, PawPrint, Car, Sparkles } from "lucide-react";
import type { Listing, HospitalListingScore } from "@/types";
import { ScoreRing } from "@/components/score/ScoreRing";
import { CommuteBar } from "@/components/score/CommuteBar";
import { formatPrice, cn } from "@/lib/utils";
import { trackAffiliateClick } from "@/lib/analytics";

interface ListingCardProps {
  listing: Listing;
  score?: HospitalListingScore;
  hospitalId?: string;
  source?: string;
  className?: string;
}

export function ListingCard({ listing, score, hospitalId, source, className }: ListingCardProps) {
  const displayScore = score?.proximityScore ?? listing.listingQualityScore ?? 0;
  const resolvedHospitalId = hospitalId ?? score?.hospitalId;

  function handleAffiliateClick() {
    const url = listing.affiliateUrl ?? listing.sourceUrl;
    // Fire-and-forget click tracking
    const payload = JSON.stringify({
      listingId: listing.id,
      hospitalId: resolvedHospitalId,
      eventType: "click",
      source: source ?? "listing_card",
      affiliateUrl: url,
    });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/v1/clicks", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/v1/clicks", { method: "POST", body: payload, keepalive: true });
    }
    trackAffiliateClick({ listingId: listing.id, hospitalId: resolvedHospitalId, source: source ?? "listing_card" });
  }

  const [imgError, setImgError] = useState(false);

  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 overflow-hidden card-hover", className)}>
      {/* Image */}
      <div className="relative h-48 bg-slate-100">
        {listing.primaryImageUrl && !imgError ? (
          <Image
            src={listing.primaryImageUrl}
            alt={listing.title}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <Building2Icon className="w-12 h-12" />
          </div>
        )}

        {/* Price overlay */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-slate-900/80 text-white px-3 py-1.5 rounded-lg text-lg font-bold backdrop-blur-sm">
            {formatPrice(listing.priceMonthly)}
            <span className="text-sm font-normal text-slate-300">/mo</span>
          </span>
        </div>

        {/* Score overlay */}
        {score && (
          <div className="absolute top-3 right-3">
            <ScoreRing score={displayScore} size="sm" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {listing.isVerified && (
            <span className="bg-emerald-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Verified
            </span>
          )}
          {listing.isFurnished && (
            <span className="bg-brand-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              Furnished
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-slate-900 line-clamp-1">{listing.title}</h3>

        {/* Unit details */}
        <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
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

        {/* Feature pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {listing.isFurnished && (
            <FeaturePill icon={Armchair} label="Furnished" />
          )}
          {listing.allowsPets && (
            <FeaturePill icon={PawPrint} label="Pets OK" />
          )}
          {listing.hasParking && (
            <FeaturePill icon={Car} label="Parking" />
          )}
          {listing.leaseMinMonths && listing.leaseMinMonths <= 3 && (
            <span className="badge-amber text-[10px]">
              {listing.leaseMinMonths}mo min
            </span>
          )}
        </div>

        {/* Commute bar (if score provided) */}
        {score && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <CommuteBar
              driveTimeDayMin={score.driveTimeDayMin ?? 0}
              driveTimeNightMin={score.driveTimeNightMin ?? 0}
              distanceMiles={score.straightLineMiles}
              proximityScore={score.proximityScore}
            />
          </div>
        )}

        {/* CTA */}
        <div className="mt-4">
          <Link
            href={listing.affiliateUrl ?? listing.sourceUrl ?? `/listing/${listing.id}`}
            className="btn-primary w-full text-sm text-center block"
            target={listing.affiliateUrl ? "_blank" : undefined}
            rel={listing.affiliateUrl ? "noopener sponsored" : undefined}
            onClick={listing.affiliateUrl ? handleAffiliateClick : undefined}
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeaturePill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium">
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function Building2Icon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
    </svg>
  );
}
