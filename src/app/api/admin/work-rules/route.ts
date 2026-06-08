import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// GET all work rules (system defaults + user's own)
export async function GET() {
  try {
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    // Get system defaults (tenant_id = NULL) and user's own rules
    const { data: rules, error } = await supabase
      .from('work_rules')
      .select('*')
      .or('tenant_id.is.null')
      .order('category', { ascending: true })
      .order('activity_name', { ascending: true });

    if (error) {
      console.error('Error fetching work rules:', error);
      return NextResponse.json({ error: 'Kon arbeidsregels niet ophalen' }, { status: 500 });
    }

    return NextResponse.json({ rules: rules || [] });
  } catch (error) {
    console.error('Work rules API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// POST create new work rule
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    // Generate slug from name
    const slug = body.activity_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    const { data: rule, error } = await supabase
      .from('work_rules')
      .insert({
        tenant_id: null, // System-level for now
        activity_name: body.activity_name,
        activity_slug: slug,
        category: body.category,
        unit_price: body.unit_price ? parseFloat(body.unit_price) : null,
        hourly_rate: body.hourly_rate ? parseFloat(body.hourly_rate) : null,
        hours_per_unit: body.hours_per_unit ? parseFloat(body.hours_per_unit) : null,
        default_unit: body.default_unit || 'm²',
        linked_tasks: body.linked_tasks || [],
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating work rule:', error);
      return NextResponse.json({ error: 'Kon arbeidsregel niet aanmaken' }, { status: 500 });
    }

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Create work rule error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
