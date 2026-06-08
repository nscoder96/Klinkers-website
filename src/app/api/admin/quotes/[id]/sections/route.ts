import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// GET all sections for a quote (with line items)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    // Fetch sections with line items
    const { data: sections, error } = await supabase
      .from('quote_sections')
      .select(`
        *,
        line_items:quote_line_items(*)
      `)
      .eq('quote_id', quoteId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching sections:', error);
      return NextResponse.json({ error: 'Kon secties niet ophalen' }, { status: 500 });
    }

    // Sort line items within each section
    const sectionsWithSortedItems = sections?.map(section => ({
      ...section,
      line_items: section.line_items?.sort((a: { display_order: number }, b: { display_order: number }) =>
        (a.display_order || 0) - (b.display_order || 0)
      ) || []
    })) || [];

    return NextResponse.json({ sections: sectionsWithSortedItems });
  } catch (error) {
    console.error('Sections API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// POST create new section
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    // Get max display_order for this quote
    const { data: maxOrderData } = await supabase
      .from('quote_sections')
      .select('display_order')
      .eq('quote_id', quoteId)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (maxOrderData?.[0]?.display_order || 0) + 1;

    const { data: section, error } = await supabase
      .from('quote_sections')
      .insert({
        quote_id: quoteId,
        title: body.title,
        description: body.description || null,
        display_order: body.display_order ?? nextOrder,
        subtotal: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating section:', error);
      return NextResponse.json({ error: 'Kon sectie niet aanmaken' }, { status: 500 });
    }

    return NextResponse.json({ section });
  } catch (error) {
    console.error('Create section error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// PUT - Replace all sections for a quote
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const { sections, subtotal, btw_amount, total } = body;

    // Start transaction: delete existing sections and line items
    // First get existing section IDs
    const { data: existingSections } = await supabase
      .from('quote_sections')
      .select('id')
      .eq('quote_id', quoteId);

    const existingSectionIds = existingSections?.map(s => s.id) || [];

    // Delete existing line items
    if (existingSectionIds.length > 0) {
      await supabase
        .from('quote_line_items')
        .delete()
        .in('section_id', existingSectionIds);
    }

    // Delete existing sections
    await supabase
      .from('quote_sections')
      .delete()
      .eq('quote_id', quoteId);

    // Create new sections with line items
    const allLineItems: object[] = [];

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      // Calculate section subtotal
      const sectionSubtotal = section.line_items?.reduce(
        (sum: number, item: { total_price: number }) => sum + (item.total_price || 0),
        0
      ) || 0;

      // Create section
      const { data: newSection, error: sectionError } = await supabase
        .from('quote_sections')
        .insert({
          quote_id: quoteId,
          title: section.title,
          description: section.description || null,
          display_order: section.display_order || i + 1,
          subtotal: sectionSubtotal
        })
        .select()
        .single();

      if (sectionError) {
        console.error('Error creating section:', sectionError);
        continue;
      }

      // Create line items for this section
      if (section.line_items && section.line_items.length > 0) {
        const lineItems = section.line_items.map((item: {
          description: string;
          quantity: number;
          unit: string;
          unit_price: number;
          total_price: number;
          line_type?: string;
          markup_percent?: number | null;
          vat_rate?: number;
          display_order?: number;
          pricing_id?: string | null;
          is_ai_calculated?: boolean;
          calculation_breakdown?: object | null;
        }, idx: number) => ({
          section_id: newSection.id,
          pricing_id: item.pricing_id || null,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          cost_price: null,
          markup_percent: item.markup_percent || null,
          unit_price: item.unit_price,
          total_price: item.total_price,
          line_type: item.line_type || 'arbeid',
          vat_rate: item.vat_rate || 21,
          display_order: item.display_order || idx + 1,
          is_auto_calculated: item.is_ai_calculated || false,
          formula_used: item.calculation_breakdown ? JSON.stringify(item.calculation_breakdown) : null
        }));

        const { error: itemsError } = await supabase
          .from('quote_line_items')
          .insert(lineItems);

        if (itemsError) {
          console.error('Error creating line items:', itemsError);
        }

        allLineItems.push(...lineItems);
      }
    }

    // Update quote totals and line_items JSON
    const flatLineItems = sections.flatMap((s: { line_items?: object[] }) => s.line_items || []).map((item: {
      description: string;
      quantity: number;
      unit: string;
      unit_price: number;
      total_price: number;
      line_type?: string;
    }, index: number) => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      total: item.total_price,
      line_type: item.line_type || 'arbeid',
      display_order: index + 1
    }));

    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        line_items: flatLineItems,
        subtotal: subtotal,
        btw_amount: btw_amount,
        total: total
      })
      .eq('id', quoteId);

    if (updateError) {
      console.error('Error updating quote:', updateError);
      return NextResponse.json({ error: 'Kon offerte totalen niet updaten' }, { status: 500 });
    }

    // Log to quote_history
    await supabase.from('quote_history').insert({
      quote_id: quoteId,
      change_type: 'updated',
      old_data: null,
      new_data: {
        sections: sections.length,
        items: allLineItems.length,
        subtotal,
        btw_amount,
        total
      },
      change_summary: `Offerte bijgewerkt: ${sections.length} secties, €${total.toFixed(2)} totaal`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update sections error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
