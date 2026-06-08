-- Migration: Work Rules Table
-- Date: 2026-01-23
-- Description: Create work_rules table for activity dependencies
-- Defines which sub-tasks are required when a main activity is detected
-- Example: "terras aanleggen" -> uitgraven, zandbed, opsluitbanden, leggen, invoegen

-- ============================================
-- WORK RULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS work_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_activity TEXT NOT NULL,
  child_activity TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'grondwerk', 'bestrating', 'erfafscheiding', 'vlonders',
    'gazon', 'beplanting', 'overkappingen', 'waterwerken',
    'verlichting', 'overig'
  )),

  -- Rule behavior
  is_required BOOLEAN DEFAULT true,
  condition_formula TEXT,
  quantity_formula TEXT,
  display_order INTEGER DEFAULT 0,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate rules per tenant
  UNIQUE(tenant_id, parent_activity, child_activity)
);

COMMENT ON TABLE work_rules IS 'Defines which sub-tasks are required when a main activity is detected';
COMMENT ON COLUMN work_rules.tenant_id IS 'NULL = system default, UUID = tenant-specific rule override';
COMMENT ON COLUMN work_rules.parent_activity IS 'Main activity that triggers child tasks (e.g., "terras aanleggen")';
COMMENT ON COLUMN work_rules.child_activity IS 'Sub-task that must be performed (e.g., "uitgraven cunet")';
COMMENT ON COLUMN work_rules.quantity_formula IS 'Formula to derive quantity (e.g., "area", "perimeter", "area * 1.1")';
COMMENT ON COLUMN work_rules.display_order IS 'Order in which tasks should be executed (1 = first)';

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_work_rules_tenant_id ON work_rules(tenant_id);
CREATE INDEX idx_work_rules_parent ON work_rules(parent_activity);
CREATE INDEX idx_work_rules_active ON work_rules(is_active) WHERE is_active = true;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE work_rules ENABLE ROW LEVEL SECURITY;

-- Users see own rules and system defaults
CREATE POLICY "Users see own rules and defaults" ON work_rules
  FOR SELECT
  USING (tenant_id IS NULL OR tenant_id = auth.uid());

-- Users can insert their own rules
CREATE POLICY "Users insert own rules" ON work_rules
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- Users can update their own rules
CREATE POLICY "Users update own rules" ON work_rules
  FOR UPDATE
  USING (tenant_id = auth.uid());
