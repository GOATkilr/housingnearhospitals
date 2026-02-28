// ============================================================
// Data Source Abstraction — Housing Near Hospitals
//
// Provides a unified API for fetching data.
// When DATABASE_URL is set → queries the real database via Drizzle.
// When unset → falls back to sample data from sample-data.ts.
//
// This lets the app run identically in dev (sample data) and
// production (Neon Postgres) with zero code changes in pages.
// ============================================================

import type { Hospital, Listing, Metro } from "@/types";

const USE_DB = !!process.env.DATABASE_URL;

// ============================================================
// Metro
// ============================================================

export async function getMetros(): Promise<Metro[]> {
  if (USE_DB) {
    const { getAllActiveMetros } = await import("@/db/queries");
    return getAllActiveMetros();
  }
  const { SAMPLE_METROS } = await import("@/lib/sample-data");
  return SAMPLE_METROS;
}

export async function getMetroBySlug(slug: string): Promise<Metro | undefined> {
  if (USE_DB) {
    const queries = await import("@/db/queries");
    return queries.getMetroBySlug(slug);
  }
  const { SAMPLE_METROS } = await import("@/lib/sample-data");
  return SAMPLE_METROS.find((m) => m.slug === slug);
}

// ============================================================
// Hospital
// ============================================================

export async function getHospitals(): Promise<Hospital[]> {
  if (USE_DB) {
    const { getAllHospitals } = await import("@/db/queries");
    return getAllHospitals();
  }
  const { SAMPLE_HOSPITALS } = await import("@/lib/sample-data");
  return SAMPLE_HOSPITALS;
}

export async function getHospitalsByMetroId(metroId: string): Promise<Hospital[]> {
  if (USE_DB) {
    const { getHospitalsByMetro } = await import("@/db/queries");
    return getHospitalsByMetro(metroId);
  }
  const { SAMPLE_HOSPITALS } = await import("@/lib/sample-data");
  return SAMPLE_HOSPITALS.filter((h) => h.metroId === metroId);
}

export async function getHospitalBySlug(slug: string): Promise<Hospital | undefined> {
  if (USE_DB) {
    const queries = await import("@/db/queries");
    return queries.getHospitalBySlug(slug);
  }
  const { SAMPLE_HOSPITALS } = await import("@/lib/sample-data");
  return SAMPLE_HOSPITALS.find((h) => h.slug === slug);
}

// ============================================================
// Listing
// ============================================================

export async function getListings(): Promise<Listing[]> {
  if (USE_DB) {
    const { getAllListings } = await import("@/db/queries");
    return getAllListings();
  }
  const { SAMPLE_LISTINGS } = await import("@/lib/sample-data");
  return SAMPLE_LISTINGS;
}

export async function getListingsByMetroId(metroId: string): Promise<Listing[]> {
  if (USE_DB) {
    const { getListingsByMetro } = await import("@/db/queries");
    return getListingsByMetro(metroId);
  }
  const { SAMPLE_LISTINGS } = await import("@/lib/sample-data");
  return SAMPLE_LISTINGS.filter((l) => l.metroId === metroId);
}

export async function getListingById(id: string): Promise<Listing | undefined> {
  if (USE_DB) {
    const queries = await import("@/db/queries");
    return queries.getListingById(id);
  }
  const { SAMPLE_LISTINGS } = await import("@/lib/sample-data");
  return SAMPLE_LISTINGS.find((l) => l.id === id);
}
