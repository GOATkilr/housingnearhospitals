"use client";

import Link from "next/link";
import { BarChart3, ArrowLeft } from "lucide-react";
import { SCORE_BANDS } from "@/lib/scoring";

export default function AdminScoringPage() {
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/admin" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Score Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">Adjust scoring weights and review score band thresholds</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Weights */}
        <div className="bg-white rounded-brand border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Proximity Score Weights</h2>
          <div className="space-y-4">
            <WeightRow label="Day Drive Time" weight={35} description="Score based on estimated drive time during day shift hours" />
            <WeightRow label="Night Drive Time" weight={25} description="Score based on estimated drive time during night shift hours" />
            <WeightRow label="Straight-Line Distance" weight={40} description="Score based on direct distance in miles" />
          </div>
          <p className="text-xs text-slate-400 mt-4">Weights must sum to 100%. Changes require score recalculation.</p>
        </div>

        {/* Score Bands */}
        <div className="bg-white rounded-brand border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Score Bands</h2>
          <div className="space-y-2">
            {SCORE_BANDS.map((band) => (
              <div key={band.band} className="flex items-center gap-4 p-3 rounded-lg" style={{ backgroundColor: band.bgColor + "33" }}>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: band.color }} />
                <span className="text-sm font-medium text-slate-900 w-24">{band.label}</span>
                <span className="text-sm text-slate-600 w-32 font-mono">{band.minScore}+ score</span>
                <span className="text-xs text-slate-400 capitalize">{band.band}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeightRow({ label, weight, description }: { label: string; weight: number; description: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <div className="w-32 bg-slate-100 rounded-full h-3 overflow-hidden">
        <div className="bg-brand-blue h-full rounded-full" style={{ width: `${weight}%` }} />
      </div>
      <span className="text-sm font-mono font-semibold text-slate-700 w-12 text-right">{weight}%</span>
    </div>
  );
}
