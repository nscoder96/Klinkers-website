import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    if (!supabase) return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });

    const { data, error } = await supabase
      .from('invoices')
      .select('*, quotes(quote_number, project_description, project_address, leads(name, email, phone, address, city))')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Factuur niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ invoice: data });
  } catch (error) {
    console.error('Factuur GET error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();
    if (!supabase) return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });

    const allowedFields = [
      'sections', 'line_items', 'subtotal', 'vat_amount', 'total',
      'status', 'due_date', 'invoice_date', 'notes', 'internal_notes',
      'paid_at', 'paid_amount', 'payment_method', 'payment_reference',
    ];

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (field in body) updateData[field] = body[field];
    }

    // Recalculate totals from sections if sections are provided
    if (body.sections) {
      const allItems = (body.sections as Record<string, unknown>[]).flatMap((s) =>
        (s.line_items as Record<string, unknown>[] || [])
      );
      const subtotal = allItems.reduce((sum: number, item: Record<string, unknown>) =>
        sum + (Number(item.total_price) || 0), 0);
      const vatAmount = allItems.reduce((sum: number, item: Record<string, unknown>) => {
        const vat = Number(item.vat_rate) || 21;
        return sum + (Number(item.total_price) || 0) * (vat / 100);
      }, 0);
      updateData.subtotal = Math.round(subtotal * 100) / 100;
      updateData.vat_amount = Math.round(vatAmount * 100) / 100;
      updateData.total = Math.round((subtotal + vatAmount) * 100) / 100;
      updateData.line_items = allItems;
    }

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating invoice:', error);
      return NextResponse.json({ error: 'Kon factuur niet bijwerken: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ invoice: data });
  } catch (error) {
    console.error('Factuur PUT error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
