import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: rules, error } = await supabase
      .from('demo_category_rules')
      .select('*')
      .eq('category_id', id)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching category rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category rules' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data: rule, error } = await supabase
      .from('demo_category_rules')
      .insert([{
        category_id: id,
        rule_name: body.rule_name,
        description: body.description,
        trigger_condition: body.trigger_condition,
        pricing_id: body.pricing_id,
        quantity_formula: body.quantity_formula,
        condition_formula: body.condition_formula,
        display_order: body.display_order || 0,
        is_active: body.is_active ?? true,
        material_name: body.material_name,
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error creating category rule:', error);
    return NextResponse.json(
      { error: 'Failed to create category rule' },
      { status: 500 }
    );
  }
}
