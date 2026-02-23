# Housing Near Hospitals

**Live closer. Commute less. Care more.**

Find housing scored by commute time to your hospital — built for travel nurses, residents, and healthcare workers.

## What is this?

Housing Near Hospitals is a search platform that lets healthcare workers find housing near their workplace. Every listing gets a **0-100 proximity score** based on actual commute time, distance, and shift-specific data.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and API keys

# Run development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
├── STRATEGIC_BLUEPRINT.md      # Full product/data/GTM strategy document
├── database/
│   └── schema.sql              # PostgreSQL + PostGIS schema (11 tables)
├── scripts/
│   ├── seed-hospitals.ts       # HIFLD hospital data importer
│   └── calculate-scores.ts     # Batch proximity score calculator
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Homepage
│   │   ├── search/             # Hospital search + filtered results
│   │   ├── city/[slug]/        # City landing pages (SEO)
│   │   ├── city/[slug]/[hospitalSlug]/ # Hospital detail + scored listings
│   │   ├── map/                # Interactive map explorer
│   │   ├── admin/              # Admin dashboard
│   │   └── api/v1/             # REST API endpoints
│   ├── components/
│   │   ├── layout/             # Header, Footer
│   │   ├── score/              # ScoreRing, ScoreBadge, CommuteBar
│   │   ├── hospital/           # HospitalCard
│   │   ├── listing/            # ListingCard
│   │   └── search/             # HospitalSearch, FilterPanel
│   ├── lib/
│   │   ├── scoring.ts          # Proximity scoring engine (Haversine, scoring)
│   │   ├── constants.ts        # App constants, launch metros
│   │   ├── sample-data.ts      # Real hospital/listing sample data
│   │   └── utils.ts            # Utility functions
│   ├── types/                  # TypeScript type definitions
│   └── styles/                 # Global CSS + Tailwind
└── data/                       # Hospital CSV data (gitignored)
```

## Launch Markets

1. **Nashville, TN** — HCA headquarters, Vanderbilt, 25+ hospitals
2. **Houston, TX** — Texas Medical Center (world's largest), 40+ hospitals
3. **Phoenix, AZ** — Banner Health, Mayo Clinic, fast-growing market

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** + shadcn/ui components
- **PostgreSQL 15** + PostGIS (spatial queries)
- **Drizzle ORM** (type-safe database access)
- **Mapbox GL JS** (interactive maps)

## Key Features

- Hospital-centric search (start by selecting your hospital)
- 0-100 proximity scoring with shift-aware commute calculation
- Day/night shift toggle for commute times
- Filters: furnished, short-term lease, pet-friendly, parking, min score
- Programmatic SEO pages for every hospital in every metro
- Admin dashboard for data management
- REST API for integrations

## Data Sources

- **HIFLD**: 7,596 US hospitals with coordinates
- **CMS**: Hospital quality ratings (1-5 stars)
- **CMS POS**: Medicare-certified facility details

See `STRATEGIC_BLUEPRINT.md` for the complete product strategy.
