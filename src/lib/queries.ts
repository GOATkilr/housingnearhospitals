import { sql } from "./db";
import type {
  Metro,
  Hospital,
  Listing,
  HospitalListingScore,
  SearchFilters,
  HospitalType,
  ListingSource,
  PropertyType,
  ListingStatus,
} from "@/types";

// ============================================================
// Row → Type Mappers
// ============================================================

function rowToMetro(r: Record<string, unknown>): Metro {
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    stateCode: r.state_code as string,
    center: { lat: r.lat as number, lng: r.lng as number },
    radiusMiles: Number(r.radius_miles),
    timezone: r.timezone as string,
    circuityFactor: Number(r.circuity_factor),
    isActive: r.is_active as boolean,
    metroPop: r.metro_pop as number | undefined,
    avgRent1br: r.avg_rent_1br as number | undefined,
    costOfLiving: r.cost_of_living ? Number(r.cost_of_living) : undefined,
  };
}

function rowToHospital(r: Record<string, unknown>): Hospital {
  return {
    id: r.id as string,
    metroId: r.metro_id as string,
    cmsCcn: r.cms_ccn as string | undefined,
    hifldId: r.hifld_id as string | undefined,
    name: r.name as string,
    slug: r.slug as string,
    address: r.address as string | undefined,
    city: r.city as string | undefined,
    stateCode: r.state_code as string | undefined,
    zipCode: r.zip_code as string | undefined,
    phone: r.phone as string | undefined,
    website: r.website as string | undefined,
    location: { lat: r.lat as number, lng: r.lng as number },
    hospitalType: r.hospital_type as HospitalType,
    ownership: r.ownership as string | undefined,
    systemName: r.system_name as string | undefined,
    bedCount: r.bed_count as number | undefined,
    hasEmergency: r.has_emergency as boolean,
    traumaLevel: r.trauma_level as string | undefined,
    teachingStatus: r.teaching_status as string | undefined,
    cmsOverallRating: r.cms_overall_rating as number | undefined,
    cmsPatientExp: r.cms_patient_exp as number | undefined,
    cmsSafetyRating: r.cms_safety_rating as number | undefined,
    isActive: r.is_active as boolean,
  };
}

function rowToListing(r: Record<string, unknown>): Listing {
  return {
    id: r.id as string,
    metroId: r.metro_id as string,
    neighborhoodId: r.neighborhood_id as string | undefined,
    externalId: r.external_id as string | undefined,
    source: r.source as ListingSource,
    sourceUrl: r.source_url as string | undefined,
    isFeatured: (r.is_featured as boolean) ?? false,
    featuredUntil: r.featured_until as string | undefined,
    title: r.title as string,
    description: r.description as string | undefined,
    propertyType: r.property_type as PropertyType,
    location: { lat: r.lat as number, lng: r.lng as number },
    address: r.address as string | undefined,
    city: r.city as string | undefined,
    stateCode: r.state_code as string | undefined,
    zipCode: r.zip_code as string | undefined,
    bedrooms: r.bedrooms as number | undefined,
    bathrooms: r.bathrooms ? Number(r.bathrooms) : undefined,
    sqft: r.sqft as number | undefined,
    priceMonthly: r.price_monthly as number,
    isFurnished: r.is_furnished as boolean,
    leaseMinMonths: r.lease_min_months as number | undefined,
    allowsPets: r.allows_pets as boolean,
    hasParking: r.has_parking as boolean,
    hasInUnitLaundry: r.has_in_unit_laundry as boolean,
    amenities: (r.amenities as string[]) ?? [],
    primaryImageUrl: r.primary_image_url as string | undefined,
    imageCount: (r.image_count as number) ?? 0,
    listingQualityScore: r.listing_quality_score as number | undefined,
    status: r.status as ListingStatus,
    isVerified: r.is_verified as boolean,
    availableDate: r.available_date as string | undefined,
  };
}

function rowToScore(r: Record<string, unknown>): HospitalListingScore {
  return {
    id: r.id as string,
    hospitalId: r.hospital_id as string,
    listingId: r.listing_id as string,
    straightLineMiles: Number(r.straight_line_miles),
    estimatedDriveMiles: r.estimated_drive_miles
      ? Number(r.estimated_drive_miles)
      : undefined,
    driveTimeDayMin: r.drive_time_day_min as number | undefined,
    driveTimeNightMin: r.drive_time_night_min as number | undefined,
    proximityScore: r.proximity_score as number,
    combinedScore: r.combined_score as number | undefined,
    calculationMethod: (r.calculation_method as "haversine" | "osrm" | "google") ?? "haversine",
  };
}

// ============================================================
// METROS
// ============================================================

export async function getMetros(): Promise<Metro[]> {
  const rows = await sql`
    SELECT *, ST_Y(center::geometry) AS lat, ST_X(center::geometry) AS lng
    FROM metros
    WHERE is_active = true
    ORDER BY name
  `;
  return rows.map(rowToMetro);
}

export async function getMetroById(id: string): Promise<Metro | null> {
  const rows = await sql`
    SELECT *, ST_Y(center::geometry) AS lat, ST_X(center::geometry) AS lng
    FROM metros
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows.length > 0 ? rowToMetro(rows[0]) : null;
}

export async function getMetroBySlug(slug: string): Promise<Metro | null> {
  const rows = await sql`
    SELECT *, ST_Y(center::geometry) AS lat, ST_X(center::geometry) AS lng
    FROM metros
    WHERE slug = ${slug}
    LIMIT 1
  `;
  return rows.length > 0 ? rowToMetro(rows[0]) : null;
}

// ============================================================
// HOSPITALS
// ============================================================

export async function getHospitalsByMetro(metroSlug: string): Promise<Hospital[]> {
  const rows = await sql`
    SELECT h.*, ST_Y(h.location::geometry) AS lat, ST_X(h.location::geometry) AS lng
    FROM hospitals h
    JOIN metros m ON m.id = h.metro_id
    WHERE m.slug = ${metroSlug} AND h.is_active = true
    ORDER BY h.name
  `;
  return rows.map(rowToHospital);
}

export async function getHospitalBySlug(slug: string): Promise<Hospital | null> {
  const rows = await sql`
    SELECT *, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
    FROM hospitals
    WHERE slug = ${slug} AND is_active = true
    LIMIT 1
  `;
  return rows.length > 0 ? rowToHospital(rows[0]) : null;
}

export async function getHospitalById(id: string): Promise<Hospital | null> {
  const rows = await sql`
    SELECT *, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
    FROM hospitals
    WHERE id = ${id} AND is_active = true
    LIMIT 1
  `;
  return rows.length > 0 ? rowToHospital(rows[0]) : null;
}

export async function getAllHospitals(): Promise<Hospital[]> {
  const rows = await sql`
    SELECT *, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
    FROM hospitals
    WHERE is_active = true
    ORDER BY name
  `;
  return rows.map(rowToHospital);
}

export async function getAllHospitalSlugs(): Promise<{ slug: string; metroSlug: string }[]> {
  const rows = await sql`
    SELECT h.slug, m.slug AS metro_slug
    FROM hospitals h
    JOIN metros m ON m.id = h.metro_id
    WHERE h.is_active = true
  `;
  return rows.map((r) => ({
    slug: r.slug as string,
    metroSlug: r.metro_slug as string,
  }));
}

export async function searchHospitals(opts: {
  metroSlug?: string;
  query?: string;
  type?: string;
  limit?: number;
}): Promise<Hospital[]> {
  const limit = Math.min(opts.limit ?? 50, 100);

  // Build conditions array for dynamic filtering
  if (opts.metroSlug && opts.query && opts.type) {
    const rows = await sql`
      SELECT h.*, ST_Y(h.location::geometry) AS lat, ST_X(h.location::geometry) AS lng
      FROM hospitals h
      JOIN metros m ON m.id = h.metro_id
      WHERE m.slug = ${opts.metroSlug}
        AND h.is_active = true
        AND (h.name ILIKE ${'%' + opts.query + '%'} OR h.system_name ILIKE ${'%' + opts.query + '%'} OR h.city ILIKE ${'%' + opts.query + '%'})
        AND h.hospital_type = ${opts.type}
      ORDER BY h.name
      LIMIT ${limit}
    `;
    return rows.map(rowToHospital);
  }

  if (opts.metroSlug && opts.query) {
    const rows = await sql`
      SELECT h.*, ST_Y(h.location::geometry) AS lat, ST_X(h.location::geometry) AS lng
      FROM hospitals h
      JOIN metros m ON m.id = h.metro_id
      WHERE m.slug = ${opts.metroSlug}
        AND h.is_active = true
        AND (h.name ILIKE ${'%' + opts.query + '%'} OR h.system_name ILIKE ${'%' + opts.query + '%'} OR h.city ILIKE ${'%' + opts.query + '%'})
      ORDER BY h.name
      LIMIT ${limit}
    `;
    return rows.map(rowToHospital);
  }

  if (opts.metroSlug && opts.type) {
    const rows = await sql`
      SELECT h.*, ST_Y(h.location::geometry) AS lat, ST_X(h.location::geometry) AS lng
      FROM hospitals h
      JOIN metros m ON m.id = h.metro_id
      WHERE m.slug = ${opts.metroSlug}
        AND h.is_active = true
        AND h.hospital_type = ${opts.type}
      ORDER BY h.name
      LIMIT ${limit}
    `;
    return rows.map(rowToHospital);
  }

  if (opts.metroSlug) {
    const rows = await sql`
      SELECT h.*, ST_Y(h.location::geometry) AS lat, ST_X(h.location::geometry) AS lng
      FROM hospitals h
      JOIN metros m ON m.id = h.metro_id
      WHERE m.slug = ${opts.metroSlug} AND h.is_active = true
      ORDER BY h.name
      LIMIT ${limit}
    `;
    return rows.map(rowToHospital);
  }

  if (opts.query && opts.type) {
    const rows = await sql`
      SELECT *, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
      FROM hospitals
      WHERE is_active = true
        AND (name ILIKE ${'%' + opts.query + '%'} OR system_name ILIKE ${'%' + opts.query + '%'} OR city ILIKE ${'%' + opts.query + '%'})
        AND hospital_type = ${opts.type}
      ORDER BY name
      LIMIT ${limit}
    `;
    return rows.map(rowToHospital);
  }

  if (opts.query) {
    const rows = await sql`
      SELECT *, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
      FROM hospitals
      WHERE is_active = true
        AND (name ILIKE ${'%' + opts.query + '%'} OR system_name ILIKE ${'%' + opts.query + '%'} OR city ILIKE ${'%' + opts.query + '%'})
      ORDER BY name
      LIMIT ${limit}
    `;
    return rows.map(rowToHospital);
  }

  if (opts.type) {
    const rows = await sql`
      SELECT *, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
      FROM hospitals
      WHERE is_active = true AND hospital_type = ${opts.type}
      ORDER BY name
      LIMIT ${limit}
    `;
    return rows.map(rowToHospital);
  }

  const rows = await sql`
    SELECT *, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
    FROM hospitals
    WHERE is_active = true
    ORDER BY name
    LIMIT ${limit}
  `;
  return rows.map(rowToHospital);
}

// ============================================================
// LISTINGS
// ============================================================

export async function getListingById(id: string): Promise<Listing | null> {
  const rows = await sql`
    SELECT *, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
    FROM listings
    WHERE id = ${id} AND status = 'active' AND deleted_at IS NULL
    LIMIT 1
  `;
  return rows.length > 0 ? rowToListing(rows[0]) : null;
}

export async function getListingsByMetro(metroSlug: string): Promise<Listing[]> {
  const rows = await sql`
    SELECT l.*, ST_Y(l.location::geometry) AS lat, ST_X(l.location::geometry) AS lng
    FROM listings l
    JOIN metros m ON m.id = l.metro_id
    WHERE m.slug = ${metroSlug} AND l.status = 'active' AND l.deleted_at IS NULL
    ORDER BY l.listing_quality_score DESC NULLS LAST, l.price_monthly
  `;
  return rows.map(rowToListing);
}

export async function getAllListingIds(): Promise<string[]> {
  const rows = await sql`
    SELECT id FROM listings WHERE status = 'active' AND deleted_at IS NULL
  `;
  return rows.map((r) => r.id as string);
}

export async function getAllListings(): Promise<Listing[]> {
  const rows = await sql`
    SELECT *, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
    FROM listings
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `;
  return rows.map(rowToListing);
}

// ============================================================
// SCORES
// ============================================================

export async function getScoresForHospital(
  hospitalId: string
): Promise<{ listing: Listing; score: HospitalListingScore }[]> {
  const rows = await sql`
    SELECT
      hls.*,
      l.id AS l_id, l.metro_id AS l_metro_id, l.neighborhood_id AS l_neighborhood_id,
      l.external_id AS l_external_id, l.source AS l_source, l.source_url AS l_source_url,
      l.is_featured AS l_is_featured, l.featured_until AS l_featured_until,
      l.title AS l_title, l.description AS l_description,
      l.property_type AS l_property_type,
      ST_Y(l.location::geometry) AS l_lat, ST_X(l.location::geometry) AS l_lng,
      l.address AS l_address, l.city AS l_city, l.state_code AS l_state_code,
      l.zip_code AS l_zip_code, l.bedrooms AS l_bedrooms, l.bathrooms AS l_bathrooms,
      l.sqft AS l_sqft, l.price_monthly AS l_price_monthly, l.is_furnished AS l_is_furnished,
      l.lease_min_months AS l_lease_min_months, l.allows_pets AS l_allows_pets,
      l.has_parking AS l_has_parking, l.has_in_unit_laundry AS l_has_in_unit_laundry,
      l.amenities AS l_amenities, l.primary_image_url AS l_primary_image_url,
      l.image_count AS l_image_count, l.listing_quality_score AS l_listing_quality_score,
      l.status AS l_status, l.is_verified AS l_is_verified,
      l.available_date AS l_available_date
    FROM hospital_listing_scores hls
    JOIN listings l ON l.id = hls.listing_id AND l.status = 'active' AND l.deleted_at IS NULL
    WHERE hls.hospital_id = ${hospitalId}
    ORDER BY hls.proximity_score DESC
  `;

  return rows.map((r) => ({
    listing: rowToListing({
      id: r.l_id,
      metro_id: r.l_metro_id,
      neighborhood_id: r.l_neighborhood_id,
      external_id: r.l_external_id,
      source: r.l_source,
      source_url: r.l_source_url,
      is_featured: r.l_is_featured,
      featured_until: r.l_featured_until,
      title: r.l_title,
      description: r.l_description,
      property_type: r.l_property_type,
      lat: r.l_lat,
      lng: r.l_lng,
      address: r.l_address,
      city: r.l_city,
      state_code: r.l_state_code,
      zip_code: r.l_zip_code,
      bedrooms: r.l_bedrooms,
      bathrooms: r.l_bathrooms,
      sqft: r.l_sqft,
      price_monthly: r.l_price_monthly,
      is_furnished: r.l_is_furnished,
      lease_min_months: r.l_lease_min_months,
      allows_pets: r.l_allows_pets,
      has_parking: r.l_has_parking,
      has_in_unit_laundry: r.l_has_in_unit_laundry,
      amenities: r.l_amenities,
      primary_image_url: r.l_primary_image_url,
      image_count: r.l_image_count,
      listing_quality_score: r.l_listing_quality_score,
      status: r.l_status,
      is_verified: r.l_is_verified,
      available_date: r.l_available_date,
    }),
    score: rowToScore(r),
  }));
}

export async function getScoresForListing(
  listingId: string
): Promise<{ hospital: Hospital; score: HospitalListingScore }[]> {
  const rows = await sql`
    SELECT
      hls.*,
      h.id AS h_id, h.metro_id AS h_metro_id, h.cms_ccn AS h_cms_ccn,
      h.hifld_id AS h_hifld_id, h.name AS h_name, h.slug AS h_slug,
      h.address AS h_address, h.city AS h_city, h.state_code AS h_state_code,
      h.zip_code AS h_zip_code, h.phone AS h_phone, h.website AS h_website,
      ST_Y(h.location::geometry) AS h_lat, ST_X(h.location::geometry) AS h_lng,
      h.hospital_type AS h_hospital_type, h.ownership AS h_ownership,
      h.system_name AS h_system_name, h.bed_count AS h_bed_count,
      h.has_emergency AS h_has_emergency, h.trauma_level AS h_trauma_level,
      h.teaching_status AS h_teaching_status, h.cms_overall_rating AS h_cms_overall_rating,
      h.cms_patient_exp AS h_cms_patient_exp, h.cms_safety_rating AS h_cms_safety_rating,
      h.is_active AS h_is_active
    FROM hospital_listing_scores hls
    JOIN hospitals h ON h.id = hls.hospital_id AND h.is_active = true
    WHERE hls.listing_id = ${listingId}
    ORDER BY hls.proximity_score DESC
  `;

  return rows.map((r) => ({
    hospital: rowToHospital({
      id: r.h_id,
      metro_id: r.h_metro_id,
      cms_ccn: r.h_cms_ccn,
      hifld_id: r.h_hifld_id,
      name: r.h_name,
      slug: r.h_slug,
      address: r.h_address,
      city: r.h_city,
      state_code: r.h_state_code,
      zip_code: r.h_zip_code,
      phone: r.h_phone,
      website: r.h_website,
      lat: r.h_lat,
      lng: r.h_lng,
      hospital_type: r.h_hospital_type,
      ownership: r.h_ownership,
      system_name: r.h_system_name,
      bed_count: r.h_bed_count,
      has_emergency: r.h_has_emergency,
      trauma_level: r.h_trauma_level,
      teaching_status: r.h_teaching_status,
      cms_overall_rating: r.h_cms_overall_rating,
      cms_patient_exp: r.h_cms_patient_exp,
      cms_safety_rating: r.h_cms_safety_rating,
      is_active: r.h_is_active,
    }),
    score: rowToScore(r),
  }));
}

// ============================================================
// SEARCH (uses materialized view)
// ============================================================

export interface SearchResultRow {
  listing: Listing;
  hospital: Pick<Hospital, "id" | "name" | "slug">;
  score: {
    straightLineMiles: number;
    driveTimeDayMin?: number;
    driveTimeNightMin?: number;
    proximityScore: number;
    combinedScore?: number;
  };
  metro: { slug: string; name: string } | null;
}

export async function searchListings(
  hospitalId: string,
  filters: SearchFilters
): Promise<{ results: SearchResultRow[]; total: number }> {
  const sort = filters.sortBy ?? "score";
  const limit = Math.min(filters.limit ?? 20, 50);
  const offset = ((filters.page ?? 1) - 1) * limit;

  // Build WHERE clauses
  const conditions: string[] = [`hospital_id = '${hospitalId}'`];
  if (filters.maxPrice) conditions.push(`price_monthly <= ${filters.maxPrice}`);
  if (filters.minBedrooms !== undefined) conditions.push(`COALESCE(bedrooms, 0) >= ${filters.minBedrooms}`);
  if (filters.isFurnished) conditions.push(`is_furnished = true`);
  if (filters.allowsPets) conditions.push(`allows_pets = true`);
  if (filters.hasParking) conditions.push(`has_parking = true`);
  if (filters.minScore) conditions.push(`proximity_score >= ${filters.minScore}`);

  const whereClause = conditions.join(" AND ");

  let orderBy: string;
  switch (sort) {
    case "price_asc":
      orderBy = "price_monthly ASC";
      break;
    case "price_desc":
      orderBy = "price_monthly DESC";
      break;
    case "distance":
      orderBy = "straight_line_miles ASC";
      break;
    default:
      orderBy = "COALESCE(combined_score, proximity_score) DESC";
  }

  // Use raw query via the neon driver (tagged template doesn't support dynamic ORDER BY easily)
  // So we'll use parameterized queries for the critical parts
  const rows = await sql`
    SELECT
      listing_id, listing_title, property_type, bedrooms, bathrooms, sqft,
      price_monthly, is_furnished, lease_min_months, allows_pets, has_parking,
      has_in_unit_laundry, primary_image_url, source, source_url,
      is_featured, listing_quality_score,
      ST_Y(listing_location::geometry) AS listing_lat,
      ST_X(listing_location::geometry) AS listing_lng,
      hospital_id, hospital_name, hospital_slug,
      straight_line_miles, drive_time_day_min, drive_time_night_min,
      proximity_score, combined_score,
      metro_slug, metro_name, metro_id,
      neighborhood_name
    FROM mv_search_results
    WHERE hospital_id = ${hospitalId}
      AND (${filters.maxPrice ?? null}::int IS NULL OR price_monthly <= ${filters.maxPrice ?? null})
      AND (${filters.minBedrooms ?? null}::int IS NULL OR COALESCE(bedrooms, 0) >= ${filters.minBedrooms ?? null})
      AND (${filters.isFurnished ? true : null}::bool IS NULL OR is_furnished = true)
      AND (${filters.allowsPets ? true : null}::bool IS NULL OR allows_pets = true)
      AND (${filters.hasParking ? true : null}::bool IS NULL OR has_parking = true)
      AND (${filters.minScore ?? null}::int IS NULL OR proximity_score >= ${filters.minScore ?? null})
    ORDER BY
      CASE WHEN ${sort} = 'price_asc' THEN price_monthly END ASC,
      CASE WHEN ${sort} = 'price_desc' THEN price_monthly END DESC,
      CASE WHEN ${sort} = 'distance' THEN straight_line_miles END ASC,
      CASE WHEN ${sort} NOT IN ('price_asc', 'price_desc', 'distance') THEN COALESCE(combined_score, proximity_score) END DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  // Count query
  const countRows = await sql`
    SELECT COUNT(*)::int AS total
    FROM mv_search_results
    WHERE hospital_id = ${hospitalId}
      AND (${filters.maxPrice ?? null}::int IS NULL OR price_monthly <= ${filters.maxPrice ?? null})
      AND (${filters.minBedrooms ?? null}::int IS NULL OR COALESCE(bedrooms, 0) >= ${filters.minBedrooms ?? null})
      AND (${filters.isFurnished ? true : null}::bool IS NULL OR is_furnished = true)
      AND (${filters.allowsPets ? true : null}::bool IS NULL OR allows_pets = true)
      AND (${filters.hasParking ? true : null}::bool IS NULL OR has_parking = true)
      AND (${filters.minScore ?? null}::int IS NULL OR proximity_score >= ${filters.minScore ?? null})
  `;

  const total = (countRows[0]?.total as number) ?? 0;

  const results: SearchResultRow[] = rows.map((r) => ({
    listing: {
      id: r.listing_id as string,
      metroId: r.metro_id as string,
      source: r.source as ListingSource,
      sourceUrl: r.source_url as string | undefined,
      isFeatured: (r.is_featured as boolean) ?? false,
      title: r.listing_title as string,
      propertyType: r.property_type as PropertyType,
      location: { lat: r.listing_lat as number, lng: r.listing_lng as number },
      bedrooms: r.bedrooms as number | undefined,
      bathrooms: r.bathrooms ? Number(r.bathrooms) : undefined,
      sqft: r.sqft as number | undefined,
      priceMonthly: r.price_monthly as number,
      isFurnished: r.is_furnished as boolean,
      leaseMinMonths: r.lease_min_months as number | undefined,
      allowsPets: r.allows_pets as boolean,
      hasParking: r.has_parking as boolean,
      hasInUnitLaundry: r.has_in_unit_laundry as boolean,
      amenities: [],
      primaryImageUrl: r.primary_image_url as string | undefined,
      imageCount: 0,
      listingQualityScore: r.listing_quality_score as number | undefined,
      status: "active" as const,
      isVerified: false,
    },
    hospital: {
      id: r.hospital_id as string,
      name: r.hospital_name as string,
      slug: r.hospital_slug as string,
    },
    score: {
      straightLineMiles: Number(r.straight_line_miles),
      driveTimeDayMin: r.drive_time_day_min as number | undefined,
      driveTimeNightMin: r.drive_time_night_min as number | undefined,
      proximityScore: r.proximity_score as number,
      combinedScore: r.combined_score as number | undefined,
    },
    metro: r.metro_slug
      ? { slug: r.metro_slug as string, name: r.metro_name as string }
      : null,
  }));

  return { results, total };
}

// ============================================================
// ADMIN COUNTS
// ============================================================

export async function getAdminCounts(): Promise<{
  metros: { active: number; total: number };
  hospitals: { active: number; total: number };
  listings: { active: number; total: number };
  scorePairs: number;
}> {
  const [metroRows, hospRows, listRows, scoreRows] = await Promise.all([
    sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_active = true)::int AS active FROM metros`,
    sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_active = true)::int AS active FROM hospitals`,
    sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'active')::int AS active FROM listings WHERE deleted_at IS NULL`,
    sql`SELECT COUNT(*)::int AS total FROM hospital_listing_scores`,
  ]);

  return {
    metros: {
      active: (metroRows[0]?.active as number) ?? 0,
      total: (metroRows[0]?.total as number) ?? 0,
    },
    hospitals: {
      active: (hospRows[0]?.active as number) ?? 0,
      total: (hospRows[0]?.total as number) ?? 0,
    },
    listings: {
      active: (listRows[0]?.active as number) ?? 0,
      total: (listRows[0]?.total as number) ?? 0,
    },
    scorePairs: (scoreRows[0]?.total as number) ?? 0,
  };
}
