import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { sendLeadNotification } from '@/lib/services/lead-notification.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      address,
      postcode,
      city,
      project_type,
      description,
      estimated_m2,
      budget_range,
      urgency,
      source = 'website'
    } = body;

    // Validatie
    if (!name || !description) {
      return NextResponse.json(
        { error: 'Naam en beschrijving zijn verplicht' },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email of telefoonnummer is verplicht' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Als Supabase niet geconfigureerd is, log en return success
    if (!supabase) {
      console.log('Lead ontvangen (Supabase niet geconfigureerd):', { name, email, phone, description });
      return NextResponse.json({
        success: true,
        message: 'Bedankt voor uw aanvraag! We nemen zo snel mogelijk contact met u op.',
        leadId: 'pending-setup'
      });
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        phone,
        address,
        postcode,
        city: city || 'Gouda',
        project_type,
        description,
        estimated_m2,
        budget_range,
        urgency,
        source,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Kon aanvraag niet opslaan' },
        { status: 500 }
      );
    }

    // Notificatie naar Niek — niet-blokkerend: een mailfout mag het opslaan
    // van de lead nooit breken, maar is wél zichtbaar in de serverlogs.
    const notification = await sendLeadNotification({
      id: data.id,
      name,
      email,
      phone,
      address,
      postcode,
      city,
      project_type,
      description,
      estimated_m2,
      budget_range,
      urgency,
    });
    if (!notification.sent) {
      console.error('[Lead] Notificatie niet verstuurd:', notification.reason);
    }

    return NextResponse.json({
      success: true,
      message: 'Bedankt voor uw aanvraag! We nemen zo snel mogelijk contact met u op.',
      leadId: data.id
    });

  } catch (error) {
    console.error('Lead API error:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Simple health check
  return NextResponse.json({ status: 'ok' });
}
