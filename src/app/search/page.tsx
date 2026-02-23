"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Building2, List, Map as MapIcon } from "lucide-react";
import { SAMPLE_HOSPITALS, SAMPLE_LISTINGS } from "@/lib/sample-data";
import { LAUNCH_METROS } from "@/lib/constants";
import { HospitalSearch } from "@/components/search/HospitalSearch";
import { FilterPanel } from "@/components/search/FilterPanel";
import { ListingCard } from "@/components/listing/ListingCard";
import { ScoreRing } from "@/components/score/ScoreRing";
import { calculateFullProximityScore } from "@/lib/scoring";
import type { Hospital, SearchFilters, HospitalListingScore } from "@/types";

export default function SearchPage() {
  const router = useRouter();
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({ sortBy: "score" });
  const [view, setView] = useState<"list" | "map">("list");

  const metro = selectedHospital
    ? LAUNCH_METROS.find((m) => {
        const metroSlug = selectedHospital.metroId.replace("metro-", "");
        return m.slug.startsWith(metroSlug);
      })
    : null;

  const scoredListings = useMemo(() => {
    if (!selectedHospital) return [];

    const metroData = LAUNCH_METROS.find((m) => {
      const metroSlug = selectedHospital.metroId.replace("metro-", "");
      return m.slug.startsWith(metroSlug);
    });

    let results = SAMPLE_LISTINGS
      .filter((l) => l.metroId === selectedHospital.metroId)
      .map((listing) => {
        const scoreData = calculateFullProximityScore(
          selectedHospital.location.lat,
          selectedHospital.location.lng,
          listing.location.lat,
          listing.location.lng,
          metroData?.circuityFactor ?? 1.3
        );

        const score: HospitalListingScore = {
          id: `${selectedHospital.id}-${listing.id}`,
          hospitalId: selectedHospital.id,
          listingId: listing.id,
          straightLineMiles: scoreData.straightLineMiles,
          estimatedDriveMiles: scoreData.estimatedDriveMiles,
          driveTimeDayMin: scoreData.driveTimeDayMin,
          driveTimeNightMin: scoreData.driveTimeNightMin,
          proximityScore: scoreData.proximityScore,
          calculationMethod: "haversine",
        };

        return { listing, score };
      });

    // Apply filters
    if (filters.maxPrice) {
      results = results.filter((r) => r.listing.priceMonthly <= filters.maxPrice!);
    }
    if (filters.minBedrooms !== undefined) {
      results = results.filter((r) => (r.listing.bedrooms ?? 0) >= filters.minBedrooms!);
    }
    if (filters.isFurnished) {
      results = results.filter((r) => r.listing.isFurnished);
    }
    if (filters.allowsPets) {
      results = results.filter((r) => r.listing.allowsPets);
    }
    if (filters.hasParking) {
      results = results.filter((r) => r.listing.hasParking);
    }
    if (filters.minScore) {
      results = results.filter((r) => r.score.proximityScore >= filters.minScore!);
    }

    // Sort
    switch (filters.sortBy) {
      case "price_asc":
        results.sort((a, b) => a.listing.priceMonthly - b.listing.priceMonthly);
        break;
      case "price_desc":
        results.sort((a, b) => b.listing.priceMonthly - a.listing.priceMonthly);
        break;
      case "distance":
        results.sort((a, b) => a.score.straightLineMiles - b.score.straightLineMiles);
        break;
      default:
        results.sort((a, b) => b.score.proximityScore - a.score.proximityScore);
    }

    return results;
  }, [selectedHospital, filters]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Search Header */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Find housing near your hospital</h1>
          <HospitalSearch
            hospitals={SAMPLE_HOSPITALS}
            onSelect={(h) => setSelectedHospital(h)}
            placeholder="Start typing a hospital name..."
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedHospital ? (
          <div className="grid lg:grid-cols-[280px_1fr] gap-6">
            {/* Sidebar */}
            <div className="space-y-4">
              {/* Selected hospital summary */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-brand-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 line-clamp-1">
                      {selectedHospital.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedHospital.city}, {selectedHospital.stateCode}
                    </p>
                  </div>
                </div>
              </div>

              <FilterPanel filters={filters} onChange={setFilters} />
            </div>

            {/* Results */}
            <div>
              {/* Results header */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-600">
                  <strong>{scoredListings.length}</strong> listings near{" "}
                  <strong>{selectedHospital.name}</strong>
                </p>
                <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1">
                  <button
                    onClick={() => setView("list")}
                    className={`p-1.5 rounded ${view === "list" ? "bg-brand-50 text-brand-700" : "text-slate-400"}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView("map")}
                    className={`p-1.5 rounded ${view === "map" ? "bg-brand-50 text-brand-700" : "text-slate-400"}`}
                  >
                    <MapIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {scoredListings.length > 0 ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {scoredListings.map(({ listing, score }) => (
                    <ListingCard key={listing.id} listing={listing} score={score} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                  <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">No listings match your filters.</p>
                  <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or searching a different hospital.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-brand-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Search for a hospital</h2>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              Start by selecting the hospital where you work or will be working.
              We&apos;ll show you all nearby housing scored by commute time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
