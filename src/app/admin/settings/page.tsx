"use client";

import Link from "next/link";
import { Settings, ArrowLeft } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/admin" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Site Settings</h1>
          <p className="text-sm text-slate-500 mt-1">General configuration, API keys, and feature flags</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <SettingsSection title="API Integrations">
          <SettingRow label="Mapbox Token" value="Not configured" status="inactive" />
          <SettingRow label="Google Maps API" value="Not configured" status="inactive" />
          <SettingRow label="Database URL" value="Using sample data" status="demo" />
        </SettingsSection>

        <SettingsSection title="Authentication">
          <SettingRow label="NextAuth Provider" value="Not configured" status="inactive" />
          <SettingRow label="Admin Access" value="No auth required (development)" status="demo" />
        </SettingsSection>

        <SettingsSection title="Feature Flags">
          <SettingRow label="Map Integration" value="Placeholder mode" status="demo" />
          <SettingRow label="User Reviews" value="Disabled" status="inactive" />
          <SettingRow label="Search Alerts" value="Disabled" status="inactive" />
          <SettingRow label="Ad Placements" value="Hidden (pre-growth)" status="inactive" />
          <SettingRow label="Featured Listings" value="Disabled" status="inactive" />
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SettingRow({ label, value, status }: {
  label: string;
  value: string;
  status: "active" | "inactive" | "demo";
}) {
  const statusColors = {
    active: "bg-emerald-100 text-emerald-800",
    inactive: "bg-slate-100 text-slate-500",
    demo: "bg-amber-100 text-amber-800",
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-400">{value}</p>
      </div>
      <span className={`badge ${statusColors[status]}`}>{status}</span>
    </div>
  );
}
