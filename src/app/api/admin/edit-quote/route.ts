import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';

interface PricingItem {
  id: string;
  item_name: string;
  unit: string;
  selling_price_default: number;
  item_type: 'materiaal' | 'arbeid';
  category: string;
}

interface QuoteItem {
  id: string;
  description: string;
  line_type: 'materiaal' | 'arbeid';
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  pricing_id: string | null;
  is_ai_calculated: boolean;
  calculation_breakdown: { formula: string; explanation: string; source: string } | null;
}

interface Section {
  id: string;
  title: string;
  category?: string;
  subtotal: number;
  items: QuoteItem[];
}

function parseJson<T>(text: string): T | null {
  try {
    let s = text.trim();
    if (s.startsWith('```json')) s = s.slice(7);
    if (s.startsWith('```')) s = s.slice(3);
    if (s.endsWith('```')) s = s.slice(0, -3);
    return JSON.parse(s.trim()) as T;
  } catch {
    return null;
  }
}

function matchPricing(description: string, lineType: string, items: PricingItem[]): PricingItem | null {
  const relevant = items.filter(p => p.item_type === lineType);
  const desc = description.toLowerCase();
  const exact = relevant.find(p => p.item_name.toLowerCase() === desc);
  if (exact) return exact;
  const contains = relevant.find(p =>
    p.item_name.toLowerCase().includes(desc) || desc.includes(p.item_name.toLowerCase())
  );
  if (contains) return contains;
  const words = desc.split(/\s+/).filter(w => w.length > 3);
  let best: PricingItem | null = null;
  let bestScore = 0;
  for (const p of relevant) {
    const nw = p.item_name.toLowerCase().split(/\s+/);
    const score = words.filter(w => nw.some(n => n.includes(w) || w.includes(n))).length;
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return bestScore >= 1 ? best : null;
}

export async function POST(request: Request) {
  try {
    const { sections, instruction } = await request.json();

    if (!sections?.length || !instruction?.trim()) {
      return NextResponse.json({ error: 'Ontbrekende gegevens' }, { status: 400 });
    }

    const supabase = createServerClient();
    let pricingItems: PricingItem[] = [];
    if (supabase) {
      const { data } = await supabase
        .from('pricing')
        .select('id, item_name, unit, selling_price_default, item_type, category')
        .eq('is_active', true);
      pricingItems = data || [];
    }

    const materiaalList = pricingItems
      .filter(p => p.item_type === 'materiaal')
      .map(p => `ID:${p.id} | ${p.item_name} | ${p.unit} | €${p.selling_price_default}`)
      .join('\n');

    const arbeidList = pricingItems
      .filter(p => p.item_type === 'arbeid')
      .map(p => `ID:${p.id} | ${p.item_name} | ${p.unit} | €${p.selling_price_default}`)
      .join('\n');

    // Build compact representation of current sections for the AI
    const compactSections = sections.map((s: Section) => ({
      id: s.id,
      title: s.title,
      category: s.category,
      items: s.items.map((i: QuoteItem) => ({
        id: i.id,
        description: i.description,
        line_type: i.line_type,
        quantity: i.quantity,
        unit: i.unit,
        unit_price: i.unit_price
      }))
    }));

    const prompt = `Je bent een offerte-assistent voor een hovenier. Pas de offerte aan op basis van de instructie van de gebruiker.

HUIDIGE OFFERTE:
${JSON.stringify(compactSections, null, 2)}

INSTRUCTIE VAN GEBRUIKER:
"${instruction}"

ZAND REGEL: Gebruik ALTIJD "Straatzand" — nooit "ophoogzand". Bij zand/ophogen altijd 3 items:
1. Straatzand (materiaal)
2. Zandbed aanbrengen (arbeid)
3. Zandbed verdichten en egaliseren (arbeid)

BESCHIKBARE MATERIALEN:
${materiaalList || 'Geen beschikbaar'}

BESCHIKBARE ARBEID:
${arbeidList || 'Geen beschikbaar'}

REGELS:
- Bewaar de bestaande item IDs die niet worden gewijzigd
- Gebruik nieuwe UUIDs voor nieuwe items (schrijf "NEW_UUID_1", "NEW_UUID_2" etc. — worden achteraf vervangen)
- Elke regel is óf "materiaal" óf "arbeid", nooit beide
- Hoeveelheden en prijzen mogen worden aangepast
- Secties mogen worden hernoemd, verwijderd of toegevoegd
- Gebruik pricing_id als er een match is in de database

Geef ALLEEN de volledige gewijzigde sectie-structuur terug als JSON:
{
  "sections": [
    {
      "id": "bestaand-uuid-of-nieuwe-sectie-id",
      "title": "Sectie naam",
      "category": "bestrating",
      "items": [
        {
          "id": "bestaand-uuid-of-NEW_UUID_1",
          "description": "Straatzand",
          "line_type": "materiaal",
          "quantity": 2.5,
          "unit": "m³",
          "unit_price": 35,
          "pricing_id": "uuid-of-null"
        }
      ]
    }
  ]
}`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'AI gaf geen antwoord' }, { status: 500 });
    }

    const result = parseJson<{ sections: Array<{
      id: string;
      title: string;
      category?: string;
      items: Array<{
        id: string;
        description: string;
        line_type: 'materiaal' | 'arbeid';
        quantity: number;
        unit: string;
        unit_price: number;
        pricing_id?: string | null;
      }>;
    }> }>(textBlock.text);

    if (!result?.sections) {
      console.error('[edit-quote] Parse error. Raw:', textBlock.text.substring(0, 500));
      return NextResponse.json({ error: 'Kon aanpassing niet verwerken' }, { status: 500 });
    }

    // Process sections: resolve pricing IDs and calculate totals
    const updatedSections = result.sections.map(section => {
      const items: QuoteItem[] = section.items.map((item, idx) => {
        // Replace NEW_UUID placeholders
        const itemId = item.id.startsWith('NEW_UUID') ? crypto.randomUUID() : item.id;

        const lineType: 'materiaal' | 'arbeid' =
          (item.line_type === 'arbeid' || item.line_type === 'materiaal') ? item.line_type : 'materiaal';

        let pricingId: string | null = item.pricing_id && item.pricing_id !== 'null' ? item.pricing_id : null;
        let unitPrice = item.unit_price || 0;

        // Validate pricing ID
        if (pricingId) {
          const dbItem = pricingItems.find(p => p.id === pricingId);
          if (dbItem) {
            unitPrice = dbItem.selling_price_default;
          } else {
            pricingId = null;
          }
        }

        // Try to match if no valid ID
        if (!pricingId) {
          const matched = matchPricing(item.description, lineType, pricingItems);
          if (matched) {
            pricingId = matched.id;
            unitPrice = matched.selling_price_default;
          }
        }

        const quantity = item.quantity || 0;
        return {
          id: itemId,
          description: item.description,
          line_type: lineType,
          quantity,
          unit: item.unit || 'stuk',
          unit_price: unitPrice,
          total_price: quantity * unitPrice,
          pricing_id: pricingId,
          is_ai_calculated: true,
          calculation_breakdown: null,
          display_order: idx,
          section_id: section.id.startsWith('NEW_') ? '' : section.id,
          cost_price: null,
          markup_percent: null,
          vat_rate: 21,
          show_on_quote: true,
          internal_notes: null,
          is_auto_calculated: true,
          formula_used: null,
          reasoning: null
        } as QuoteItem & Record<string, unknown>;
      });

      const subtotal = items.reduce((sum, i) => sum + i.total_price, 0);
      const sectionId = section.id.startsWith('NEW_') ? crypto.randomUUID() : section.id;

      return {
        id: sectionId,
        title: section.title,
        category: section.category,
        subtotal,
        items,
        // Preserve other fields needed by the frontend
        quote_id: '',
        description: null,
        display_order: 0,
        line_items: items
      };
    });

    return NextResponse.json({ sections: updatedSections });

  } catch (error) {
    console.error('[edit-quote] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Bewerking mislukt'
    }, { status: 500 });
  }
}
