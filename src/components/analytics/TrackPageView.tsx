"use client";

import { useEffect } from "react";
import { trackHospitalView, trackListingView } from "@/lib/analytics";

export function TrackHospitalView({
  hospitalId,
  hospitalName,
  metroSlug,
}: {
  hospitalId: string;
  hospitalName: string;
  metroSlug: string;
}) {
  useEffect(() => {
    trackHospitalView({ hospitalId, hospitalName, metroSlug });
  }, [hospitalId, hospitalName, metroSlug]);
  return null;
}

export function TrackListingView({
  listingId,
  priceMonthly,
  city,
}: {
  listingId: string;
  priceMonthly: number;
  city?: string;
}) {
  useEffect(() => {
    trackListingView({ listingId, priceMonthly, city });
  }, [listingId, priceMonthly, city]);
  return null;
}
