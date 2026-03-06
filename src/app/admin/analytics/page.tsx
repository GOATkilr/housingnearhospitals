"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MousePointerClick, Building2, Home, Users, DollarSign } from "lucide-react";

interface AnalyticsData {
  dailyClicks: { day: string; clicks: number }[];
  topHospitals: { hospitalId: string; hospitalName: string; clicks: number }[];
  topListings: { listingId: string; listingTitle: string; city: string; clicks: number }[];
  totals: {
    totalClicks: number;
    uniqueListingsClicked: number;
    uniqueHospitals: number;
    uniqueVisitors: number;
  };
}

// Configurable commission assumptions
const ESTIMATED_CONVERSION_RATE = 0.02; // 2% of clicks convert to lease
const ESTIMATED_COMMISSION_PER_CONVERSION = 50; // $50 avg commission per conversion

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalClicks = data?.totals.totalClicks ?? 0;
  const estimatedConversions = Math.round(totalClicks * ESTIMATED_CONVERSION_RATE);
  const estimatedRevenue = estimatedConversions * ESTIMATED_COMMISSION_PER_CONVERSION;

  const stats = [
    { label: "Total Clicks (30d)", value: totalClicks, icon: MousePointerClick, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Unique Visitors", value: data?.totals.uniqueVisitors ?? 0, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Est. Revenue (30d)", value: `$${estimatedRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Est. Conversions", value: estimatedConversions, icon: Home, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/admin" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Click Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Affiliate click tracking — last 30 days</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading analytics...</div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-3">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Revenue assumptions note */}
            <div className="bg-slate-50 rounded-lg px-4 py-3 mb-6 text-xs text-slate-500">
              Revenue estimates assume {(ESTIMATED_CONVERSION_RATE * 100).toFixed(0)}% click-to-conversion rate
              and ${ESTIMATED_COMMISSION_PER_CONVERSION} avg commission per conversion.
              {totalClicks > 0 && data?.totals.uniqueListingsClicked && (
                <span className="ml-2">
                  Click-through rate: <strong className="text-slate-700">
                    {((data.totals.uniqueListingsClicked / totalClicks) * 100).toFixed(1)}%
                  </strong> unique listings per click.
                </span>
              )}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Daily Clicks */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Clicks Per Day</h2>
                {data?.dailyClicks && data.dailyClicks.length > 0 ? (
                  <div className="space-y-2">
                    {data.dailyClicks.map((row) => {
                      const max = Math.max(...data.dailyClicks.map((d) => d.clicks));
                      const pct = max > 0 ? (row.clicks / max) * 100 : 0;
                      return (
                        <div key={row.day} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-20 shrink-0">
                            {new Date(row.day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-medium text-slate-700 w-10 text-right">{row.clicks}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-8 text-center">No click data yet.</p>
                )}
              </div>

              {/* Top Hospitals */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Hospitals by Clicks</h2>
                {data?.topHospitals && data.topHospitals.length > 0 ? (
                  <div className="space-y-3">
                    {data.topHospitals.map((h, i) => (
                      <div key={h.hospitalId} className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-medium text-slate-600">
                          {i + 1}
                        </span>
                        <span className="flex-1 text-sm text-slate-700 truncate">{h.hospitalName}</span>
                        <span className="text-sm font-semibold text-slate-900">{h.clicks}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-8 text-center">No click data yet.</p>
                )}
              </div>

              {/* Top Listings */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 lg:col-span-2">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Listings by Clicks</h2>
                {data?.topListings && data.topListings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-slate-200">
                        <tr>
                          <th className="text-left text-xs font-medium text-slate-500 pb-2">#</th>
                          <th className="text-left text-xs font-medium text-slate-500 pb-2">Listing</th>
                          <th className="text-left text-xs font-medium text-slate-500 pb-2">City</th>
                          <th className="text-right text-xs font-medium text-slate-500 pb-2">Clicks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.topListings.map((l, i) => (
                          <tr key={l.listingId}>
                            <td className="py-2 text-sm text-slate-500">{i + 1}</td>
                            <td className="py-2 text-sm text-slate-700 truncate max-w-xs">{l.listingTitle}</td>
                            <td className="py-2 text-sm text-slate-500">{l.city}</td>
                            <td className="py-2 text-sm font-semibold text-slate-900 text-right">{l.clicks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-8 text-center">No click data yet.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
