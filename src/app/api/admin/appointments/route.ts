import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ appointments: [] });
    }

    const { data, error } = await supabase
      .from('appointments')
      .select('*, leads(name, city)')
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json({ appointments: [] });
    }

    const appointmentsWithLeadInfo = data?.map(apt => ({
      ...apt,
      lead_name: apt.leads?.name,
      lead_city: apt.leads?.city,
    })) || [];

    return NextResponse.json({ appointments: appointmentsWithLeadInfo });
  } catch (error) {
    console.error('Appointments API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        lead_id: body.lead_id,
        quote_id: body.quote_id,
        scheduled_at: body.scheduled_at,
        duration_minutes: body.duration_minutes || 60,
        appointment_type: body.appointment_type,
        title: body.title,
        description: body.description,
        location: body.location,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      return NextResponse.json({ error: 'Kon afspraak niet aanmaken' }, { status: 500 });
    }

    // Log activity if lead_id exists
    if (body.lead_id) {
      await supabase.from('lead_activities').insert({
        lead_id: body.lead_id,
        activity_type: 'follow_up_scheduled',
        title: `Afspraak gepland: ${body.title}`,
        description: `${body.appointment_type} op ${new Date(body.scheduled_at).toLocaleDateString('nl-NL')}`
      });

      // Update lead status if it's a site visit
      if (body.appointment_type === 'site_visit') {
        await supabase
          .from('leads')
          .update({ status: 'site_visit_scheduled', updated_at: new Date().toISOString() })
          .eq('id', body.lead_id);
      }
    }

    return NextResponse.json({ appointment: data });
  } catch (error) {
    console.error('Appointment create error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
