"use client";

import { useState } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import type { SearchFilters } from "@/types";
import { SORT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { trackSearchFilter } from "@/lib/analytics";

interface FilterPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  hospitalId?: string;
  className?: string;
}

export function FilterPanel({ filters, onChange, hospitalId, className }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const update = (partial: Partial<SearchFilters>) => {
    onChange({ ...filters, ...partial });
    // Track filter changes
    if (hospitalId) {
      const [key, value] = Object.entries(partial)[0];
      trackSearchFilter({ hospitalId, filterType: key, filterValue: value ?? "" });
    }
  };

  const activeFilterCount = [
    filters.maxPrice,
    filters.minBedrooms,
    filters.isFurnished,
    filters.allowsPets,
    filters.hasParking,
    filters.minScore,
    filters.maxDriveTime,
  ].filter(Boolean).length;

  return (
    <div className={cn("bg-white rounded-xl border border-slate-200", className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-sm">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-brand-100 text-brand-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 transition-transform",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">
          {/* Sort */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Sort by</label>
            <select
              value={filters.sortBy ?? "score"}
              onChange={(e) => update({ sortBy: e.target.value as SearchFilters["sortBy"] })}
              className="input-field text-sm py-2"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price range */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Max price</label>
            <select
              value={filters.maxPrice ?? ""}
              onChange={(e) => update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
              className="input-field text-sm py-2"
            >
              <option value="">Any price</option>
              <option value="1000">Under $1,000</option>
              <option value="1500">Under $1,500</option>
              <option value="2000">Under $2,000</option>
              <option value="2500">Under $2,500</option>
              <option value="3000">Under $3,000</option>
            </select>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Bedrooms</label>
            <div className="flex gap-1.5">
              {[
                { value: undefined, label: "Any" },
                { value: 0, label: "Studio" },
                { value: 1, label: "1" },
                { value: 2, label: "2" },
                { value: 3, label: "3+" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => update({ minBedrooms: opt.value })}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                    filters.minBedrooms === opt.value
                      ? "bg-brand-50 border-brand-300 text-brand-800"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Min score */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Min proximity score: {filters.minScore ?? 0}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={filters.minScore ?? 0}
              onChange={(e) => update({ minScore: Number(e.target.value) || undefined })}
              className="w-full accent-brand-600"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <Toggle
              label="Furnished only"
              checked={!!filters.isFurnished}
              onChange={(v) => update({ isFurnished: v || undefined })}
            />
            <Toggle
              label="Pet friendly"
              checked={!!filters.allowsPets}
              onChange={(v) => update({ allowsPets: v || undefined })}
            />
            <Toggle
              label="Parking included"
              checked={!!filters.hasParking}
              onChange={(v) => update({ hasParking: v || undefined })}
            />
          </div>

          {/* Clear */}
          {activeFilterCount > 0 && (
            <button
              onClick={() =>
                onChange({
                  hospitalId: filters.hospitalId,
                  metroSlug: filters.metroSlug,
                  sortBy: "score",
                })
              }
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
            >
              <X className="w-3.5 h-3.5" />
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-slate-600 group-hover:text-slate-900">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors",
          checked ? "bg-brand-600" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
            checked && "translate-x-4"
          )}
        />
      </button>
    </label>
  );
}
