import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// PATCH update formula (mainly parameters)
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

    if (body.parameters !== undefined) updates.parameters = body.parameters;
    if (body.formula_name !== undefined) updates.formula_name = body.formula_name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.formula_expression !== undefined) updates.formula_expression = body.formula_expression;
    if (body.result_unit !== undefined) updates.result_unit = body.result_unit;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    const { data: formula, error } = await supabase
      .from('calculation_formulas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating formula:', error);
      return NextResponse.json({ error: 'Kon formule niet bijwerken' }, { status: 500 });
    }

    return NextResponse.json({ formula });
  } catch (error) {
    console.error('Update formula error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// DELETE formula
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

    // Deactivate instead of delete for system formulas
    const { error } = await supabase
      .from('calculation_formulas')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting formula:', error);
      return NextResponse.json({ error: 'Kon formule niet verwijderen' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete formula error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
