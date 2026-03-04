"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, ArrowLeft, Search, Plus } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { Hospital } from "@/types";

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  useEffect(() => {
    fetch("/api/v1/hospitals?limit=100")
      .then((r) => r.json())
      .then((data) => setHospitals(data.data ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/admin" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Hospital Management</h1>
              <p className="text-sm text-slate-500 mt-1">{hospitals.length} hospitals</p>
            </div>
            <button className="btn-primary text-sm flex items-center gap-2" disabled>
              <Plus className="w-4 h-4" />
              Import Hospitals
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Hospital</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Metro</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Type</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Beds</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">CMS Rating</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hospitals.map((h) => {
                return (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{h.name}</p>
                        <p className="text-xs text-slate-400">{h.city}, {h.stateCode}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{h.city}, {h.stateCode}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{h.hospitalType}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">{h.bedCount ? formatNumber(h.bedCount) : "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{h.cmsOverallRating ? `${h.cmsOverallRating}/5` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${h.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                        {h.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
