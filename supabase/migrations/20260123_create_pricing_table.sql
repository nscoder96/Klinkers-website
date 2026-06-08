-- Create pricing table for eenheidsprijzen per werkzaamheid
-- Multi-tenant support via tenant_id column (NULL = system defaults)

CREATE TABLE IF NOT EXISTS pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'grondwerk', 'bestrating', 'erfafscheiding', 'vlonders',
    'gazon', 'beplanting', 'overkappingen', 'waterwerken',
    'verlichting', 'overig'
  )),
  item_name TEXT NOT NULL,
  item_description TEXT,
  item_type TEXT CHECK (item_type IN ('arbeid', 'materiaal')),
  unit TEXT NOT NULL,

  -- Pricing fields
  cost_price DECIMAL(10,2),
  labor_hours_per_unit DECIMAL(10,2),
  labor_rate_per_hour DECIMAL(10,2),
  selling_price_min DECIMAL(10,2),
  selling_price_max DECIMAL(10,2),
  selling_price_default DECIMAL(10,2),

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate entries per tenant
  UNIQUE(tenant_id, category, item_name, item_type)
);

-- CRITICAL: Indexes for RLS performance (see AWS Prescriptive Guidance)
CREATE INDEX idx_pricing_tenant_id ON pricing(tenant_id);
CREATE INDEX idx_pricing_category ON pricing(category);
CREATE INDEX idx_pricing_active ON pricing(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users see system defaults (NULL tenant) + their own pricing
CREATE POLICY "Users see own pricing and defaults" ON pricing
  FOR SELECT
  USING (tenant_id IS NULL OR tenant_id = auth.uid());

-- Users can insert their own pricing only
CREATE POLICY "Users insert own pricing" ON pricing
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- Users can update their own pricing only
CREATE POLICY "Users update own pricing" ON pricing
  FOR UPDATE
  USING (tenant_id = auth.uid());
