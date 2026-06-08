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

    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching lead:', error);
      return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Lead API error:', error);
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

    // Get current lead for activity logging
    const { data: currentLead } = await supabase
      .from('leads')
      .select('status')
      .eq('id', id)
      .single();

    // Update lead
    const { data: lead, error } = await supabase
      .from('leads')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      return NextResponse.json({ error: 'Kon lead niet bijwerken' }, { status: 500 });
    }

    // Log status change as activity
    if (body.status && currentLead && body.status !== currentLead.status) {
      await supabase.from('lead_activities').insert({
        lead_id: id,
        activity_type: 'status_change',
        title: `Status gewijzigd naar ${body.status}`,
        description: body.lost_reason || null
      });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Lead update error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    // Get lead info
    const { data: lead } = await supabase
      .from('leads')
      .select('name, quotes(id)')
      .eq('id', id)
      .single();

    if (!lead) {
      return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 });
    }

    // Check if lead has quotes
    if (lead.quotes && lead.quotes.length > 0) {
      return NextResponse.json({
        error: `Deze lead heeft ${lead.quotes.length} offerte(s). Verwijder eerst de offertes voordat je de lead verwijdert.`
      }, { status: 400 });
    }

    // Delete lead activities first
    await supabase
      .from('lead_activities')
      .delete()
      .eq('lead_id', id);

    // Delete the lead
    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting lead:', deleteError);
      return NextResponse.json({ error: 'Kon lead niet verwijderen' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lead delete error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
