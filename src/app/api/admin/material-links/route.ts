import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// GET all material links with related data
export async function GET() {
  try {
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    // Get links with work rule and pricing info
    const { data: links, error } = await supabase
      .from('material_links')
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching material links:', error);
      return NextResponse.json({ error: 'Kon koppelingen niet ophalen' }, { status: 500 });
    }

    return NextResponse.json({ links: links || [] });
  } catch (error) {
    console.error('Material links API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// POST create new material link
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    // Get material name from pricing if not provided
    let materialName = body.material_name;
    if (!materialName && body.pricing_id) {
      const { data: pricing } = await supabase
        .from('pricing')
        .select('item_name')
        .eq('id', body.pricing_id)
        .single();
      materialName = pricing?.item_name || 'Onbekend materiaal';
    }

    const { data: link, error } = await supabase
      .from('material_links')
      .insert({
        work_rule_id: body.work_rule_id,
        pricing_id: body.pricing_id || null,
        material_name: materialName,
        calculation_formula_id: body.formula_id || null,
        custom_formula: body.custom_formula || null,
        default_unit: body.default_unit || null,
        is_enabled: body.is_enabled ?? true,
      })
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
      console.error('Error creating material link:', error);
      return NextResponse.json({ error: 'Kon koppeling niet aanmaken' }, { status: 500 });
    }

    return NextResponse.json({ link });
  } catch (error) {
    console.error('Create material link error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
