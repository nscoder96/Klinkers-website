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

    const { data: materials, error } = await supabase
      .from('demo_category_materials')
      .select('*')
      .eq('category_id', id)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ materials });
  } catch (error) {
    console.error('Error fetching category materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category materials' },
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

    const { data: material, error } = await supabase
      .from('demo_category_materials')
      .insert([{
        category_id: id,
        pricing_id: body.pricing_id,
        material_type: body.material_type || 'base',
        is_required: body.is_required ?? true,
        default_quantity: body.default_quantity,
        quantity_formula: body.quantity_formula,
        display_order: body.display_order || 0,
        notes: body.notes,
        material_name: body.material_name,
        material_unit: body.material_unit,
        material_price: body.material_price,
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ material });
  } catch (error) {
    console.error('Error creating category material:', error);
    return NextResponse.json(
      { error: 'Failed to create category material' },
      { status: 500 }
    );
  }
}
