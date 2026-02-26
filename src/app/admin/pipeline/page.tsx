"use client";

import Link from "next/link";
import { Database, ArrowLeft, RefreshCw } from "lucide-react";

export default function AdminPipelinePage() {
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
              <h1 className="text-2xl font-bold text-slate-900">Data Pipeline</h1>
              <p className="text-sm text-slate-500 mt-1">Monitor data imports and schedule automated refreshes</p>
            </div>
            <button className="btn-primary text-sm flex items-center gap-2" disabled>
              <RefreshCw className="w-4 h-4" />
              Run Pipeline
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Data Sources */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Data Sources</h2>
          <div className="space-y-3">
            <SourceRow
              name="HIFLD"
              description="Hospital locations from Homeland Infrastructure Foundation"
              status="ready"
              records="7,596 hospitals"
            />
            <SourceRow
              name="CMS"
              description="Hospital quality ratings from Centers for Medicare & Medicaid"
              status="ready"
              records="~5,000 rated"
            />
            <SourceRow
              name="Manual Listings"
              description="Hand-curated housing listings for launch metros"
              status="loaded"
              records="14 listings"
            />
            <SourceRow
              name="Score Engine"
              description="Proximity score calculations for hospital-listing pairs"
              status="pending"
              records="Calculated on-demand"
            />
          </div>
        </div>

        {/* Recent Runs */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pipeline History</h2>
          <div className="text-center py-8 text-slate-400">
            <Database className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="text-sm">No pipeline runs yet.</p>
            <p className="text-xs mt-1">Connect a database and configure data sources to start importing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceRow({ name, description, status, records }: {
  name: string;
  description: string;
  status: "ready" | "loaded" | "pending" | "error";
  records: string;
}) {
  const statusColors = {
    ready: "bg-amber-100 text-amber-800",
    loaded: "bg-emerald-100 text-emerald-800",
    pending: "bg-slate-100 text-slate-600",
    error: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <div>
        <p className="text-sm font-medium text-slate-900">{name}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 font-mono">{records}</span>
        <span className={`badge ${statusColors[status]}`}>{status}</span>
      </div>
    </div>
  );
}
