"use client";

import { useState } from "react";
import { Building2, MapPin } from "lucide-react";
import { SAMPLE_HOSPITALS } from "@/lib/sample-data";
import { LAUNCH_METROS } from "@/lib/constants";
import { HospitalCard } from "@/components/hospital/HospitalCard";

export default function MapPage() {
  const [selectedMetro, setSelectedMetro] = useState<string>(LAUNCH_METROS[0].slug);

  const metro = LAUNCH_METROS.find((m) => m.slug === selectedMetro);
  const hospitals = SAMPLE_HOSPITALS.filter((h) => h.metroId === metro?.metroId);

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-blue" />
              Map Explorer
            </h1>

            {/* Metro selector */}
            <div className="flex gap-2">
              {LAUNCH_METROS.map((m) => (
                <button
                  key={m.slug}
                  onClick={() => setSelectedMetro(m.slug)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedMetro === m.slug
                      ? "bg-blue-50 text-brand-navy"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-[1fr_350px] gap-6">
          {/* Map placeholder */}
          <div className="bg-white rounded-brand border border-gray-200 overflow-hidden min-h-[600px] flex flex-col items-center justify-center text-slate-400">
            <div className="text-center p-8">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-slate-200" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Interactive Map</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
                Add your Mapbox token to <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> in your environment to enable the interactive map.
              </p>
              <p className="text-sm text-slate-400">
                The map will show hospital pins (blue) and listing clusters (green) with proximity scoring overlays.
              </p>

              {/* Static preview of what the map would show */}
              <div className="mt-6 bg-slate-50 rounded-lg p-4 text-left">
                <p className="text-xs font-medium text-slate-500 mb-2">
                  {metro?.name} — {hospitals.length} hospitals
                </p>
                <div className="space-y-1">
                  {hospitals.slice(0, 5).map((h) => (
                    <div key={h.id} className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="w-2 h-2 bg-brand-blue rounded-full" />
                      <span className="truncate">{h.name}</span>
                      <span className="text-slate-300 ml-auto">
                        {h.location.lat.toFixed(4)}, {h.location.lng.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hospital sidebar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">
                Hospitals in {metro?.name}
              </h2>
              <span className="text-xs text-slate-400">{hospitals.length} total</span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {hospitals.map((hospital) => (
                <HospitalCard
                  key={hospital.id}
                  hospital={hospital}
                  metroSlug={selectedMetro}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
