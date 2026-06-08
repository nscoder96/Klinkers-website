import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: categories, error } = await supabase
      .from('demo_work_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching work categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data: category, error } = await supabase
      .from('demo_work_categories')
      .insert([{
        name: body.name,
        slug: body.slug,
        description: body.description,
        icon: body.icon || 'Folder',
        display_order: body.display_order || 0,
        is_active: body.is_active ?? true,
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error creating work category:', error);
    return NextResponse.json(
      { error: 'Failed to create work category' },
      { status: 500 }
    );
  }
}
