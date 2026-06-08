import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// POST restore a specific version (replaces current sections)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id: quoteId, versionId } = await params;
    const supabase = createServerClient();
    if (!supabase) return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });

    // Fetch the version
    const { data: version, error: fetchError } = await supabase
      .from('quote_versions')
      .select('snapshot')
      .eq('id', versionId)
      .eq('quote_id', quoteId)
      .single();

    if (fetchError || !version) {
      return NextResponse.json({ error: 'Versie niet gevonden' }, { status: 404 });
    }

    const snapshot = version.snapshot as {
      sections: Array<{
        id: string;
        title: string;
        description: string | null;
        display_order: number;
        quote_line_items: Array<{
          description: string;
          quantity: number;
          unit: string;
          unit_price: number;
          total_price: number;
          line_type: string;
          display_order: number;
          pricing_id: string | null;
          is_ai_calculated: boolean;
          calculation_breakdown: unknown;
          markup_percent: number | null;
          vat_rate: number;
        }>;
      }>;
      overhead: Array<{
        name: string;
        description: string | null;
        overhead_type: string;
        value: number;
        calculated_amount: number;
      }>;
    };

    // Save current state as new version before restoring (safety)
    const { data: existingVersions } = await supabase
      .from('quote_versions')
      .select('version_number')
      .eq('quote_id', quoteId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = existingVersions && existingVersions.length > 0
      ? existingVersions[0].version_number + 1 : 1;

    const { data: currentSections } = await supabase
      .from('quote_sections')
      .select('*, quote_line_items(*)')
      .eq('quote_id', quoteId)
      .order('display_order');

    const { data: currentOverhead } = await supabase
      .from('quote_overhead')
      .select('*')
      .eq('quote_id', quoteId);

    await supabase.from('quote_versions').insert({
      quote_id: quoteId,
      version_number: nextVersion,
      label: `Backup voor herstel (${new Date().toLocaleString('nl-NL')})`,
      snapshot: { sections: currentSections || [], overhead: currentOverhead || [], saved_at: new Date().toISOString() }
    });

    // Delete current sections
    await supabase.from('quote_sections').delete().eq('quote_id', quoteId);

    // Restore sections from snapshot
    let subtotal = 0;
    for (const section of snapshot.sections) {
      const { data: newSection } = await supabase
        .from('quote_sections')
        .insert({
          quote_id: quoteId,
          title: section.title,
          description: section.description,
          display_order: section.display_order
        })
        .select()
        .single();

      if (newSection && section.quote_line_items?.length) {
        const items = section.quote_line_items.map((item, idx) => ({
          section_id: newSection.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.total_price,
          line_type: item.line_type,
          display_order: item.display_order ?? idx + 1,
          pricing_id: item.pricing_id,
          is_ai_calculated: item.is_ai_calculated ?? false,
          calculation_breakdown: item.calculation_breakdown,
          markup_percent: item.markup_percent,
          vat_rate: item.vat_rate ?? 21
        }));
        await supabase.from('quote_line_items').insert(items);
        subtotal += section.quote_line_items.reduce((s, i) => s + (i.total_price || 0), 0);
      }
    }

    // Restore overhead
    await supabase.from('quote_overhead').delete().eq('quote_id', quoteId);
    if (snapshot.overhead?.length) {
      const overheadItems = snapshot.overhead.map(o => ({
        quote_id: quoteId,
        name: o.name,
        description: o.description,
        overhead_type: o.overhead_type,
        value: o.value,
        calculated_amount: o.calculated_amount
      }));
      await supabase.from('quote_overhead').insert(overheadItems);
    }

    // Update quote totals
    const btwAmount = subtotal * 0.21;
    await supabase.from('quotes').update({
      subtotal,
      btw_amount: btwAmount,
      total: subtotal + btwAmount
    }).eq('id', quoteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[versions restore]', error);
    return NextResponse.json({ error: 'Herstel mislukt' }, { status: 500 });
  }
}
