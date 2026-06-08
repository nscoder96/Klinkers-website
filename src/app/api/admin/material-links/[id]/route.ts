import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// PATCH update material link
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const updates: Record<string, unknown> = {};

    if (body.pricing_id !== undefined) updates.pricing_id = body.pricing_id;
    if (body.material_name !== undefined) updates.material_name = body.material_name;
    if (body.calculation_formula_id !== undefined) updates.calculation_formula_id = body.calculation_formula_id;
    if (body.formula_id !== undefined) updates.calculation_formula_id = body.formula_id;
    if (body.custom_formula !== undefined) updates.custom_formula = body.custom_formula;
    if (body.default_unit !== undefined) updates.default_unit = body.default_unit;
    if (body.is_enabled !== undefined) updates.is_enabled = body.is_enabled;

    const { data: link, error } = await supabase
      .from('material_links')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        work_rules (
          id,
          activity_name,
          category
        ),
        pricing (
          id,
          item_name,
          unit,
          selling_price_default
        ),
        calculation_formulas (
          id,
          formula_name,
          formula_expression
        )
      `)
      .single();

    if (error) {
      console.error('Error updating material link:', error);
      return NextResponse.json({ error: 'Kon koppeling niet bijwerken' }, { status: 500 });
    }

    return NextResponse.json({ link });
  } catch (error) {
    console.error('Update material link error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// DELETE material link
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

    const { error } = await supabase
      .from('material_links')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting material link:', error);
      return NextResponse.json({ error: 'Kon koppeling niet verwijderen' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete material link error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
