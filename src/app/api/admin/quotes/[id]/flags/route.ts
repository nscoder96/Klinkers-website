import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { getQuoteFlags, resolveQuoteFlag } from '@/lib/pipeline/flag-gate.service';

/**
 * Pipeline-flags van een offerte (C2.1): de vlaggen uit de jongste generation
 * run, met per vlag of er een oplos-actie voor gelogd is. De editor toont ze
 * bij de verzendknop; de send-route gate op dezelfde bron.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    const result = await getQuoteFlags(supabase, quoteId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Flags ophalen mislukt:', error);
    return NextResponse.json({ error: 'Kon vlaggen niet ophalen' }, { status: 500 });
  }
}

/**
 * Expliciete oplos-actie voor één flag (code + message). Wordt gelogd in
 * quote_flag_resolutions — wie/wanneer/welke flag is later leerdata over hoe
 * vaak vlaggen handmatig worden afgehandeld.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    const { code, message } = await request.json();

    if (typeof code !== 'string' || code.length === 0 || typeof message !== 'string') {
      return NextResponse.json({ error: 'code en message zijn verplicht' }, { status: 400 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    await resolveQuoteFlag(supabase, quoteId, code, message);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Flag oplossen mislukt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kon flag niet oplossen' },
      { status: 500 }
    );
  }
}
