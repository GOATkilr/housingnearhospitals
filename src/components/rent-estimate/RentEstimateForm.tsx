"use client";

import { useState } from "react";
import { DollarSign, Search, Building2, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface Hospital {
  id: string;
  name: string;
  slug: string;
  location: { lat: number; lng: number };
  metroSlug?: string;
  city?: string;
  stateCode?: string;
}

interface RentEstimate {
  rent: number;
  rentRangeLow: number;
  rentRangeHigh: number;
  bedrooms: number;
  propertyType: string;
  comparables: {
    formattedAddress: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    distance: number;
  }[];
}

const BEDROOM_OPTIONS = [
  { label: "Studio", value: 0 },
  { label: "1 BR", value: 1 },
  { label: "2 BR", value: 2 },
  { label: "3 BR+", value: 3 },
];

const PROPERTY_TYPES = ["Apartment", "Single Family", "Condo", "Townhouse"];

export function RentEstimateForm() {
  const [query, setQuery] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [bedrooms, setBedrooms] = useState(1);
  const [propertyType, setPropertyType] = useState("Apartment");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RentEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Search hospitals as user types (API uses ?q= param)
  const handleSearch = async (q: string) => {
    setQuery(q);
    setSelectedHospital(null);
    setResult(null);
    if (q.length < 2) {
      setHospitals([]);
      setShowDropdown(false);
      return;
    }
    try {
      const res = await fetch(`/api/v1/hospitals?q=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json();
      setHospitals(data.data ?? []);
      setShowDropdown(true);
    } catch {
      setHospitals([]);
    }
  };

  const selectHospital = (h: Hospital) => {
    setSelectedHospital(h);
    setQuery(h.name);
    setShowDropdown(false);
    setResult(null);
  };

  const getEstimate = async () => {
    if (!selectedHospital) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const { lat, lng } = selectedHospital.location;

    try {
      const res = await fetch(
        `/api/v1/rent-estimate?lat=${lat}&lng=${lng}&bedrooms=${bedrooms}&propertyType=${encodeURIComponent(propertyType)}`
      );
      if (!res.ok) {
        setError("Could not get estimate. Try a different hospital or property type.");
        return;
      }
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hospital Search */}
      <div className="relative mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select a hospital
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => hospitals.length > 0 && setShowDropdown(true)}
            placeholder="Search by hospital name..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900"
          />
        </div>
        {showDropdown && hospitals.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg max-h-64 overflow-y-auto">
            {hospitals.map((h) => (
              <button
                key={h.id}
                onClick={() => selectHospital(h)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0"
              >
                <p className="font-medium text-slate-900 text-sm">{h.name}</p>
                <p className="text-xs text-slate-500">{h.city}, {h.stateCode}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bedroom selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Bedrooms</label>
        <div className="flex gap-2">
          {BEDROOM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setBedrooms(opt.value); setResult(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                bedrooms === opt.value
                  ? "bg-brand-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Property type selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Property Type</label>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => { setPropertyType(type); setResult(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                propertyType === type
                  ? "bg-brand-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Get Estimate button */}
      <button
        onClick={getEstimate}
        disabled={!selectedHospital || loading}
        className="w-full py-3 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Getting estimate...
          </>
        ) : (
          <>
            <DollarSign className="w-5 h-5" />
            Get Rent Estimate
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && selectedHospital && (
        <div className="mt-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-1">
              Estimated Rent Near {selectedHospital.name}
            </h3>
            <p className="text-4xl font-bold text-slate-900">
              ${result.rent?.toLocaleString()}<span className="text-lg text-slate-500">/mo</span>
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Range: ${result.rentRangeLow?.toLocaleString()} – ${result.rentRangeHigh?.toLocaleString()}
            </p>

            {/* Comparables */}
            {result.comparables && result.comparables.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Comparable Rentals</h4>
                <div className="space-y-2">
                  {result.comparables.map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
                      <div>
                        <p className="text-slate-900">{c.formattedAddress}</p>
                        <p className="text-xs text-slate-500">
                          {c.bedrooms}BR / {c.bathrooms}BA
                          {c.squareFootage ? ` · ${c.squareFootage.toLocaleString()} sqft` : ""}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900">${c.price?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA to hospital page */}
            {selectedHospital.metroSlug && (
              <Link
                href={`/city/${selectedHospital.metroSlug}/${selectedHospital.slug}`}
                className="mt-6 flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-white bg-brand-700 hover:bg-brand-600 transition-colors"
              >
                <Building2 className="w-5 h-5" />
                Find apartments near {selectedHospital.name}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-3 text-center">
            Estimates based on comparable rental data from RentCast
          </p>
        </div>
      )}
    </div>
  );
}
