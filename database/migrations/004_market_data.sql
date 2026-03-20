CREATE TABLE IF NOT EXISTS market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code TEXT NOT NULL,
  metro_id UUID REFERENCES metros(id),
  median_rent INTEGER,
  rent_studio INTEGER,
  rent_1br INTEGER,
  rent_2br INTEGER,
  rent_3br INTEGER,
  rent_4br INTEGER,
  avg_sqft INTEGER,
  vacancy_rate NUMERIC(5,2),
  listings_count INTEGER,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(zip_code)
);

CREATE INDEX IF NOT EXISTS idx_market_data_metro ON market_data(metro_id);
CREATE INDEX IF NOT EXISTS idx_market_data_zip ON market_data(zip_code);
