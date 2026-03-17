-- Step 1: Add slug column (idempotent)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS slug text;

-- Step 2: Bulk backfill from name
UPDATE venues
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Step 3: Resolve any backfill collisions
-- One row per duplicate group keeps the base slug (arbitrary);
-- others receive {base}-2, {base}-3, etc.
DO $$
DECLARE
  dup_slug text;
  venue_row RECORD;
  counter int;
  candidate text;
BEGIN
  FOR dup_slug IN
    SELECT slug FROM venues GROUP BY slug HAVING count(*) > 1
  LOOP
    counter := 2;
    FOR venue_row IN
      SELECT id FROM venues WHERE slug = dup_slug ORDER BY id OFFSET 1
    LOOP
      candidate := dup_slug || '-' || counter;
      WHILE EXISTS (
        SELECT 1 FROM venues WHERE slug = candidate AND id != venue_row.id
      ) LOOP
        counter := counter + 1;
        candidate := dup_slug || '-' || counter;
      END LOOP;
      UPDATE venues SET slug = candidate WHERE id = venue_row.id;
      counter := counter + 1;
    END LOOP;
  END LOOP;
END;
$$;

-- Step 4: Enforce NOT NULL + UNIQUE
ALTER TABLE venues ALTER COLUMN slug SET NOT NULL;
ALTER TABLE venues ADD CONSTRAINT IF NOT EXISTS venues_slug_key UNIQUE (slug);

-- Step 5: INSERT trigger for auto-slug on new venues
-- Created AFTER the UNIQUE constraint so the constraint is always the safety net.
CREATE OR REPLACE FUNCTION set_venue_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  candidate text;
  counter int := 2;
BEGIN
  -- If slug already provided manually, skip auto-generation
  IF NEW.slug IS NOT NULL THEN
    RETURN NEW;
  END IF;

  base_slug := trim(both '-' from
    lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'))
  );
  candidate := base_slug;

  LOOP
    IF NOT EXISTS (SELECT 1 FROM venues WHERE slug = candidate) THEN
      NEW.slug := candidate;
      RETURN NEW;
    END IF;
    IF counter > 99 THEN
      RAISE EXCEPTION 'Could not generate unique slug for venue: %', NEW.name;
    END IF;
    candidate := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS venue_slug_trigger ON venues;
CREATE TRIGGER venue_slug_trigger
  BEFORE INSERT ON venues
  FOR EACH ROW EXECUTE FUNCTION set_venue_slug();

-- Step 6: RLS — anon clients can read id + slug (needed for unauthenticated kiosk route)
-- Skip if a permissive SELECT policy already exists for anon on venues.
-- Adjust policy name/condition to match your existing RLS conventions.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'venues' AND policyname = 'public_slug_lookup'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY public_slug_lookup ON venues
        FOR SELECT TO anon USING (true)
    $policy$;
  END IF;
END;
$$;

-- Step 7: Ensure authenticated users can read name + slug for VenuePicker
-- Skip if an authenticated-user SELECT policy already exists.
-- The existing RLS setup may already cover this — check before running.
