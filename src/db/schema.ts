// ============================================================
// Drizzle ORM Schema — Housing Near Hospitals
//
// Mirrors database/schema.sql for the core tables.
// PostGIS GEOGRAPHY columns are typed as `text` and handled
// via raw SQL in queries (Drizzle doesn't natively support PostGIS).
// ============================================================

import {
  pgTable,
  uuid,
  varchar,
  char,
  text,
  boolean,
  integer,
  smallint,
  numeric,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ============================================================
// METROS
// ============================================================
export const metros = pgTable(
  "metros",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    stateCode: char("state_code", { length: 2 }).notNull(),
    center: text("center").notNull(), // GEOGRAPHY(POINT, 4326)
    radiusMiles: numeric("radius_miles", { precision: 6, scale: 2 }).default("30.0"),
    timezone: varchar("timezone", { length: 50 }).notNull().default("America/Chicago"),
    circuityFactor: numeric("circuity_factor", { precision: 4, scale: 2 }).default("1.30"),
    isActive: boolean("is_active").default(false),
    metroPop: integer("metro_pop"),
    avgRent1br: integer("avg_rent_1br"),
    costOfLiving: numeric("cost_of_living", { precision: 5, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    slugIdx: index("idx_metros_slug").on(t.slug),
  })
);

// ============================================================
// HOSPITALS
// ============================================================
export const hospitals = pgTable(
  "hospitals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    metroId: uuid("metro_id").references(() => metros.id, { onDelete: "set null" }),
    cmsCcn: varchar("cms_ccn", { length: 20 }),
    hifldId: varchar("hifld_id", { length: 20 }),
    name: varchar("name", { length: 300 }).notNull(),
    slug: varchar("slug", { length: 300 }).notNull(),
    address: varchar("address", { length: 500 }),
    city: varchar("city", { length: 100 }),
    stateCode: char("state_code", { length: 2 }),
    zipCode: varchar("zip_code", { length: 10 }),
    county: varchar("county", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    website: varchar("website", { length: 500 }),
    location: text("location").notNull(), // GEOGRAPHY(POINT, 4326)
    hospitalType: varchar("hospital_type", { length: 50 }).notNull().default("General Acute Care"),
    ownership: varchar("ownership", { length: 100 }),
    systemName: varchar("system_name", { length: 200 }),
    bedCount: integer("bed_count"),
    hasEmergency: boolean("has_emergency").default(true),
    traumaLevel: varchar("trauma_level", { length: 20 }),
    teachingStatus: varchar("teaching_status", { length: 50 }),
    cmsOverallRating: smallint("cms_overall_rating"),
    cmsPatientExp: smallint("cms_patient_exp"),
    cmsSafetyRating: smallint("cms_safety_rating"),
    annualAdmissions: integer("annual_admissions"),
    annualErVisits: integer("annual_er_visits"),
    isActive: boolean("is_active").default(true),
    dataSource: varchar("data_source", { length: 50 }).default("hifld"),
    rawData: jsonb("raw_data"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    slugMetroIdx: uniqueIndex("idx_hospitals_slug_metro").on(t.slug, t.metroId),
    metroIdx: index("idx_hospitals_metro").on(t.metroId),
  })
);

// ============================================================
// LISTINGS
// ============================================================
export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    metroId: uuid("metro_id").notNull().references(() => metros.id, { onDelete: "cascade" }),
    neighborhoodId: uuid("neighborhood_id"),
    externalId: varchar("external_id", { length: 200 }),
    source: varchar("source", { length: 50 }).notNull().default("manual"),
    sourceUrl: varchar("source_url", { length: 1000 }),
    affiliateUrl: varchar("affiliate_url", { length: 1000 }),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    propertyType: varchar("property_type", { length: 50 }).notNull().default("apartment"),
    location: text("location").notNull(), // GEOGRAPHY(POINT, 4326)
    address: varchar("address", { length: 500 }),
    city: varchar("city", { length: 100 }),
    stateCode: char("state_code", { length: 2 }),
    zipCode: varchar("zip_code", { length: 10 }),
    bedrooms: smallint("bedrooms"),
    bathrooms: numeric("bathrooms", { precision: 3, scale: 1 }),
    sqft: integer("sqft"),
    priceMonthly: integer("price_monthly").notNull(),
    isFurnished: boolean("is_furnished").default(false),
    leaseMinMonths: smallint("lease_min_months").default(12),
    allowsPets: boolean("allows_pets").default(false),
    hasParking: boolean("has_parking").default(false),
    hasInUnitLaundry: boolean("has_in_unit_laundry").default(false),
    amenities: jsonb("amenities").default([]),
    primaryImageUrl: varchar("primary_image_url", { length: 1000 }),
    imageCount: smallint("image_count").default(0),
    listingQualityScore: smallint("listing_quality_score"),
    status: varchar("status", { length: 20 }).default("active"),
    isVerified: boolean("is_verified").default(false),
    availableDate: varchar("available_date", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    metroIdx: index("idx_listings_metro").on(t.metroId),
    priceIdx: index("idx_listings_price").on(t.priceMonthly),
  })
);

// ============================================================
// HOSPITAL ↔ LISTING SCORES
// ============================================================
export const hospitalListingScores = pgTable(
  "hospital_listing_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hospitalId: uuid("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
    straightLineMiles: numeric("straight_line_miles", { precision: 6, scale: 2 }).notNull(),
    estimatedDriveMiles: numeric("estimated_drive_miles", { precision: 6, scale: 2 }),
    driveTimeDayMin: smallint("drive_time_day_min"),
    driveTimeNightMin: smallint("drive_time_night_min"),
    proximityScore: smallint("proximity_score").notNull(),
    combinedScore: smallint("combined_score"),
    calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow(),
    calculationMethod: varchar("calculation_method", { length: 20 }).default("haversine"),
  },
  (t) => ({
    hospitalIdx: index("idx_hls_hospital").on(t.hospitalId),
    listingIdx: index("idx_hls_listing").on(t.listingId),
    hospitalProxIdx: index("idx_hls_proximity").on(t.hospitalId, t.proximityScore),
    hospitalListingUniq: uniqueIndex("idx_hls_hospital_listing").on(t.hospitalId, t.listingId),
  })
);
