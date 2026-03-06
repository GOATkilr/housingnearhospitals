"use client";

import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { HOSPITAL_PIN_COLOR, LISTING_PIN_COLOR } from "@/lib/constants";
import { trackMapInteraction } from "@/lib/analytics";
import type { Hospital, Listing } from "@/types";

interface MapViewProps {
  token: string;
  center: { lat: number; lng: number };
  zoom: number;
  hospitals: Hospital[];
  listings: Listing[];
  metroSlug: string;
}

export default function MapView({ token, center, zoom, hospitals, listings, metroSlug }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [center.lng, center.lat],
      zoom,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.on("moveend", () => trackMapInteraction({ action: "pan", metroSlug }));
    map.on("zoomend", () => trackMapInteraction({ action: "zoom", metroSlug }));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Update center when metro changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: [center.lng, center.lat], zoom, duration: 1200 });
  }, [center.lat, center.lng, zoom]);

  // Update markers when data changes
  useEffect(() => {
    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!mapRef.current) return;

    // Hospital markers (blue)
    hospitals.forEach((hospital) => {
      const el = document.createElement("div");
      el.className = "hospital-marker";
      el.style.cssText = `
        width: 28px; height: 28px; border-radius: 50%;
        background: ${HOSPITAL_PIN_COLOR}; border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3); cursor: pointer;
      `;

      const popup = new mapboxgl.Popup({ offset: 20, closeButton: false }).setHTML(`
        <div style="padding: 4px 0;">
          <strong style="font-size: 13px;">${hospital.name}</strong>
          <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">
            ${hospital.hospitalType}${hospital.bedCount ? ` &middot; ${hospital.bedCount} beds` : ""}
          </p>
          <a href="/city/${metroSlug}/${hospital.slug}" style="font-size: 11px; color: #2563eb; text-decoration: none;">
            View listings &rarr;
          </a>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([hospital.location.lng, hospital.location.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    // Listing markers (green)
    listings.forEach((listing) => {
      const el = document.createElement("div");
      el.className = "listing-marker";
      el.style.cssText = `
        width: 20px; height: 20px; border-radius: 50%;
        background: ${LISTING_PIN_COLOR}; border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2); cursor: pointer;
      `;

      const popup = new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(`
        <div style="padding: 4px 0;">
          <strong style="font-size: 12px;">${listing.title}</strong>
          <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">
            $${listing.priceMonthly.toLocaleString()}/mo &middot; ${listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bed`}
          </p>
          <a href="/listing/${listing.id}" style="font-size: 11px; color: #059669; text-decoration: none;">
            View details &rarr;
          </a>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([listing.location.lng, listing.location.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [hospitals, listings, metroSlug]);

  return <div ref={mapContainer} className="w-full h-full min-h-[600px]" />;
}
