-- =====================================================
-- HOVENIERS WERKZAAMHEDEN DATABASE
-- Intelligente offerte module voor hoveniers
-- =====================================================

-- Enum voor werkzaamheid types
CREATE TYPE work_activity_type AS ENUM ('always', 'optional', 'conditional');

-- Enum voor categorieën (vaste volgorde)
CREATE TYPE quote_category AS ENUM (
  'grondwerk',
  'bestrating',
  'erfafscheiding',
  'vlonders',
  'gazon',
  'beplanting',
  'overkappingen',
  'waterwerken',
  'verlichting',
  'overig'
);

-- =====================================================
-- WERKZAAMHEDEN TABEL
-- Alle mogelijke werkzaamheden per hoofdcategorie
-- =====================================================
CREATE TABLE IF NOT EXISTS work_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category quote_category NOT NULL,
  parent_activity_id UUID REFERENCES work_activities(id),
  name TEXT NOT NULL,
  description TEXT,
  activity_type work_activity_type NOT NULL DEFAULT 'always',
  trigger_question TEXT, -- Vraag voor optionele items
  display_order INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'm²', -- m², m¹, stuk, uur
  default_hours_per_unit DECIMAL(10,2), -- Standaard uren per eenheid
  is_main_activity BOOLEAN DEFAULT false, -- Hoofdwerkzaamheid of sub-taak
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index voor snelle lookups
CREATE INDEX idx_work_activities_category ON work_activities(category);
CREATE INDEX idx_work_activities_parent ON work_activities(parent_activity_id);

-- =====================================================
-- MATERIAAL TYPES TABEL
-- Uitgebreide materiaalbibliotheek
-- =====================================================
CREATE TABLE IF NOT EXISTS material_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category quote_category NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'm²',
  price_low DECIMAL(10,2),
  price_medium DECIMAL(10,2),
  price_high DECIMAL(10,2),
  quantity_per_unit DECIMAL(10,2), -- Aantal per m² (bijv. 70 klinkers per m²)
  waste_percentage DECIMAL(5,2) DEFAULT 5, -- Snijverlies %
  lifespan_years INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_material_types_category ON material_types(category);

-- =====================================================
-- AFHANKELIJKHEDEN TABEL
-- Welke werkzaamheden triggeren andere werkzaamheden
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES work_activities(id) ON DELETE CASCADE,
  requires_activity_id UUID NOT NULL REFERENCES work_activities(id) ON DELETE CASCADE,
  condition TEXT, -- Conditie wanneer dit geldt (bijv. "ophogen > 10cm")
  is_automatic BOOLEAN DEFAULT false, -- Automatisch toevoegen of vragen
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BEREKENINGEN TABEL
-- Formules voor automatische berekeningen
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES work_activities(id) ON DELETE CASCADE,
  output_name TEXT NOT NULL, -- Bijv. "ophoogzand_kg"
  formula TEXT NOT NULL, -- Bijv. "area * depth * 1500 * 1.1"
  variables JSONB, -- Beschrijving van variabelen
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STANDAARD TARIEVEN TABEL
-- Per-hovenier configureerbare tarieven
-- =====================================================
CREATE TABLE IF NOT EXISTS hourly_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- NULL = systeem default
  category quote_category NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  material_markup_percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- =====================================================
-- VASTE TOESLAGEN TABEL
-- =====================================================
CREATE TABLE IF NOT EXISTS fixed_surcharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- NULL = systeem default
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  is_percentage BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- =====================================================
-- QUOTE WEERGAVE INSTELLINGEN
-- =====================================================
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS display_settings JSONB DEFAULT '{
  "show_hours_per_line": false,
  "show_price_per_item": true,
  "show_category_subtotals": true,
  "show_material_details": false
}'::jsonb;

-- =====================================================
-- WERKBON TABEL
-- Gedetailleerde werkbonnen voor uitvoerders
-- =====================================================
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  executor_name TEXT,
  scheduled_date DATE,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_order_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES work_activities(id),
  task_description TEXT NOT NULL,
  quantity DECIMAL(10,2),
  unit TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SEED DATA: STANDAARD UURTARIEVEN
-- =====================================================
INSERT INTO hourly_rates (category, hourly_rate) VALUES
  ('grondwerk', 50.00),
  ('bestrating', 55.00),
  ('erfafscheiding', 55.00),
  ('vlonders', 55.00),
  ('gazon', 50.00),
  ('beplanting', 50.00),
  ('overkappingen', 60.00),
  ('waterwerken', 55.00),
  ('verlichting', 55.00),
  ('overig', 50.00)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED DATA: VASTE TOESLAGEN
-- =====================================================
INSERT INTO fixed_surcharges (name, description, amount) VALUES
  ('Voorrijkosten', 'Standaard voorrijkosten', 35.00),
  ('Container 3m³ groen', 'Afvalcontainer groenafval', 175.00),
  ('Container 3m³ grond', 'Afvalcontainer grond', 250.00),
  ('Container 6m³', 'Grote afvalcontainer', 300.00),
  ('KLIC-melding', 'Kabels en leidingen informatie', 25.00),
  ('Klein materiaal', 'Percentage van materiaalkosten', 5.00)
ON CONFLICT DO NOTHING;

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE work_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_surcharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_tasks ENABLE ROW LEVEL SECURITY;

-- Open policies voor development
CREATE POLICY "Allow all for work_activities" ON work_activities FOR ALL USING (true);
CREATE POLICY "Allow all for material_types" ON material_types FOR ALL USING (true);
CREATE POLICY "Allow all for activity_dependencies" ON activity_dependencies FOR ALL USING (true);
CREATE POLICY "Allow all for activity_calculations" ON activity_calculations FOR ALL USING (true);
CREATE POLICY "Allow all for hourly_rates" ON hourly_rates FOR ALL USING (true);
CREATE POLICY "Allow all for fixed_surcharges" ON fixed_surcharges FOR ALL USING (true);
CREATE POLICY "Allow all for work_orders" ON work_orders FOR ALL USING (true);
CREATE POLICY "Allow all for work_order_tasks" ON work_order_tasks FOR ALL USING (true);
