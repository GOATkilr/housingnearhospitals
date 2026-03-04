"use client";

import { useState, useEffect } from "react";
import { Building2, Home, BarChart3, Database, Settings, RefreshCw, MapPin, TrendingUp } from "lucide-react";
import Link from "next/link";

interface AdminCounts {
  metros: { active: number; total: number };
  hospitals: { active: number; total: number };
  listings: { active: number; total: number };
  scorePairs: number;
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState<AdminCounts | null>(null);

  useEffect(() => {
    fetch("/api/admin/counts")
      .then((r) => r.json())
      .then((data) => setCounts(data))
      .catch(() => {});
  }, []);

  const stats = [
    {
      label: "Metros Active",
      value: counts?.metros.active ?? "--",
      total: counts?.metros.total ?? null,
      icon: MapPin,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Hospitals Indexed",
      value: counts?.hospitals.active ?? "--",
      total: counts?.hospitals.total ?? null,
      icon: Building2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Active Listings",
      value: counts?.listings.active ?? "--",
      total: counts?.listings.total ?? null,
      icon: Home,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Score Pairs",
      value: counts?.scorePairs ?? "--",
      total: null,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage hospitals, listings, and scoring configuration
              </p>
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh Scores
              </button>
              <button className="btn-primary text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                Import Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                {stat.total !== null && (
                  <span className="text-xs text-slate-400">of {stat.total}</span>
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Management</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <AdminCard
            title="Hospital Management"
            description="View, edit, and import hospital data. Manage hospital records across all metros."
            icon={Building2}
            href="/admin/hospitals"
            stats={`${counts?.hospitals.total ?? "--"} hospitals`}
          />
          <AdminCard
            title="Listing Management"
            description="Manage housing listings. Import from external sources or add manually."
            icon={Home}
            href="/admin/listings"
            stats={`${counts?.listings.total ?? "--"} listings`}
          />
          <AdminCard
            title="Score Configuration"
            description="Adjust scoring weights, circuity factors, and recalculate proximity scores."
            icon={BarChart3}
            href="/admin/scoring"
            stats="7 score components"
          />
          <AdminCard
            title="Metro Settings"
            description="Configure launch metros, bounding boxes, and metro-specific settings."
            icon={MapPin}
            href="/admin/metros"
            stats={`${counts?.metros.total ?? "--"} metros`}
          />
          <AdminCard
            title="Data Pipeline"
            description="Monitor data imports, view logs, and schedule automated data refreshes."
            icon={Database}
            href="/admin/pipeline"
            stats="Last run: --"
          />
          <AdminCard
            title="Site Settings"
            description="General site configuration, API keys, and feature flags."
            icon={Settings}
            href="/admin/settings"
            stats=""
          />
        </div>

        {/* Recent Activity (placeholder) */}
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Data Pipeline Status</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Source</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Type</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Metro</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Records</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <PipelineRow source="HIFLD" type="Hospitals" metro="All" records="7,596" status="ready" date="Awaiting import" />
              <PipelineRow source="CMS" type="Ratings" metro="All" records="~5,000" status="ready" date="Awaiting import" />
              <PipelineRow source="Manual" type="Listings" metro="Nashville" records="6" status="completed" date="Sample data loaded" />
              <PipelineRow source="Score Engine" type="Scores" metro="Nashville" records="--" status="pending" date="Awaiting listings" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminCard({
  title,
  description,
  icon: Icon,
  href,
  stats,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  stats: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-slate-200 p-5 card-hover block"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-700" />
        </div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="text-sm text-slate-500">{description}</p>
      {stats && (
        <p className="text-xs text-brand-600 font-medium mt-3">{stats}</p>
      )}
    </Link>
  );
}

function PipelineRow({
  source,
  type,
  metro,
  records,
  status,
  date,
}: {
  source: string;
  type: string;
  metro: string;
  records: string;
  status: "completed" | "running" | "failed" | "ready" | "pending";
  date: string;
}) {
  const statusColors = {
    completed: "bg-emerald-100 text-emerald-800",
    running: "bg-blue-100 text-blue-800",
    failed: "bg-red-100 text-red-800",
    ready: "bg-amber-100 text-amber-800",
    pending: "bg-slate-100 text-slate-600",
  };

  return (
    <tr>
      <td className="px-4 py-3 text-sm font-medium text-slate-900">{source}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{type}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{metro}</td>
      <td className="px-4 py-3 text-sm text-slate-600 font-mono">{records}</td>
      <td className="px-4 py-3">
        <span className={`badge ${statusColors[status]}`}>{status}</span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-400">{date}</td>
    </tr>
  );
}
