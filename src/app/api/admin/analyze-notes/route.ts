import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface PricingItem {
  id: string;
  category: string;
  item_name: string;
  unit: string;
  selling_price_default: number;
}

export async function POST(request: Request) {
  try {
    const { notes } = await request.json();

    if (!notes || notes.trim().length === 0) {
      return NextResponse.json({ error: 'Geen notities ontvangen' }, { status: 400 });
    }

    // Fetch pricing items from database
    const supabase = createServerClient();
    let pricingItems: PricingItem[] = [];

    if (supabase) {
      const { data } = await supabase
        .from('pricing')
        .select('id, category, item_name, unit, selling_price_default')
        .eq('is_active', true);

      if (data) {
        pricingItems = data;
      }
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        error: 'AI niet geconfigureerd',
        lineItems: []
      }, { status: 500 });
    }

    // Create a list of available items for the AI
    const pricingList = pricingItems.map(p =>
      `- ID: ${p.id} | ${p.item_name} | ${p.unit} | €${p.selling_price_default}`
    ).join('\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `Je bent een assistent die notities van een hovenier analyseert en omzet naar offerte regels.

BESCHIKBARE PRIJSITEMS:
${pricingList}

JE TAAK:
1. Analyseer de notities
2. Identificeer welke werkzaamheden er nodig zijn
3. Schat de hoeveelheden in op basis van de genoemde maten
4. Selecteer de juiste prijsitems uit de lijst

REGELS:
- Gebruik ALLEEN items uit de bovenstaande lijst
- Schat hoeveelheden realistisch in (liever iets meer dan te weinig)
- Als er m2 wordt genoemd, gebruik dat
- Als er meters worden genoemd voor schuttingen/hagen, gebruik dat
- Voeg grondwerk toe als er bestrating of gazon wordt aangelegd
- Voeg opsluitbanden toe bij bestrating (omtrek = 2x lengte + 2x breedte)

BELANGRIJKE AANNAMES:
- Bij tuinaanleg: reken ~10% extra voor onvoorzien
- Bij bestrating: voeg altijd zandbed en opsluitbanden toe
- Bij gazon: voeg egaliseren toe

OUTPUT FORMAT (JSON):
{
  "analysis": "Korte samenvatting van wat je hebt geanalyseerd",
  "lineItems": [
    {
      "pricing_id": "uuid van het prijsitem",
      "description": "aangepaste beschrijving",
      "quantity": number,
      "unit": "eenheid",
      "unit_price": number
    }
  ]
}

Geef ALLEEN geldige JSON terug, geen andere tekst.`,
      messages: [
        {
          role: 'user',
          content: `Analyseer deze notities en genereer offerte regels:\n\n${notes}`
        }
      ]
    });

    // Extract text from response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'Geen analyse ontvangen' }, { status: 500 });
    }

    // Parse the JSON response
    try {
      // Clean up the response (remove markdown code blocks if present)
      let jsonStr = textContent.text.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      const result = JSON.parse(jsonStr);

      // Add totals to line items
      const lineItemsWithTotals = result.lineItems.map((item: {
        pricing_id: string;
        description: string;
        quantity: number;
        unit: string;
        unit_price: number;
      }) => ({
        id: crypto.randomUUID(),
        pricing_id: item.pricing_id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price
      }));

      return NextResponse.json({
        analysis: result.analysis,
        lineItems: lineItemsWithTotals
      });

    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', textContent.text);
      return NextResponse.json({
        error: 'Kon analyse niet verwerken',
        raw: textContent.text
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Analyze notes API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
