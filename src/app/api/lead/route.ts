import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

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

    // TODO: Stuur notificatie naar eigenaar (email/WhatsApp)

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
