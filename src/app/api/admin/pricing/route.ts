import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ pricing: [] });
    }

    const { data, error } = await supabase
      .from('pricing')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('item_name', { ascending: true });

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
