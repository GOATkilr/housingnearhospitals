# Hospital Data

## Download Instructions

### HIFLD Hospital Dataset (Primary — Pre-geocoded)
1. Visit: https://hifld-geoplatform.opendata.arcgis.com/datasets/hospitals
2. Click "Download" → "Spreadsheet" (CSV)
3. Save as `hospitals.csv` in this directory
4. Run: `npx tsx scripts/seed-hospitals.ts`

### CMS Hospital General Information (Supplementary)
1. Visit: https://data.cms.gov/provider-data/dataset/xubh-q36u
2. Download CSV
3. Save as `cms-hospitals.csv` in this directory

### CMS Hospital Compare Ratings (Quality Scores)
1. Visit: https://data.cms.gov/provider-data/topics/hospitals
2. Download the "Hospital General Information" CSV
3. Save as `cms-ratings.csv` in this directory
