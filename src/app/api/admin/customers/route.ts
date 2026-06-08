import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// GET /api/admin/customers - List all customers
export async function GET(request: Request) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);

    // Query params
    const search = searchParams.get('search');
    const type = searchParams.get('type'); // particulier, zakelijk
    const tag = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!supabase) {
      return NextResponse.json({ customers: [] });
    }

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' });

    // Search filter
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Type filter
    if (type) {
      query = query.eq('customer_type', type);
    }

    // Tag filter
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // Pagination & sorting
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ error: 'Kon klanten niet ophalen' }, { status: 500 });
    }

    return NextResponse.json({
      customers: data,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Customers API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// POST /api/admin/customers - Create new customer
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    // Validate required fields
    if (!body.first_name) {
      return NextResponse.json({ error: 'Voornaam is verplicht' }, { status: 400 });
    }

    // Create customer
    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        company_name: body.company_name || null,
        first_name: body.first_name,
        last_name: body.last_name || null,
        email: body.email || null,
        phone: body.phone || null,
        street: body.street || null,
        house_number: body.house_number || null,
        postal_code: body.postal_code || null,
        city: body.city || 'Gouda',
        customer_type: body.customer_type || 'particulier',
        tags: body.tags || [],
        notes: body.notes || null,
        converted_from_lead_id: body.converted_from_lead_id || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json({ error: 'Kon klant niet aanmaken' }, { status: 500 });
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_entity_type: 'customer',
      p_entity_id: customer.id,
      p_entity_name: `${customer.first_name} ${customer.last_name || ''}`.trim(),
      p_action: 'created',
      p_user_name: 'Admin'
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Customer create error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
