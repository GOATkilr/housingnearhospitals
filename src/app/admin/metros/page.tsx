"use client";

import Link from "next/link";
import { MapPin, ArrowLeft } from "lucide-react";
import { SAMPLE_METROS, SAMPLE_HOSPITALS, SAMPLE_LISTINGS } from "@/lib/sample-data";
import { formatNumber, formatPrice } from "@/lib/utils";

export default function AdminMetrosPage() {
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/admin" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Metro Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure launch metros and metro-specific settings</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          {SAMPLE_METROS.map((metro) => {
            const hospitalCount = SAMPLE_HOSPITALS.filter((h) => h.metroId === metro.id).length;
            const listingCount = SAMPLE_LISTINGS.filter((l) => l.metroId === metro.id).length;
            return (
              <div key={metro.id} className="bg-white rounded-brand border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-brand-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{metro.name}</h3>
                      <p className="text-sm text-slate-500">{metro.slug}</p>
                    </div>
                  </div>
                  <span className={`badge ${metro.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                    {metro.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="grid sm:grid-cols-4 gap-4 mt-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Hospitals</p>
                    <p className="text-lg font-semibold text-slate-900">{hospitalCount}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Listings</p>
                    <p className="text-lg font-semibold text-slate-900">{listingCount}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Population</p>
                    <p className="text-lg font-semibold text-slate-900">{metro.metroPop ? formatNumber(metro.metroPop) : "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Avg 1BR Rent</p>
                    <p className="text-lg font-semibold text-slate-900">{metro.avgRent1br ? formatPrice(metro.avgRent1br) : "—"}</p>
                  </div>
                </div>

                <div className="flex gap-6 mt-4 text-xs text-slate-400">
                  <span>Circuity: {metro.circuityFactor}x</span>
                  <span>Radius: {metro.radiusMiles} mi</span>
                  <span>Timezone: {metro.timezone}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
