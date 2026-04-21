import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/client';
import {
  genereerNormenTekst,
  type PatroonType,
  type GrondtypeType,
  type BereikbaarheidType,
} from '@/lib/utils/straatwerk-calculations';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-6';

const CATEGORY_ORDER = [
  'grondwerk', 'bestrating', 'erfafscheiding', 'vlonders',
  'gazon', 'beplanting', 'overkappingen', 'waterwerken', 'verlichting', 'overig'
] as const;

interface PricingItem {
  id: string;
  category: string;
  item_name: string;
  unit: string;
  selling_price_default: number;
  item_type: 'materiaal' | 'arbeid';
}

interface Element {
  name: string;
  category: string;
  source_text: string;
}

interface QuoteItem {
  id: string;
  description: string;
  category: string;
  line_type: 'arbeid' | 'materiaal';
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  pricing_id: string | null;
  is_ai_calculated: boolean;
  calculation_breakdown: {
    formula: string;
    explanation: string;
    source: string;
  } | null;
}

function getCategoryTitle(cat: string): string {
  const titles: Record<string, string> = {
    grondwerk: 'Grondwerk', bestrating: 'Bestrating', erfafscheiding: 'Erfafscheiding',
    vlonders: 'Vlonders', gazon: 'Gazon', beplanting: 'Beplanting',
    overkappingen: 'Overkappingen', waterwerken: 'Waterwerken',
    verlichting: 'Verlichting', overig: 'Overig'
  };
  return titles[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
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

function matchPricing(description: string, lineType: string, pricingItems: PricingItem[]): PricingItem | null {
  const relevant = pricingItems.filter(p => p.item_type === lineType);
  const desc = description.toLowerCase();

  // Exact name match
  const exact = relevant.find(p => p.item_name.toLowerCase() === desc);
  if (exact) return exact;

  // Contains match
  const contains = relevant.find(p =>
    p.item_name.toLowerCase().includes(desc) || desc.includes(p.item_name.toLowerCase())
  );
  if (contains) return contains;

  // Word overlap
  const descWords = desc.split(/\s+/).filter(w => w.length > 3);
  let bestMatch: PricingItem | null = null;
  let bestScore = 0;
  for (const p of relevant) {
    const nameWords = p.item_name.toLowerCase().split(/\s+/);
    const score = descWords.filter(w => nameWords.some(nw => nw.includes(w) || w.includes(nw))).length;
    if (score > bestScore) { bestScore = score; bestMatch = p; }
  }
  return bestScore >= 1 ? bestMatch : null;
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const {
          notes,
          patroon = 'recht',
          grondtype = 'zand',
          bereikbaarheid = 'goed',
        } = await request.json() as {
          notes: string;
          patroon?: PatroonType;
          grondtype?: GrondtypeType;
          bereikbaarheid?: BereikbaarheidType;
        };
        const normenTekst = genereerNormenTekst(patroon, grondtype, bereikbaarheid);

        if (!notes?.trim()) {
          send({ error: 'Geen notities ontvangen', step: 0, status: 'error' });
          controller.close();
          return;
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

          // Bouw work rules context op voor de element prompts
          const rules = rulesRes.data || [];
          if (rules.length > 0) {
            workRulesContext = '\n\nGELEERDE REGELS (voeg deze altijd toe als het element hierop van toepassing is):\n' +
              rules.map(r => {
                const tasks = (r.linked_tasks as Array<{name: string; enabled: boolean}> || [])
                  .filter(t => t.enabled)
                  .map(t => t.name)
                  .join(', ');
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

        // ═══════════════════════════════════════════════════
        // STAP 1: Splits kladnotities in losse onderdelen
        // ═══════════════════════════════════════════════════
        send({ step: 1, status: 'in_progress', message: 'Notities opdelen in onderdelen...' });

        const splitPrompt = `Je bent een expert in het lezen van schouwnotities van hoveniers.

Identificeer elk AFZONDERLIJK tuinelement of locatie in deze notities.
Elk uniek onderdeel wordt straks een eigen sectie in de offerte.

REGELS:
- Elke aparte locatie of apart werk = eigen element
- Splits ook combinaties (bijv. "schuur links" en "schuur rechts" zijn apart)
- Geef elk element een duidelijke naam met afmetingen
- Kopieer de EXACTE relevante tekst uit de notities als source_text

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
  "project_summary": "Verhalende samenvatting van het hele project in 2-3 zinnen."
}`;

        const splitResponse = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 2000,
          messages: [{ role: 'user', content: splitPrompt }]
        });

        const splitText = splitResponse.content.find(b => b.type === 'text');
        if (!splitText || splitText.type !== 'text') {
          send({ step: 1, status: 'error', error: 'Kon notities niet opdelen' });
          controller.close();
          return;
        }

        const splitResult = parseJson<{ elements: Element[]; project_summary: string }>(splitText.text);
        if (!splitResult?.elements?.length) {
          console.error('[analyze-steps] Split parse error. Raw:', splitText.text.substring(0, 500));
          send({ step: 1, status: 'error', error: 'Kon onderdelen niet herkennen' });
          controller.close();
          return;
        }

        const elements = splitResult.elements;

        send({
          step: 1,
          status: 'complete',
          message: `${elements.length} onderdelen gevonden`,
          elements: elements.map(e => e.name)
        });

        // ═══════════════════════════════════════════════════
        // STAP 2: Verwerk elk element apart
        // ═══════════════════════════════════════════════════
        send({
          step: 2,
          status: 'in_progress',
          current: 0,
          total: elements.length,
          message: `Onderdelen verwerken (0/${elements.length})...`
        });

        const allSections: Array<{
          element_title: string;
          category: string;
          items: QuoteItem[];
          subtotal: number;
        }> = [];

        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];

          send({
            step: 2,
            status: 'in_progress',
            current: i + 1,
            total: elements.length,
            message: `Verwerken: ${element.name} (${i + 1}/${elements.length})`
          });

          const elementPrompt = `Je bent een ervaren stratenmaker en hovenier die een offerte opstelt. Denk als een vakman.

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
  7. Bestrating herleggen / herstraten (arbeid) ← GEEN nieuw materiaal, bestaande stenen worden hergebruikt
  8. Voegen (arbeid)

HERSTRATEN ZONDER OPHOGEN (bijv. "verzakt", "herstraten", "opnieuw leggen"):
  1. Bestaande bestrating opbreken (arbeid)
  2. Straatzand bijvullen (materiaal) → m² × 0.05m = m³
  3. Zandbed aanbrengen (arbeid)
  4. Zandbed verdichten en egaliseren (arbeid)
  5. Bestrating herleggen (arbeid) ← GEEN nieuw materiaal
  6. Voegen (arbeid)

NIEUW TERRAS / NIEUWE BESTRATING:
  1. Grond afgraven (arbeid) → m² × 0.25m diepte = m³
  2. Grondafvoer (arbeid) → m³ × 1.3 uitzetting
  3. Straatzand fundering aanvoeren (materiaal) → m² × hoogte_in_m = m³
  4. Zandbed aanbrengen (arbeid)
  5. Zandbed verdichten en egaliseren (arbeid)
  6. Straatzand zandbed (materiaal) → m² × 0.05m = m³
  7. Zandbed aanbrengen (arbeid)
  8. Opsluitbanden (materiaal) → omtrek in meters
  9. Opsluitbanden plaatsen (arbeid)
  10. Bestrating / tegels (materiaal) → m²
  11. Bestrating leggen (arbeid)
  12. Voegen (arbeid)

OPHOGEN GROND / GRINDVLAK / PLANTVAK:
  1. Straatzand / ophoogmateriaal aanvoeren (materiaal) → m² × hoogte = m³
  2. Zandbed aanbrengen (arbeid)
  3. Zandbed verdichten en egaliseren (arbeid)

TRAPTREDEN / BANDEN HERSTELLEN:
  1. Bestaande elementen opbreken (arbeid)
  2. Fundering herstellen (materiaal + arbeid)
  3. Traptreden / banden herplaatsen (arbeid) ← bij "herstellen": GEEN nieuw materiaal
  4. Bij "vervangen" of "nieuw": wél nieuw materiaal (traptreden/banden)

VERWIJDEREN:
  1. Opbreken en afvoeren (arbeid)
  2. Grondafvoer indien van toepassing (arbeid)

═══════════════════════════════════════════════════
STAP 2 — BEREKEN DE HOEVEELHEDEN
═══════════════════════════════════════════════════
${normenTekst}
- Haal afmetingen uit de notitie
- Reken altijd uit en toon de rekensom: "14m × 3.5m = 49m²"
- Straatzand (zandbed): m² × 0.05 = m³
- Toon rekensom in "calculation" veld: bijv. "25m² × 1.12 (visgraat) = 28m²"

═══════════════════════════════════════════════════
STAP 3 — VOLGORDE IN DE OFFERTE
═══════════════════════════════════════════════════
Zet de items in UITVOERINGSVOLGORDE (sloopwerk → grondwerk → materiaal → afwerking).
Zo kan de klant de offerte van boven naar beneden lezen en controleren.

KRITIEKE REGELS:
- Elke regel is óf "materiaal" óf "arbeid" — NOOIT beide in één regel
- HERSTRATEN / HERSTELLEN = altijd arbeid, GEEN nieuw straatmateriaal (stenen worden hergebruikt)
- Bij OPHOGEN: altijd "Trillen/verdichten" toevoegen
- Gebruik pricing_id als er een match is in de database

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
}`;

          const elementResponse = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 2000,
            messages: [{ role: 'user', content: elementPrompt }]
          });

          const elementText = elementResponse.content.find(b => b.type === 'text');
          if (!elementText || elementText.type !== 'text') {
            console.error(`[analyze-steps] No response for element: ${element.name}`);
            continue;
          }

          const elementResult = parseJson<{ items: Array<{
            description: string;
            line_type: string;
            quantity: number;
            unit: string;
            unit_price: number;
            pricing_id?: string | null;
            calculation?: string;
          }> }>(elementText.text);

          if (!elementResult?.items?.length) {
            console.error(`[analyze-steps] Parse error for element "${element.name}". Raw:`, elementText.text.substring(0, 300));
            continue;
          }

          const sectionItems: QuoteItem[] = elementResult.items.map(item => {
            const lineType = (item.line_type === 'arbeid' || item.line_type === 'materiaal')
              ? item.line_type
              : 'materiaal';

            // Try to match pricing from DB
            let pricingId = item.pricing_id || null;
            let unitPrice = item.unit_price || 0;

            if (pricingId && pricingId !== 'null') {
              const dbItem = pricingItems.find(p => p.id === pricingId);
              if (dbItem) {
                unitPrice = dbItem.selling_price_default;
              } else {
                pricingId = null; // Invalid ID from AI
              }
            }

            if (!pricingId) {
              const matched = matchPricing(item.description, lineType, pricingItems);
              if (matched) {
                pricingId = matched.id;
                unitPrice = matched.selling_price_default;
              }
            }

            const quantity = item.quantity || 0;
            const total = quantity * unitPrice;

            return {
              id: crypto.randomUUID(),
              description: item.description,
              category: element.category,
              line_type: lineType,
              quantity,
              unit: item.unit || 'stuk',
              unit_price: unitPrice,
              total_price: total,
              pricing_id: pricingId,
              is_ai_calculated: true,
              calculation_breakdown: item.calculation ? {
                formula: item.calculation,
                explanation: item.calculation,
                source: 'AI berekening'
              } : null
            };
          });

          const subtotal = sectionItems.reduce((sum, it) => sum + it.total_price, 0);

          allSections.push({
            element_title: element.name,
            category: element.category,
            items: sectionItems,
            subtotal
          });
        }

        send({
          step: 2,
          status: 'complete',
          message: `${allSections.length} onderdelen verwerkt`
        });

        // ═══════════════════════════════════════════════════
        // STAP 3: Samenvoegen en structureren
        // ═══════════════════════════════════════════════════
        send({ step: 3, status: 'in_progress', message: 'Offerte samenstellen...' });

        // Sort sections by category order, preserve element grouping within category
        const sortedSections = [...allSections].sort((a, b) => {
          const orderA = CATEGORY_ORDER.indexOf(a.category as typeof CATEGORY_ORDER[number]);
          const orderB = CATEGORY_ORDER.indexOf(b.category as typeof CATEGORY_ORDER[number]);
          return (orderA === -1 ? 99 : orderA) - (orderB === -1 ? 99 : orderB);
        });

        const finalSections = sortedSections.map(s => ({
          category: s.category,
          title: s.element_title,
          items: s.items,
          subtotal: s.subtotal
        }));

        const subtotalAll = finalSections.reduce((sum, s) => sum + s.subtotal, 0);
        const totals = {
          subtotal: subtotalAll,
          btw: subtotalAll * 0.21,
          total: subtotalAll * 1.21
        };

        send({ step: 3, status: 'complete', message: 'Offerte gereed' });

        send({
          complete: true,
          analysis: splitResult.project_summary,
          sections: finalSections,
          totals,
          activities: elements.map(e => ({
            name: e.name,
            category: e.category,
            quantity: 1,
            unit: 'onderdeel',
            notes: e.source_text
          })),
          linked_tasks: []
        });

        controller.close();

      } catch (error) {
        console.error('[analyze-steps] FATAL error:', error);
        if (error instanceof Error) {
          console.error('[analyze-steps]', error.name, error.message);
        }
        send({
          error: error instanceof Error ? error.message : 'Analyse mislukt',
          step: 0,
          status: 'error'
        });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
