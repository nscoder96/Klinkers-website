import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// POST /api/admin/leads/[id]/convert - Convert lead to customer
export async function POST(
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

    // Get the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 });
    }

    // Check if lead is already converted
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('converted_from_lead_id', id)
      .single();

    if (existingCustomer) {
      return NextResponse.json({
        error: 'Lead is al geconverteerd naar een klant',
        customer_id: existingCustomer.id
      }, { status: 400 });
    }

    // Parse name into first_name and last_name
    const nameParts = lead.name.trim().split(' ');
    const firstName = nameParts[0] || lead.name;
    const lastName = nameParts.slice(1).join(' ') || null;

    // Create customer from lead data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        first_name: body.first_name || firstName,
        last_name: body.last_name || lastName,
        company_name: body.company_name || null,
        email: body.email || lead.email,
        phone: body.phone || lead.phone,
        street: body.street || lead.address,
        house_number: body.house_number || null,
        postal_code: body.postal_code || lead.postcode,
        city: body.city || lead.city || 'Gouda',
        customer_type: body.customer_type || 'particulier',
        tags: body.tags || [],
        notes: body.notes || lead.description,
        converted_from_lead_id: id
      })
      .select()
      .single();

    if (customerError) {
      console.error('Error creating customer from lead:', customerError);
      return NextResponse.json({ error: 'Kon klant niet aanmaken' }, { status: 500 });
    }

    // Update lead status to 'won'
    await supabase
      .from('leads')
      .update({
        status: 'won',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // Log activity on lead
    await supabase.from('lead_activities').insert({
      lead_id: id,
      activity_type: 'status_change',
      title: 'Lead geconverteerd naar klant',
      description: `Klant aangemaakt: ${customer.first_name} ${customer.last_name || ''}`.trim(),
      metadata: { customer_id: customer.id }
    });

    // Log activity on customer
    await supabase.rpc('log_activity', {
      p_entity_type: 'customer',
      p_entity_id: customer.id,
      p_entity_name: `${customer.first_name} ${customer.last_name || ''}`.trim(),
      p_action: 'created',
      p_changes: JSON.stringify({ converted_from_lead: lead.name }),
      p_user_name: 'Admin'
    });

    // Update any existing quotes to link to customer
    await supabase
      .from('quotes')
      .update({ customer_id: customer.id })
      .eq('lead_id', id);

    // Update any existing projects to link to customer
    await supabase
      .from('projects')
      .update({ customer_id: customer.id })
      .eq('lead_id', id);

    return NextResponse.json({
      success: true,
      customer,
      message: 'Lead succesvol geconverteerd naar klant'
    }, { status: 201 });
  } catch (error) {
    console.error('Lead conversion error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
