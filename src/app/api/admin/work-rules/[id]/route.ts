import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// GET single work rule
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const { data: rule, error } = await supabase
      .from('work_rules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching work rule:', error);
      return NextResponse.json({ error: 'Kon arbeidsregel niet vinden' }, { status: 404 });
    }

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Work rule API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// PATCH update work rule
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.activity_name !== undefined) {
      updates.activity_name = body.activity_name;
      updates.activity_slug = body.activity_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
    }
    if (body.category !== undefined) updates.category = body.category;
    if (body.unit_price !== undefined) updates.unit_price = body.unit_price ? parseFloat(body.unit_price) : null;
    if (body.hourly_rate !== undefined) updates.hourly_rate = body.hourly_rate ? parseFloat(body.hourly_rate) : null;
    if (body.hours_per_unit !== undefined) updates.hours_per_unit = body.hours_per_unit ? parseFloat(body.hours_per_unit) : null;
    if (body.default_unit !== undefined) updates.default_unit = body.default_unit;
    if (body.linked_tasks !== undefined) updates.linked_tasks = body.linked_tasks;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    const { data: rule, error } = await supabase
      .from('work_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating work rule:', error);
      return NextResponse.json({ error: 'Kon arbeidsregel niet bijwerken' }, { status: 500 });
    }

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Update work rule error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// DELETE work rule
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    // Check if it's a system default (tenant_id = NULL with is_active = true)
    const { data: rule } = await supabase
      .from('work_rules')
      .select('tenant_id')
      .eq('id', id)
      .single();

    if (rule?.tenant_id === null) {
      // Don't delete system defaults, just deactivate
      await supabase
        .from('work_rules')
        .update({ is_active: false })
        .eq('id', id);
    } else {
      // Delete user's own rules
      const { error } = await supabase
        .from('work_rules')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting work rule:', error);
        return NextResponse.json({ error: 'Kon arbeidsregel niet verwijderen' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete work rule error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
