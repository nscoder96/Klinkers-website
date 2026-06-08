import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// Payment schedule item type
export interface PaymentScheduleItem {
  termijn: number;
  omschrijving: string;
  percentage: number;
}

export interface QuoteSettings {
  id: string;
  // Company info
  company_name: string;
  company_logo_url: string | null;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_website: string | null;
  company_kvk: string | null;
  company_btw: string | null;
  company_iban: string | null;
  // Quote texts
  intro_text: string | null;
  outro_text: string | null;
  terms_text: string | null;
  disclaimer_text: string | null;
  // Payment settings
  payment_terms: string | null;
  payment_methods: string | null;
  deposit_percentage: number;
  deposit_text: string | null;
  // Display options
  show_company_logo: boolean;
  show_item_prices: boolean;
  show_item_quantities: boolean;
  show_section_subtotals: boolean;
  show_btw_specification: boolean;
  show_payment_terms: boolean;
  show_validity_date: boolean;
  default_validity_days: number;
  // Footer section visibility
  show_footer_contact: boolean;
  show_footer_payment: boolean;
  show_footer_company: boolean;
  show_footer_guarantee: boolean;
  // Footer section titles
  footer_contact_title: string | null;
  footer_payment_title: string | null;
  footer_company_title: string | null;
  footer_guarantee_title: string | null;
  // Footer section content
  footer_contact_text: string | null;
  footer_payment_text: string | null;
  footer_company_text: string | null;
  footer_guarantee_text: string | null;
  // Styling
  primary_color: string;
  accent_color: string;

  // === NEW: Deddo-style section visibility ===
  show_section_werkomschrijving: boolean;
  show_section_specificatie: boolean;
  show_section_condities: boolean;
  show_section_termijnschema: boolean;

  // === NEW: Specification column options ===
  spec_show_quantities: boolean;
  spec_show_unit_price: boolean;
  spec_show_btw_column: boolean;
  spec_show_line_totals: boolean;
  spec_show_group_subtotals: boolean;
  spec_show_type_column: boolean;

  // === NEW: Conditions default texts ===
  conditions_uitgangspunten: string | null;
  conditions_uitgesloten: string | null;

  // === NEW: Payment schedule ===
  payment_schedule: PaymentScheduleItem[];

  // === NEW: Cover page settings ===
  cover_betreft_prefix: string | null;
  cover_signature_name: string | null;

  // === NEW: Labor settings ===
  labor_pricing_mode: 'hourly_rate' | 'unit_price';
  default_hourly_rate: number;
}

// GET quote settings
export async function GET() {
  try {
    const supabase = createServerClient();

    if (!supabase) {
      // Return defaults if no database
      return NextResponse.json({
        settings: getDefaultSettings()
      });
    }

    const { data: settings, error } = await supabase
      .from('quote_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching quote settings:', error);
      // If table doesn't exist yet, return defaults
      return NextResponse.json({
        settings: getDefaultSettings()
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Quote settings API error:', error);
    return NextResponse.json({
      settings: getDefaultSettings()
    });
  }
}

// PATCH update quote settings
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    // Get current settings to get the ID
    const { data: currentSettings } = await supabase
      .from('quote_settings')
      .select('id')
      .limit(1)
      .single();

    if (!currentSettings) {
      // Insert if no settings exist
      const { data: newSettings, error: insertError } = await supabase
        .from('quote_settings')
        .insert({
          ...body,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating quote settings:', insertError);
        return NextResponse.json({ error: 'Kon instellingen niet opslaan' }, { status: 500 });
      }

      return NextResponse.json({ settings: newSettings });
    }

    // Update existing settings
    const { data: settings, error } = await supabase
      .from('quote_settings')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSettings.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating quote settings:', error);
      return NextResponse.json({ error: 'Kon instellingen niet opslaan' }, { status: 500 });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Quote settings update error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

function getDefaultSettings(): QuoteSettings {
  return {
    id: 'default',
    company_name: 'Klinkers & Co',
    company_logo_url: null,
    company_address: null,
    company_phone: null,
    company_email: null,
    company_website: null,
    company_kvk: null,
    company_btw: null,
    company_iban: null,
    intro_text: 'Hartelijk dank voor uw aanvraag. Hierbij ontvangt u onze offerte voor de door u gevraagde werkzaamheden.',
    outro_text: 'Wij hopen u hiermee een passende aanbieding te hebben gedaan. Mocht u vragen hebben, neem dan gerust contact met ons op.',
    terms_text: 'Op al onze offertes zijn onze algemene voorwaarden van toepassing.',
    disclaimer_text: 'Door ondertekening van deze offerte gaat u akkoord met de werkzaamheden en de hieraan verbonden kosten. Op deze offerte zijn onze algemene voorwaarden van toepassing.',
    payment_terms: 'Betaling binnen 14 dagen na factuurdatum.',
    payment_methods: 'Overschrijving naar bovenstaand rekeningnummer.',
    deposit_percentage: 30,
    deposit_text: 'Bij opdracht verzoeken wij u om 30% aanbetaling.',
    show_company_logo: true,
    show_item_prices: true,
    show_item_quantities: true,
    show_section_subtotals: true,
    show_btw_specification: true,
    show_payment_terms: true,
    show_validity_date: true,
    default_validity_days: 30,
    // Footer visibility
    show_footer_contact: true,
    show_footer_payment: true,
    show_footer_company: true,
    show_footer_guarantee: true,
    // Footer titles
    footer_contact_title: 'Contact',
    footer_payment_title: 'Betaling',
    footer_company_title: 'Bedrijfsgegevens',
    footer_guarantee_title: 'Garantie',
    // Footer content
    footer_contact_text: null,
    footer_payment_text: null,
    footer_company_text: null,
    footer_guarantee_text: '2 jaar garantie op alle werkzaamheden',
    // Styling
    primary_color: '#f97316',
    accent_color: '#1e293b',

    // === NEW: Deddo-style section visibility ===
    show_section_werkomschrijving: true,
    show_section_specificatie: true,
    show_section_condities: true,
    show_section_termijnschema: true,

    // === NEW: Specification column options ===
    spec_show_quantities: true,
    spec_show_unit_price: true,
    spec_show_btw_column: false,
    spec_show_line_totals: true,
    spec_show_group_subtotals: true,
    spec_show_type_column: true,

    // === NEW: Conditions default texts ===
    conditions_uitgangspunten: `Locatie van werkzaamheden is opgeruimd en vrij toegankelijk bij start van de werkzaamheden.
Werkzaamheden buiten deze overeenkomst (meerwerk) worden alleen na schriftelijke opdracht en tegen meerprijs uitgevoerd.
Door de overheid opgelegde wijzigingen in het btw-tarief worden aan u doorberekend.
Deze offerte is gebaseerd op het prijspeil van de offertedatum. Prijswijzigingen kunnen worden verrekend.
Water en elektra dienen door u beschikbaar gesteld te worden.
Op deze overeenkomst zijn onze algemene voorwaarden van toepassing.`,
    conditions_uitgesloten: `Alle andere werkzaamheden en voorzieningen dan genoemd.
Grondwerkzaamheden in de vorm van uitvlakken van de oppervlakte (indien nodig).
Sloopwerkzaamheden.
Afvoer van materialen welke schadelijk zijn voor gezondheid en milieu.`,

    // === NEW: Payment schedule ===
    payment_schedule: [
      { termijn: 1, omschrijving: 'Bij opdracht', percentage: 30 },
      { termijn: 2, omschrijving: 'Start werkzaamheden', percentage: 35 },
      { termijn: 3, omschrijving: 'Na oplevering', percentage: 35 }
    ],

    // === NEW: Cover page settings ===
    cover_betreft_prefix: 'Betreft:',
    cover_signature_name: null,

    // === NEW: Labor settings ===
    labor_pricing_mode: 'hourly_rate',
    default_hourly_rate: 85
  };
}
