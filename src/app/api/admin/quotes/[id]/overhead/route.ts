import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// GET all overhead items for a quote
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const { data: overhead, error } = await supabase
      .from('quote_overhead')
      .select('*')
      .eq('quote_id', quoteId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching overhead:', error);
      return NextResponse.json({ error: 'Kon staartkosten niet ophalen' }, { status: 500 });
    }

    return NextResponse.json({ overhead: overhead || [] });
  } catch (error) {
    console.error('Overhead API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// POST create new overhead item
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    // Get quote subtotal for percentage calculation
    const { data: quote } = await supabase
      .from('quotes')
      .select('subtotal')
      .eq('id', quoteId)
      .single();

    const subtotal = Number(quote?.subtotal) || 0;
    const value = Number(body.value) || 0;

    // Calculate amount based on type
    let calculatedAmount = value;
    if (body.overhead_type === 'percentage') {
      calculatedAmount = subtotal * (value / 100);
    }

    // Get max display_order
    const { data: maxOrderData } = await supabase
      .from('quote_overhead')
      .select('display_order')
      .eq('quote_id', quoteId)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (maxOrderData?.[0]?.display_order || 0) + 1;

    const { data: overhead, error } = await supabase
      .from('quote_overhead')
      .insert({
        quote_id: quoteId,
        name: body.name,
        description: body.description || null,
        overhead_type: body.overhead_type || 'fixed',
        value: value,
        calculated_amount: calculatedAmount,
        vat_rate: body.vat_rate ?? 21,
        display_order: body.display_order ?? nextOrder
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating overhead:', error);
      return NextResponse.json({ error: 'Kon staartkosten niet aanmaken' }, { status: 500 });
    }

    // Recalculate quote total
    await recalculateQuoteTotal(supabase, quoteId);

    return NextResponse.json({ overhead });
  } catch (error) {
    console.error('Create overhead error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// Helper: Recalculate quote total including overhead
async function recalculateQuoteTotal(supabase: ReturnType<typeof createServerClient>, quoteId: string) {
  if (!supabase) return;

  // Get sections subtotal
  const { data: sections } = await supabase
    .from('quote_sections')
    .select('subtotal')
    .eq('quote_id', quoteId);

  const sectionsSubtotal = sections?.reduce((sum, s) => sum + (Number(s.subtotal) || 0), 0) || 0;

  // Get overhead items
  const { data: overheadItems } = await supabase
    .from('quote_overhead')
    .select('calculated_amount')
    .eq('quote_id', quoteId);

  const overheadTotal = overheadItems?.reduce((sum, o) => sum + (Number(o.calculated_amount) || 0), 0) || 0;

  // Get legacy line_items subtotal (for backward compatibility)
  const { data: quote } = await supabase
    .from('quotes')
    .select('line_items')
    .eq('id', quoteId)
    .single();

  let legacySubtotal = 0;
  if (quote?.line_items && Array.isArray(quote.line_items) && sectionsSubtotal === 0) {
    legacySubtotal = quote.line_items.reduce((sum: number, item: { total?: number }) =>
      sum + (Number(item.total) || 0), 0);
  }

  const subtotal = sectionsSubtotal > 0 ? sectionsSubtotal : legacySubtotal;
  const subtotalWithOverhead = subtotal + overheadTotal;
  const btwAmount = subtotalWithOverhead * 0.21;
  const total = subtotalWithOverhead + btwAmount;

  await supabase
    .from('quotes')
    .update({
      subtotal: subtotalWithOverhead,
      btw_amount: btwAmount,
      total,
      updated_at: new Date().toISOString()
    })
    .eq('id', quoteId);
}
