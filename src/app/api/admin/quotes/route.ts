import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

interface LineItemInput {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  line_type?: 'arbeid' | 'materiaal';
  markup_percent?: number | null;
  vat_rate?: number;
  display_order?: number;
  pricing_id?: string | null;
  is_ai_calculated?: boolean;
  calculation_breakdown?: object | null;
}

interface SectionInput {
  title: string;
  category?: string;
  display_order?: number;
  line_items: LineItemInput[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    let leadId = body.lead_id || body.existing_lead_id;

    // If using existing lead, just use that ID
    if (body.existing_lead_id) {
      leadId = body.existing_lead_id;
    }
    // If no lead_id but customer info provided, create a lead first
    else if (!leadId && body.customer_name) {
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: body.customer_name,
          phone: body.customer_phone || null,
          email: body.customer_email || null,
          address: body.customer_address || null,
          city: '',
          source: 'other',
          status: 'quote_sent'
        })
        .select()
        .single();

      if (leadError) {
        console.error('Error creating lead:', leadError);
        return NextResponse.json({ error: 'Kon klant niet aanmaken' }, { status: 500 });
      }

      leadId = newLead.id;
    }

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID of klantgegevens vereist' }, { status: 400 });
    }

    // Generate quote number
    const { data: lastQuote } = await supabase
      .from('quotes')
      .select('quote_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let newQuoteNumber = 'OFF-2024-001';
    if (lastQuote?.quote_number) {
      const match = lastQuote.quote_number.match(/OFF-(\d{4})-(\d{3})/);
      if (match) {
        const year = new Date().getFullYear();
        const num = match[1] === String(year) ? parseInt(match[2]) + 1 : 1;
        newQuoteNumber = `OFF-${year}-${String(num).padStart(3, '0')}`;
      }
    }

    // Calculate totals from sections if provided
    let subtotal = body.subtotal || 0;
    let btwAmount = body.btw_amount || 0;
    let total = body.total || 0;
    let lineItemsForQuote: object[] = [];

    if (body.sections && body.sections.length > 0) {
      // Calculate from sections
      const allItems = body.sections.flatMap((s: SectionInput) => s.line_items || []);
      subtotal = allItems.reduce((sum: number, item: LineItemInput) => sum + (item.total_price || 0), 0);
      btwAmount = allItems.reduce((sum: number, item: LineItemInput) => {
        const vatRate = item.vat_rate || 21;
        return sum + ((item.total_price || 0) * (vatRate / 100));
      }, 0);
      total = subtotal + btwAmount;

      // Convert sections to flat line_items for backward compatibility
      lineItemsForQuote = allItems.map((item: LineItemInput, index: number) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total: item.total_price,
        line_type: item.line_type || 'arbeid',
        display_order: index + 1
      }));
    } else if (body.line_items) {
      lineItemsForQuote = body.line_items;
    }

    // Create the quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        quote_number: body.quote_number || newQuoteNumber,
        lead_id: leadId,
        project_description: body.project_description || '',
        project_address: body.project_address || body.customer_address || '',
        valid_until: body.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        line_items: lineItemsForQuote,
        subtotal: subtotal,
        btw_percentage: body.btw_percentage || 21,
        btw_amount: btwAmount,
        total: total,
        customer_notes: body.customer_notes || '',
        status: body.status || 'draft'
      })
      .select()
      .single();

    if (quoteError) {
      console.error('Error creating quote:', quoteError);
      return NextResponse.json({ error: 'Kon offerte niet aanmaken: ' + quoteError.message }, { status: 500 });
    }

    // If sections provided, also save to quote_sections table
    if (body.sections && body.sections.length > 0) {
      for (let i = 0; i < body.sections.length; i++) {
        const section: SectionInput = body.sections[i];

        // Create section
        const { data: sectionData, error: sectionError } = await supabase
          .from('quote_sections')
          .insert({
            quote_id: quote.id,
            title: section.title,
            description: null,
            display_order: section.display_order || i + 1,
            subtotal: section.line_items?.reduce((sum: number, item: LineItemInput) => sum + (item.total_price || 0), 0) || 0
          })
          .select()
          .single();

        if (sectionError) {
          console.error('Error creating section:', sectionError);
          continue;
        }

        // Create line items for this section
        if (section.line_items && section.line_items.length > 0) {
          const lineItems = section.line_items.map((item: LineItemInput, idx: number) => ({
            section_id: sectionData.id,
            pricing_id: item.pricing_id || null,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            cost_price: null,
            markup_percent: item.markup_percent || null,
            unit_price: item.unit_price,
            total_price: item.total_price,
            line_type: item.line_type || 'arbeid',
            vat_rate: item.vat_rate || 21,
            display_order: item.display_order || idx + 1,
            is_auto_calculated: item.is_ai_calculated || false,
            formula_used: item.calculation_breakdown ? JSON.stringify(item.calculation_breakdown) : null
          }));

          const { error: itemsError } = await supabase
            .from('quote_line_items')
            .insert(lineItems);

          if (itemsError) {
            console.error('Error creating line items:', itemsError);
          }
        }
      }
    }

    // Log to quote_history
    await supabase.from('quote_history').insert({
      quote_id: quote.id,
      change_type: 'created',
      old_data: null,
      new_data: {
        quote_number: quote.quote_number,
        project_description: quote.project_description,
        project_address: quote.project_address,
        line_items: quote.line_items,
        subtotal: quote.subtotal,
        total: quote.total,
        status: quote.status
      },
      change_summary: `Offerte ${quote.quote_number} aangemaakt (€${quote.total.toFixed(2)})`
    });

    // Log to lead activities
    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      activity_type: 'quote_created',
      title: 'Offerte aangemaakt',
      description: `Offerte ${quote.quote_number} - €${quote.total.toFixed(2)}`
    });

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Quote API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ quotes: [] });
    }

    const { data, error } = await supabase
      .from('quotes')
      .select('*, leads(name, city)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotes:', error);
      return NextResponse.json({ error: 'Kon offertes niet ophalen' }, { status: 500 });
    }

    // Map the data to include lead_name and lead_city at top level
    const quotesWithLeadInfo = data?.map(quote => ({
      ...quote,
      lead_name: quote.leads?.name,
      lead_city: quote.leads?.city,
    })) || [];

    return NextResponse.json({ quotes: quotesWithLeadInfo });
  } catch (error) {
    console.error('Quotes API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
