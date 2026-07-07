import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/client';

/** Bijwerken/verwijderen van één urennorm (C3). */

const PatchSchema = z
  .object({
    label: z.string().min(1),
    category: z.string().min(1),
    unit: z.string().min(1),
    hours_per_unit: z.number().positive().nullable(),
    basis_qty: z.number().positive(),
    display_text: z.string().min(1).nullable(),
    sort_order: z.number().int(),
    is_active: z.boolean(),
  })
  .partial();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsed = PatchSchema.safeParse(await request.json());
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'Ongeldige wijziging' }, { status: 400 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('labor_norms')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Urennorm bijwerken mislukt:', error.message);
      return NextResponse.json({ error: `Kon norm niet bijwerken: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ norm: data });
  } catch (error) {
    console.error('Labor norms API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    const { error } = await supabase.from('labor_norms').delete().eq('id', id);
    if (error) {
      console.error('Urennorm verwijderen mislukt:', error.message);
      return NextResponse.json({ error: `Kon norm niet verwijderen: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Labor norms API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
