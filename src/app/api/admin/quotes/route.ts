import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('quotes')
      .insert({
        quote_number: body.quote_number,
        lead_id: body.lead_id,
        project_description: body.project_description,
        project_address: body.project_address,
        valid_until: body.valid_until,
        line_items: body.line_items,
        subtotal: body.subtotal,
        btw_percentage: body.btw_percentage,
        btw_amount: body.btw_amount,
        total: body.total,
        customer_notes: body.customer_notes,
        status: body.status || 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating quote:', error);
      return NextResponse.json({ error: 'Kon offerte niet aanmaken' }, { status: 500 });
    }

    // Log to quote_history
    await supabase.from('quote_history').insert({
      quote_id: data.id,
      change_type: 'created',
      old_data: null,
      new_data: {
        quote_number: data.quote_number,
        project_description: data.project_description,
        project_address: data.project_address,
        line_items: data.line_items,
        subtotal: data.subtotal,
        total: data.total,
        status: data.status
      },
      change_summary: `Offerte ${data.quote_number} aangemaakt (€${data.total.toFixed(2)})`
    });

    // Log to lead activities
    await supabase.from('lead_activities').insert({
      lead_id: body.lead_id,
      activity_type: 'quote_created',
      title: 'Offerte aangemaakt',
      description: `Offerte ${data.quote_number} - €${data.total.toFixed(2)}`
    });

    // Update lead status
    await supabase
      .from('leads')
      .update({ status: 'quote_sent', updated_at: new Date().toISOString() })
      .eq('id', body.lead_id);

    return NextResponse.json({ quote: data });
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
