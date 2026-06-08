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

    const { data: quote, error } = await supabase
      .from('demo_quotes')
      .select(`
        *,
        demo_leads (
          id,
          name,
          email,
          phone,
          address,
          postcode,
          city
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Error fetching demo quote:', error);
    return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 });
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

    // Calculate totals if line_items are updated
    if (updates.line_items) {
      const subtotal = updates.line_items.reduce(
        (sum: number, item: { total: number }) => sum + (item.total || 0),
        0
      );
      const btwPercentage = updates.btw_percentage || 21;
      const btwAmount = subtotal * (btwPercentage / 100);
      const total = subtotal + btwAmount;

      updates.subtotal = subtotal;
      updates.btw_amount = btwAmount;
      updates.total = total;
    }

    const { data, error } = await supabase
      .from('demo_quotes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ quote: data });
  } catch (error) {
    console.error('Error updating demo quote:', error);
    return NextResponse.json({ error: 'Fout bij bijwerken offerte' }, { status: 500 });
  }
}
