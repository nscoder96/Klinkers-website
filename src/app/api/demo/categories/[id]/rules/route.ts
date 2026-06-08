import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

/**
 * GET /api/demo/categories/[id]/rules
 * Get all calculation rules for a category
 */
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

    const { data: rules, error } = await supabase
      .from('demo_category_rules')
      .select(`
        *,
        demo_pricing (
          id,
          item_name,
          unit,
          selling_price_default
        )
      `)
      .eq('category_id', id)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ rules: rules || [] });
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen regels' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/demo/categories/[id]/rules
 * Add a calculation rule to a category
 */
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

    const body = await request.json();
    const {
      rule_name,
      description,
      trigger_condition,
      pricing_id,
      quantity_formula,
      condition_formula,
      display_order,
      is_active
    } = body;

    if (!rule_name || !quantity_formula) {
      return NextResponse.json(
        { error: 'Regel naam en hoeveelheid formule zijn verplicht' },
        { status: 400 }
      );
    }

    const { data: rule, error } = await supabase
      .from('demo_category_rules')
      .insert({
        category_id: id,
        rule_name,
        description: description || null,
        trigger_condition: trigger_condition || null,
        pricing_id: pricing_id || null,
        quantity_formula,
        condition_formula: condition_formula || null,
        display_order: display_order || 0,
        is_active: is_active !== false,
      })
      .select(`
        *,
        demo_pricing (
          id,
          item_name,
          unit,
          selling_price_default
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('Error creating rule:', error);
    return NextResponse.json(
      { error: 'Fout bij toevoegen regel' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/demo/categories/[id]/rules
 * Update a rule (expects ruleId in body)
 */
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

    const body = await request.json();
    const { ruleId, ...updates } = body;

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is verplicht' },
        { status: 400 }
      );
    }

    // Don't allow updating certain fields
    delete updates.id;
    delete updates.category_id;
    delete updates.created_at;

    const { data: rule, error } = await supabase
      .from('demo_category_rules')
      .update(updates)
      .eq('id', ruleId)
      .eq('category_id', id)
      .select(`
        *,
        demo_pricing (
          id,
          item_name,
          unit,
          selling_price_default
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error updating rule:', error);
    return NextResponse.json(
      { error: 'Fout bij bijwerken regel' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/demo/categories/[id]/rules
 * Delete a rule (expects ruleId as query param)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is verplicht' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('demo_category_rules')
      .delete()
      .eq('id', ruleId)
      .eq('category_id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rule:', error);
    return NextResponse.json(
      { error: 'Fout bij verwijderen regel' },
      { status: 500 }
    );
  }
}
