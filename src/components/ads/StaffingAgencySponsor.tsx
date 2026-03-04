"use client";

import { isFeatureEnabled } from "@/lib/feature-flags";
import { AdPlaceholder } from "./AdPlaceholder";
import type { AdPlacement } from "@/types";

/**
 * "Now Hiring" staffing agency sponsor block for hospital pages.
 * Shows a branded callout from a travel nurse staffing agency.
 * Renders nothing when SHOW_STAFFING_ADS is off (shows dev placeholder in development).
 */
export function StaffingAgencySponsor({ placement }: { placement?: AdPlacement }) {
  if (!isFeatureEnabled("SHOW_STAFFING_ADS")) {
    return <AdPlaceholder zone="Staffing Sponsor" className="h-[100px]" />;
  }

  if (!placement) return null;

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Sponsored</p>
      <div className="flex items-center gap-3">
        {placement.imageUrl && (
          <img
            src={placement.imageUrl}
            alt={placement.altText || placement.advertiserName}
            className="w-12 h-12 rounded-lg object-contain"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm">{placement.title || "Now Hiring Travel Nurses"}</p>
          <p className="text-xs text-slate-500 truncate">{placement.description || placement.advertiserName}</p>
        </div>
        <a
          href={placement.clickUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors flex-shrink-0"
        >
          Learn More
        </a>
      </div>
    </div>
  );
}
