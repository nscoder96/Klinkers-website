-- Klinkers & Co Database Schema
-- Run dit in de Supabase SQL Editor

-- ============================================
-- LEADS TABEL (Klantaanvragen)
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Contact informatie
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    postcode TEXT,
    city TEXT DEFAULT 'Gouda',

    -- Lead bron
    source TEXT CHECK (source IN ('website', 'whatsapp', 'phone', 'werkspot', 'referral', 'flyer', 'chat', 'other')),
    source_detail TEXT,

    -- Project informatie
    project_type TEXT[], -- ['tuinaanleg', 'bestrating', 'onderhoud', 'snoeiwerk', 'schutting']
    description TEXT,
    estimated_m2 DECIMAL(10,2),
    budget_range TEXT CHECK (budget_range IN ('under_2500', '2500_5000', '5000_10000', '10000_plus', 'unknown')),
    urgency TEXT CHECK (urgency IN ('asap', 'this_month', 'this_quarter', 'this_year', 'exploring')),

    -- AI verrijking
    ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
    ai_notes TEXT,

    -- Status tracking
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'site_visit_scheduled', 'quote_sent', 'negotiating', 'won', 'lost', 'dormant')),
    lost_reason TEXT,

    -- Conversatie historie (voor chat)
    conversation_history JSONB DEFAULT '[]'
);

-- ============================================
-- PRICING TABEL (Meterprijzen)
-- ============================================
CREATE TABLE IF NOT EXISTS pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'bestrating', 'beplanting', 'grondwerk', 'materialen', 'afscheiding'
    item_name TEXT NOT NULL,
    item_description TEXT,
    unit TEXT NOT NULL, -- 'm2', 'stuks', 'meter', 'uur', 'forfait'

    -- Prijzen
    cost_price DECIMAL(10,2), -- inkoopprijs
    labor_hours_per_unit DECIMAL(5,2),
    labor_rate_per_hour DECIMAL(10,2) DEFAULT 45.00,
    selling_price_min DECIMAL(10,2),
    selling_price_max DECIMAL(10,2),
    selling_price_default DECIMAL(10,2),

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- QUOTES TABEL (Offertes)
-- ============================================
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number TEXT UNIQUE NOT NULL,
    lead_id UUID REFERENCES leads(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until DATE,

    -- Project details
    project_description TEXT,
    project_address TEXT,

    -- Regels als JSONB
    line_items JSONB NOT NULL DEFAULT '[]',
    -- Voorbeeld: [{"description": "Bestrating keramisch", "quantity": 45, "unit": "m2", "unit_price": 70, "total": 3150}]

    -- Totalen
    subtotal DECIMAL(12,2),
    btw_percentage DECIMAL(5,2) DEFAULT 21.00,
    btw_amount DECIMAL(12,2),
    total DECIMAL(12,2),

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired')),
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,

    -- PDF
    pdf_url TEXT,

    -- Notities
    internal_notes TEXT,
    customer_notes TEXT
);

-- ============================================
-- PROJECTS TABEL (Geaccepteerde offertes)
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID REFERENCES quotes(id),
    lead_id UUID REFERENCES leads(id),

    project_number TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Planning
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,

    -- Status
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'invoiced', 'paid')),

    -- Financieel
    quoted_amount DECIMAL(12,2),
    additional_work DECIMAL(12,2) DEFAULT 0,
    final_amount DECIMAL(12,2),

    -- Media
    photos JSONB DEFAULT '[]',

    -- Review
    review_requested_at TIMESTAMP WITH TIME ZONE,
    review_received BOOLEAN DEFAULT FALSE,
    review_rating INTEGER CHECK (review_rating >= 1 AND review_rating <= 5),
    review_text TEXT
);

-- ============================================
-- MESSAGES TABEL (Chat/email historie)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    channel TEXT NOT NULL CHECK (channel IN ('website_chat', 'whatsapp', 'email', 'phone', 'system')),
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),

    content TEXT NOT NULL,
    ai_generated BOOLEAN DEFAULT FALSE,

    -- Voor emails
    subject TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_lead_id ON quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_pricing_category ON pricing(category);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Voor nu disabled - later aanzetten als nodig
-- ============================================
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VOORBEELD DATA: PRICING
-- ============================================
INSERT INTO pricing (category, item_name, unit, selling_price_min, selling_price_max, selling_price_default) VALUES
-- Bestrating
('bestrating', 'Betontegels 30x30', 'm2', 25, 35, 30),
('bestrating', 'Betontegels 50x50', 'm2', 30, 45, 38),
('bestrating', 'Keramische tegels', 'm2', 55, 85, 70),
('bestrating', 'Sierbestrating waaltjes', 'm2', 45, 65, 55),
('bestrating', 'Gebakken klinkers', 'm2', 50, 75, 62),
('bestrating', 'Natuursteen', 'm2', 80, 150, 110),
('bestrating', 'Opsluitbanden', 'meter', 12, 18, 15),

-- Grondwerk
('grondwerk', 'Ontgraven tot 30cm', 'm2', 8, 15, 12),
('grondwerk', 'Afvoer grond', 'm3', 35, 55, 45),
('grondwerk', 'Zandbed aanbrengen', 'm2', 6, 10, 8),
('grondwerk', 'Drainage aanleggen', 'meter', 25, 40, 32),
('grondwerk', 'Egaliseren', 'm2', 5, 10, 7),

-- Beplanting
('beplanting', 'Gazon aanleggen (graszoden)', 'm2', 15, 25, 20),
('beplanting', 'Gazon aanleggen (inzaaien)', 'm2', 8, 14, 11),
('beplanting', 'Haag planten (per meter)', 'meter', 35, 60, 45),
('beplanting', 'Beplanting borders', 'm2', 25, 50, 38),
('beplanting', 'Boom planten (klein)', 'stuks', 75, 150, 100),
('beplanting', 'Boom planten (groot)', 'stuks', 150, 350, 250),
('beplanting', 'Heester planten', 'stuks', 25, 50, 35),

-- Schutting/afscheiding
('afscheiding', 'Schutting plaatsen (standaard)', 'meter', 85, 150, 115),
('afscheiding', 'Betonpalen + schermen', 'meter', 95, 165, 125),
('afscheiding', 'Tuinhek hout', 'meter', 120, 200, 155),
('afscheiding', 'Poort plaatsen', 'stuks', 250, 500, 350),

-- Onderhoud
('onderhoud', 'Snoeiwerk per uur', 'uur', 40, 55, 45),
('onderhoud', 'Haag knippen (per meter)', 'meter', 5, 10, 7),
('onderhoud', 'Onkruid verwijderen', 'm2', 3, 6, 4),
('onderhoud', 'Bladruimen', 'uur', 35, 50, 42)

ON CONFLICT DO NOTHING;

-- ============================================
-- FUNCTIE: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
