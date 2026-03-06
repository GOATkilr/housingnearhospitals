"use client";

import { useState, useEffect, useMemo } from "react";
import { Building2, MapPin } from "lucide-react";
import { HOSPITAL_PIN_COLOR, LISTING_PIN_COLOR, MAP_DEFAULT_ZOOM } from "@/lib/constants";
import { HospitalCard } from "@/components/hospital/HospitalCard";
import dynamic from "next/dynamic";
import type { Hospital, Listing } from "@/types";

const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false });

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface MetroOption {
  slug: string;
  name: string;
  center?: { lat: number; lng: number };
}

export default function MapPage() {
  const [metros, setMetros] = useState<MetroOption[]>([]);
  const [selectedMetro, setSelectedMetro] = useState<string>("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);

  // Fetch metros on mount
  useEffect(() => {
    fetch("/api/v1/metros")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.data ?? []) as MetroOption[];
        setMetros(list);
        if (list.length > 0 && !selectedMetro) {
          setSelectedMetro(list[0].slug);
        }
      })
      .catch(() => {});
  }, []);

  const metro = metros.find((m) => m.slug === selectedMetro);

  useEffect(() => {
    fetch(`/api/v1/hospitals?metro=${selectedMetro}&limit=100`)
      .then((r) => r.json())
      .then((data) => setHospitals(data.data ?? []))
      .catch(() => setHospitals([]));
  }, [selectedMetro]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-600" />
              Map Explorer
            </h1>

            {/* Metro selector */}
            <div className="flex gap-2">
              {metros.map((m) => (
                <button
                  key={m.slug}
                  onClick={() => setSelectedMetro(m.slug)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedMetro === m.slug
                      ? "bg-brand-100 text-brand-800"
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
          {/* Map */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-[600px]">
            {MAPBOX_TOKEN && metro?.center ? (
              <MapView
                token={MAPBOX_TOKEN}
                center={metro.center}
                zoom={MAP_DEFAULT_ZOOM}
                hospitals={hospitals}
                listings={listings}
                metroSlug={selectedMetro}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">Interactive Map</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
                  Add your Mapbox token to <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> in your environment to enable the interactive map.
                </p>
                <div className="mt-4 bg-slate-50 rounded-lg p-4 text-left w-full max-w-md">
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    {metro?.name} — {hospitals.length} hospitals
                  </p>
                  <div className="space-y-1">
                    {hospitals.slice(0, 5).map((h) => (
                      <div key={h.id} className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="w-2 h-2 bg-brand-600 rounded-full" />
                        <span className="truncate">{h.name}</span>
                        <span className="text-slate-300 ml-auto">
                          {h.location.lat.toFixed(4)}, {h.location.lng.toFixed(4)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
