"use client";

import { isFeatureEnabled } from "@/lib/feature-flags";
import { AdPlaceholder } from "./AdPlaceholder";

/**
 * Inline ad that appears between listing cards in the feed (e.g., after every 4th card).
 * Renders nothing when SHOW_DISPLAY_ADS is off (shows dev placeholder in development).
 */
export function AdInterstitial() {
  if (!isFeatureEnabled("SHOW_DISPLAY_ADS")) {
    return <AdPlaceholder zone="In-Feed" className="h-[120px]" />;
  }

  return (
    <div
      className="w-full h-[120px] flex items-center justify-center border border-slate-200 rounded bg-slate-50 my-4"
      data-ad-zone="listing_feed"
      data-ad-type="interstitial"
    >
      {/* AdSense or Mediavine in-feed unit will inject here */}
    </div>
  );
}
