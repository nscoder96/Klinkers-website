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

    // Totalen worden server-side herberekend (zie onder); client-waarden worden
    // bewust genegeerd zodat een leeg/NaN-veld de totalen nooit op 0/null zet.
    const { sections } = body;
    const round2 = (n: number) => Math.round(n * 100) / 100;

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

    // Create new sections with line items.
    // Elk regeltotaal = aantal × prijs (server-side herberekend, defensief tegen
    // NaN/lege velden). Offertetotalen worden hieruit opgeteld — nooit uit de client.
    const allLineItems: object[] = [];
    let serverSubtotal = 0;
    let serverBtwRaw = 0;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      // Herbereken elke regel defensief
      const computed = (section.line_items || []).map((item: {
        description: string;
        quantity: number;
        unit: string;
        unit_price: number;
        total_price?: number;
        line_type?: string;
        markup_percent?: number | null;
        vat_rate?: number;
        display_order?: number;
        pricing_id?: string | null;
        is_ai_calculated?: boolean;
        calculation_breakdown?: object | null;
      }, idx: number) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unit_price) || 0;
        const vatRate = Number(item.vat_rate) || 21;
        const totalPrice = round2(unitPrice * quantity);
        return { item, idx, quantity, unitPrice, vatRate, totalPrice };
      });

      const sectionSubtotal = round2(
        computed.reduce((sum: number, c: { totalPrice: number }) => sum + c.totalPrice, 0)
      );

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
      if (computed.length > 0) {
        const lineItems = computed.map(({ item, idx, quantity, unitPrice, vatRate, totalPrice }: {
          item: { description: string; unit: string; line_type?: string; markup_percent?: number | null; display_order?: number; pricing_id?: string | null; is_ai_calculated?: boolean; calculation_breakdown?: object | null };
          idx: number; quantity: number; unitPrice: number; vatRate: number; totalPrice: number;
        }) => ({
          section_id: newSection.id,
          pricing_id: item.pricing_id || null,
          description: item.description,
          quantity,
          unit: item.unit,
          cost_price: null,
          markup_percent: item.markup_percent || null,
          unit_price: unitPrice,
          total_price: totalPrice,
          line_type: item.line_type || 'arbeid',
          vat_rate: vatRate,
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

      serverSubtotal = round2(serverSubtotal + sectionSubtotal);
      serverBtwRaw += computed.reduce(
        (sum: number, c: { totalPrice: number; vatRate: number }) =>
          sum + c.totalPrice * (c.vatRate / 100),
        0
      );
    }

    const serverBtw = round2(serverBtwRaw);
    const serverTotal = round2(serverSubtotal + serverBtw);

    // Update quote totals and line_items JSON — totalen server-side herberekend.
    const flatLineItems = sections.flatMap((s: { line_items?: object[] }) => s.line_items || []).map((item: {
      description: string;
      quantity: number;
      unit: string;
      unit_price: number;
      line_type?: string;
    }, index: number) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      return {
        description: item.description,
        quantity,
        unit: item.unit,
        unit_price: unitPrice,
        total: round2(unitPrice * quantity),
        line_type: item.line_type || 'arbeid',
        display_order: index + 1
      };
    });

    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        line_items: flatLineItems,
        subtotal: serverSubtotal,
        btw_amount: serverBtw,
        total: serverTotal
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
        subtotal: serverSubtotal,
        btw_amount: serverBtw,
        total: serverTotal
      },
      change_summary: `Offerte bijgewerkt: ${sections.length} secties, €${serverTotal.toFixed(2)} totaal`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update sections error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
