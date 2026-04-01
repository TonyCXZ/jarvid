-- supabase/migrations/20260401000000_add_venue_setup_code.sql
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS setup_code TEXT
  CHECK (setup_code ~ '^\d{6}$');

CREATE UNIQUE INDEX IF NOT EXISTS venues_setup_code_unique
  ON venues (setup_code)
  WHERE setup_code IS NOT NULL;
