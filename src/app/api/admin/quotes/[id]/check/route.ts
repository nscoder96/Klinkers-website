import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';

export type CheckType = 'all' | 'eenheden' | 'prijzen' | 'titels' | 'logica';
export type SuggestionType = 'eenheid' | 'prijs' | 'titel' | 'logica';
export type Severity = 'fout' | 'waarschuwing' | 'info';

export interface CheckSuggestion {
  id: string;
  type: SuggestionType;
  severity: Severity;
  section_id: string | null;
  item_id: string | null;
  section_title: string;
  item_description: string;
  field: string;
  current_value: string;
  suggested_value: string;
  reason: string;
}

function parseJson<T>(text: string): T | null {
  try {
    let s = text.trim();
    if (s.startsWith('```json')) s = s.slice(7);
    if (s.startsWith('```')) s = s.slice(3);
    if (s.endsWith('```')) s = s.slice(0, -3);
    s = s.trim();
    // Try direct parse first
    return JSON.parse(s) as T;
  } catch {
    // Try to extract JSON object/array from text
    try {
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) return JSON.parse(objMatch[0]) as T;
    } catch {
      // fall through
    }
    return null;
  }
}

interface FlatItem {
  item_id: string;
  section_id: string;
  section_title: string;
  description: string;
  line_type: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

interface GroupedItem {
  description: string;
  occurrences: Array<{
    item_id: string;
    section_id: string;
    section_title: string;
    unit: string;
    unit_price: number;
    quantity: number;
  }>;
  unique_units: string[];
  unique_prices: number[];
  has_unit_mismatch: boolean;
  has_price_mismatch: boolean;
}

function groupItemsByDescription(sections: Array<{
  id: string;
  title: string;
  items: FlatItem[];
}>): GroupedItem[] {
  const map = new Map<string, GroupedItem>();

  for (const section of sections) {
    for (const item of section.items) {
      const key = item.description.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, {
          description: item.description,
          occurrences: [],
          unique_units: [],
          unique_prices: [],
          has_unit_mismatch: false,
          has_price_mismatch: false
        });
      }
      const group = map.get(key)!;
      group.occurrences.push({
        item_id: item.item_id,
        section_id: item.section_id,
        section_title: item.section_title,
        unit: item.unit,
        unit_price: item.unit_price,
        quantity: item.quantity
      });
      if (!group.unique_units.includes(item.unit)) group.unique_units.push(item.unit);
      if (!group.unique_prices.includes(item.unit_price)) group.unique_prices.push(item.unit_price);
    }
  }

  // Mark mismatches
  for (const group of map.values()) {
    group.has_unit_mismatch = group.unique_units.length > 1;
    // Price mismatch: more than one price AND price difference > 20%
    if (group.unique_prices.length > 1) {
      const min = Math.min(...group.unique_prices);
      const max = Math.max(...group.unique_prices);
      group.has_price_mismatch = min > 0 && (max - min) / min > 0.20;
    }
  }

  return Array.from(map.values());
}

function buildCheckPrompt(checkType: CheckType, sections: Array<{
  id: string;
  title: string;
  items: FlatItem[];
}>, pricingList: string, dismissalRules: Array<{ item_description: string; field: string; reason: string }> = []): string {
  // Build grouped view for cross-section inconsistency detection
  const grouped = groupItemsByDescription(sections);
  const mismatches = grouped.filter(g => g.has_unit_mismatch || g.has_price_mismatch);

  // Build flat list for per-item checks
  const flatItems = sections.flatMap(s => s.items);

  const mismatchBlock = mismatches.length > 0
    ? `\nGEDETECTEERDE INCONSISTENTIES (zelfde item, verschillende prijs of eenheid in verschillende secties):\n${
        mismatches.map(g => {
          const lines = [`Item: "${g.description}"`];
          if (g.has_unit_mismatch) lines.push(`  ⚠ Eenheden: ${g.unique_units.join(', ')}`);
          if (g.has_price_mismatch) lines.push(`  ⚠ Prijzen: ${g.unique_prices.map(p => '€' + p).join(', ')}`);
          g.occurrences.forEach(o => lines.push(`    → sectie "${o.section_title}" | item_id: ${o.item_id} | ${o.unit} @ €${o.unit_price}`));
          return lines.join('\n');
        }).join('\n\n')
      }`
    : '\nGeen automatisch gedetecteerde cross-sectie inconsistenties. Controleer alsnog op subtielere problemen.';

  const eenheidRules = `
CORRECTE EENHEDEN PER ITEMTYPE:
- Straatzand, grond, grindafvoer, ophoogmateriaal → m³ (volume)
- Bestrating, tegels, gazon, terras → m² (oppervlak)
- Opsluitbanden, schutting, drainage, randen → m (lengte)
- Zandbed aanbrengen, verdichten, egaliseren → m² (oppervlak, NIET m³)
- Grondafvoer → m³ (volume)
- Losse items (bomen, palen) → stuk`;

  const checkInstructions: Record<CheckType, string> = {
    eenheden: `
Check de eenheden van ALLE items. Gebruik de correcte eenhedenlijst hieronder.
${eenheidRules}
Rapporteer ALLE eenheidfouten, inclusief de inconsistenties boven.`,

    prijzen: `
Check de prijzen van ALLE items op inconsistenties en marktconformiteit.
Rapporteer ALLE prijsinconsistenties uit het overzicht boven.
Gebruik ook de prijslijst als referentie voor marktconforme prijzen.
Let extra op: nul-prijzen, en prijzen die ver buiten marktrange liggen.`,

    titels: `
Check sectietitels en itemomschrijvingen op duidelijkheid, correctheid en consistentie.
Let op: vage omschrijvingen, taalfouten, inconsistente naamgeving voor hetzelfde item.`,

    logica: `
Check de logische opbouw en volledigheid per sectie.
- Zandpakket (Straatzand + Zandbed aanbrengen + Zandbed verdichten en egaliseren) aanwezig bij bestratingswerk?
- Opsluitbanden aanwezig bij nieuwe bestrating?
- Grondafvoer aanwezig bij sloopwerk/afgraven?
- Verdichten aanwezig bij ophogingswerk?
- Dubbele items of tegenstrijdig werk?`,

    all: `
Doe een VOLLEDIGE check op ALLE van de volgende aspecten. Wees grondig — rapporteer ALLES wat afwijkt.

1. CROSS-SECTIE INCONSISTENTIES — gebruik het overzicht boven, rapporteer ELKE inconsistentie als aparte suggestie per item_id
2. EENHEDEN — check alle items tegen de correcte eenhedenlijst:
${eenheidRules}
3. PRIJZEN — zijn prijzen marktconform en consistent? Gebruik de prijslijst als referentie.
4. TITELS — zijn omschrijvingen duidelijk en correct?
5. LOGICA — is het werk compleet en logisch opgebouwd?`
  };

  const dismissalBlock = dismissalRules.length > 0
    ? `\nVASTE GEBRUIKERSREGELS — deze situaties zijn bewust zo gekozen door de gebruiker. NOOIT rapporteren:\n${
        dismissalRules.map(r => {
          const fieldLabel = r.field === 'unit_price' ? 'prijs' : r.field === 'unit' ? 'eenheid' : r.field;
          return `- "${r.item_description}" → ${fieldLabel}${r.reason ? `: ${r.reason}` : ' (bewuste keuze)'}`;
        }).join('\n')
      }\n`
    : '';

  return `Je bent een expert stratenmaker die een offerte grondig controleert. Wees kritisch — rapporteer de belangrijkste afwijkingen.
${dismissalBlock}${mismatchBlock}

VOLLEDIGE OFFERTE (alle secties en items):
${JSON.stringify(sections, null, 2)}

PRIJSLIJST (referentie):
${pricingList || 'Niet beschikbaar'}

CONTROLEOPDRACHT:
${checkInstructions[checkType]}

REGELS:
- Rapporteer ELKE inconsistentie uit het mismatch-overzicht als aparte suggestie (één per item_id)
- Gebruik de exacte section_id en item_id uit de offerte (de UUID-waarden uit de data, NIET "uuid-van-item")
- Voor prijssuggesties: field = "unit_price", suggested_value = alleen het getal (bv: 45, niet "€45,00/m³")
- Voor eenheidssuggesties: field = "unit", suggested_value = alleen de eenheid (bv: "m²", niet "vierkante meter")
- Voor omschrijvingen: field = "description", suggested_value = de verbeterde omschrijving
- current_value en suggested_value zijn ALTIJD strings, maar prijzen als kaal getal: "28" en "45"
- Severity: "fout" = duidelijk fout of inconsistent, "waarschuwing" = mogelijk fout, "info" = verbetering
- MAXIMAAL 20 suggesties totaal — prioriteer de meest kritieke fouten (fout > waarschuwing > info)
- Houd elke "reason" KORT: maximaal 1 zin van max 15 woorden
- Geen lange uitleg, alleen de kern van het probleem

BELANGRIJK: Geef je antwoord als ALLEEN geldig JSON — geen uitleg, geen inleiding, geen markdown.
Als er niets te melden is, stuur dan: {"suggestions": []}

Formaat (gebruik de echte UUIDs uit de data, niet de placeholder-tekst hieronder):
{
  "suggestions": [
    {
      "id": "placeholder",
      "type": "prijs",
      "severity": "fout",
      "section_id": "werkelijke-uuid-van-sectie-uit-data",
      "item_id": "werkelijke-uuid-van-item-uit-data",
      "section_title": "Trap achterkant huis",
      "item_description": "Straatzand",
      "field": "unit_price",
      "current_value": "28",
      "suggested_value": "45",
      "reason": "Straatzand staat op €28/m³ maar elders in de offerte op €45/m³."
    }
  ]
}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    const { check_type = 'all', dismissal_rules = [] }: {
      check_type: CheckType;
      dismissal_rules: Array<{ item_description: string; field: string; reason: string }>;
    } = await request.json();

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    // Two separate queries — avoids silent join failures
    const [sectionsRes, lineItemsRes, pricingRes] = await Promise.all([
      supabase
        .from('quote_sections')
        .select('id, title, display_order')
        .eq('quote_id', quoteId)
        .order('display_order'),
      supabase
        .from('quote_line_items')
        .select('id, section_id, description, line_type, quantity, unit, unit_price, total_price')
        .in('section_id',
          // Subquery workaround: first get section IDs
          (await supabase
            .from('quote_sections')
            .select('id')
            .eq('quote_id', quoteId)
          ).data?.map((s: { id: string }) => s.id) ?? []
        ),
      supabase
        .from('pricing')
        .select('item_name, unit, selling_price_default, item_type')
        .eq('is_active', true)
        .order('item_name')
    ]);

    if (sectionsRes.error || !sectionsRes.data?.length) {
      console.error('[check-quote] Sections error:', sectionsRes.error);
      return NextResponse.json({ error: 'Kon offerte secties niet ophalen' }, { status: 500 });
    }

    const rawSections = sectionsRes.data;
    const rawLineItems = lineItemsRes.data ?? [];
    const pricingData = pricingRes.data ?? [];

    console.log(`[check-quote] ${rawSections.length} secties, ${rawLineItems.length} items geladen`);

    // Build structured sections
    const structuredSections = rawSections.map(s => ({
      id: s.id,
      title: s.title,
      items: rawLineItems
        .filter(i => i.section_id === s.id)
        .map(i => ({
          item_id: i.id,
          section_id: s.id,
          section_title: s.title,
          description: i.description,
          line_type: i.line_type,
          quantity: i.quantity,
          unit: i.unit,
          unit_price: i.unit_price,
          total_price: i.total_price
        }))
    }));

    const totalItems = structuredSections.reduce((sum, s) => sum + s.items.length, 0);
    console.log(`[check-quote] Totaal items in structuredSections: ${totalItems}`);

    const pricingList = pricingData
      .map(p => `${p.item_name} | ${p.unit} | €${p.selling_price_default} | ${p.item_type}`)
      .join('\n');

    const prompt = buildCheckPrompt(check_type, structuredSections, pricingList, dismissal_rules);

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: 'Je bent een offerte-controleur. Geef ALTIJD je antwoord als geldig JSON. Nooit proza, nooit uitleg buiten de JSON. Begin direct met { en eindig met }.',
      messages: [{ role: 'user', content: prompt }]
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'AI gaf geen antwoord' }, { status: 500 });
    }

    const rawText = textBlock.text;
    const result = parseJson<{ suggestions: CheckSuggestion[] }>(rawText);

    if (!result) {
      console.error('[check-quote] JSON parse failed. Full raw response:', rawText);
      return NextResponse.json({
        error: 'Kon controleresultaat niet verwerken',
        debug_raw: rawText.substring(0, 300)
      }, { status: 500 });
    }

    // Assign real UUIDs
    const suggestions: CheckSuggestion[] = (result.suggestions ?? []).map(s => ({
      ...s,
      id: crypto.randomUUID()
    }));

    return NextResponse.json({ suggestions, check_type });

  } catch (error) {
    console.error('[check-quote] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Controle mislukt'
    }, { status: 500 });
  }
}
