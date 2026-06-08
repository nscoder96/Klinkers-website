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
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const { data: lead, error } = await supabase
      .from('demo_leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Get messages for this lead
    const { data: messages } = await supabase
      .from('demo_messages')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: true });

    // Get activities for this lead
    const { data: activities } = await supabase
      .from('demo_lead_activities')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });

    // Get quotes for this lead
    const { data: quotes } = await supabase
      .from('demo_quotes')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      lead,
      messages: messages || [],
      activities: activities || [],
      quotes: quotes || []
    });
  } catch (error) {
    console.error('Error fetching demo lead:', error);
    return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }
    const updates = await request.json();

    const { data, error } = await supabase
      .from('demo_leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ lead: data });
  } catch (error) {
    console.error('Error updating demo lead:', error);
    return NextResponse.json({ error: 'Fout bij bijwerken lead' }, { status: 500 });
  }
}
