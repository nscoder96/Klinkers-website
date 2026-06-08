-- Migration: Create Quote Category System
-- Date: 2023-12-23
-- Description: Creates tables for intelligent quote builder with work categories,
--              materials, questions, and calculation rules.

-- ============================================
-- WORK CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS demo_work_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE demo_work_categories IS 'Work categories for grouping quote items (e.g., Schutting, Bestrating)';
COMMENT ON COLUMN demo_work_categories.slug IS 'URL-safe identifier for the category';
COMMENT ON COLUMN demo_work_categories.icon IS 'Lucide icon name for the category';

-- ============================================
-- CATEGORY MATERIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS demo_category_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES demo_work_categories(id) ON DELETE CASCADE,
  pricing_id UUID REFERENCES demo_pricing(id) ON DELETE SET NULL,
  material_type VARCHAR(20) NOT NULL CHECK (material_type IN ('base', 'extra')),
  is_required BOOLEAN DEFAULT false,
  default_quantity DECIMAL(10,2),
  quantity_formula VARCHAR(255),
  display_order INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE demo_category_materials IS 'Materials associated with work categories';
COMMENT ON COLUMN demo_category_materials.material_type IS 'base = always included, extra = optional';
COMMENT ON COLUMN demo_category_materials.quantity_formula IS 'Formula for calculating quantity, e.g. "{sections} + 1"';

-- ============================================
-- CATEGORY QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS demo_category_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES demo_work_categories(id) ON DELETE CASCADE,
  question_text VARCHAR(255) NOT NULL,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('boolean', 'number', 'select', 'text')),
  options JSONB,
  default_value VARCHAR(100),
  variable_name VARCHAR(50) NOT NULL,
  display_order INT DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  help_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE demo_category_questions IS 'Questions to ask when creating quotes for a category';
COMMENT ON COLUMN demo_category_questions.variable_name IS 'Variable name used in formulas, e.g. "has_gate"';
COMMENT ON COLUMN demo_category_questions.options IS 'JSON array of options for select type questions';

-- ============================================
-- CATEGORY RULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS demo_category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES demo_work_categories(id) ON DELETE CASCADE,
  rule_name VARCHAR(100) NOT NULL,
  description TEXT,
  trigger_condition VARCHAR(255),
  pricing_id UUID REFERENCES demo_pricing(id) ON DELETE SET NULL,
  quantity_formula VARCHAR(255) NOT NULL,
  condition_formula VARCHAR(255),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE demo_category_rules IS 'Calculation rules for automatically adding materials';
COMMENT ON COLUMN demo_category_rules.quantity_formula IS 'Formula for quantity calculation, e.g. "{sections} * 4"';
COMMENT ON COLUMN demo_category_rules.condition_formula IS 'Condition for when rule applies, e.g. "{has_gate} == true"';

-- ============================================
-- QUOTE SECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS demo_quote_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES demo_quotes(id) ON DELETE CASCADE,
  category_id UUID REFERENCES demo_work_categories(id) ON DELETE SET NULL,
  section_name VARCHAR(100),
  display_order INT DEFAULT 0,
  question_answers JSONB,
  calculated_values JSONB,
  subtotal DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE demo_quote_sections IS 'Sections within a quote, each linked to a work category';
COMMENT ON COLUMN demo_quote_sections.question_answers IS 'JSON object with question variable names and their answers';
COMMENT ON COLUMN demo_quote_sections.calculated_values IS 'JSON object with calculated values like total sections, area, etc.';

-- ============================================
-- QUOTE SECTION ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS demo_quote_section_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES demo_quote_sections(id) ON DELETE CASCADE,
  pricing_id UUID REFERENCES demo_pricing(id) ON DELETE SET NULL,
  description VARCHAR(255),
  quantity DECIMAL(10,2),
  unit VARCHAR(20),
  unit_price DECIMAL(10,2),
  total DECIMAL(10,2),
  is_auto_calculated BOOLEAN DEFAULT false,
  formula_used VARCHAR(255),
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE demo_quote_section_items IS 'Individual line items within a quote section';
COMMENT ON COLUMN demo_quote_section_items.is_auto_calculated IS 'True if quantity was calculated from a formula';
COMMENT ON COLUMN demo_quote_section_items.formula_used IS 'The formula that was used to calculate the quantity';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_demo_category_materials_category ON demo_category_materials(category_id);
CREATE INDEX IF NOT EXISTS idx_demo_category_questions_category ON demo_category_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_demo_category_rules_category ON demo_category_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_demo_quote_sections_quote ON demo_quote_sections(quote_id);
CREATE INDEX IF NOT EXISTS idx_demo_quote_section_items_section ON demo_quote_section_items(section_id);

-- ============================================
-- RLS POLICIES (disable for demo tables)
-- ============================================
ALTER TABLE demo_work_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_category_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_category_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_category_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_quote_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_quote_section_items ENABLE ROW LEVEL SECURITY;

-- Allow public access to demo tables (no authentication required)
CREATE POLICY "Allow public read demo_work_categories" ON demo_work_categories FOR SELECT USING (true);
CREATE POLICY "Allow public write demo_work_categories" ON demo_work_categories FOR ALL USING (true);

CREATE POLICY "Allow public read demo_category_materials" ON demo_category_materials FOR SELECT USING (true);
CREATE POLICY "Allow public write demo_category_materials" ON demo_category_materials FOR ALL USING (true);

CREATE POLICY "Allow public read demo_category_questions" ON demo_category_questions FOR SELECT USING (true);
CREATE POLICY "Allow public write demo_category_questions" ON demo_category_questions FOR ALL USING (true);

CREATE POLICY "Allow public read demo_category_rules" ON demo_category_rules FOR SELECT USING (true);
CREATE POLICY "Allow public write demo_category_rules" ON demo_category_rules FOR ALL USING (true);

CREATE POLICY "Allow public read demo_quote_sections" ON demo_quote_sections FOR SELECT USING (true);
CREATE POLICY "Allow public write demo_quote_sections" ON demo_quote_sections FOR ALL USING (true);

CREATE POLICY "Allow public read demo_quote_section_items" ON demo_quote_section_items FOR SELECT USING (true);
CREATE POLICY "Allow public write demo_quote_section_items" ON demo_quote_section_items FOR ALL USING (true);
