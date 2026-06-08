import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createServerClient();
    if (!supabase) return NextResponse.json({ facturen: [] });

    const { data, error } = await supabase
      .from('invoices')
      .select('*, leads(name, city, email)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching facturen:', error);
      return NextResponse.json({ error: 'Kon facturen niet ophalen' }, { status: 500 });
    }

    const facturen = data?.map(f => ({
      ...f,
      lead_name: f.leads?.name,
      lead_city: f.leads?.city,
      lead_email: f.leads?.email,
    })) || [];

    return NextResponse.json({ facturen });
  } catch (error) {
    console.error('Facturen GET error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServerClient();
    if (!supabase) return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });

    const { quote_id } = body;
    if (!quote_id) {
      return NextResponse.json({ error: 'quote_id is vereist' }, { status: 400 });
    }

    // Fetch the quote with sections
    const [quoteRes, sectionsRes] = await Promise.all([
      supabase.from('quotes').select('*, leads(name, email, phone, address, city)').eq('id', quote_id).single(),
      supabase.from('quote_sections').select('*, quote_line_items(*)').eq('quote_id', quote_id).order('display_order'),
    ]);

    if (quoteRes.error || !quoteRes.data) {
      return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 });
    }

    const quote = quoteRes.data;
    const quoteSections = sectionsRes.data || [];

    // Generate invoice number
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const year = new Date().getFullYear();
    let newInvoiceNumber = `FACT-${year}-001`;
    if (lastInvoice?.invoice_number) {
      const match = lastInvoice.invoice_number.match(/FACT-(\d{4})-(\d+)/);
      if (match) {
        const num = match[1] === String(year) ? parseInt(match[2]) + 1 : 1;
        newInvoiceNumber = `FACT-${year}-${String(num).padStart(3, '0')}`;
      }
    }

    // Build sections from quote_sections or fall back to line_items
    let sections: object[] = [];
    if (quoteSections.length > 0) {
      sections = quoteSections.map((s: Record<string, unknown>) => {
        const lineItems = (s.quote_line_items as Record<string, unknown>[] || []);
        return {
          id: crypto.randomUUID(),
          title: s.title,
          display_order: s.display_order,
          line_items: lineItems
            .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
            .map((item: Record<string, unknown>) => ({
              id: crypto.randomUUID(),
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.unit_price,
              total_price: item.total_price,
              line_type: item.line_type || 'arbeid',
              vat_rate: item.vat_rate || 21,
              display_order: item.display_order,
            })),
        };
      });
    } else if (Array.isArray(quote.line_items) && quote.line_items.length > 0) {
      sections = [{
        id: crypto.randomUUID(),
        title: 'Werkzaamheden',
        display_order: 1,
        line_items: (quote.line_items as Record<string, unknown>[]).map((item: Record<string, unknown>, i: number) => ({
          id: crypto.randomUUID(),
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.total || item.total_price,
          line_type: item.line_type || 'arbeid',
          vat_rate: 21,
          display_order: i + 1,
        })),
      }];
    }

    // Calculate totals
    const allItems = (sections as Record<string, unknown>[]).flatMap((s) =>
      (s.line_items as Record<string, unknown>[] || [])
    );
    const subtotal = allItems.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
    const vatAmount = allItems.reduce((sum, item) => {
      const vat = Number(item.vat_rate) || 21;
      return sum + (Number(item.total_price) || 0) * (vat / 100);
    }, 0);
    const total = subtotal + vatAmount;

    // Due date: 14 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        quote_id: quote.id,
        customer_id: quote.customer_id || null,
        invoice_number: newInvoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        subtotal: Math.round(subtotal * 100) / 100,
        vat_amount: Math.round(vatAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
        line_items: allItems,
        sections,
        status: 'draft',
        notes: quote.customer_notes || null,
        internal_notes: `Aangemaakt vanuit offerte ${quote.quote_number}`,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      return NextResponse.json({ error: 'Kon factuur niet aanmaken: ' + invoiceError.message }, { status: 500 });
    }

    return NextResponse.json({ invoice, lead: quote.leads });
  } catch (error) {
    console.error('Facturen POST error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
