ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS etapes jsonb NOT NULL DEFAULT '[]'::jsonb;
