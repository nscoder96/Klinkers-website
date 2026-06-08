import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

/**
 * GET /api/demo/categories
 * List all work categories with their materials, questions, and rules counts
 */
export async function GET() {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const { data: categories, error } = await supabase
      .from('demo_work_categories')
      .select(`
        *,
        demo_category_materials (id),
        demo_category_questions (id),
        demo_category_rules (id)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Transform to include counts
    const categoriesWithCounts = categories?.map(cat => ({
      ...cat,
      materials_count: cat.demo_category_materials?.length || 0,
      questions_count: cat.demo_category_questions?.length || 0,
      rules_count: cat.demo_category_rules?.length || 0,
      demo_category_materials: undefined,
      demo_category_questions: undefined,
      demo_category_rules: undefined,
    })) || [];

    return NextResponse.json({ categories: categoriesWithCounts });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen categorieën' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/demo/categories
 * Create a new work category
 */
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const body = await request.json();
    const { name, slug, description, icon, display_order } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Naam en slug zijn verplicht' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('demo_work_categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Categorie met deze slug bestaat al' },
        { status: 400 }
      );
    }

    const { data: category, error } = await supabase
      .from('demo_work_categories')
      .insert({
        name,
        slug,
        description: description || null,
        icon: icon || null,
        display_order: display_order || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Fout bij aanmaken categorie' },
      { status: 500 }
    );
  }
}
