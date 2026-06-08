import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }
    const activityData = await request.json();

    const { data, error } = await supabase
      .from('demo_lead_activities')
      .insert({
        lead_id: id,
        activity_type: activityData.activity_type,
        title: activityData.title,
        description: activityData.description || null,
        created_by: 'demo_user'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ activity: data });
  } catch (error) {
    console.error('Error creating demo activity:', error);
    return NextResponse.json({ error: 'Fout bij toevoegen activiteit' }, { status: 500 });
  }
}
