"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, List, Map as MapIcon } from "lucide-react";
import { HospitalSearch } from "@/components/search/HospitalSearch";
import { FilterPanel } from "@/components/search/FilterPanel";
import { ListingCard } from "@/components/listing/ListingCard";
import type { Hospital, SearchFilters, HospitalListingScore } from "@/types";

interface SearchResultItem {
  listing: {
    id: string;
    title: string;
    propertyType: string;
    location: { lat: number; lng: number };
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    priceMonthly: number;
    isFurnished: boolean;
    leaseMinMonths?: number;
    allowsPets: boolean;
    hasParking: boolean;
    hasInUnitLaundry: boolean;
    amenities: string[];
    primaryImageUrl?: string;
    imageCount: number;
    listingQualityScore?: number;
    status: string;
    isVerified: boolean;
    [key: string]: unknown;
  };
  score: {
    straightLineMiles: number;
    driveTimeDayMin?: number;
    driveTimeNightMin?: number;
    proximityScore: number;
    combinedScore?: number;
  };
}

export default function SearchPage() {
  const [allHospitals, setAllHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({ sortBy: "score" });
  const [view, setView] = useState<"list" | "map">("list");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all hospitals for search
  useEffect(() => {
    fetch("/api/v1/hospitals?limit=100")
      .then((r) => r.json())
      .then((data) => setAllHospitals(data.data ?? []))
      .catch(() => {});
  }, []);

  // Fetch search results when hospital or filters change
  const fetchResults = useCallback(async () => {
    if (!selectedHospital) {
      setResults([]);
      return;
    }
    setLoading(true);

    const params = new URLSearchParams({
      hospital_id: selectedHospital.id,
      sort: filters.sortBy ?? "score",
      limit: "50",
    });
    if (filters.maxPrice) params.set("max_price", String(filters.maxPrice));
    if (filters.minBedrooms !== undefined) params.set("min_bedrooms", String(filters.minBedrooms));
    if (filters.isFurnished) params.set("furnished", "true");
    if (filters.allowsPets) params.set("pets", "true");
    if (filters.hasParking) params.set("parking", "true");
    if (filters.minScore) params.set("min_score", String(filters.minScore));

    try {
      const r = await fetch(`/api/v1/search?${params}`);
      const data = await r.json();
      setResults(data.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedHospital, filters]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Search Header */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Find housing near your hospital</h1>
          <HospitalSearch
            hospitals={allHospitals}
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
                  <strong>{results.length}</strong> listings near{" "}
                  <strong>{selectedHospital.name}</strong>
                  {loading && <span className="ml-2 text-slate-400">Loading...</span>}
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

              {results.length > 0 ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {results.map(({ listing, score }) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing as unknown as import("@/types").Listing}
                      score={score as unknown as HospitalListingScore}
                    />
                  ))}
                </div>
              ) : !loading ? (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                  <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">No listings match your filters.</p>
                  <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or searching a different hospital.</p>
                </div>
              ) : null}
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
