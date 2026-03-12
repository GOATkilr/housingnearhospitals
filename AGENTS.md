# AGENTS.md

## Cursor Cloud specific instructions

This is a single Next.js 14 (App Router) application — not a monorepo.

### Quick reference

| Action | Command |
|--------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000) |
| Lint | `npm run lint` |
| Build | `npm run build` |

### Caveats

- **No database required for dev.** All API routes (`/api/v1/hospitals`, `/api/v1/search`) use in-memory sample data from `src/lib/sample-data.ts`. PostgreSQL + PostGIS is only needed for production/data-pipeline scripts.
- **ESLint config:** The repo ships without an `.eslintrc.json`. One must exist for `npm run lint` (which runs `next lint`) to work non-interactively. If missing, create `.eslintrc.json` with `{ "extends": "next/core-web-vitals" }`.
- **`.env` file:** Copy `.env.example` to `.env` before running. The placeholder values are fine for local dev — no real API keys are needed for the core flows.
- **Mapbox token:** The `/map` page requires a real `NEXT_PUBLIC_MAPBOX_TOKEN` to render maps. All other pages work without it.
- **No automated test suite:** The project currently has no test framework or test files. `npm run lint` and `npm run build` are the primary verification commands.
