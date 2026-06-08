import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('all') === 'true';

    let query = supabase
      .from('demo_pricing')
      .select('*')
      .order('category')
      .order('item_name');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: pricing, error } = await query;

    if (error) throw error;

    return NextResponse.json({ pricing: pricing || [] });
  } catch (error) {
    console.error('Error fetching demo pricing:', error);
    return NextResponse.json({ error: 'Fout bij ophalen prijzen' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }
    const pricingData = await request.json();

    const { data, error } = await supabase
      .from('demo_pricing')
      .insert(pricingData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ pricing: data });
  } catch (error) {
    console.error('Error creating demo pricing:', error);
    return NextResponse.json({ error: 'Fout bij aanmaken prijsitem' }, { status: 500 });
  }
}
