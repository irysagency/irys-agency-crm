-- Colonne source sur les prospects (canal d'acquisition)
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'email'
    CHECK (source IN ('email', 'instagram', 'linkedin', 'autre'));
