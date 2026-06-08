import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const { data: quotes, error } = await supabase
      .from('demo_quotes')
      .select(`
        *,
        demo_leads (
          id,
          name,
          email,
          phone,
          city
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ quotes: quotes || [] });
  } catch (error) {
    console.error('Error fetching demo quotes:', error);
    return NextResponse.json({ error: 'Fout bij ophalen offertes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }
    const quoteData = await request.json();

    // Generate quote number
    const { data: lastQuote } = await supabase
      .from('demo_quotes')
      .select('quote_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastQuote?.quote_number) {
      const match = lastQuote.quote_number.match(/OFF-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const year = new Date().getFullYear();
    const quoteNumber = `OFF-${year}-${String(nextNumber).padStart(3, '0')}`;

    const { data, error } = await supabase
      .from('demo_quotes')
      .insert({
        ...quoteData,
        quote_number: quoteNumber,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ quote: data });
  } catch (error) {
    console.error('Error creating demo quote:', error);
    return NextResponse.json({ error: 'Fout bij aanmaken offerte' }, { status: 500 });
  }
}
