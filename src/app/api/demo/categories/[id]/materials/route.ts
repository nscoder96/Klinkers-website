import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

/**
 * GET /api/demo/categories/[id]/materials
 * Get all materials for a category
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

    const { data: materials, error } = await supabase
      .from('demo_category_materials')
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

    return NextResponse.json({ materials: materials || [] });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen materialen' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/demo/categories/[id]/materials
 * Add a material to a category
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
      pricing_id,
      material_type,
      is_required,
      default_quantity,
      quantity_formula,
      display_order,
      notes
    } = body;

    if (!material_type || !['base', 'extra'].includes(material_type)) {
      return NextResponse.json(
        { error: 'Ongeldig materiaal type' },
        { status: 400 }
      );
    }

    const { data: material, error } = await supabase
      .from('demo_category_materials')
      .insert({
        category_id: id,
        pricing_id: pricing_id || null,
        material_type,
        is_required: is_required || false,
        default_quantity: default_quantity || null,
        quantity_formula: quantity_formula || null,
        display_order: display_order || 0,
        notes: notes || null,
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

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      { error: 'Fout bij toevoegen materiaal' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/demo/categories/[id]/materials
 * Update a material (expects materialId in body)
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
    const { materialId, ...updates } = body;

    if (!materialId) {
      return NextResponse.json(
        { error: 'Material ID is verplicht' },
        { status: 400 }
      );
    }

    // Don't allow updating certain fields
    delete updates.id;
    delete updates.category_id;
    delete updates.created_at;

    const { data: material, error } = await supabase
      .from('demo_category_materials')
      .update(updates)
      .eq('id', materialId)
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

    return NextResponse.json({ material });
  } catch (error) {
    console.error('Error updating material:', error);
    return NextResponse.json(
      { error: 'Fout bij bijwerken materiaal' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/demo/categories/[id]/materials
 * Delete a material (expects materialId in body)
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
    const materialId = searchParams.get('materialId');

    if (!materialId) {
      return NextResponse.json(
        { error: 'Material ID is verplicht' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('demo_category_materials')
      .delete()
      .eq('id', materialId)
      .eq('category_id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting material:', error);
    return NextResponse.json(
      { error: 'Fout bij verwijderen materiaal' },
      { status: 500 }
    );
  }
}
