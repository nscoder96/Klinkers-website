import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// GET all line items for a section
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { sectionId } = await params;
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const { data: items, error } = await supabase
      .from('quote_line_items')
      .select('*')
      .eq('section_id', sectionId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching items:', error);
      return NextResponse.json({ error: 'Kon items niet ophalen' }, { status: 500 });
    }

    return NextResponse.json({ items: items || [] });
  } catch (error) {
    console.error('Items API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// POST create new line item
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { id: quoteId, sectionId } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    // Get max display_order for this section
    const { data: maxOrderData } = await supabase
      .from('quote_line_items')
      .select('display_order')
      .eq('section_id', sectionId)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (maxOrderData?.[0]?.display_order || 0) + 1;

    // Calculate total_price
    const quantity = Number(body.quantity) || 1;
    const unitPrice = Number(body.unit_price) || 0;
    const totalPrice = quantity * unitPrice;

    const { data: item, error } = await supabase
      .from('quote_line_items')
      .insert({
        section_id: sectionId,
        pricing_id: body.pricing_id || null,
        description: body.description,
        quantity: quantity,
        unit: body.unit || 'stuk',
        cost_price: body.cost_price || null,
        markup_percent: body.markup_percent || null,
        unit_price: unitPrice,
        total_price: totalPrice,
        vat_rate: body.vat_rate ?? 21,
        display_order: body.display_order ?? nextOrder,
        is_auto_calculated: body.is_auto_calculated || false,
        formula_used: body.formula_used || null,
        line_type: body.line_type || 'materiaal',
        reasoning: body.reasoning || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating item:', error);
      return NextResponse.json({ error: 'Kon item niet aanmaken' }, { status: 500 });
    }

    // Update pricing usage statistics (lerend systeem)
    if (body.pricing_id) {
      await updatePricingUsage(supabase, body.pricing_id, unitPrice);
    }

    // Update section subtotal
    await updateSectionSubtotal(supabase, sectionId);

    // Update quote total
    await updateQuoteTotal(supabase, quoteId);

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Create item error:', error);
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

// Helper: Update pricing usage statistics (lerend systeem)
async function updatePricingUsage(
  supabase: ReturnType<typeof createServerClient>,
  pricingId: string,
  appliedPrice: number
) {
  if (!supabase) return;

  try {
    // Get current times_used
    const { data: pricing } = await supabase
      .from('pricing')
      .select('times_used')
      .eq('id', pricingId)
      .single();

    // Update times_used and last_used_at in pricing table
    await supabase
      .from('pricing')
      .update({
        times_used: (pricing?.times_used || 0) + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', pricingId);

    // Also record in learned_prices for price tracking
    const { data: existing } = await supabase
      .from('learned_prices')
      .select('id, times_used')
      .eq('pricing_id', pricingId)
      .eq('applied_price', appliedPrice)
      .single();

    if (existing) {
      // Update existing record
      await supabase
        .from('learned_prices')
        .update({
          times_used: (existing.times_used || 1) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new record
      await supabase
        .from('learned_prices')
        .insert({
          pricing_id: pricingId,
          applied_price: appliedPrice,
          times_used: 1,
          last_used_at: new Date().toISOString()
        });
    }
  } catch (error) {
    // Don't fail the main operation if learning fails
    console.error('Error updating pricing usage:', error);
  }
}
