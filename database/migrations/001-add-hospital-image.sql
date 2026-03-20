-- Add image_url column to hospitals table
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS image_url VARCHAR(1000);
