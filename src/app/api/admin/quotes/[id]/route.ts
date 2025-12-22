import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*, leads(name, phone, email, city, address)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching quote:', error);
      return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Quote API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    // Extract old_data for history (if provided) and remove from update body
    const oldData = body._old_data;
    delete body._old_data;

    // Get current quote for activity logging
    const { data: currentQuote } = await supabase
      .from('quotes')
      .select('status, lead_id, project_description, line_items, subtotal, total, customer_notes')
      .eq('id', id)
      .single();

    // Update quote
    const { data: quote, error } = await supabase
      .from('quotes')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating quote:', error);
      return NextResponse.json({ error: 'Kon offerte niet bijwerken' }, { status: 500 });
    }

    // Log changes to quote_history if we have old data (content edit)
    if (oldData && currentQuote) {
      const changes: string[] = [];

      // Check what changed
      if (oldData.project_description !== body.project_description) {
        changes.push('Projectomschrijving aangepast');
      }
      if (oldData.project_address !== body.project_address) {
        changes.push('Projectadres aangepast');
      }
      if (JSON.stringify(oldData.line_items) !== JSON.stringify(body.line_items)) {
        const oldCount = oldData.line_items?.length || 0;
        const newCount = body.line_items?.length || 0;
        if (newCount > oldCount) {
          changes.push(`${newCount - oldCount} regel(s) toegevoegd`);
        } else if (newCount < oldCount) {
          changes.push(`${oldCount - newCount} regel(s) verwijderd`);
        } else {
          changes.push('Regels aangepast');
        }
      }
      if (oldData.total !== body.total) {
        const diff = body.total - oldData.total;
        const sign = diff > 0 ? '+' : '';
        changes.push(`Totaal: €${oldData.total.toFixed(2)} → €${body.total.toFixed(2)} (${sign}€${diff.toFixed(2)})`);
      }
      if (oldData.customer_notes !== body.customer_notes) {
        changes.push('Opmerkingen aangepast');
      }

      // Insert history record
      await supabase.from('quote_history').insert({
        quote_id: id,
        change_type: 'updated',
        old_data: oldData,
        new_data: {
          project_description: body.project_description,
          project_address: body.project_address,
          line_items: body.line_items,
          subtotal: body.subtotal,
          total: body.total,
          customer_notes: body.customer_notes,
        },
        change_summary: changes.length > 0 ? changes.join('; ') : 'Offerte bijgewerkt'
      });

      // Also log to lead activities
      if (currentQuote.lead_id) {
        await supabase.from('lead_activities').insert({
          lead_id: currentQuote.lead_id,
          activity_type: 'quote_updated',
          title: 'Offerte bijgewerkt',
          description: changes.join(', ')
        });
      }
    }

    // If status changed, log activity and update lead
    if (body.status && currentQuote && body.status !== currentQuote.status) {
      // Log to quote_history
      await supabase.from('quote_history').insert({
        quote_id: id,
        change_type: 'status_changed',
        old_data: { status: currentQuote.status },
        new_data: { status: body.status },
        change_summary: `Status: ${currentQuote.status} → ${body.status}`
      });

      // Log activity
      if (currentQuote.lead_id) {
        const activityType = body.status === 'accepted' ? 'quote_accepted'
          : body.status === 'declined' ? 'quote_declined'
          : 'status_change';

        const activityTitle = body.status === 'accepted' ? 'Offerte geaccepteerd!'
          : body.status === 'declined' ? 'Offerte afgewezen'
          : body.status === 'sent' ? 'Offerte verstuurd'
          : `Offerte status: ${body.status}`;

        await supabase.from('lead_activities').insert({
          lead_id: currentQuote.lead_id,
          activity_type: activityType,
          title: activityTitle,
          description: body.decline_reason || null
        });

        // Update lead status based on quote status
        let leadStatus = currentQuote.status;
        if (body.status === 'accepted') {
          leadStatus = 'won';
        } else if (body.status === 'declined') {
          leadStatus = 'lost';
        } else if (body.status === 'sent') {
          leadStatus = 'quote_sent';
        }

        await supabase
          .from('leads')
          .update({
            status: leadStatus,
            lost_reason: body.status === 'declined' ? body.decline_reason : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentQuote.lead_id);
      }
    }

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Quote update error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
