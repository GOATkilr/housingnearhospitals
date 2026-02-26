"use client";

import { useState, useMemo } from "react";
import { Search, Building2, MapPin } from "lucide-react";
import type { Hospital } from "@/types";
import { cn } from "@/lib/utils";

interface HospitalSearchProps {
  hospitals: Hospital[];
  onSelect: (hospital: Hospital) => void;
  placeholder?: string;
  className?: string;
}

export function HospitalSearch({
  hospitals,
  onSelect,
  placeholder = "Search hospitals by name...",
  className,
}: HospitalSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return hospitals.slice(0, 10);
    const q = query.toLowerCase();
    return hospitals
      .filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.systemName?.toLowerCase().includes(q) ||
          h.city?.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [hospitals, query]);

  return (
    <div className={cn("relative", className)}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-300 bg-white
                     text-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
                     focus:outline-none transition-all shadow-sm"
        />
      </div>

      {/* Dropdown */}
      {isOpen && filtered.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl z-20 max-h-96 overflow-y-auto">
            {filtered.map((hospital) => (
              <button
                key={hospital.id}
                onClick={() => {
                  onSelect(hospital);
                  setQuery(hospital.name);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-brand-50 transition-colors text-left border-b border-slate-100 last:border-b-0"
              >
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building2 className="w-5 h-5 text-brand-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{hospital.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {hospital.systemName && (
                      <span className="text-xs text-slate-500">{hospital.systemName}</span>
                    )}
                    <span className="flex items-center gap-0.5 text-xs text-slate-400">
                      <MapPin className="w-3 h-3" />
                      {hospital.city}, {hospital.stateCode}
                    </span>
                  </div>
                </div>
                {hospital.bedCount && (
                  <span className="text-xs text-slate-400 flex-shrink-0 mt-1">
                    {hospital.bedCount} beds
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
