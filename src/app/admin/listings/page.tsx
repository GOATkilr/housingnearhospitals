"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Home, ArrowLeft, Plus } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Listing } from "@/types";

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    fetch("/api/v1/listings")
      .then((r) => r.json())
      .then((data) => setListings(data.data ?? []))
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
              <h1 className="text-2xl font-bold text-slate-900">Listing Management</h1>
              <p className="text-sm text-slate-500 mt-1">{listings.length} listings across all metros</p>
            </div>
            <button className="btn-primary text-sm flex items-center gap-2" disabled>
              <Plus className="w-4 h-4" />
              Add Listing
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Listing</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Metro</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Price</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Type</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Furnished</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listings.map((l) => {
                return (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 line-clamp-1">{l.title}</p>
                        <p className="text-xs text-slate-400">{l.city}, {l.stateCode}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{l.city}, {l.stateCode}</td>
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{formatPrice(l.priceMonthly)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 capitalize">{l.propertyType}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${l.isFurnished ? "bg-brand-100 text-brand-800" : "bg-slate-100 text-slate-600"}`}>
                        {l.isFurnished ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${l.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                        {l.status}
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
