import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// GET all calculation formulas
export async function GET() {
  try {
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const { data: formulas, error } = await supabase
      .from('calculation_formulas')
      .select('*')
      .or('user_id.is.null')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('formula_name', { ascending: true });

    if (error) {
      console.error('Error fetching formulas:', error);
      return NextResponse.json({ error: 'Kon formules niet ophalen' }, { status: 500 });
    }

    return NextResponse.json({ formulas: formulas || [] });
  } catch (error) {
    console.error('Formulas API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// POST create new formula
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const slug = body.formula_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    const { data: formula, error } = await supabase
      .from('calculation_formulas')
      .insert({
        user_id: null,
        formula_name: body.formula_name,
        formula_slug: slug,
        category: body.category,
        formula_expression: body.formula_expression,
        description: body.description || null,
        parameters: body.parameters || {},
        result_unit: body.result_unit,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating formula:', error);
      return NextResponse.json({ error: 'Kon formule niet aanmaken' }, { status: 500 });
    }

    return NextResponse.json({ formula });
  } catch (error) {
    console.error('Create formula error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
