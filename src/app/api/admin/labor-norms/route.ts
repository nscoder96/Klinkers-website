import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/client';

/**
 * Urennormen-beheer (C3). De normen voeden de Laag 1-prompt per aanroep;
 * een wijziging hier is direct zichtbaar in de eerstvolgende generatie.
 */

const NormSchema = z.object({
  work_type_key: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'alleen kleine letters, cijfers en streepjes'),
  label: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  hours_per_unit: z.number().positive().nullable(),
  basis_qty: z.number().positive(),
  display_text: z.string().min(1).nullable().optional(),
  sort_order: z.number().int(),
  is_active: z.boolean().optional(),
});

export async function GET() {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    // Beheer toont ook inactieve normen; de generator filtert zelf op actief.
    const { data, error } = await supabase
      .from('labor_norms')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Urennormen ophalen mislukt:', error.message);
      return NextResponse.json({ error: 'Kon urennormen niet ophalen' }, { status: 500 });
    }
    return NextResponse.json({ norms: data ?? [] });
  } catch (error) {
    console.error('Labor norms API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = NormSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ongeldige norm', details: parsed.error.issues },
        { status: 400 }
      );
    }
    if (parsed.data.hours_per_unit == null && !parsed.data.display_text) {
      return NextResponse.json(
        { error: 'Een norm heeft uren óf een weergavetekst nodig' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('labor_norms')
      .insert({ ...parsed.data, source: 'handmatig' })
      .select()
      .single();

    if (error) {
      console.error('Urennorm aanmaken mislukt:', error.message);
      return NextResponse.json({ error: `Kon norm niet aanmaken: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ norm: data });
  } catch (error) {
    console.error('Labor norms API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
