import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// POST reorder sections
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    const { section_ids } = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    if (!Array.isArray(section_ids)) {
      return NextResponse.json({ error: 'section_ids moet een array zijn' }, { status: 400 });
    }

    // Update each section's display_order
    const updates = section_ids.map((sectionId: string, index: number) =>
      supabase
        .from('quote_sections')
        .update({ display_order: index + 1, updated_at: new Date().toISOString() })
        .eq('id', sectionId)
        .eq('quote_id', quoteId)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reorder sections error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
