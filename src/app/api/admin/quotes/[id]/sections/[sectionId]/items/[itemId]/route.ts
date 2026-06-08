import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// GET single line item
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const { data: item, error } = await supabase
      .from('quote_line_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) {
      console.error('Error fetching item:', error);
      return NextResponse.json({ error: 'Item niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Item API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// PATCH update line item
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string; itemId: string }> }
) {
  try {
    const { id: quoteId, sectionId, itemId } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    // Get current item to calculate new total if needed
    const { data: currentItem } = await supabase
      .from('quote_line_items')
      .select('quantity, unit_price')
      .eq('id', itemId)
      .single();

    const quantity = body.quantity !== undefined ? Number(body.quantity) : Number(currentItem?.quantity || 0);
    const unitPrice = body.unit_price !== undefined ? Number(body.unit_price) : Number(currentItem?.unit_price || 0);
    const totalPrice = quantity * unitPrice;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      total_price: totalPrice
    };

    if (body.description !== undefined) updateData.description = body.description;
    if (body.quantity !== undefined) updateData.quantity = quantity;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.unit_price !== undefined) updateData.unit_price = unitPrice;
    if (body.cost_price !== undefined) updateData.cost_price = body.cost_price;
    if (body.markup_percent !== undefined) updateData.markup_percent = body.markup_percent;
    if (body.vat_rate !== undefined) updateData.vat_rate = body.vat_rate;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;
    if (body.pricing_id !== undefined) updateData.pricing_id = body.pricing_id;
    if (body.is_auto_calculated !== undefined) updateData.is_auto_calculated = body.is_auto_calculated;
    if (body.formula_used !== undefined) updateData.formula_used = body.formula_used;
    if (body.show_on_quote !== undefined) updateData.show_on_quote = body.show_on_quote;
    if (body.internal_notes !== undefined) updateData.internal_notes = body.internal_notes;

    const { data: item, error } = await supabase
      .from('quote_line_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating item:', error);
      return NextResponse.json({ error: 'Kon item niet bijwerken' }, { status: 500 });
    }

    // Update section subtotal
    await updateSectionSubtotal(supabase, sectionId);

    // Update quote total
    await updateQuoteTotal(supabase, quoteId);

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Update item error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// DELETE line item
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string; itemId: string }> }
) {
  try {
    const { id: quoteId, sectionId, itemId } = await params;
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const { error } = await supabase
      .from('quote_line_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting item:', error);
      return NextResponse.json({ error: 'Kon item niet verwijderen' }, { status: 500 });
    }

    // Update section subtotal
    await updateSectionSubtotal(supabase, sectionId);

    // Update quote total
    await updateQuoteTotal(supabase, quoteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete item error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// Helper: Update section subtotal
async function updateSectionSubtotal(supabase: ReturnType<typeof createServerClient>, sectionId: string) {
  if (!supabase) return;

  const { data: items } = await supabase
    .from('quote_line_items')
    .select('total_price')
    .eq('section_id', sectionId);

  const subtotal = items?.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0) || 0;

  await supabase
    .from('quote_sections')
    .update({ subtotal, updated_at: new Date().toISOString() })
    .eq('id', sectionId);
}

// Helper: Update quote total from all sections
async function updateQuoteTotal(supabase: ReturnType<typeof createServerClient>, quoteId: string) {
  if (!supabase) return;

  const { data: sections } = await supabase
    .from('quote_sections')
    .select('subtotal')
    .eq('quote_id', quoteId);

  const subtotal = sections?.reduce((sum, section) => sum + (Number(section.subtotal) || 0), 0) || 0;
  const btwAmount = subtotal * 0.21;
  const total = subtotal + btwAmount;

  await supabase
    .from('quotes')
    .update({
      subtotal,
      btw_amount: btwAmount,
      total,
      updated_at: new Date().toISOString()
    })
    .eq('id', quoteId);
}
