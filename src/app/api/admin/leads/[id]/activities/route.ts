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

    const { data: activities, error } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
      return NextResponse.json({ activities: [] });
    }

    return NextResponse.json({ activities: activities || [] });
  } catch (error) {
    console.error('Activities API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

export async function POST(
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

    const { data: activity, error } = await supabase
      .from('lead_activities')
      .insert({
        lead_id: id,
        activity_type: body.activity_type,
        title: body.title,
        description: body.description,
        metadata: body.metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating activity:', error);
      return NextResponse.json({ error: 'Kon activiteit niet toevoegen' }, { status: 500 });
    }

    // Update lead's updated_at
    await supabase
      .from('leads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Activity create error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
