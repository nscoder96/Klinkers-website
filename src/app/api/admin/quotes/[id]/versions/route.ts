import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// GET all versions for a quote
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    const supabase = createServerClient();
    if (!supabase) return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });

    const { data, error } = await supabase
      .from('quote_versions')
      .select('id, version_number, label, created_at, snapshot')
      .eq('quote_id', quoteId)
      .order('version_number', { ascending: false });

    if (error) {
      // Table may not exist yet — return empty gracefully
      if (error.code === '42P01') {
        return NextResponse.json({ versions: [] });
      }
      return NextResponse.json({ error: 'Kon versies niet ophalen' }, { status: 500 });
    }

    return NextResponse.json({ versions: data || [] });
  } catch (error) {
    console.error('[versions GET]', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// POST create a new version snapshot
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    const { label } = await request.json().catch(() => ({ label: null }));

    const supabase = createServerClient();
    if (!supabase) return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });

    // Fetch current sections + items for snapshot
    const { data: sections, error: sectionsError } = await supabase
      .from('quote_sections')
      .select('*, quote_line_items(*)')
      .eq('quote_id', quoteId)
      .order('display_order');

    if (sectionsError) {
      return NextResponse.json({ error: 'Kon secties niet ophalen' }, { status: 500 });
    }

    // Fetch current overhead for snapshot
    const { data: overhead } = await supabase
      .from('quote_overhead')
      .select('*')
      .eq('quote_id', quoteId);

    // Get next version number
    const { data: existing } = await supabase
      .from('quote_versions')
      .select('version_number')
      .eq('quote_id', quoteId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = existing && existing.length > 0 ? existing[0].version_number + 1 : 1;

    const snapshot = {
      sections: sections || [],
      overhead: overhead || [],
      saved_at: new Date().toISOString()
    };

    const { data: version, error: insertError } = await supabase
      .from('quote_versions')
      .insert({
        quote_id: quoteId,
        version_number: nextVersion,
        label: label || `Versie ${nextVersion}`,
        snapshot
      })
      .select()
      .single();

    if (insertError) {
      // Table may not exist — try to create it inline and retry
      if (insertError.code === '42P01') {
        return NextResponse.json({
          error: 'Versiebeheer tabel bestaat nog niet. Voer de database migratie uit.',
          migration_needed: true
        }, { status: 400 });
      }
      console.error('[versions POST] Insert error:', insertError);
      return NextResponse.json({ error: 'Kon versie niet opslaan' }, { status: 500 });
    }

    return NextResponse.json({ version });
  } catch (error) {
    console.error('[versions POST]', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
