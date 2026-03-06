/**
 * GA4 custom event helpers.
 * All events are no-ops if gtag is not loaded.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function track(eventName: string, params: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}

export function trackAffiliateClick(params: {
  listingId: string;
  hospitalId?: string;
  source?: string;
}) {
  track("affiliate_click", {
    listing_id: params.listingId,
    hospital_id: params.hospitalId,
    source: params.source,
  });
}

export function trackHospitalView(params: {
  hospitalId: string;
  hospitalName: string;
  metroSlug: string;
}) {
  track("hospital_view", {
    hospital_id: params.hospitalId,
    hospital_name: params.hospitalName,
    metro_slug: params.metroSlug,
  });
}

export function trackListingView(params: {
  listingId: string;
  priceMonthly: number;
  city?: string;
}) {
  track("listing_view", {
    listing_id: params.listingId,
    price_monthly: params.priceMonthly,
    city: params.city,
  });
}

export function trackSearchFilter(params: {
  hospitalId: string;
  filterType: string;
  filterValue: string | number | boolean;
}) {
  track("search_filter", {
    hospital_id: params.hospitalId,
    filter_type: params.filterType,
    filter_value: String(params.filterValue),
  });
}

export function trackMapInteraction(params: {
  action: string;
  metroSlug?: string;
}) {
  track("map_interaction", {
    action: params.action,
    metro_slug: params.metroSlug,
  });
}
