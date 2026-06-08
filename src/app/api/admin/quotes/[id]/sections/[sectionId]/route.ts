import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// GET single section with line items
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { sectionId } = await params;
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const { data: section, error } = await supabase
      .from('quote_sections')
      .select(`
        *,
        line_items:quote_line_items(*)
      `)
      .eq('id', sectionId)
      .single();

    if (error) {
      console.error('Error fetching section:', error);
      return NextResponse.json({ error: 'Sectie niet gevonden' }, { status: 404 });
    }

    // Sort line items
    section.line_items = section.line_items?.sort((a: { display_order: number }, b: { display_order: number }) =>
      (a.display_order || 0) - (b.display_order || 0)
    ) || [];

    return NextResponse.json({ section });
  } catch (error) {
    console.error('Section API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// PATCH update section
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { sectionId } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;
    if (body.subtotal !== undefined) updateData.subtotal = body.subtotal;

    const { data: section, error } = await supabase
      .from('quote_sections')
      .update(updateData)
      .eq('id', sectionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating section:', error);
      return NextResponse.json({ error: 'Kon sectie niet bijwerken' }, { status: 500 });
    }

    return NextResponse.json({ section });
  } catch (error) {
    console.error('Update section error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// DELETE section (and all line items)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { sectionId } = await params;
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    // Delete line items first (cascade should handle this, but be explicit)
    await supabase
      .from('quote_line_items')
      .delete()
      .eq('section_id', sectionId);

    // Delete section
    const { error } = await supabase
      .from('quote_sections')
      .delete()
      .eq('id', sectionId);

    if (error) {
      console.error('Error deleting section:', error);
      return NextResponse.json({ error: 'Kon sectie niet verwijderen' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete section error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
