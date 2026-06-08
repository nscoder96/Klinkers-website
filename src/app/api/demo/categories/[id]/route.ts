import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

/**
 * GET /api/demo/categories/[id]
 * Get a single category with all its materials, questions, and rules
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

    const { data: category, error } = await supabase
      .from('demo_work_categories')
      .select(`
        *,
        demo_category_materials (
          *,
          demo_pricing (
            id,
            item_name,
            unit,
            selling_price_default
          )
        ),
        demo_category_questions (*),
        demo_category_rules (
          *,
          demo_pricing (
            id,
            item_name,
            unit,
            selling_price_default
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Categorie niet gevonden' }, { status: 404 });
      }
      throw error;
    }

    // Sort materials, questions, and rules by display_order
    if (category.demo_category_materials) {
      category.demo_category_materials.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order);
    }
    if (category.demo_category_questions) {
      category.demo_category_questions.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order);
    }
    if (category.demo_category_rules) {
      category.demo_category_rules.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order);
    }

    return NextResponse.json({
      category: {
        ...category,
        materials: category.demo_category_materials || [],
        questions: category.demo_category_questions || [],
        rules: category.demo_category_rules || [],
        demo_category_materials: undefined,
        demo_category_questions: undefined,
        demo_category_rules: undefined,
      }
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen categorie' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/demo/categories/[id]
 * Update a category
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

    const updates = await request.json();

    // Don't allow updating certain fields
    delete updates.id;
    delete updates.created_at;

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    const { data: category, error } = await supabase
      .from('demo_work_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Categorie niet gevonden' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Fout bij bijwerken categorie' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/demo/categories/[id]
 * Delete a category (soft delete by setting is_active to false)
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

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('demo_work_categories')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Fout bij verwijderen categorie' },
      { status: 500 }
    );
  }
}
