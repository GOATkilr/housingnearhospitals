"use client";

import { isFeatureEnabled } from "@/lib/feature-flags";
import { AdPlaceholder } from "./AdPlaceholder";

/**
 * Sidebar ad component for desktop layouts (typically 300x250 or 300x600).
 * Renders nothing when SHOW_DISPLAY_ADS is off (shows dev placeholder in development).
 */
export function AdSidebar() {
  if (!isFeatureEnabled("SHOW_DISPLAY_ADS")) {
    return <AdPlaceholder zone="Sidebar" className="w-[300px] h-[250px]" />;
  }

  return (
    <div
      className="w-[300px] h-[250px] flex items-center justify-center border border-slate-200 rounded bg-slate-50"
      data-ad-zone="sidebar"
      data-ad-type="sidebar"
    >
      {/* AdSense or Mediavine script will inject here */}
    </div>
  );
}
