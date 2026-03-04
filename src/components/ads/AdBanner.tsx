"use client";

import { isFeatureEnabled } from "@/lib/feature-flags";
import { AdPlaceholder } from "./AdPlaceholder";

/**
 * Horizontal banner ad for header/footer zones.
 * Renders nothing when SHOW_DISPLAY_ADS is off (shows dev placeholder in development).
 */
export function AdBanner({ zone = "header" }: { zone?: "header" | "footer" }) {
  if (!isFeatureEnabled("SHOW_DISPLAY_ADS")) {
    return <AdPlaceholder zone={`Banner (${zone})`} className="h-[90px]" />;
  }

  return (
    <div className="w-full flex justify-center py-2 bg-slate-50">
      <div
        className="max-w-7xl w-full h-[90px] flex items-center justify-center text-sm text-slate-400 border border-slate-200 rounded"
        data-ad-zone={zone}
        data-ad-type="banner"
      >
        {/* AdSense or Mediavine script will inject here */}
      </div>
    </div>
  );
}
