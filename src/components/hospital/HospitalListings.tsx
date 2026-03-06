"use client";

import { useState, useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import { ListingCard } from "@/components/listing/ListingCard";
import { SORT_OPTIONS } from "@/lib/constants";
import type { Listing, HospitalListingScore } from "@/types";

interface HospitalListingsProps {
  listings: { listing: Listing; score: HospitalListingScore }[];
  hospitalId: string;
}

export function HospitalListings({ listings, hospitalId }: HospitalListingsProps) {
  const [sortBy, setSortBy] = useState("score");
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [minBedrooms, setMinBedrooms] = useState<number | undefined>();
  const [furnishedOnly, setFurnishedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...listings];

    if (maxPrice) {
      result = result.filter(({ listing }) => listing.priceMonthly <= maxPrice);
    }
    if (minBedrooms !== undefined) {
      result = result.filter(({ listing }) => (listing.bedrooms ?? 0) >= minBedrooms);
    }
    if (furnishedOnly) {
      result = result.filter(({ listing }) => listing.isFurnished);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return a.listing.priceMonthly - b.listing.priceMonthly;
        case "price_desc":
          return b.listing.priceMonthly - a.listing.priceMonthly;
        case "distance":
          return a.score.straightLineMiles - b.score.straightLineMiles;
        default:
          return (b.score.proximityScore ?? 0) - (a.score.proximityScore ?? 0);
      }
    });

    return result;
  }, [listings, sortBy, maxPrice, minBedrooms, furnishedOnly]);

  const hasActiveFilters = maxPrice || minBedrooms !== undefined || furnishedOnly;

  return (
    <div>
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors ${
            showFilters || hasActiveFilters
              ? "bg-brand-50 border-brand-300 text-brand-800"
              : "border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-brand-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {[maxPrice, minBedrooms !== undefined, furnishedOnly].filter(Boolean).length}
            </span>
          )}
        </button>

        <span className="text-sm text-slate-500 ml-auto">
          {filtered.length} of {listings.length} listings
        </span>
      </div>

      {/* Inline filters */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Max price</label>
            <select
              value={maxPrice ?? ""}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
            >
              <option value="">Any</option>
              <option value="1000">Under $1,000</option>
              <option value="1500">Under $1,500</option>
              <option value="2000">Under $2,000</option>
              <option value="2500">Under $2,500</option>
              <option value="3000">Under $3,000</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Bedrooms</label>
            <div className="flex gap-1">
              {[
                { value: undefined, label: "Any" },
                { value: 0, label: "Studio" },
                { value: 1, label: "1+" },
                { value: 2, label: "2+" },
                { value: 3, label: "3+" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setMinBedrooms(opt.value)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                    minBedrooms === opt.value
                      ? "bg-brand-50 border-brand-300 text-brand-800"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={furnishedOnly}
              onChange={(e) => setFurnishedOnly(e.target.checked)}
              className="accent-brand-600"
            />
            <span className="text-sm text-slate-600">Furnished only</span>
          </label>
          {hasActiveFilters && (
            <button
              onClick={() => { setMaxPrice(undefined); setMinBedrooms(undefined); setFurnishedOnly(false); }}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Listings grid */}
      {filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(({ listing, score }) => (
            <ListingCard key={listing.id} listing={listing} score={score} hospitalId={hospitalId} source="hospital_page" />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <p className="text-slate-500">No listings match your filters.</p>
          <button
            onClick={() => { setMaxPrice(undefined); setMinBedrooms(undefined); setFurnishedOnly(false); }}
            className="text-sm text-brand-600 hover:text-brand-700 mt-2"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
