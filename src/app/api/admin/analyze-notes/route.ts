import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-6';

interface PricingItem {
  id: string;
  category: string;
  item_name: string;
  unit: string;
  selling_price_default: number;
  item_type?: 'materiaal' | 'arbeid';
}

interface Element {
  name: string;
  category: string;
  source_text: string;
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

function matchPricing(description: string, lineType: string, items: PricingItem[]): PricingItem | undefined {
  const relevant = items.filter(p => p.item_type === lineType);
  const desc = description.toLowerCase();

  const exact = relevant.find(p => p.item_name.toLowerCase() === desc);
  if (exact) return exact;

  const contains = relevant.find(p =>
    p.item_name.toLowerCase().includes(desc) || desc.includes(p.item_name.toLowerCase())
  );
  if (contains) return contains;

  const descWords = desc.split(/\s+/).filter(w => w.length > 3);
  let best: PricingItem | undefined;
  let bestScore = 0;
  for (const p of relevant) {
    const nw = p.item_name.toLowerCase().split(/\s+/);
    const score = descWords.filter(w => nw.some(n => n.includes(w) || w.includes(n))).length;
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return bestScore >= 1 ? best : undefined;
}

export async function POST(request: Request) {
  try {
    const { notes } = await request.json();

    if (!notes?.trim()) {
      return NextResponse.json({ error: 'Geen notities ontvangen' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI niet geconfigureerd' }, { status: 500 });
    }

    const supabase = createServerClient();
    let pricingItems: PricingItem[] = [];
    let workRulesContext = '';

    if (supabase) {
      const [pricingRes, rulesRes] = await Promise.all([
        supabase.from('pricing').select('id, category, item_name, unit, selling_price_default, item_type').eq('is_active', true),
        supabase.from('work_rules').select('activity_name, category, linked_tasks').eq('is_active', true)
      ]);
      pricingItems = pricingRes.data || [];

      const rules = rulesRes.data || [];
      if (rules.length > 0) {
        workRulesContext = '\n\nGELEERDE REGELS (voeg deze altijd toe als het element hierop van toepassing is):\n' +
          rules.map(r => {
            const tasks = (r.linked_tasks as Array<{name: string; enabled: boolean}> || [])
              .filter(t => t.enabled).map(t => t.name).join(', ');
            return tasks ? `- Bij "${r.activity_name}": voeg ook toe → ${tasks}` : null;
          }).filter(Boolean).join('\n');
      }
    }

    const materiaalList = pricingItems
      .filter(p => p.item_type === 'materiaal')
      .map(p => `ID:${p.id} | ${p.item_name} | ${p.unit} | €${p.selling_price_default}`)
      .join('\n');

    const arbeidList = pricingItems
      .filter(p => p.item_type === 'arbeid')
      .map(p => `ID:${p.id} | ${p.item_name} | ${p.unit} | €${p.selling_price_default}`)
      .join('\n');

    // ═══════════════════════════════════════════
    // STAP 1: Splits in losse onderdelen
    // ═══════════════════════════════════════════
    const splitResponse = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Identificeer elk afzonderlijk tuinelement of locatie in deze schouwnotities.
Elk uniek onderdeel wordt een eigen sectie in de offerte.

REGELS:
- Elke aparte locatie of apart werk = eigen element
- Geef elk element een naam met afmetingen
- Kopieer de EXACTE relevante tekst als source_text

CATEGORIEËN: grondwerk, bestrating, erfafscheiding, vlonders, gazon, beplanting, overkappingen, waterwerken, verlichting, overig

NOTITIES:
"""
${notes}
"""

Return ALLEEN geldig JSON:
{
  "elements": [
    {
      "name": "Grind ophogen 40m² (15cm)",
      "category": "grondwerk",
      "source_text": "Grind ophogen (Grind moet zeker 15 cm op over een gebied van 40m2)"
    }
  ],
  "project_summary": "Verhalende samenvatting van het hele project."
}`
      }]
    });

    const splitText = splitResponse.content.find(b => b.type === 'text');
    if (!splitText || splitText.type !== 'text') {
      return NextResponse.json({ error: 'Kon notities niet opdelen' }, { status: 500 });
    }

    const splitResult = parseJson<{ elements: Element[]; project_summary: string }>(splitText.text);
    if (!splitResult?.elements?.length) {
      console.error('[analyze-notes] Split parse error. Raw:', splitText.text.substring(0, 500));
      return NextResponse.json({ error: 'Kon onderdelen niet herkennen' }, { status: 500 });
    }

    const elements = splitResult.elements;

    // ═══════════════════════════════════════════
    // STAP 2: Verwerk elk element apart
    // ═══════════════════════════════════════════
    interface RawItem {
      description: string;
      line_type: string;
      quantity: number;
      unit: string;
      unit_price: number;
      pricing_id?: string | null;
      calculation?: string;
      new_item?: boolean;
    }

    interface FinalItem {
      id: string;
      pricing_id: string | null;
      description: string;
      quantity: number;
      unit: string;
      unit_price: number;
      total: number;
      reasoning: string;
      is_new: boolean;
      category: string;
      line_type: 'materiaal' | 'arbeid';
      is_main_item: boolean;
    }

    interface FinalSection {
      category: string;
      element_title: string;
      title: string;
      items: FinalItem[];
    }

    const finalSections: FinalSection[] = [];
    const allLineItems: FinalItem[] = [];
    const newItemsAdded: string[] = [];

    for (const element of elements) {
      const elementResponse = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Je bent een ervaren stratenmaker en hovenier die een offerte opstelt. Denk als een vakman.

ONDERDEEL: ${element.name}
NOTITIE: "${element.source_text}"

═══════════════════════════════════════════════════
STAP 1 — HERKEN HET WERKTYPE
═══════════════════════════════════════════════════
Bepaal eerst welk type werk dit is. Elk type heeft een vaste logische volgorde:

ZAND REGEL (ALTIJD TOEPASSEN):
Gebruik ALTIJD "Straatzand" — nooit "ophoogzand". Straatzand wordt gebruikt voor zowel ophogen als het zandbed.
Bij elk werk met zand/ophogen zijn er ALTIJD 3 items samen (het "zandpakket"):
  a. Straatzand (materiaal) → hoeveelheid in m³
  b. Zandbed aanbrengen (arbeid)
  c. Zandbed verdichten en egaliseren (arbeid)

OPHOGEN BESTRATING (bijv. "5cm omhoog", "ophogen inrit"):
  1. Bestaande bestrating opbreken en stapelen (arbeid)
  2. Straatzand aanvoeren (materiaal) → m² × hoogte_in_m = m³ (voor ophogen)
  3. Zandbed aanbrengen (arbeid)
  4. Zandbed verdichten en egaliseren (arbeid)
  5. Straatzand zandbed (materiaal) → m² × 0.05m = m³ (voor het zandbed onder de stenen)
  6. Zandbed aanbrengen (arbeid)
  7. Bestrating herleggen / herstraten (arbeid) ← GEEN nieuw materiaal
  8. Voegen (arbeid)

HERSTRATEN ZONDER OPHOGEN (bijv. "verzakt", "herstraten"):
  1. Bestaande bestrating opbreken (arbeid)
  2. Straatzand bijvullen (materiaal) → m² × 0.05m = m³
  3. Zandbed aanbrengen (arbeid)
  4. Zandbed verdichten en egaliseren (arbeid)
  5. Bestrating herleggen (arbeid) ← GEEN nieuw materiaal
  6. Voegen (arbeid)

NIEUW TERRAS / NIEUWE BESTRATING:
  1. Grond afgraven (arbeid) → m² × 0.25m = m³
  2. Grondafvoer (arbeid) → m³ × 1.3
  3. Straatzand fundering aanvoeren (materiaal) → m² × hoogte_in_m = m³
  4. Zandbed aanbrengen (arbeid)
  5. Zandbed verdichten en egaliseren (arbeid)
  6. Straatzand zandbed (materiaal) → m² × 0.05 = m³
  7. Zandbed aanbrengen (arbeid)
  8. Opsluitbanden (materiaal) → omtrek meters
  9. Opsluitbanden plaatsen (arbeid)
  10. Bestrating (materiaal) → m²
  11. Bestrating leggen (arbeid)
  12. Voegen (arbeid)

OPHOGEN GROND / GRIND / PLANTVAK:
  1. Straatzand / ophoogmateriaal aanvoeren (materiaal) → m² × hoogte = m³
  2. Zandbed aanbrengen (arbeid)
  3. Zandbed verdichten en egaliseren (arbeid)

TRAPTREDEN / BANDEN HERSTELLEN:
  1. Opbreken (arbeid)
  2. Fundering herstellen (arbeid + evt. materiaal)
  3. Herplaatsen (arbeid) ← "herstellen" = GEEN nieuw materiaal
  4. "Vervangen/nieuw" = wél nieuw materiaal

═══════════════════════════════════════════════════
STAP 2 — BEREKEN DE HOEVEELHEDEN
═══════════════════════════════════════════════════
- Haal afmetingen uit de notitie, reken altijd uit
- Toon de rekensom: "14m × 3.5m = 49m²"
- Straatzand (ophogen): m² × hoogte_in_meters = m³
- Straatzand (zandbed): m² × 0.05 = m³
- Grondafvoer: m³ × 1.3

═══════════════════════════════════════════════════
STAP 3 — VOLGORDE IN DE OFFERTE
═══════════════════════════════════════════════════
Zet items in UITVOERINGSVOLGORDE: sloopwerk → grondwerk → materiaal → afwerking.

KRITIEKE REGELS:
- Elke regel is óf "materiaal" óf "arbeid" — NOOIT beide
- HERSTRATEN / HERSTELLEN = arbeid, GEEN nieuw straatmateriaal
- Bij OPHOGEN: altijd Trillen/verdichten toevoegen

BESCHIKBARE MATERIALEN:
${materiaalList || 'Geen beschikbaar'}

BESCHIKBARE ARBEID:
${arbeidList || 'Geen beschikbaar'}
${workRulesContext}
Return ALLEEN geldig JSON:
{
  "items": [
    {
      "description": "Straatzand",
      "line_type": "materiaal",
      "quantity": 2.0,
      "unit": "m³",
      "unit_price": 35,
      "pricing_id": "uuid-of-null",
      "calculation": "40m² × 0.05m = 2.0 m³"
    }
  ]
}`
        }]
      });

      const elementText = elementResponse.content.find(b => b.type === 'text');
      if (!elementText || elementText.type !== 'text') {
        console.error(`[analyze-notes] No response for element: ${element.name}`);
        continue;
      }

      const elementResult = parseJson<{ items: RawItem[] }>(elementText.text);
      if (!elementResult?.items?.length) {
        console.error(`[analyze-notes] Parse error for "${element.name}". Raw:`, elementText.text.substring(0, 300));
        continue;
      }

      const sectionItems: FinalItem[] = [];

      for (const item of elementResult.items) {
        const lineType: 'materiaal' | 'arbeid' =
          (item.line_type === 'arbeid' || item.line_type === 'materiaal') ? item.line_type : 'materiaal';

        let pricingId: string | null = item.pricing_id && item.pricing_id !== 'null' ? item.pricing_id : null;
        let unitPrice = item.unit_price || 0;

        // Validate DB pricing_id
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

        // Add new item to pricing DB if flagged
        if (item.new_item && !pricingId && supabase) {
          try {
            const { data: newPricing, error } = await supabase
              .from('pricing')
              .insert({
                category: element.category,
                item_name: item.description,
                unit: item.unit,
                selling_price_default: unitPrice,
                item_type: lineType,
                is_active: true,
                ai_generated: true,
                notes: `AI gegenereerd. Berekening: ${item.calculation || 'Geen'}`
              })
              .select()
              .single();

            if (!error && newPricing) {
              pricingId = newPricing.id;
              newItemsAdded.push(item.description);
            }
          } catch (err) {
            console.error('[analyze-notes] Error adding new pricing item:', err);
          }
        }

        const quantity = item.quantity || 0;
        const finalItem: FinalItem = {
          id: crypto.randomUUID(),
          pricing_id: pricingId,
          description: item.description,
          quantity,
          unit: item.unit || 'stuk',
          unit_price: unitPrice,
          total: quantity * unitPrice,
          reasoning: item.calculation || '',
          is_new: item.new_item || false,
          category: element.category,
          line_type: lineType,
          is_main_item: true
        };

        sectionItems.push(finalItem);
        allLineItems.push(finalItem);
      }

      if (sectionItems.length > 0) {
        finalSections.push({
          category: element.category,
          element_title: element.name,
          title: element.name,
          items: sectionItems
        });
      }
    }

    // Sort sections by category order
    const categoryOrder = ['grondwerk', 'bestrating', 'erfafscheiding', 'vlonders', 'gazon', 'beplanting', 'overkappingen', 'waterwerken', 'verlichting', 'overig'];
    finalSections.sort((a, b) => {
      const oa = categoryOrder.indexOf(a.category);
      const ob = categoryOrder.indexOf(b.category);
      return (oa === -1 ? 99 : oa) - (ob === -1 ? 99 : ob);
    });

    const subtotal = allLineItems.reduce((sum, i) => sum + i.total, 0);

    return NextResponse.json({
      analysis: splitResult.project_summary,
      sections: finalSections,
      lineItems: allLineItems,
      totals: {
        subtotal,
        btw: subtotal * 0.21,
        total: subtotal * 1.21
      },
      newItemsAdded
    });

  } catch (error) {
    console.error('[analyze-notes] FATAL error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Analyse mislukt'
    }, { status: 500 });
  }
}
