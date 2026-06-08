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

    const { data: questions, error } = await supabase
      .from('demo_category_questions')
      .select('*')
      .eq('category_id', id)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching category questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category questions' },
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

    const { data: question, error } = await supabase
      .from('demo_category_questions')
      .insert([{
        category_id: id,
        question_text: body.question_text,
        question_type: body.question_type || 'boolean',
        options: body.options,
        default_value: body.default_value,
        variable_name: body.variable_name,
        display_order: body.display_order || 0,
        is_required: body.is_required ?? false,
        help_text: body.help_text,
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error creating category question:', error);
    return NextResponse.json(
      { error: 'Failed to create category question' },
      { status: 500 }
    );
  }
}
