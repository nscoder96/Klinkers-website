import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// GET - Fetch quote by accept token (public)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    // Get quote by accept token
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*, leads(name, city)')
      .eq('accept_token', token)
      .single();

    if (error || !quote) {
      return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 });
    }

    // Mark as viewed if first time
    if (!quote.viewed_at) {
      await supabase
        .from('quotes')
        .update({
          viewed_at: new Date().toISOString(),
          status: quote.status === 'sent' ? 'viewed' : quote.status
        })
        .eq('id', quote.id);
    }

    // Return limited data for public view (hide sensitive info)
    return NextResponse.json({
      quote: {
        id: quote.id,
        quote_number: quote.quote_number,
        project_description: quote.project_description,
        project_address: quote.project_address,
        valid_until: quote.valid_until,
        line_items: quote.line_items,
        subtotal: quote.subtotal,
        btw_percentage: quote.btw_percentage,
        btw_amount: quote.btw_amount,
        total: quote.total,
        customer_notes: quote.customer_notes,
        status: quote.status,
        created_at: quote.created_at,
        customer_name: quote.leads?.name,
        customer_city: quote.leads?.city,
      }
    });
  } catch (error) {
    console.error('Quote API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// POST - Respond to quote (accept/decline)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { action, decline_reason, customer_signature } = body;

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Ongeldige actie' }, { status: 400 });
    }

    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    // Get quote by accept token
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('id, status, lead_id')
      .eq('accept_token', token)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 });
    }

    // Check if quote can still be responded to
    if (['accepted', 'declined'].includes(quote.status)) {
      return NextResponse.json({
        error: 'Deze offerte is al beantwoord',
        status: quote.status
      }, { status: 400 });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined';

    // Update quote
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        status: newStatus,
        decline_reason: action === 'decline' ? decline_reason : null,
        responded_at: new Date().toISOString(),
        customer_signature: customer_signature || null
      })
      .eq('id', quote.id);

    if (updateError) {
      console.error('Error updating quote:', updateError);
      return NextResponse.json({ error: 'Kon offerte niet bijwerken' }, { status: 500 });
    }

    // Update lead status
    if (quote.lead_id) {
      const leadStatus = action === 'accept' ? 'won' : 'lost';
      await supabase
        .from('leads')
        .update({
          status: leadStatus,
          lost_reason: action === 'decline' ? decline_reason : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', quote.lead_id);

      // Log activity
      await supabase.from('lead_activities').insert({
        lead_id: quote.lead_id,
        activity_type: action === 'accept' ? 'quote_accepted' : 'quote_declined',
        title: action === 'accept' ? 'Offerte geaccepteerd door klant!' : 'Offerte afgewezen door klant',
        description: action === 'decline' ? decline_reason : 'Klant heeft de offerte digitaal geaccepteerd'
      });
    }

    return NextResponse.json({
      success: true,
      message: action === 'accept'
        ? 'Offerte succesvol geaccepteerd! We nemen zo snel mogelijk contact met u op.'
        : 'Bedankt voor uw reactie. Jammer dat deze offerte niet passend was.'
    });
  } catch (error) {
    console.error('Quote response error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
