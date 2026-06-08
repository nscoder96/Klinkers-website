import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const { data: leads, error } = await supabase
      .from('demo_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ leads: leads || [] });
  } catch (error) {
    console.error('Error fetching demo leads:', error);
    return NextResponse.json({ error: 'Fout bij ophalen leads' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is verplicht' }, { status: 400 });
    }

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
