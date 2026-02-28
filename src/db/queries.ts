// ============================================================
// Data Access Layer — Housing Near Hospitals
//
// Database queries using Drizzle ORM.
// These functions are called via data-source.ts when DATABASE_URL is set.
// ============================================================

import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./index";
import { hospitals, listings, metros, hospitalListingScores } from "./schema";
import type { Hospital, Listing, Metro } from "@/types";

// ============================================================
// Metro Queries
// ============================================================

export async function getMetroBySlug(slug: string): Promise<Metro | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(metros)
    .where(and(eq(metros.slug, slug), eq(metros.isActive, true)))
    .limit(1);

  if (rows.length === 0) return undefined;
  return mapMetroRow(rows[0]);
}

export async function getAllActiveMetros(): Promise<Metro[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(metros)
    .where(eq(metros.isActive, true));
  return rows.map(mapMetroRow);
}

// ============================================================
// Hospital Queries
// ============================================================

export async function getHospitalsByMetro(metroId: string): Promise<Hospital[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(hospitals)
    .where(and(eq(hospitals.metroId, metroId), eq(hospitals.isActive, true)));
  return rows.map(mapHospitalRow);
}

export async function getHospitalBySlug(slug: string): Promise<Hospital | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(hospitals)
    .where(and(eq(hospitals.slug, slug), eq(hospitals.isActive, true)))
    .limit(1);

  if (rows.length === 0) return undefined;
  return mapHospitalRow(rows[0]);
}

export async function getAllHospitals(): Promise<Hospital[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(hospitals)
    .where(eq(hospitals.isActive, true));
  return rows.map(mapHospitalRow);
}

// ============================================================
// Listing Queries
// ============================================================

export async function getListingsByMetro(metroId: string): Promise<Listing[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.metroId, metroId), eq(listings.status, "active")));
  return rows.map(mapListingRow);
}

export async function getListingById(id: string): Promise<Listing | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);

  if (rows.length === 0) return undefined;
  return mapListingRow(rows[0]);
}

export async function getAllListings(): Promise<Listing[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(listings)
    .where(eq(listings.status, "active"));
  return rows.map(mapListingRow);
}

// ============================================================
// Score Queries
// ============================================================

export async function getScoredListingsForHospital(hospitalId: string) {
  const db = getDb();
  const rows = await db
    .select({
      listing: listings,
      score: hospitalListingScores,
    })
    .from(hospitalListingScores)
    .innerJoin(listings, eq(hospitalListingScores.listingId, listings.id))
    .where(
      and(
        eq(hospitalListingScores.hospitalId, hospitalId),
        eq(listings.status, "active")
      )
    )
    .orderBy(desc(hospitalListingScores.proximityScore));

  return rows.map((row) => ({
    listing: mapListingRow(row.listing),
    score: {
      id: row.score.id,
      hospitalId: row.score.hospitalId,
      listingId: row.score.listingId,
      straightLineMiles: Number(row.score.straightLineMiles),
      estimatedDriveMiles: row.score.estimatedDriveMiles ? Number(row.score.estimatedDriveMiles) : undefined,
      driveTimeDayMin: row.score.driveTimeDayMin ?? undefined,
      driveTimeNightMin: row.score.driveTimeNightMin ?? undefined,
      proximityScore: row.score.proximityScore,
      combinedScore: row.score.combinedScore ?? undefined,
      calculationMethod: (row.score.calculationMethod ?? "haversine") as "haversine" | "osrm" | "google",
    },
  }));
}

// ============================================================
// Row Mappers — DB rows → domain types
// ============================================================

function parseLocation(locationStr: string): { lat: number; lng: number } {
  // PostGIS EWKT format: SRID=4326;POINT(-86.7816 36.1627) or POINT(...)
  const match = locationStr.match(/POINT\(([^ ]+) ([^ ]+)\)/);
  if (match) {
    return { lat: parseFloat(match[2]), lng: parseFloat(match[1]) };
  }
  return { lat: 0, lng: 0 };
}

function mapMetroRow(row: typeof metros.$inferSelect): Metro {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    stateCode: row.stateCode,
    center: parseLocation(row.center),
    radiusMiles: Number(row.radiusMiles ?? 30),
    timezone: row.timezone,
    circuityFactor: Number(row.circuityFactor ?? 1.3),
    isActive: row.isActive ?? false,
    metroPop: row.metroPop ?? undefined,
    avgRent1br: row.avgRent1br ?? undefined,
    costOfLiving: row.costOfLiving ? Number(row.costOfLiving) : undefined,
  };
}

function mapHospitalRow(row: typeof hospitals.$inferSelect): Hospital {
  return {
    id: row.id,
    metroId: row.metroId ?? "",
    cmsCcn: row.cmsCcn ?? undefined,
    hifldId: row.hifldId ?? undefined,
    name: row.name,
    slug: row.slug,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    stateCode: row.stateCode ?? undefined,
    zipCode: row.zipCode ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    location: parseLocation(row.location),
    hospitalType: row.hospitalType as Hospital["hospitalType"],
    ownership: row.ownership ?? undefined,
    systemName: row.systemName ?? undefined,
    bedCount: row.bedCount ?? undefined,
    hasEmergency: row.hasEmergency ?? true,
    traumaLevel: row.traumaLevel ?? undefined,
    teachingStatus: row.teachingStatus ?? undefined,
    cmsOverallRating: row.cmsOverallRating ?? undefined,
    cmsPatientExp: row.cmsPatientExp ?? undefined,
    cmsSafetyRating: row.cmsSafetyRating ?? undefined,
    isActive: row.isActive ?? true,
  };
}

function mapListingRow(row: typeof listings.$inferSelect): Listing {
  return {
    id: row.id,
    metroId: row.metroId,
    neighborhoodId: row.neighborhoodId ?? undefined,
    externalId: row.externalId ?? undefined,
    source: (row.source ?? "manual") as Listing["source"],
    sourceUrl: row.sourceUrl ?? undefined,
    affiliateUrl: row.affiliateUrl ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    propertyType: (row.propertyType ?? "apartment") as Listing["propertyType"],
    location: parseLocation(row.location),
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    stateCode: row.stateCode ?? undefined,
    zipCode: row.zipCode ?? undefined,
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ? Number(row.bathrooms) : undefined,
    sqft: row.sqft ?? undefined,
    priceMonthly: row.priceMonthly,
    isFurnished: row.isFurnished ?? false,
    leaseMinMonths: row.leaseMinMonths ?? undefined,
    allowsPets: row.allowsPets ?? false,
    hasParking: row.hasParking ?? false,
    hasInUnitLaundry: row.hasInUnitLaundry ?? false,
    amenities: (row.amenities ?? []) as string[],
    primaryImageUrl: row.primaryImageUrl ?? undefined,
    imageCount: row.imageCount ?? 0,
    listingQualityScore: row.listingQualityScore ?? undefined,
    status: (row.status ?? "active") as Listing["status"],
    isVerified: row.isVerified ?? false,
    availableDate: row.availableDate ?? undefined,
  };
}
