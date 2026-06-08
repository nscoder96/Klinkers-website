import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

/**
 * GET /api/demo/categories/[id]/questions
 * Get all questions for a category
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

    const { data: questions, error } = await supabase
      .from('demo_category_questions')
      .select('*')
      .eq('category_id', id)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ questions: questions || [] });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen vragen' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/demo/categories/[id]/questions
 * Add a question to a category
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
      question_text,
      question_type,
      options,
      default_value,
      variable_name,
      display_order,
      is_required,
      help_text
    } = body;

    if (!question_text || !question_type || !variable_name) {
      return NextResponse.json(
        { error: 'Vraag tekst, type en variabele naam zijn verplicht' },
        { status: 400 }
      );
    }

    if (!['boolean', 'number', 'select', 'text'].includes(question_type)) {
      return NextResponse.json(
        { error: 'Ongeldig vraag type' },
        { status: 400 }
      );
    }

    const { data: question, error } = await supabase
      .from('demo_category_questions')
      .insert({
        category_id: id,
        question_text,
        question_type,
        options: options || null,
        default_value: default_value || null,
        variable_name,
        display_order: display_order || 0,
        is_required: is_required || false,
        help_text: help_text || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Fout bij toevoegen vraag' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/demo/categories/[id]/questions
 * Update a question (expects questionId in body)
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
    const { questionId, ...updates } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is verplicht' },
        { status: 400 }
      );
    }

    // Don't allow updating certain fields
    delete updates.id;
    delete updates.category_id;
    delete updates.created_at;

    const { data: question, error } = await supabase
      .from('demo_category_questions')
      .update(updates)
      .eq('id', questionId)
      .eq('category_id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Fout bij bijwerken vraag' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/demo/categories/[id]/questions
 * Delete a question (expects questionId as query param)
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
    const questionId = searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is verplicht' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('demo_category_questions')
      .delete()
      .eq('id', questionId)
      .eq('category_id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Fout bij verwijderen vraag' },
      { status: 500 }
    );
  }
}
