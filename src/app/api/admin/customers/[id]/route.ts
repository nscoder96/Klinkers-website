import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// GET /api/admin/customers/[id] - Get customer detail with related data
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    // Get customer
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching customer:', error);
      return NextResponse.json({ error: 'Klant niet gevonden' }, { status: 404 });
    }

    // Get related quotes
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id, quote_number, status, total, created_at, project_description')
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    // Get related projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, project_number, status, quoted_amount, created_at')
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    // Get related invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, total, invoice_date, due_date')
      .eq('customer_id', id)
      .order('invoice_date', { ascending: false });

    // Get maintenance contracts
    const { data: contracts } = await supabase
      .from('maintenance_contracts')
      .select('id, name, status, frequency, price_per_visit, annual_value')
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    // Get original lead if converted
    let originalLead = null;
    if (customer.converted_from_lead_id) {
      const { data: lead } = await supabase
        .from('leads')
        .select('id, name, status, source, created_at')
        .eq('id', customer.converted_from_lead_id)
        .single();
      originalLead = lead;
    }

    // Calculate stats
    const stats = {
      total_quotes: quotes?.length || 0,
      total_projects: projects?.length || 0,
      total_invoices: invoices?.length || 0,
      total_revenue: invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0) || 0,
      open_invoices: invoices?.filter(i => i.status === 'sent' || i.status === 'overdue').length || 0,
      active_contracts: contracts?.filter(c => c.status === 'active').length || 0
    };

    return NextResponse.json({
      customer,
      quotes: quotes || [],
      projects: projects || [],
      invoices: invoices || [],
      contracts: contracts || [],
      original_lead: originalLead,
      stats
    });
  } catch (error) {
    console.error('Customer API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// PATCH /api/admin/customers/[id] - Update customer
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

    // Get current customer for activity logging
    const { data: currentCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentCustomer) {
      return NextResponse.json({ error: 'Klant niet gevonden' }, { status: 404 });
    }

    // Update customer
    const { data: customer, error } = await supabase
      .from('customers')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return NextResponse.json({ error: 'Kon klant niet bijwerken' }, { status: 500 });
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_entity_type: 'customer',
      p_entity_id: customer.id,
      p_entity_name: `${customer.first_name} ${customer.last_name || ''}`.trim(),
      p_action: 'updated',
      p_changes: JSON.stringify({ old: currentCustomer, new: customer }),
      p_user_name: 'Admin'
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Customer update error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// DELETE /api/admin/customers/[id] - Delete customer
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

    // Check if customer has related records
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id')
      .eq('customer_id', id)
      .limit(1);

    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('customer_id', id)
      .limit(1);

    const { data: invoices } = await supabase
      .from('invoices')
      .select('id')
      .eq('customer_id', id)
      .limit(1);

    if ((quotes && quotes.length > 0) || (projects && projects.length > 0) || (invoices && invoices.length > 0)) {
      return NextResponse.json({
        error: 'Kan klant niet verwijderen: er zijn nog gekoppelde offertes, projecten of facturen'
      }, { status: 400 });
    }

    // Get customer name for logging
    const { data: customer } = await supabase
      .from('customers')
      .select('first_name, last_name')
      .eq('id', id)
      .single();

    // Delete customer
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer:', error);
      return NextResponse.json({ error: 'Kon klant niet verwijderen' }, { status: 500 });
    }

    // Log activity
    if (customer) {
      await supabase.rpc('log_activity', {
        p_entity_type: 'customer',
        p_entity_id: id,
        p_entity_name: `${customer.first_name} ${customer.last_name || ''}`.trim(),
        p_action: 'deleted',
        p_user_name: 'Admin'
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Customer delete error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
