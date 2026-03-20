# Traffic Growth Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maximize organic search traffic by expanding listing inventory, adding rent market data to hospital pages, building a rent estimate tool, and fixing stale homepage copy.

**Architecture:** Three new data features powered by RentCast Pro API (10K calls/month). Market data and rent estimates are fetched via new scripts, stored in DB, and displayed on existing hospital pages + a new rent estimate page. ZIP expansion triples listing coverage.

**Tech Stack:** Next.js 14, Neon Postgres, RentCast API v1, TypeScript, Tailwind CSS

---

## Chunk 1: Expand Listing Inventory

### Task 1: Triple ZIP Coverage + Update Pro Limits

**Files:**
- Modify: `scripts/fetch-rentcast-listings.ts`

- [ ] **Step 1: Update API limits and ZIP lists**

Update the script header comment and limits for Pro tier, and expand METRO_ZIPS from ~6 to ~15 ZIPs per metro (targeting additional hospital-adjacent neighborhoods):

```typescript
const API_CALL_LIMIT = 500; // RentCast Pro: 10K calls/month, safe per-run cap
const CACHE_MAX_AGE_DAYS = 5; // Refresh more frequently with Pro
```

Expand each metro's ZIP array with additional hospital-cluster-adjacent ZIPs. For example Nashville goes from 8 to 15 ZIPs by adding surrounding neighborhoods that feed into hospital corridors.

- [ ] **Step 2: Update the console log that says "50/month"**

Line 161 still says `50/month` — update to reflect Pro tier.

- [ ] **Step 3: Commit**

```bash
git add scripts/fetch-rentcast-listings.ts
git commit -m "feat: expand ZIP coverage and update limits for RentCast Pro tier"
```

### Task 2: Fix Homepage Stale Copy

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update "three major healthcare markets" text**

The homepage still says "launching in three major healthcare markets" and "Nashville, Houston, and Phoenix" — but there are 27 metros now.

Change the StepCard description and the Explore Cities subtitle to be dynamic/accurate.

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "fix: update homepage copy to reflect 27+ metros"
```

---

## Chunk 2: Rent Market Data on Hospital Pages

### Task 3: Create Market Data Fetch Script

**Files:**
- Create: `scripts/fetch-market-data.ts`
- Create: `database/migrations/004_market_data.sql`

- [ ] **Step 1: Create market_data table migration**

```sql
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

CREATE INDEX idx_market_data_metro ON market_data(metro_id);
CREATE INDEX idx_market_data_zip ON market_data(zip_code);
```

- [ ] **Step 2: Run migration**

```bash
npx tsx scripts/run-migration.ts database/migrations/004_market_data.sql
```

Or run directly via psql/neon dashboard.

- [ ] **Step 3: Create fetch-market-data.ts**

Script that:
- Iterates all ZIPs in METRO_ZIPS
- Calls `GET https://api.rentcast.io/v1/markets?zipCode={zip}`
- Caches to `data/rentcast-markets/{zip}.json` (30-day TTL)
- Upserts into market_data table
- Rate-limited: 1 request/second, max 200 calls/run

- [ ] **Step 4: Commit**

```bash
git add scripts/fetch-market-data.ts database/migrations/004_market_data.sql
git commit -m "feat: add market data fetch script and DB table"
```

### Task 4: Display Market Data on Hospital Pages

**Files:**
- Modify: `src/lib/queries.ts` — add `getMarketDataForZips()` query
- Create: `src/components/hospital/RentMarketData.tsx` — market data display component
- Modify: `src/app/city/[slug]/[hospitalSlug]/page.tsx` — add market data section

- [ ] **Step 1: Add query function**

```typescript
export async function getMarketDataForZips(zipCodes: string[]): Promise<MarketData[]> {
  // Query market_data table for given ZIP codes
  // Return averaged/aggregated rent data
}
```

- [ ] **Step 2: Create RentMarketData component**

Server component that displays:
- "Average Rent Near [Hospital]" heading
- Grid showing Studio / 1BR / 2BR / 3BR median rents
- Comparison to metro average (if available from metro table's avg_rent_1br)
- Data attribution: "Rent data from RentCast"

- [ ] **Step 3: Add to hospital page**

Insert `<RentMarketData>` between the listing stats section and the listings section.

- [ ] **Step 4: Add MarketData type to types/index.ts**

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries.ts src/components/hospital/RentMarketData.tsx src/app/city/[slug]/[hospitalSlug]/page.tsx src/types/index.ts
git commit -m "feat: display rent market data on hospital pages"
```

---

## Chunk 3: Rent Estimate Tool

### Task 5: Create Rent Estimate API Route

**Files:**
- Create: `src/app/api/v1/rent-estimate/route.ts`

- [ ] **Step 1: Create API route**

Proxies to RentCast AVM endpoint:
- `GET /api/v1/rent-estimate?lat={lat}&lng={lng}&bedrooms={beds}&propertyType={type}`
- Calls `https://api.rentcast.io/v1/avm/rent/long-term?latitude={lat}&longitude={lng}&bedrooms={beds}&propertyType={type}`
- Returns: `{ rent, rentRangeLow, rentRangeHigh, comparables }`
- Caches response in-memory or via a simple JSON cache (to avoid burning API calls)

- [ ] **Step 2: Commit**

```bash
git add src/app/api/v1/rent-estimate/route.ts
git commit -m "feat: add rent estimate API proxy for RentCast AVM"
```

### Task 6: Create Rent Estimate Page

**Files:**
- Create: `src/app/rent-estimate/page.tsx`
- Create: `src/components/rent-estimate/RentEstimateForm.tsx` (client component)
- Modify: `src/components/layout/Header.tsx` — add nav link

- [ ] **Step 1: Create the page (server component with metadata)**

```typescript
// SEO-rich metadata
export const metadata: Metadata = {
  title: "Rent Estimate Near Hospitals | Housing Near Hospitals",
  description: "What should rent cost near your hospital? Get instant rent estimates by hospital with comparisons by bedroom count.",
};
```

- [ ] **Step 2: Create RentEstimateForm client component**

Interactive form:
- Hospital selector (reuse HospitalSearch component)
- Bedroom count selector (Studio, 1BR, 2BR, 3BR+)
- Property type selector (Apartment, House, Condo)
- "Get Estimate" button
- Results display: estimated rent, range low-high, comparable listings
- CTA: "Find apartments near [Hospital] from $X/mo →" linking to hospital page

- [ ] **Step 3: Add "Rent Estimate" link to Header navigation**

Add between Guides and Map in desktop nav.

- [ ] **Step 4: Add JSON-LD structured data for the tool page**

WebApplication schema for the rent estimate tool.

- [ ] **Step 5: Commit**

```bash
git add src/app/rent-estimate/page.tsx src/components/rent-estimate/RentEstimateForm.tsx src/components/layout/Header.tsx
git commit -m "feat: add rent estimate tool page with hospital-based lookup"
```

### Task 7: Add Rent Estimate to Sitemap

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Add /rent-estimate to sitemap**

Add as a static route with weekly changefreq, priority 0.8.

- [ ] **Step 2: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: add rent estimate page to sitemap"
```

---

## Chunk 4: Pipeline Integration

### Task 8: Add Market Data to Pipeline

**Files:**
- Modify: `scripts/refresh-listings-pipeline.ts`

- [ ] **Step 1: Add market data fetch as Step 5 in pipeline**

After expiring stale listings and before summary, run `fetch-market-data.ts`.

- [ ] **Step 2: Commit**

```bash
git add scripts/refresh-listings-pipeline.ts
git commit -m "feat: add market data fetch to listings pipeline"
```
