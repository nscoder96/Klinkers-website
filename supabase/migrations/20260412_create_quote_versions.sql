-- Quote versions table for version history / backup & restore
CREATE TABLE IF NOT EXISTS quote_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  label TEXT NOT NULL DEFAULT 'Versie',
  snapshot JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(quote_id, version_number)
);

-- Index for fast lookup per quote
CREATE INDEX IF NOT EXISTS idx_quote_versions_quote_id ON quote_versions(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_versions_created_at ON quote_versions(created_at DESC);

-- RLS: same pattern as other quote tables
ALTER TABLE quote_versions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (same as other tables)
CREATE POLICY "Allow all for authenticated" ON quote_versions
  FOR ALL
  USING (true)
  WITH CHECK (true);
