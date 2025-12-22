import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('all') === 'true';

    if (!supabase) {
      return NextResponse.json({ pricing: [] });
    }

    let query = supabase
      .from('pricing')
      .select('*')
      .order('category', { ascending: true })
      .order('item_name', { ascending: true });

    // For admin page, include inactive items
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pricing:', error);
      return NextResponse.json({ error: 'Kon prijzen niet ophalen' }, { status: 500 });
    }

    return NextResponse.json({ pricing: data });
  } catch (error) {
    console.error('Pricing API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('pricing')
      .insert({
        category: body.category,
        item_name: body.item_name,
        item_description: body.item_description,
        unit: body.unit,
        selling_price_default: body.selling_price_default,
        selling_price_min: body.selling_price_min,
        selling_price_max: body.selling_price_max,
        cost_price: body.cost_price,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pricing item:', error);
      return NextResponse.json({ error: 'Kon item niet aanmaken' }, { status: 500 });
    }

    return NextResponse.json({ pricing: data });
  } catch (error) {
    console.error('Pricing create error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
