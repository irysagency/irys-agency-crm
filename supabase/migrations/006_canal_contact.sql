ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS canal_contact text CHECK (canal_contact IN ('email','instagram','whatsapp','autre')) DEFAULT NULL;
