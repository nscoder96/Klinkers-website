import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

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
    const updates = await request.json();

    const { data, error } = await supabase
      .from('demo_pricing')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ pricing: data });
  } catch (error) {
    console.error('Error updating demo pricing:', error);
    return NextResponse.json({ error: 'Fout bij bijwerken prijsitem' }, { status: 500 });
  }
}

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

    const { error } = await supabase
      .from('demo_pricing')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting demo pricing:', error);
    return NextResponse.json({ error: 'Fout bij verwijderen prijsitem' }, { status: 500 });
  }
}
