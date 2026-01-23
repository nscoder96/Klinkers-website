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
  item_type?: 'materiaal' | 'arbeid';
}

// Vaste categorieën in de juiste volgorde
const CATEGORIES = [
  'grondwerk',
  'bestrating',
  'erfafscheiding',
  'vlonders',
  'gazon',
  'beplanting',
  'overkappingen',
  'waterwerken',
  'verlichting',
  'overig'
] as const;

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
        .select('id, category, item_name, unit, selling_price_default, item_type')
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

    // Create lists of available items for the AI, split by type
    const materiaalItems = pricingItems.filter(p => p.item_type === 'materiaal');
    const arbeidItems = pricingItems.filter(p => p.item_type === 'arbeid');

    const materiaalList = materiaalItems.map(p =>
      `- ID: ${p.id} | ${p.item_name} | ${p.unit} | €${p.selling_price_default}`
    ).join('\n');

    const arbeidList = arbeidItems.map(p =>
      `- ID: ${p.id} | ${p.item_name} | ${p.unit} | €${p.selling_price_default}`
    ).join('\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: `Je bent een AI-assistent voor hoveniers. Je analyseert schouwnotities en genereert professionele offertes.

═══════════════════════════════════════════════════════════════════════════════
KERNPRINCIPES
═══════════════════════════════════════════════════════════════════════════════

1. VERHALENDE PROJECTOMSCHRIJVING
   Schrijf een samenhangende beschrijving van het project, niet een opsomming.
   Beschrijf de logische volgorde van uitvoering.

2. MATERIAAL EN ARBEID GESCHEIDEN - ZEER BELANGRIJK!
   Elke offerteregel is óf MATERIAAL óf ARBEID, nooit beide.

   MATERIAAL (line_type: "materiaal") = fysieke producten die je KOOPT:
   - Straatzand, tuinaarde, grond
   - Tegels, klinkers, natuursteen
   - Opsluitbanden (het product zelf)
   - Schuttingpanelen, palen
   - Planten, bomen, graszoden

   ARBEID (line_type: "arbeid") = werkzaamheden die je DOET:
   - Zandbed aanbrengen, grond afvoeren, egaliseren
   - Bestrating leggen, tegels leggen
   - Opsluitbanden PLAATSEN (het werk, niet het product!)
   - Schutting plaatsen
   - Beplanting planten, gazon aanleggen

   VOORBEELD: Voor opsluitbanden heb je 2 regels:
   1. "Opsluitbanden" (materiaal) - het product
   2. "Opsluitbanden plaatsen" (arbeid) - het werk

3. GEEN OPTIONELE VRAGEN
   Genereer GEEN optional_questions. De hovenier is de specialist.

4. GEEN SUGGESTIES
   Genereer GEEN suggestions. De hovenier weet wat hij doet.

═══════════════════════════════════════════════════════════════════════════════
VASTE CATEGORIEËN (in uitvoeringsvolgorde!)
═══════════════════════════════════════════════════════════════════════════════
1. grondwerk      - Afgraven, ophogen, egaliseren, grondafvoer
2. bestrating     - Tegels, klinkers, opsluitbanden, zandbed
3. erfafscheiding - Schuttingen, hekwerk, poorten
4. vlonders       - Houten terrassen, composiet vlonders
5. gazon          - Graszoden, kunstgras, doorzaaien
6. beplanting     - Haag, borders, bomen, struiken
7. overkappingen  - Veranda, pergola, carport
8. waterwerken    - Vijvers, fonteinen, waterloop
9. verlichting    - Tuinverlichting, irrigatie
10. overig        - Alles wat niet past

═══════════════════════════════════════════════════════════════════════════════
KLANTTAAL → VAKTAAL
═══════════════════════════════════════════════════════════════════════════════
"terras" → bestrating | "stenen" → tegels/klinkers | "gras" → gazon
"schutting" → erfafscheiding | "boompje" → sierboom | "plantjes" → vaste planten

═══════════════════════════════════════════════════════════════════════════════
AUTOMATISCHE BEREKENINGEN
═══════════════════════════════════════════════════════════════════════════════
- Straatzand: m² × 0.05m = m³ (voor 5cm zandbed)
- Ophogen: m² × dikte in meters = m³
- Opsluitbanden: omtrek = 2×(lengte + breedte) strekkende meter
  TOON ALTIJD DE REKENSOM: bijv. "2×(5+7) = 24 meter"
- Grondafvoer: m³ × 1.3 (uitzetting)
- Schutting palen: CEILING(lengte / 1.80) + 1

VERPLICHTE EXTRA ARBEIDSREGELS:
- Bij ophogen: ALTIJD "Trillen/verdichten" arbeid toevoegen
  Reken: €50/uur, ca. 30m² per uur → €1,67/m²
- Bij zand aanbrengen: reken €50/uur, 1 m³ per 30 min → ca. €25/m³

EENHEDEN:
- Zand, grond, aarde = m³ (kubieke meter, NIET ton!)
- Bestrating, gazon = m²
- Opsluitbanden, schutting = meter

═══════════════════════════════════════════════════════════════════════════════
STANDAARD MATERIALEN
═══════════════════════════════════════════════════════════════════════════════
SCHUTTINGEN:
- Palen: standaard HARDHOUTEN palen 3m, 68×68mm (NIET betonpalen!)
- Alleen betonpalen als klant dit expliciet noemt
- Schermhoogte standaard 180cm tenzij anders aangegeven

REASONING:
- Toon ALTIJD de volledige rekensom, niet alleen het resultaat
  GOED: "Omtrek: 2×(4+3) = 14 meter"
  FOUT: "Geschatte omtrek bestrating: 14 meter"
  GOED: "Zandbed: 20m² × 0.05m = 1.0 m³"
  FOUT: "1 m³ straatzand nodig"

═══════════════════════════════════════════════════════════════════════════════
BESCHIKBARE MATERIALEN
═══════════════════════════════════════════════════════════════════════════════
${materiaalList || 'Geen materialen beschikbaar'}

═══════════════════════════════════════════════════════════════════════════════
BESCHIKBARE ARBEID
═══════════════════════════════════════════════════════════════════════════════
${arbeidList || 'Geen arbeid items beschikbaar'}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT STRUCTUUR (STRIKT JSON)
═══════════════════════════════════════════════════════════════════════════════

BELANGRIJK: Groepeer per TUINELEMENT, niet per werkcategorie!
Elk element uit de notities wordt een sectie met eigen materialen + arbeid.

{
  "analysis": "Verhalende projectomschrijving in logische uitvoeringsvolgorde.",
  "sections": [
    {
      "element_title": "Terras 40m² tegels 60x60",
      "category": "bestrating",
      "items": [
        {
          "pricing_id": "uuid",
          "description": "Straatzand",
          "line_type": "materiaal",
          "quantity": 2,
          "unit": "m³",
          "unit_price": 35,
          "reasoning": "Zandbed: 40m² × 0.05m = 2.0 m³"
        },
        {
          "pricing_id": "uuid",
          "description": "Zandbed aanbrengen en verdichten",
          "line_type": "arbeid",
          "quantity": 2,
          "unit": "m³",
          "unit_price": 25,
          "reasoning": "€50/uur, 1m³ per 30min → €25/m³ × 2m³"
        },
        {
          "pricing_id": "uuid",
          "description": "Tegels 60x60",
          "line_type": "materiaal",
          "quantity": 40,
          "unit": "m²",
          "unit_price": 45,
          "reasoning": "40m² terras"
        },
        {
          "pricing_id": "uuid",
          "description": "Tegels leggen",
          "line_type": "arbeid",
          "quantity": 40,
          "unit": "m²",
          "unit_price": 25,
          "reasoning": "Legwerk 40m²"
        },
        {
          "pricing_id": "uuid",
          "description": "Opsluitbanden",
          "line_type": "materiaal",
          "quantity": 25,
          "unit": "meter",
          "unit_price": 8,
          "reasoning": "Omtrek: 2×(6.3+6.3) = 25.2 ≈ 25 meter"
        },
        {
          "pricing_id": "uuid",
          "description": "Opsluitbanden plaatsen",
          "line_type": "arbeid",
          "quantity": 25,
          "unit": "meter",
          "unit_price": 12,
          "reasoning": "Plaatsen 25 meter opsluitbanden"
        }
      ]
    },
    {
      "element_title": "Schutting 8m hardhout",
      "category": "erfafscheiding",
      "items": [
        {
          "pricing_id": "uuid",
          "description": "Schuttingplanken hardhout 180cm",
          "line_type": "materiaal",
          "quantity": 8,
          "unit": "meter",
          "unit_price": 95,
          "reasoning": "8 meter schutting"
        },
        {
          "pricing_id": "uuid",
          "description": "Hardhouten palen 3m 68×68mm",
          "line_type": "materiaal",
          "quantity": 6,
          "unit": "stuk",
          "unit_price": 28,
          "reasoning": "CEILING(8/1.80)+1 = 6 palen"
        },
        {
          "pricing_id": "uuid",
          "description": "Schutting plaatsen",
          "line_type": "arbeid",
          "quantity": 8,
          "unit": "meter",
          "unit_price": 35,
          "reasoning": "Plaatswerk 8 meter"
        }
      ]
    }
  ],
  "totals": {
    "subtotal": 0,
    "btw": 0,
    "total": 0
  }
}

REGELS VOOR ELEMENT-GROEPERING:
- Elk concreet tuinelement uit de notities = eigen sectie
- element_title = korte beschrijving incl. afmetingen (bijv. "Terras 20m² klinkers")
- category = welke werkcategorie het betreft (voor kleuren/iconen)
- Alle materialen EN arbeid voor dat element staan IN die sectie
- Materialen die voor meerdere elementen nodig zijn: plaats bij het hoofdelement

═══════════════════════════════════════════════════════════════════════════════
KRITIEKE REGELS
═══════════════════════════════════════════════════════════════════════════════
1. line_type is VERPLICHT: "materiaal" of "arbeid"
2. GEEN optional_questions in output
3. GEEN suggestions in output
4. analysis moet VERHALEND zijn, niet een opsomming
5. Gebruik bestaande pricing_id waar mogelijk
6. Bij nieuwe items: pricing_id = "NEW" en new_item = true
7. Toon berekeningen in reasoning

═══════════════════════════════════════════════════════════════════════════════
⚠️ DUPLICATIE VOORKOMEN - ZEER BELANGRIJK
═══════════════════════════════════════════════════════════════════════════════
1. Elk tuinelement is een EIGEN sectie met eigen materialen + arbeid
   - GOED: "Terras 20m²" sectie met zand (1 ton), tegels, legwerk
   - GOED: "Gazon 30m²" sectie met tuinaarde, graszoden, aanlegwerk

2. Materialen die voor MEERDERE elementen nodig zijn:
   - Voeg ze samen bij het hoofdelement dat ze het meest nodig heeft
   - Of splits ze eerlijk op over de elementen met reasoning waarom

3. GEEN dubbele materiaalregels binnen dezelfde sectie
   - Check: komt dit materiaal al voor in deze sectie?
   - Zo ja: tel op bij bestaande regel

4. Arbeid is altijd PER element
   - Elk element heeft zijn eigen arbeidsregels
   - Dit is correct want het zijn werkzaamheden specifiek voor dat element

Geef ALLEEN geldige JSON terug, geen andere tekst.`,
      messages: [
        {
          role: 'user',
          content: `Analyseer deze notities en genereer een complete offerte met alle afhankelijke werkzaamheden:\n\n${notes}`
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

      // Process sections and convert to flat lineItems for backward compatibility
      const lineItems: Array<{
        id: string;
        pricing_id: string;
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
        sub_items?: Array<{
          description: string;
          quantity: number;
          unit: string;
          reasoning?: string;
        }>;
      }> = [];

      const newItemsAdded: string[] = [];

      // Process new structure (sections) or fall back to old structure (lineItems)
      const sections = result.sections || [];

      // Create maps for quick lookup - by ID and by name (fuzzy match)
      const pricingMapById = new Map(pricingItems.map(p => [p.id, p]));
      const pricingMapByName = new Map(pricingItems.map(p => [p.item_name.toLowerCase(), p]));

      // Helper function to find matching pricing item
      const findMatchingPricing = (pricingId: string | undefined, description: string): PricingItem | undefined => {
        // First try by ID
        if (pricingId && pricingId !== 'NEW' && pricingMapById.has(pricingId)) {
          return pricingMapById.get(pricingId);
        }
        // Then try by exact name match
        const exactMatch = pricingMapByName.get(description.toLowerCase());
        if (exactMatch) return exactMatch;
        // Finally try fuzzy match on key words
        const descWords = description.toLowerCase().split(' ');
        for (const [name, pricing] of pricingMapByName) {
          const nameWords = name.split(' ');
          const matchingWords = descWords.filter(w => nameWords.some(nw => nw.includes(w) || w.includes(nw)));
          if (matchingWords.length >= 2 || (matchingWords.length >= 1 && descWords.length <= 2)) {
            return pricing;
          }
        }
        return undefined;
      };

      console.log('=== DEBUG: Processing AI sections ===');
      console.log('Available pricing items:', pricingItems.length);

      for (const section of sections) {
        for (const item of section.items || []) {
          let pricingId = item.pricing_id;

          // Find matching pricing to get correct item_type
          const matchedPricing = findMatchingPricing(item.pricing_id, item.description);
          const itemType: 'materiaal' | 'arbeid' = matchedPricing?.item_type || item.line_type || 'materiaal';

          console.log(`Item: "${item.description}" | AI line_type: ${item.line_type} | Matched: ${matchedPricing?.item_name || 'NONE'} | Final type: ${itemType}`);

          // Update pricingId if we found a match
          if (matchedPricing && (!pricingId || pricingId === 'NEW')) {
            pricingId = matchedPricing.id;
          }

          // If it's a new item, add it to the pricing database
          if (item.new_item && item.pricing_id === 'NEW' && supabase) {
            try {
              const { data: newPricing, error } = await supabase
                .from('pricing')
                .insert({
                  category: section.category || 'overig',
                  item_name: item.description,
                  unit: item.unit,
                  selling_price_default: item.unit_price,
                  item_type: item.line_type || 'materiaal',
                  is_active: true,
                  ai_generated: true,
                  notes: `AI gegenereerd. Berekening: ${item.reasoning || 'Geen'}`
                })
                .select()
                .single();

              if (!error && newPricing) {
                pricingId = newPricing.id;
                newItemsAdded.push(item.description);
              }
            } catch (err) {
              console.error('Error adding new pricing item:', err);
            }
          }

          lineItems.push({
            id: item.id || crypto.randomUUID(),
            pricing_id: pricingId,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            total: item.quantity * item.unit_price,
            reasoning: item.reasoning || '',
            is_new: item.new_item || false,
            category: section.category,
            line_type: itemType, // Use itemType from database lookup or AI
            is_main_item: item.is_main_item || false,
            sub_items: item.sub_items || []
          });
        }
      }

      // Also support old format for backward compatibility
      if (result.lineItems && !result.sections) {
        for (const item of result.lineItems) {
          let pricingId = item.pricing_id;

          // Find matching pricing to get correct item_type
          const matchedPricing = findMatchingPricing(item.pricing_id, item.description);
          const itemType: 'materiaal' | 'arbeid' = matchedPricing?.item_type || item.line_type || 'materiaal';

          // Update pricingId if we found a match
          if (matchedPricing && (!pricingId || pricingId === 'NEW')) {
            pricingId = matchedPricing.id;
          }

          if (item.new_item && item.pricing_id === 'NEW' && supabase) {
            try {
              const { data: newPricing, error } = await supabase
                .from('pricing')
                .insert({
                  category: item.category || 'overig',
                  item_name: item.description,
                  unit: item.unit,
                  selling_price_default: item.unit_price,
                  item_type: itemType,
                  is_active: true,
                  ai_generated: true,
                  notes: `AI gegenereerd. Berekening: ${item.reasoning || 'Geen'}`
                })
                .select()
                .single();

              if (!error && newPricing) {
                pricingId = newPricing.id;
                newItemsAdded.push(item.description);
              }
            } catch (err) {
              console.error('Error adding new pricing item:', err);
            }
          }

          lineItems.push({
            id: crypto.randomUUID(),
            pricing_id: pricingId,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            total: item.quantity * item.unit_price,
            reasoning: item.reasoning || '',
            is_new: item.new_item || false,
            category: item.category || 'overig',
            line_type: itemType,
            is_main_item: true,
            sub_items: []
          });
        }
      }

      // Build sections from AI element grouping (preserve element_title)
      const categoryOrder = ['grondwerk', 'bestrating', 'erfafscheiding', 'vlonders', 'gazon', 'beplanting', 'overkappingen', 'waterwerken', 'verlichting', 'overig'];
      const getCategoryTitle = (cat: string) => {
        const titles: Record<string, string> = {
          grondwerk: 'Grondwerk',
          bestrating: 'Bestrating',
          erfafscheiding: 'Erfafscheiding',
          vlonders: 'Vlonders',
          gazon: 'Gazon',
          beplanting: 'Beplanting',
          overkappingen: 'Overkappingen',
          waterwerken: 'Waterwerken',
          verlichting: 'Verlichting',
          overig: 'Overig'
        };
        return titles[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
      };

      // Group lineItems by their original section index to maintain element grouping
      const lineItemsBySectionIndex = lineItems.reduce((acc, item, idx) => {
        // Find which section this item came from
        let itemIdx = 0;
        let sectionIdx = 0;
        for (const section of sections) {
          const sectionItemCount = (section.items || []).length;
          if (idx < itemIdx + sectionItemCount) {
            sectionIdx = sections.indexOf(section);
            break;
          }
          itemIdx += sectionItemCount;
        }
        if (!acc[sectionIdx]) acc[sectionIdx] = [];
        acc[sectionIdx].push(item);
        return acc;
      }, {} as Record<number, typeof lineItems>);

      interface FinalSection {
        category: string;
        element_title: string;
        title: string;
        items: Array<{ id: string; pricing_id: string; description: string; quantity: number; unit: string; unit_price: number; line_type: string; reasoning: string }>;
      }

      const finalSections: FinalSection[] = [];
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as { element_title?: string; title?: string; category?: string; items?: unknown[] };
        const sectionItems = lineItemsBySectionIndex[i] || [];
        if (sectionItems.length === 0) continue;
        const cat = section.category || 'overig';
        finalSections.push({
          category: cat,
          element_title: section.element_title || section.title || getCategoryTitle(cat),
          title: section.element_title || section.title || getCategoryTitle(cat),
          items: sectionItems.map(item => ({
            id: item.id,
            pricing_id: item.pricing_id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            line_type: item.line_type,
            reasoning: item.reasoning
          }))
        });
      }

      // Sort by category order
      finalSections.sort((a, b) => {
        const orderA = categoryOrder.indexOf(a.category);
        const orderB = categoryOrder.indexOf(b.category);
        return orderA - orderB;
      });

      return NextResponse.json({
        analysis: result.analysis,
        sections: finalSections,
        lineItems: lineItems,
        totals: result.totals || {
          subtotal: lineItems.reduce((sum, item) => sum + item.total, 0),
          btw: lineItems.reduce((sum, item) => sum + item.total, 0) * 0.21,
          total: lineItems.reduce((sum, item) => sum + item.total, 0) * 1.21
        },
        newItemsAdded: newItemsAdded
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
