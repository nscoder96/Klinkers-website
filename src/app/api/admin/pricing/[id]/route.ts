import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('pricing')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing item:', error);
      return NextResponse.json({ error: 'Kon item niet bijwerken' }, { status: 500 });
    }

    return NextResponse.json({ pricing: data });
  } catch (error) {
    console.error('Pricing update error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
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
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    const { error } = await supabase
      .from('pricing')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting pricing item:', error);
      return NextResponse.json({ error: 'Kon item niet verwijderen' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pricing delete error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
