import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// GET single overhead item
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; overheadId: string }> }
) {
  try {
    const { overheadId } = await params;
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const { data: overhead, error } = await supabase
      .from('quote_overhead')
      .select('*')
      .eq('id', overheadId)
      .single();

    if (error) {
      console.error('Error fetching overhead:', error);
      return NextResponse.json({ error: 'Staartkosten niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ overhead });
  } catch (error) {
    console.error('Overhead API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// PATCH update overhead item
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; overheadId: string }> }
) {
  try {
    const { id: quoteId, overheadId } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    // Get current overhead and quote for calculation
    const [overheadRes, quoteRes] = await Promise.all([
      supabase.from('quote_overhead').select('*').eq('id', overheadId).single(),
      supabase.from('quotes').select('subtotal').eq('id', quoteId).single()
    ]);

    const currentOverhead = overheadRes.data;
    const subtotal = Number(quoteRes.data?.subtotal) || 0;

    const overheadType = body.overhead_type ?? currentOverhead?.overhead_type ?? 'fixed';
    const value = body.value !== undefined ? Number(body.value) : Number(currentOverhead?.value) || 0;

    // Recalculate amount
    let calculatedAmount = value;
    if (overheadType === 'percentage') {
      calculatedAmount = subtotal * (value / 100);
    }

    const updateData: Record<string, unknown> = {
      calculated_amount: calculatedAmount
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.overhead_type !== undefined) updateData.overhead_type = body.overhead_type;
    if (body.value !== undefined) updateData.value = value;
    if (body.vat_rate !== undefined) updateData.vat_rate = body.vat_rate;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;

    const { data: overhead, error } = await supabase
      .from('quote_overhead')
      .update(updateData)
      .eq('id', overheadId)
      .select()
      .single();

    if (error) {
      console.error('Error updating overhead:', error);
      return NextResponse.json({ error: 'Kon staartkosten niet bijwerken' }, { status: 500 });
    }

    // Recalculate quote total
    await recalculateQuoteTotal(supabase, quoteId);

    return NextResponse.json({ overhead });
  } catch (error) {
    console.error('Update overhead error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// DELETE overhead item
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; overheadId: string }> }
) {
  try {
    const { id: quoteId, overheadId } = await params;
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const { error } = await supabase
      .from('quote_overhead')
      .delete()
      .eq('id', overheadId);

    if (error) {
      console.error('Error deleting overhead:', error);
      return NextResponse.json({ error: 'Kon staartkosten niet verwijderen' }, { status: 500 });
    }

    // Recalculate quote total
    await recalculateQuoteTotal(supabase, quoteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete overhead error:', error);
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

  // Get legacy line_items subtotal
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
