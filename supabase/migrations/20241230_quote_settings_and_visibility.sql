-- Migration: Quote Settings and Visibility Options
-- Date: 2024-12-30
-- Description: Adds quote_settings table and visibility options to line items/sections

-- ============================================
-- QUOTE SETTINGS TABLE
-- Company-wide settings for quote appearance
-- ============================================
CREATE TABLE IF NOT EXISTS quote_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Company info
  company_name VARCHAR(255) DEFAULT 'Klinkers & Co',
  company_logo_url TEXT,
  company_address TEXT,
  company_phone VARCHAR(50),
  company_email VARCHAR(255),
  company_website VARCHAR(255),
  company_kvk VARCHAR(50),
  company_btw VARCHAR(50),
  company_iban VARCHAR(50),

  -- Quote texts
  intro_text TEXT DEFAULT 'Hartelijk dank voor uw aanvraag. Hierbij ontvangt u onze offerte voor de door u gevraagde werkzaamheden.',
  outro_text TEXT DEFAULT 'Wij hopen u hiermee een passende aanbieding te hebben gedaan. Mocht u vragen hebben, neem dan gerust contact met ons op.',
  terms_text TEXT DEFAULT 'Op al onze offertes zijn onze algemene voorwaarden van toepassing.',

  -- Payment settings
  payment_terms TEXT DEFAULT 'Betaling binnen 14 dagen na factuurdatum.',
  payment_methods TEXT DEFAULT 'Overschrijving naar bovenstaand rekeningnummer.',
  deposit_percentage INT DEFAULT 30,
  deposit_text TEXT DEFAULT 'Bij opdracht verzoeken wij u om 30% aanbetaling.',

  -- Display options
  show_company_logo BOOLEAN DEFAULT true,
  show_item_prices BOOLEAN DEFAULT true,
  show_item_quantities BOOLEAN DEFAULT true,
  show_section_subtotals BOOLEAN DEFAULT true,
  show_btw_specification BOOLEAN DEFAULT true,
  show_payment_terms BOOLEAN DEFAULT true,
  show_validity_date BOOLEAN DEFAULT true,
  default_validity_days INT DEFAULT 30,

  -- Styling
  primary_color VARCHAR(7) DEFAULT '#f97316',
  accent_color VARCHAR(7) DEFAULT '#1e293b',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE quote_settings IS 'Company-wide settings for quote appearance and content';

-- ============================================
-- ADD VISIBILITY COLUMN TO LINE ITEMS
-- ============================================
ALTER TABLE quote_line_items
ADD COLUMN IF NOT EXISTS show_on_quote BOOLEAN DEFAULT true;

ALTER TABLE quote_line_items
ADD COLUMN IF NOT EXISTS internal_notes TEXT;

COMMENT ON COLUMN quote_line_items.show_on_quote IS 'Whether this item is visible on the customer-facing quote';
COMMENT ON COLUMN quote_line_items.internal_notes IS 'Internal notes not shown to customer';

-- ============================================
-- ADD VISIBILITY TO SECTIONS
-- ============================================
ALTER TABLE quote_sections
ADD COLUMN IF NOT EXISTS show_on_quote BOOLEAN DEFAULT true;

COMMENT ON COLUMN quote_sections.show_on_quote IS 'Whether this section is visible on the customer-facing quote';

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE quote_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read quote_settings" ON quote_settings FOR SELECT USING (true);
CREATE POLICY "Allow public write quote_settings" ON quote_settings FOR ALL USING (true);

-- Insert default settings row
INSERT INTO quote_settings (id) VALUES (gen_random_uuid());
