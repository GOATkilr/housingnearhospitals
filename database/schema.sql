-- ============================================================
-- Housing Near Hospitals — Database Schema
-- PostgreSQL 15+ with PostGIS 3.3+
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;       -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- UUID generation

-- ============================================================
-- METROS
-- ============================================================
CREATE TABLE metros (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            VARCHAR(100) UNIQUE NOT NULL,          -- "nashville-tn"
    name            VARCHAR(200) NOT NULL,                  -- "Nashville, TN"
    state_code      CHAR(2) NOT NULL,
    center          GEOGRAPHY(POINT, 4326) NOT NULL,       -- Metro center point
    radius_miles    NUMERIC(6,2) DEFAULT 30.0,             -- Search radius
    timezone        VARCHAR(50) NOT NULL DEFAULT 'America/Chicago',
    circuity_factor NUMERIC(4,2) DEFAULT 1.30,             -- Road vs straight-line multiplier
    is_active       BOOLEAN DEFAULT false,
    metro_pop       INTEGER,
    avg_rent_1br    INTEGER,                                -- Average 1BR rent in dollars
    cost_of_living  NUMERIC(5,2),                           -- Index (100 = national avg)
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metros_slug ON metros(slug);
CREATE INDEX idx_metros_active ON metros(is_active) WHERE is_active = true;

-- ============================================================
-- HOSPITALS
-- ============================================================
CREATE TABLE hospitals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metro_id            UUID REFERENCES metros(id) ON DELETE SET NULL,
    cms_ccn             VARCHAR(20),                            -- CMS Certification Number
    hifld_id            VARCHAR(20),                            -- HIFLD dataset ID
    name                VARCHAR(300) NOT NULL,
    slug                VARCHAR(300) NOT NULL,
    address             VARCHAR(500),
    city                VARCHAR(100),
    state_code          CHAR(2),
    zip_code            VARCHAR(10),
    county              VARCHAR(100),
    phone               VARCHAR(20),
    website             VARCHAR(500),
    location            GEOGRAPHY(POINT, 4326) NOT NULL,        -- Geocoded lat/lng
    hospital_type       VARCHAR(50) NOT NULL DEFAULT 'General Acute Care',
    -- Types: General Acute Care, Critical Access, Psychiatric,
    --        Rehabilitation, Long Term Care, Children's, VA, Military
    ownership           VARCHAR(100),
    -- Ownership: Government, Non-Profit, For-Profit
    system_name         VARCHAR(200),                           -- Parent health system
    bed_count           INTEGER,
    has_emergency        BOOLEAN DEFAULT true,
    trauma_level        VARCHAR(20),                            -- Level I, II, III, IV, V
    teaching_status     VARCHAR(50),                            -- Major, Minor, None
    cms_overall_rating  SMALLINT CHECK (cms_overall_rating BETWEEN 1 AND 5),
    cms_patient_exp     SMALLINT CHECK (cms_patient_exp BETWEEN 1 AND 5),
    cms_safety_rating   SMALLINT CHECK (cms_safety_rating BETWEEN 1 AND 5),
    annual_admissions   INTEGER,
    annual_er_visits    INTEGER,
    is_active           BOOLEAN DEFAULT true,
    data_source         VARCHAR(50) DEFAULT 'hifld',            -- hifld, cms, manual
    raw_data            JSONB,                                  -- Original import data
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for proximity queries
CREATE INDEX idx_hospitals_location ON hospitals USING GIST (location);
CREATE UNIQUE INDEX idx_hospitals_slug_metro ON hospitals(slug, metro_id);
CREATE INDEX idx_hospitals_metro ON hospitals(metro_id);
CREATE INDEX idx_hospitals_name_trgm ON hospitals USING GIN (name gin_trgm_ops);
CREATE INDEX idx_hospitals_type ON hospitals(hospital_type);
CREATE INDEX idx_hospitals_active ON hospitals(is_active) WHERE is_active = true;

-- ============================================================
-- NEIGHBORHOODS
-- ============================================================
CREATE TABLE neighborhoods (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metro_id        UUID NOT NULL REFERENCES metros(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(200) NOT NULL,
    center          GEOGRAPHY(POINT, 4326),
    boundary        GEOGRAPHY(POLYGON, 4326),              -- Neighborhood boundary
    walk_score      SMALLINT,
    transit_score   SMALLINT,
    bike_score      SMALLINT,
    safety_score    SMALLINT,                               -- 0-100
    median_rent     INTEGER,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(slug, metro_id)
);

CREATE INDEX idx_neighborhoods_metro ON neighborhoods(metro_id);
CREATE INDEX idx_neighborhoods_center ON neighborhoods USING GIST (center);

-- ============================================================
-- LISTINGS
-- ============================================================
CREATE TABLE listings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metro_id            UUID NOT NULL REFERENCES metros(id) ON DELETE CASCADE,
    neighborhood_id     UUID REFERENCES neighborhoods(id) ON DELETE SET NULL,
    external_id         VARCHAR(200),                           -- ID from source platform
    source              VARCHAR(50) NOT NULL DEFAULT 'manual',  -- manual, apartments_com, zillow, furnished_finder, airbnb
    source_url          VARCHAR(1000),                          -- Original listing URL
    affiliate_url       VARCHAR(1000),                          -- Monetized link

    -- Property details
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    property_type       VARCHAR(50) NOT NULL DEFAULT 'apartment',
    -- Types: apartment, house, condo, townhouse, room, studio
    location            GEOGRAPHY(POINT, 4326) NOT NULL,
    address             VARCHAR(500),
    city                VARCHAR(100),
    state_code          CHAR(2),
    zip_code            VARCHAR(10),

    -- Unit details
    bedrooms            SMALLINT,                               -- 0 = studio
    bathrooms           NUMERIC(3,1),
    sqft                INTEGER,
    floor_number        SMALLINT,

    -- Pricing
    price_monthly       INTEGER NOT NULL,                       -- Monthly rent in dollars
    price_deposit       INTEGER,
    price_application   INTEGER,
    currency            CHAR(3) DEFAULT 'USD',

    -- Healthcare worker features
    is_furnished        BOOLEAN DEFAULT false,
    furniture_level     VARCHAR(20),                            -- full, partial, none
    lease_min_months    SMALLINT DEFAULT 12,
    lease_max_months    SMALLINT,
    allows_pets         BOOLEAN DEFAULT false,
    pet_deposit         INTEGER,
    pet_rent_monthly    INTEGER,
    has_parking         BOOLEAN DEFAULT false,
    parking_type        VARCHAR(30),                            -- garage, covered, lot, street
    parking_cost        INTEGER,                                -- Monthly in cents
    has_in_unit_laundry BOOLEAN DEFAULT false,
    has_onsite_laundry  BOOLEAN DEFAULT false,
    has_ac              BOOLEAN DEFAULT true,
    has_dishwasher      BOOLEAN DEFAULT false,

    -- Amenities (flexible JSON for varying attributes)
    amenities           JSONB DEFAULT '[]'::jsonb,
    -- e.g. ["pool", "gym", "doorman", "elevator", "balcony", "storage"]

    -- Media
    primary_image_url   VARCHAR(1000),
    image_count         SMALLINT DEFAULT 0,

    -- Scoring (pre-computed)
    listing_quality_score SMALLINT,                             -- 0-100

    -- Status
    status              VARCHAR(20) DEFAULT 'active',           -- active, pending, expired, removed
    is_verified         BOOLEAN DEFAULT false,
    verified_at         TIMESTAMPTZ,
    available_date      DATE,
    listed_at           TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    deleted_at          TIMESTAMPTZ,

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for proximity queries
CREATE INDEX idx_listings_location ON listings USING GIST (location);
CREATE INDEX idx_listings_metro ON listings(metro_id);
CREATE INDEX idx_listings_source ON listings(source, external_id);
CREATE INDEX idx_listings_price ON listings(price_monthly);
CREATE INDEX idx_listings_bedrooms ON listings(bedrooms);
CREATE INDEX idx_listings_furnished ON listings(is_furnished) WHERE is_furnished = true;
CREATE INDEX idx_listings_status ON listings(status) WHERE status = 'active';
CREATE INDEX idx_listings_quality ON listings(listing_quality_score DESC NULLS LAST);
CREATE INDEX idx_listings_neighborhood ON listings(neighborhood_id);

-- ============================================================
-- HOSPITAL ↔ LISTING PROXIMITY SCORES (Junction Table)
-- Pre-computed scores for fast queries
-- ============================================================
CREATE TABLE hospital_listing_scores (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id             UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    listing_id              UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,

    -- Distance metrics
    straight_line_miles     NUMERIC(6,2) NOT NULL,
    estimated_drive_miles   NUMERIC(6,2),
    drive_time_day_min      SMALLINT,                   -- Minutes at 6:30 AM
    drive_time_night_min    SMALLINT,                   -- Minutes at 6:30 PM
    transit_time_min        SMALLINT,                   -- Public transit time
    walk_time_min           SMALLINT,                   -- Walking time (if < 2 miles)

    -- Score components (0-100 each)
    score_drive_day         SMALLINT,
    score_drive_night       SMALLINT,
    score_distance          SMALLINT,
    score_transit           SMALLINT,
    score_walkability       SMALLINT,
    score_safety            SMALLINT,
    score_noise             SMALLINT,

    -- Final computed scores
    proximity_score         SMALLINT NOT NULL,           -- 0-100 weighted composite
    combined_score          SMALLINT,                    -- Includes listing quality

    -- Metadata
    calculated_at           TIMESTAMPTZ DEFAULT NOW(),
    calculation_method      VARCHAR(20) DEFAULT 'haversine',  -- haversine, osrm, google

    UNIQUE(hospital_id, listing_id)
);

CREATE INDEX idx_hls_hospital ON hospital_listing_scores(hospital_id);
CREATE INDEX idx_hls_listing ON hospital_listing_scores(listing_id);
CREATE INDEX idx_hls_proximity ON hospital_listing_scores(hospital_id, proximity_score DESC);
CREATE INDEX idx_hls_combined ON hospital_listing_scores(hospital_id, combined_score DESC NULLS LAST);

-- ============================================================
-- LISTING IMAGES
-- ============================================================
CREATE TABLE listing_images (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url         VARCHAR(1000) NOT NULL,
    alt_text    VARCHAR(300),
    sort_order  SMALLINT DEFAULT 0,
    width       SMALLINT,
    height      SMALLINT,
    is_primary  BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listing_images_listing ON listing_images(listing_id, sort_order);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(300) UNIQUE NOT NULL,
    name            VARCHAR(200),
    avatar_url      VARCHAR(1000),
    role            VARCHAR(20) DEFAULT 'user',             -- user, admin, moderator
    profession      VARCHAR(50),                            -- travel_nurse, resident, physician, allied_health, other
    auth_provider   VARCHAR(20) DEFAULT 'email',            -- email, google, facebook
    auth_provider_id VARCHAR(200),
    is_active       BOOLEAN DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id      UUID REFERENCES listings(id) ON DELETE CASCADE,
    hospital_id     UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title           VARCHAR(200),
    body            TEXT,
    pros            TEXT,
    cons            TEXT,
    commute_rating  SMALLINT CHECK (commute_rating BETWEEN 1 AND 5),
    safety_rating   SMALLINT CHECK (safety_rating BETWEEN 1 AND 5),
    value_rating    SMALLINT CHECK (value_rating BETWEEN 1 AND 5),
    is_verified     BOOLEAN DEFAULT false,
    is_published    BOOLEAN DEFAULT true,
    helpful_count   INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CHECK (listing_id IS NOT NULL OR hospital_id IS NOT NULL)
);

CREATE INDEX idx_reviews_listing ON reviews(listing_id) WHERE listing_id IS NOT NULL;
CREATE INDEX idx_reviews_hospital ON reviews(hospital_id) WHERE hospital_id IS NOT NULL;
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- ============================================================
-- SAVED LISTINGS (User favorites)
-- ============================================================
CREATE TABLE saved_listings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,   -- Context: which hospital were they searching
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_saved_user ON saved_listings(user_id);

-- ============================================================
-- SEARCH ALERTS
-- ============================================================
CREATE TABLE search_alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hospital_id     UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    metro_id        UUID REFERENCES metros(id) ON DELETE CASCADE,
    name            VARCHAR(200),
    filters         JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- e.g. {"max_price": 2000, "min_bedrooms": 1, "furnished": true, "min_score": 60}
    frequency       VARCHAR(20) DEFAULT 'daily',        -- instant, daily, weekly
    is_active       BOOLEAN DEFAULT true,
    last_sent_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_user ON search_alerts(user_id);
CREATE INDEX idx_alerts_active ON search_alerts(is_active) WHERE is_active = true;

-- ============================================================
-- CLICK TRACKING (for affiliate revenue attribution)
-- ============================================================
CREATE TABLE click_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    hospital_id     UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    event_type      VARCHAR(30) NOT NULL DEFAULT 'click',   -- click, view, save, share, apply
    source          VARCHAR(50),                             -- search, map, hospital_page, alert_email
    affiliate_url   VARCHAR(1000),
    ip_hash         VARCHAR(64),                            -- Hashed for privacy
    user_agent      VARCHAR(500),
    session_id      VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clicks_listing ON click_events(listing_id, created_at DESC);
CREATE INDEX idx_clicks_hospital ON click_events(hospital_id, created_at DESC) WHERE hospital_id IS NOT NULL;
CREATE INDEX idx_clicks_date ON click_events(created_at DESC);

-- ============================================================
-- DATA IMPORT LOG
-- ============================================================
CREATE TABLE import_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source          VARCHAR(50) NOT NULL,                   -- hifld, cms, apartments_com, manual
    entity_type     VARCHAR(30) NOT NULL,                   -- hospital, listing
    metro_id        UUID REFERENCES metros(id),
    records_total   INTEGER,
    records_created INTEGER,
    records_updated INTEGER,
    records_skipped INTEGER,
    records_errored INTEGER,
    errors          JSONB DEFAULT '[]'::jsonb,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    status          VARCHAR(20) DEFAULT 'running'           -- running, completed, failed
);

-- ============================================================
-- HELPFUL FUNCTIONS
-- ============================================================

-- Function: Calculate straight-line distance between two points (miles)
CREATE OR REPLACE FUNCTION distance_miles(
    point1 GEOGRAPHY,
    point2 GEOGRAPHY
) RETURNS NUMERIC AS $$
    SELECT ROUND((ST_Distance(point1, point2) / 1609.344)::NUMERIC, 2);
$$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE;

-- Function: Estimate drive time from straight-line distance
CREATE OR REPLACE FUNCTION estimated_drive_time(
    straight_line_miles NUMERIC,
    circuity_factor NUMERIC DEFAULT 1.3,
    avg_speed_mph NUMERIC DEFAULT 25.0
) RETURNS INTEGER AS $$
    SELECT ROUND((straight_line_miles * circuity_factor / avg_speed_mph * 60))::INTEGER;
$$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE;

-- Function: Calculate proximity score from drive time
CREATE OR REPLACE FUNCTION proximity_score_from_drive_time(
    drive_time_minutes INTEGER
) RETURNS SMALLINT AS $$
    SELECT CASE
        WHEN drive_time_minutes <= 5  THEN 100
        WHEN drive_time_minutes <= 10 THEN 95
        WHEN drive_time_minutes <= 15 THEN 85
        WHEN drive_time_minutes <= 20 THEN 75
        WHEN drive_time_minutes <= 25 THEN 65
        WHEN drive_time_minutes <= 30 THEN 55
        WHEN drive_time_minutes <= 40 THEN 40
        WHEN drive_time_minutes <= 50 THEN 30
        WHEN drive_time_minutes <= 60 THEN 20
        WHEN drive_time_minutes <= 90 THEN 10
        ELSE 0
    END::SMALLINT;
$$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE;

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_metros_updated_at BEFORE UPDATE ON metros FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_hospitals_updated_at BEFORE UPDATE ON hospitals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_neighborhoods_updated_at BEFORE UPDATE ON neighborhoods FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_alerts_updated_at BEFORE UPDATE ON search_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- MATERIALIZED VIEW: Search results (refreshed periodically)
-- Denormalized for fast search queries
-- ============================================================
CREATE MATERIALIZED VIEW mv_search_results AS
SELECT
    hls.id AS score_id,
    h.id AS hospital_id,
    h.name AS hospital_name,
    h.slug AS hospital_slug,
    h.hospital_type,
    h.bed_count,
    h.system_name,
    h.cms_overall_rating,
    l.id AS listing_id,
    l.title AS listing_title,
    l.property_type,
    l.bedrooms,
    l.bathrooms,
    l.sqft,
    l.price_monthly,
    l.is_furnished,
    l.lease_min_months,
    l.allows_pets,
    l.has_parking,
    l.has_in_unit_laundry,
    l.primary_image_url,
    l.source,
    l.affiliate_url,
    l.source_url,
    l.listing_quality_score,
    l.location AS listing_location,
    h.location AS hospital_location,
    hls.straight_line_miles,
    hls.drive_time_day_min,
    hls.drive_time_night_min,
    hls.proximity_score,
    hls.combined_score,
    m.id AS metro_id,
    m.slug AS metro_slug,
    m.name AS metro_name,
    n.name AS neighborhood_name,
    n.slug AS neighborhood_slug
FROM hospital_listing_scores hls
JOIN hospitals h ON h.id = hls.hospital_id AND h.is_active = true
JOIN listings l ON l.id = hls.listing_id AND l.status = 'active' AND l.deleted_at IS NULL
JOIN metros m ON m.id = l.metro_id AND m.is_active = true
LEFT JOIN neighborhoods n ON n.id = l.neighborhood_id
ORDER BY hls.proximity_score DESC;

CREATE UNIQUE INDEX idx_mv_search_score_id ON mv_search_results(score_id);
CREATE INDEX idx_mv_search_hospital ON mv_search_results(hospital_id, proximity_score DESC);
CREATE INDEX idx_mv_search_metro ON mv_search_results(metro_id);
CREATE INDEX idx_mv_search_price ON mv_search_results(price_monthly);

-- ============================================================
-- SEED DATA: Launch metros
-- ============================================================
INSERT INTO metros (slug, name, state_code, center, timezone, circuity_factor, is_active, metro_pop, avg_rent_1br, cost_of_living) VALUES
    ('nashville-tn', 'Nashville, TN', 'TN', ST_SetSRID(ST_MakePoint(-86.7816, 36.1627), 4326)::GEOGRAPHY, 'America/Chicago', 1.30, true, 1989519, 1550, 97.5),
    ('houston-tx', 'Houston, TX', 'TX', ST_SetSRID(ST_MakePoint(-95.3698, 29.7604), 4326)::GEOGRAPHY, 'America/Chicago', 1.40, true, 7122240, 1200, 93.1),
    ('phoenix-az', 'Phoenix, AZ', 'AZ', ST_SetSRID(ST_MakePoint(-112.0740, 33.4484), 4326)::GEOGRAPHY, 'America/Phoenix', 1.25, true, 4845832, 1350, 100.8);

-- ============================================================
-- EXAMPLE QUERY: Find top 20 listings near a hospital within 10 miles
-- ============================================================
-- SELECT
--     l.title,
--     l.price_monthly,
--     l.bedrooms,
--     l.is_furnished,
--     distance_miles(h.location, l.location) AS miles_away,
--     estimated_drive_time(distance_miles(h.location, l.location), m.circuity_factor) AS est_drive_min,
--     proximity_score_from_drive_time(
--         estimated_drive_time(distance_miles(h.location, l.location), m.circuity_factor)
--     ) AS prox_score
-- FROM listings l
-- JOIN metros m ON m.id = l.metro_id
-- CROSS JOIN hospitals h
-- WHERE h.slug = 'vanderbilt-university-medical-center'
--   AND ST_DWithin(h.location, l.location, 10 * 1609.344)  -- 10 miles in meters
--   AND l.status = 'active'
-- ORDER BY prox_score DESC, l.price_monthly ASC
-- LIMIT 20;
