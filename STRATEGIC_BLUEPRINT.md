# Housing Near Hospitals — Strategic Blueprint

## Complete Product, Data, and Go-to-Market Plan

---

## Table of Contents

- [A. Market Analysis & Opportunity](#a-market-analysis--opportunity)
- [B. Product Vision & Architecture](#b-product-vision--architecture)
- [C. Data Strategy](#c-data-strategy)
- [D. Scoring & Ranking Engine](#d-scoring--ranking-engine)
- [E. Database Schema & Data Model](#e-database-schema--data-model)
- [F. UI/UX Design System](#f-uiux-design-system)
- [G. SEO & Content Strategy](#g-seo--content-strategy)
- [H. Monetization Strategy](#h-monetization-strategy)
- [I. Go-to-Market Plan](#i-go-to-market-plan)
- [J. Competitive Landscape](#j-competitive-landscape)
- [K. Week 1 Execution Plan](#k-week-1-execution-plan)
- [L. Technical Stack & Infrastructure](#l-technical-stack--infrastructure)

---

## A. Market Analysis & Opportunity

### The Problem

Healthcare workers — travel nurses, residents, fellows, new-hire physicians, and allied health professionals — face a unique housing challenge: they need housing **close to their workplace** on **compressed timelines** (often 2-4 weeks before a 13-week contract starts). Existing platforms (Zillow, Apartments.com, Furnished Finder) are general-purpose and don't optimize for hospital proximity.

### Target Users

| Segment | Size (US) | Pain Point | Willingness to Pay |
|---------|-----------|-----------|-------------------|
| Travel Nurses | ~1.7M active | 13-week contracts, new city every quarter | High — agencies often provide stipends |
| Medical Residents | ~145K/yr | Low pay, long hours, need short commute | Medium — cost-sensitive |
| Travel Allied Health | ~500K | Same as travel nurses | High |
| Locum Tenens Physicians | ~50K | Short-term assignments | Very High |
| New-Hire Hospital Staff | Millions | Relocating for new job | Medium |

### Market Size

- **TAM**: ~$4.2B (all healthcare worker housing spend annually)
- **SAM**: ~$800M (travel healthcare housing, where proximity is critical)
- **SOM Year 1**: ~$2M (affiliate revenue + premium listings in 3 launch metros)

### Launch Markets (Ranked)

#### 1. Nashville, TN (Primary Launch)
- **Why**: 25+ hospitals including Vanderbilt, HCA headquarters (170+ hospitals managed from here), Saint Thomas, TriStar network. Massive travel nurse demand. Growing city with dynamic rental market. Affordable relative to coastal cities.
- **Hospital density**: ~180 facilities in metro area
- **Key systems**: Vanderbilt University Medical Center, HCA Healthcare, Ascension Saint Thomas, TriStar Health

#### 2. Houston, TX (Secondary Launch)
- **Why**: Texas Medical Center is the world's largest medical complex (60+ institutions). Enormous travel nurse volume. No state income tax attractive to travelers. Sprawling city makes proximity even more important.
- **Hospital density**: ~200+ facilities in metro area
- **Key systems**: Texas Medical Center, Memorial Hermann, Houston Methodist, MD Anderson

#### 3. Phoenix, AZ (Tertiary Launch)
- **Why**: Rapidly growing metro, major hospital systems expanding, huge travel nurse demand, affordable housing, year-round warm weather attractive to travelers. Banner Health, Mayo Clinic, HonorHealth, Dignity Health all have major presences.
- **Hospital density**: ~120+ facilities in metro area
- **Key systems**: Banner Health, Mayo Clinic Arizona, HonorHealth, Valleywise Health

### Why Not Coastal Cities First?
- San Francisco, NYC, Boston have high competition from existing platforms
- Higher CAC (customer acquisition cost) for advertising
- Housing prices are extreme, limiting affiliate revenue potential
- Mid-market cities have higher travel nurse volume per capita

---

## B. Product Vision & Architecture

### Core Value Proposition

> "Find housing scored by commute time to your hospital — not just distance, but actual drive time, transit access, and shift-compatibility."

### Product Pillars

1. **Hospital-Centric Search**: Users start by selecting their hospital, not a neighborhood
2. **Commute Scoring**: Every listing gets a 0-100 proximity score based on real commute data
3. **Shift-Aware**: Factor in 7am and 7pm shift changes (not just 9-5 commute)
4. **Healthcare Worker Features**: Furnished filter, short-term lease filter, pet policy, parking, safety score
5. **Trust Layer**: Verified listings, community reviews from other healthcare workers

### Information Architecture

```
Homepage
├── /search (Hospital search → results)
├── /city/[slug] (City landing page — SEO)
│   └── /city/[slug]/[hospital-slug] (Hospital detail page — SEO)
│       └── /city/[slug]/[hospital-slug]/housing (Listings near hospital)
├── /listing/[id] (Individual listing detail)
├── /map (Full-screen map explorer)
├── /guides
│   ├── /guides/travel-nurse-housing (Content hub)
│   └── /guides/[city]-hospitals (City guide)
├── /admin
│   ├── /admin/hospitals (Hospital data management)
│   ├── /admin/listings (Listing management)
│   ├── /admin/scoring (Score configuration)
│   └── /admin/analytics (Dashboard)
├── /api/v1/...  (REST API)
└── /auth (Login/Register)
```

### Page Descriptions

| Page | Purpose | Key Features |
|------|---------|-------------|
| Homepage | Convert visitors to searchers | Hospital search bar, featured cities, social proof |
| City Page | SEO landing, city overview | Hospital list, neighborhood map, cost of living |
| Hospital Page | Hospital detail + nearby housing | Hospital info, scored listings, commute map |
| Listing Detail | Convert to click-through/inquiry | Photos, scoring breakdown, commute details |
| Map Explorer | Power-user browsing | Interactive map with hospital pins + listing clusters |
| Admin Dashboard | Operator tools | Data ingestion, listing management, analytics |

---

## C. Data Strategy

### Hospital Data Sources

#### Primary: CMS Provider of Services (POS) File
- **URL**: https://data.cms.gov/provider-characteristics/hospitals-and-other-facilities/provider-of-services-file-hospital-non-hospital-type
- **Format**: CSV
- **Records**: ~7,500 Medicare-certified hospitals
- **Key fields**: Provider name, address, city, state, ZIP, county, bed count, hospital type, ownership type, CMS certification number (CCN)
- **Update frequency**: Quarterly
- **License**: Public domain (US Government)
- **Limitations**: No lat/lng (must geocode), limited to Medicare-certified facilities

#### Secondary: HIFLD Hospital Dataset
- **URL**: https://hifld-geoplatform.opendata.arcgis.com/datasets/hospitals
- **Format**: GeoJSON, CSV, Shapefile
- **Records**: ~7,596 hospitals
- **Key fields**: Name, address, city, state, ZIP, latitude, longitude, type (general, psychiatric, etc.), status (open/closed), beds, trauma level, owner
- **Update frequency**: Annual
- **License**: Public domain
- **Advantages**: Pre-geocoded with lat/lng, includes trauma level

#### Tertiary: CMS Hospital Compare / Care Compare
- **URL**: https://data.cms.gov/provider-data/topics/hospitals
- **Format**: CSV, API
- **Records**: ~5,000 hospitals with quality metrics
- **Key fields**: Overall star rating (1-5), patient experience scores, readmission rates, mortality rates, safety scores
- **Update frequency**: Quarterly
- **Use case**: Enrich hospital profiles with quality data

#### Supplementary: CMS Hospital General Information
- **URL**: https://data.cms.gov/provider-data/dataset/xubh-q36u
- **Format**: CSV
- **Key fields**: Hospital name, address, phone, type, ownership, emergency services (yes/no), overall rating
- **Use case**: Fill gaps, phone numbers, verify emergency services

### Housing Data Sources

#### Phase 1: Free Direct Listings (Launch)
- Allow landlords to list properties for **free** to maximize supply
- Manual listing submission via admin dashboard and self-serve form
- Curated seed data for launch markets to bootstrap inventory
- Strategy: Maximize listing volume to drive search traffic; monetize via ads, not listings

#### Phase 2: Scaled Listings + Aggregation (Month 3+)
- Self-serve landlord listing portal with verification
- Scrape/aggregate public rental data (Craigslist, Facebook Marketplace) for discovery
- Focus on furnished units and short-term leases
- Featured/premium listing upgrades available (paid tier)

#### Phase 3: MLS/IDX Integration (Month 6+)
- Partner with local MLS boards for real-time listing data
- IDX feed integration for for-sale properties near hospitals
- Requires broker partnership in each metro

### Geocoding Strategy

For hospital records without lat/lng (CMS POS data):
1. **Primary**: Google Maps Geocoding API (most accurate for addresses)
2. **Fallback**: Census Bureau Geocoder (free, decent accuracy)
3. **Batch processing**: Geocode all hospitals on initial import, cache results
4. **Cost**: Google Maps Geocoding — $5 per 1,000 requests ($37.50 for all US hospitals)

### Data Refresh Pipeline

```
Daily:    Housing listing availability checks (API pings)
Weekly:   Housing listing data refresh (new listings, price changes)
Monthly:  Hospital data cross-reference check
Quarterly: Full CMS data re-import + quality score refresh
Annually: HIFLD dataset re-import
```

---

## D. Scoring & Ranking Engine

### Proximity Score (0-100)

The core differentiator. Every listing gets a score relative to a specific hospital.

#### Score Components

| Component | Weight | Calculation |
|-----------|--------|------------|
| Drive Time (day shift) | 30% | Minutes at 6:30 AM arrival |
| Drive Time (night shift) | 20% | Minutes at 6:30 PM arrival |
| Straight-line Distance | 15% | Haversine formula in miles |
| Transit Access | 10% | Walk score to nearest transit + transit time |
| Walkability | 10% | Walk Score API integration |
| Safety Score | 10% | Crime data for census tract |
| Noise Level | 5% | Distance from highways, airports, rail |

#### Score Bands

| Score | Label | Typical Distance | Color |
|-------|-------|-----------------|-------|
| 90-100 | Walking Distance | < 1 mile | 🟢 Green |
| 75-89 | Very Close | 1-3 miles | 🟢 Light Green |
| 60-74 | Close | 3-7 miles | 🟡 Yellow |
| 40-59 | Moderate | 7-15 miles | 🟠 Orange |
| 20-39 | Far | 15-25 miles | 🔴 Light Red |
| 0-19 | Very Far | 25+ miles | 🔴 Red |

#### Drive Time Calculation

**MVP Approach** (Phase 1):
- Use straight-line distance with a metro-specific **circuity factor**
- Nashville: 1.3x (moderate grid)
- Houston: 1.4x (sprawling, highways)
- Phoenix: 1.25x (grid layout)
- Formula: `estimated_drive_minutes = (straight_line_miles * circuity_factor) / avg_speed_mph * 60`
- Average speeds: Urban core 20mph, Suburban 30mph, Highway corridor 45mph

**Production Approach** (Phase 2):
- Google Maps Distance Matrix API or OSRM (Open Source Routing Machine)
- Batch calculate commute times for all listing-hospital pairs
- Cache results (routes don't change frequently)
- OSRM is free and self-hosted — preferred for cost control

### Listing Quality Score (0-100)

Separate from proximity — measures how suitable the listing is for healthcare workers.

| Factor | Weight | Criteria |
|--------|--------|---------|
| Furnished | 25% | Furnished = full points, unfurnished = 0 |
| Lease Flexibility | 20% | Month-to-month > 3-month > 6-month > 12-month |
| Pet Friendly | 10% | Allows pets = full points |
| Parking | 10% | Included parking = full points |
| In-unit Laundry | 10% | In-unit > on-site > none |
| Verified | 15% | Verified listing = full points |
| Reviews | 10% | Average rating from healthcare worker reviews |

### Combined Score

```
final_score = (proximity_score * 0.65) + (listing_quality_score * 0.35)
```

---

## E. Database Schema & Data Model

### Entity Relationship Overview

```
metros (1) ──── (N) hospitals
metros (1) ──── (N) neighborhoods
hospitals (1) ──── (N) hospital_housing_scores (junction)
listings (1) ──── (N) hospital_housing_scores (junction)
listings (1) ──── (N) listing_images
listings (1) ──── (N) reviews
listings (N) ──── (1) neighborhoods
users (1) ──── (N) reviews
users (1) ──── (N) saved_listings
users (1) ──── (N) search_alerts
```

### Core Tables

See `database/schema.sql` for the complete DDL with PostGIS extensions, indexes, and constraints.

**Key design decisions:**
- PostGIS `GEOGRAPHY(POINT, 4326)` for all coordinates — enables efficient spatial queries
- `hospital_housing_scores` is the junction table pre-computing proximity scores
- Soft deletes (`deleted_at`) on user-facing tables
- `jsonb` for flexible metadata (amenities, features) that varies by listing
- Materialized views for search results (refreshed on schedule)

---

## F. UI/UX Design System

### Brand Identity

- **Name**: HousingNearHospitals (or "HNH" shorthand)
- **Tagline**: "Live closer. Commute less. Care more."
- **Voice**: Professional, empathetic, efficient. Speak like a trusted colleague, not a salesperson.

### Color System

```
Primary:       #1E40AF (Deep Blue — trust, healthcare)
Primary Light: #3B82F6 (Bright Blue — interactive elements)
Secondary:     #059669 (Emerald — "close to hospital" = good)
Accent:        #F59E0B (Amber — attention, CTAs)
Danger:        #DC2626 (Red — far from hospital)

Neutrals:
  50:  #F8FAFC
  100: #F1F5F9
  200: #E2E8F0
  300: #CBD5E1
  400: #94A3B8
  500: #64748B
  600: #475569
  700: #334155
  800: #1E293B
  900: #0F172A
```

### Typography

```
Headings: Inter (700, 600)
Body: Inter (400, 500)
Monospace: JetBrains Mono (scores, data)

Scale:
  xs:   0.75rem / 1rem
  sm:   0.875rem / 1.25rem
  base: 1rem / 1.5rem
  lg:   1.125rem / 1.75rem
  xl:   1.25rem / 1.75rem
  2xl:  1.5rem / 2rem
  3xl:  1.875rem / 2.25rem
  4xl:  2.25rem / 2.5rem
```

### Component Library

Built on **Tailwind CSS** + **shadcn/ui** for rapid development:

1. **ScoreRing** — Circular progress indicator showing 0-100 score with color coding
2. **HospitalCard** — Hospital name, type, bed count, distance, system badge
3. **ListingCard** — Photo, price, beds/baths, proximity score, key amenities
4. **CommuteBar** — Visual bar showing drive time with shift selector (day/night)
5. **MapView** — Mapbox GL JS with hospital pins (blue) and listing clusters (green)
6. **SearchBar** — Autocomplete for hospitals with metro context
7. **FilterPanel** — Price range, beds, furnished, lease term, score minimum
8. **ScoreBreakdown** — Expandable panel showing how a score was calculated

### Key Interactions

- **Hospital Selection → Instant Results**: Select a hospital, immediately see scored listings
- **Map ↔ List Sync**: Clicking a listing on the map highlights it in the list, and vice versa
- **Score Hover Detail**: Hover over any score to see the component breakdown
- **Shift Toggle**: Switch between day/night shift to see how commute times change
- **Save & Alert**: Save listings and set alerts for new listings near your hospital

---

## G. SEO & Content Strategy

### Programmatic SEO Pages

Generate landing pages for every hospital in every metro:

```
/city/nashville-tn                          → "Housing Near Nashville Hospitals"
/city/nashville-tn/vanderbilt-university     → "Housing Near Vanderbilt University Medical Center"
/city/nashville-tn/tristar-centennial        → "Housing Near TriStar Centennial Medical Center"
```

**Target keyword patterns:**
- "apartments near [hospital name]"
- "housing near [hospital name]"
- "travel nurse housing [city]"
- "short term rentals near [hospital name]"
- "furnished apartments near [hospital name]"

**Volume estimate**: "apartments near Vanderbilt" — ~1,300 searches/month

### Content Hub

- **Travel Nurse Housing Guide** — comprehensive guide, link magnet
- **City Guides** — "Complete Guide to Nashville for Travel Nurses"
- **Hospital Reviews** — "What It's Like to Work at Vanderbilt (Nurse Perspective)"
- **Cost of Living Comparisons** — "Nashville vs Houston for Travel Nurses"
- **Newsletter** — Weekly new listings digest by metro

### Technical SEO

- Server-side rendered (Next.js SSR/SSG)
- Structured data (Schema.org: Hospital, ApartmentComplex, Review)
- Dynamic sitemap generation for all hospital/city pages
- Canonical URLs to prevent duplicate content
- Open Graph + Twitter Cards for social sharing

---

## H. Monetization Strategy

### Strategic Principle: Monetize the Audience, Not the Listings

Healthcare workers making housing decisions are an extremely valuable advertising audience — high income, urgent purchasing intent, and highly sought after by staffing agencies, insurance companies, and relocation services. Rather than charging landlords or relying on unviable affiliate programs, we maximize supply and demand by keeping listings free and monetize through advertising, sponsorships, and eventually featured placements.

> **Why not affiliate revenue?** Research shows that Furnished Finder has no affiliate program (they're a search platform, not a booking platform). Zillow's affiliate program is inactive. Airbnb's ended in 2021 and requires 1M+ monthly visitors. Apartments.com's CJ program pays ~$6/lead, not $25-75. The original affiliate strategy was built on programs that don't exist.

### Revenue Streams (Phased)

#### Phase 1: Free Listings + Display Ads + Adjacent Affiliates (Launch — Month 6)

**All listings are free.** This maximizes supply (landlords list easily) and demand (nurses find options), building traffic as fast as possible.

| Revenue Source | Model | Est. Revenue |
|----------------|-------|-------------|
| Google AdSense | Display ads (CPM/CPC) | $5-15 RPM (real estate is high-CPC niche) |
| Renter's insurance affiliate (Lemonade, etc.) | CPA | $25-50 per policy |
| Furniture rental affiliate (CORT) | CPA | $15-30 per booking |
| Moving services affiliate (PODS, HireAHelper) | CPA/CPC | $10-25 per lead |
| Travel nurse tax prep services | CPA | $20-40 per signup |

These adjacent affiliate programs **actually exist** and serve real needs for healthcare workers who are relocating — they need insurance, furniture, and moving help.

**Target**: $2K-8K/month by Month 6

#### Phase 2: Staffing Agency Ads + Sponsored Content + Premium Ad Network (Month 3-12)

Travel nurse staffing agencies (Aya Healthcare, Cross Country, Medical Solutions, AMN Healthcare) spend heavily on recruitment marketing. Our audience is **exactly** who they want to reach.

| Revenue Source | Model | Est. Revenue |
|----------------|-------|-------------|
| Staffing agency display ads | Direct ad sales | $500-2,000/month per agency |
| Sponsored city/hospital guides | Content sponsorship | $200-500 per guide |
| Premium ad network (Mediavine/Raptive) | Display ads (requires 50K-100K sessions/mo) | $15-40 RPM at scale |
| Email newsletter sponsorship | Sponsored weekly digest | $200-500 per send |
| Sidebar partner placements | Fixed placement | $300-800/month |

**Target**: $8K-25K/month by Month 12

#### Phase 3: Featured Listings + Lead Generation (Month 6-18)

Once traffic is established, landlords and property managers will pay for visibility. Not before — supply-side monetization only works after demand exists.

| Revenue Source | Model | Est. Revenue |
|----------------|-------|-------------|
| Featured listing upgrade | $49/month | Priority placement, "Featured" badge |
| Premium listing | $99/month | Featured + analytics dashboard + lead contact info |
| Qualified lead sales | $25-50/lead to property managers | Volume-dependent |
| Hospital partnership housing portals | Sponsored sections | $500-1,500/month |

**Target**: $15K-40K/month by Month 18

#### Phase 4: B2B Partnerships + SaaS (Month 12+)
- Hospital HR departments: employee housing portal ($500-2,000/month)
- Travel nurse agencies: white-label housing search ($1,000-5,000/month)
- Property management companies: healthcare worker tenant pipeline ($200-500/month)

### Ad Placement Strategy

The platform includes designated ad zones that balance revenue with user experience:

| Placement | Location | Type | Priority |
|-----------|----------|------|----------|
| **Header Banner** | Top of search results | Staffing agency ads | High |
| **Sidebar** | Right column on desktop | Display ads / partner placements | Medium |
| **Interstitial** | Between every 4th listing in results | Native ad unit | High |
| **Hospital Page Sponsor** | Hospital detail pages | Staffing agency "Now Hiring" | High |
| **Footer Partners** | Site footer | Partner logo bar | Low |
| **Email Digest** | Weekly alert emails | Sponsored section | Medium |

### Unit Economics Target

| Metric | Month 6 | Month 12 | Month 18 |
|--------|---------|----------|----------|
| Monthly Unique Visitors | 15K | 75K | 200K |
| Page RPM (ad revenue per 1K pageviews) | $8 | $20 | $30 |
| Avg Pages Per Visit | 3.5 | 4.0 | 4.5 |
| Display Ad Revenue | $1.6K | $12K | $27K |
| Sponsorship + Direct Ads | $1K | $8K | $15K |
| Adjacent Affiliate Revenue | $0.5K | $2K | $4K |
| Featured Listings Revenue | $0 | $3K | $12K |
| **Total Monthly Revenue** | **$3.1K** | **$25K** | **$58K** |
| Monthly Costs | $2K | $6K | $15K |
| **Monthly Profit** | **$1.1K** | **$19K** | **$43K** |

---

## I. Go-to-Market Plan

### Pre-Launch (Weeks 1-4)

1. **Build MVP** — Hospital search + proximity scoring + ad zone scaffolding
2. **Seed data** — Import all hospitals for Nashville, Houston, Phoenix
3. **Content** — Write 10 SEO-optimized city/hospital pages
4. **Social** — Create accounts on Instagram, TikTok, Facebook Groups
5. **Partnerships** — Reach out to 5 travel nurse Facebook groups for beta feedback

### Launch (Weeks 5-8)

1. **Soft launch** — Share in travel nurse communities for feedback
2. **Content blitz** — Publish 3 blog posts/week targeting long-tail keywords
3. **Reddit strategy** — Provide value in r/travelnursing, r/nursing (no spam)
4. **Facebook Groups** — Join and provide genuine housing advice in top 10 travel nurse groups
5. **TikTok** — Short videos: "Best neighborhoods near [Hospital] for travel nurses"

### Growth (Months 3-6)

1. **Paid ads** — Google Ads targeting "travel nurse housing [city]" keywords
2. **Email marketing** — Capture emails with "New listing alerts" → weekly digest
3. **Agency partnerships** — Integrate with 3-5 travel nurse staffing agencies
4. **Expand to 5 more metros** — Dallas, Atlanta, Denver, Charlotte, San Antonio
5. **User-generated content** — Encourage reviews and housing tips from nurses

### Scale (Months 6-12)

1. **Cover 20 metros** with full hospital + listing data
2. **Launch direct listing product** for landlords
3. **Mobile app** (React Native or Expo)
4. **Hospital system partnerships** — employee housing benefit programs
5. **Series A preparation** if metrics support

---

## J. Competitive Landscape

### Direct Competitors

| Competitor | Strengths | Weaknesses | Our Advantage |
|-----------|-----------|------------|--------------|
| Furnished Finder | Travel nurse focused, large inventory | No proximity scoring, dated UI, no map | Score-based ranking, modern UX, hospital-centric |
| Gypsy Nurse Housing | Community trust, established brand | Small inventory, no technology | Technology-first, data-driven |
| NurseFly Housing | Agency integration | Limited to agency placements | Open marketplace, all listings |
| Airbnb | Massive inventory, trust | Not healthcare-specific, expensive | Healthcare-optimized, proximity focus |
| Apartments.com | Huge inventory, good UX | Generic, no hospital context | Hospital-centric search, scoring |
| Zillow | Comprehensive data | Generic, no healthcare focus | Specialized UX and scoring |

### Competitive Moat Strategy

1. **Data moat**: Pre-computed proximity scores for every hospital-listing pair (expensive to replicate)
2. **SEO moat**: Programmatic pages for every hospital (first-mover on long-tail keywords)
3. **Community moat**: Healthcare worker reviews and tips (user-generated content)
4. **Partnership moat**: Exclusive relationships with hospital HR departments
5. **Feature moat**: Shift-aware commute scoring (unique feature no one else has)

---

## K. Week 1 Execution Plan

### Day 1-2: Foundation
- [x] Set up Next.js project with TypeScript
- [x] Configure Tailwind CSS + shadcn/ui
- [x] Set up PostgreSQL + PostGIS schema
- [x] Create database migration files
- [x] Build project structure and routing

### Day 3-4: Data Pipeline
- [ ] Download HIFLD hospital dataset
- [ ] Write hospital data importer (CSV → PostgreSQL)
- [ ] Geocode any hospitals missing lat/lng
- [ ] Import Nashville, Houston, Phoenix hospitals
- [ ] Build proximity scoring engine (straight-line MVP)

### Day 5-6: Core UI
- [ ] Build homepage with hospital search
- [ ] Build hospital detail page with scored listings
- [ ] Build listing card component
- [ ] Build map view with Mapbox GL JS
- [ ] Build filter panel

### Day 7: Launch Prep
- [ ] Set up Vercel deployment
- [ ] Configure domain and SSL
- [ ] Add Google Analytics + Plausible
- [ ] Create sitemap generator
- [ ] Soft launch to 1 Facebook group for feedback

---

## L. Technical Stack & Infrastructure

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Maps**: Mapbox GL JS (free tier: 50K loads/month)
- **State**: Zustand (lightweight)
- **Forms**: React Hook Form + Zod

### Backend
- **Runtime**: Next.js API Routes (serverless)
- **Database**: PostgreSQL 15 + PostGIS 3.3
- **ORM**: Drizzle ORM (type-safe, lightweight)
- **Auth**: NextAuth.js (Google + Email)
- **File Storage**: Cloudflare R2 (S3-compatible, cheaper)
- **Search**: PostgreSQL full-text search (pg_trgm) → Typesense later

### Infrastructure
- **Hosting**: Vercel (frontend + API routes)
- **Database**: Neon (serverless Postgres with PostGIS)
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics + Sentry
- **CI/CD**: GitHub Actions

### Cost Estimate (Month 1)

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Vercel | Pro | $20 |
| Neon Postgres | Launch | $19 |
| Mapbox | Free tier | $0 |
| Google Maps API | Geocoding only | $5 |
| Cloudflare R2 | Free tier | $0 |
| Domain | Annual/12 | $1.50 |
| **Total** | | **~$45.50/month** |

---

*This document is a living blueprint. Update it as the product evolves.*
*Generated: February 2026*
