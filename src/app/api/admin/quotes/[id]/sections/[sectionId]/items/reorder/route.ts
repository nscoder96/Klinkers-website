import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// POST reorder items within a section
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { sectionId } = await params;
    const { item_ids } = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    if (!Array.isArray(item_ids)) {
      return NextResponse.json({ error: 'item_ids moet een array zijn' }, { status: 400 });
    }

    // Update each item's display_order
    const updates = item_ids.map((itemId: string, index: number) =>
      supabase
        .from('quote_line_items')
        .update({ display_order: index + 1, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq('section_id', sectionId)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reorder items error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
