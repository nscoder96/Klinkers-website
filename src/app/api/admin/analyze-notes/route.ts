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
5. Geef bij ELKE regel een duidelijke redenering/berekening

REGELS:
- Gebruik bij voorkeur items uit de bovenstaande lijst
- Als een item NIET in de lijst staat (bijv. specifieke tegels, nieuw type werk), maak dan een NIEUW item aan met:
  * pricing_id: "NEW" (dit geeft aan dat het een nieuw item is)
  * new_item: true
  * category: de categorie (bestrating, beplanting, grondwerk, afscheiding, onderhoud, overig)
  * suggested_price: een geschatte prijs gebaseerd op vergelijkbare items
- Schat hoeveelheden realistisch in (liever iets meer dan te weinig)
- Als er m² wordt genoemd, gebruik dat
- Als er meters worden genoemd voor schuttingen/hagen, gebruik dat
- Voeg grondwerk toe als er bestrating of gazon wordt aangelegd
- Voeg opsluitbanden toe bij bestrating (bereken: omtrek = 2x lengte + 2x breedte, of √m² × 4 voor vierkante vlakken)

ZANDBED BEREKENING (BELANGRIJK):
- Zandbed wordt ALTIJD berekend in m³ (kubieke meters), NIET in m²
- Standaard zandlaag is 5 cm = 0.05 meter
- Formule: oppervlakte (m²) × 0.05 = aantal m³ zand
- Voorbeeld: 50 m² bestrating → 50 × 0.05 = 2.5 m³ zand
- Toon altijd deze berekening in de reasoning

BELANGRIJKE AANNAMES:
- Bij tuinaanleg: reken ~10% extra voor onvoorzien
- Bij bestrating: voeg altijd zandbed (in m³!) en opsluitbanden toe
- Bij gazon: voeg egaliseren toe

VAKKENNIS - GEBRUIK DIT VOOR CORRECTE SUGGESTIES:
- OPRITTEN: De DIKTE van tegels/klinkers bepaalt de geschiktheid, NIET de afmeting. Minimaal 6cm dik voor opritten (auto's), 8cm voor zware belasting.
- TERRASSEN: 4-5cm dikte is voldoende voor loopverkeer
- KERAMISCHE TEGELS: Altijd op een stabiele drager leggen (beton of verstevigd zandbed)
- DRAINAGE: Nodig bij klei/veengrond, laaggelegen tuinen, of bij wateroverlast
- FUNDERING OPRIT: Altijd puinfundering (15-20cm) onder zandbed voor opritten
- WORTELDOEK: Onder grind/split om onkruid tegen te gaan
- AFSCHOT: Minimaal 1-2% afschot van huis af voor waterafvoer

SUGGESTIES REGELS:
- Geef ALLEEN suggesties die technisch correct en relevant zijn
- Geen suggesties over tegelformaat voor belasting - alleen dikte is relevant
- Focus op: drainage, fundering, afvoer grond, afschot, onderhoud

OUTPUT FORMAT (JSON):
{
  "analysis": "Korte samenvatting van wat je hebt geanalyseerd",
  "lineItems": [
    {
      "pricing_id": "uuid van het prijsitem OF 'NEW' voor nieuwe items",
      "description": "aangepaste beschrijving",
      "quantity": number,
      "unit": "eenheid",
      "unit_price": number,
      "reasoning": "Duidelijke uitleg van de berekening",
      "new_item": false,
      "category": "alleen bij new_item=true: bestrating/beplanting/grondwerk/afscheiding/onderhoud/overig"
    }
  ],
  "suggestions": [
    "Technisch correcte suggestie relevant voor dit project"
  ]
}

VOORBEELD NIEUW ITEM:
{
  "pricing_id": "NEW",
  "description": "Marlux Infinito tegels 60x60 antraciet",
  "quantity": 25,
  "unit": "m²",
  "unit_price": 85,
  "reasoning": "Klant wil specifiek Marlux Infinito tegels. Prijs geschat op basis van premium keramische tegels.",
  "new_item": true,
  "category": "bestrating"
}

BELANGRIJK VOOR REASONING:
- Toon altijd de wiskundige berekening
- Bij opsluitbanden: toon omtrek berekening (√m² of lengte×2 + breedte×2)
- Bij zandbed: toon m³ berekening (m² × 0.05)
- Bij materialen: toon hoeveelheid × prijs

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

      // Process line items and add new items to database
      const newItemsAdded: string[] = [];
      const lineItemsWithTotals = await Promise.all(result.lineItems.map(async (item: {
        pricing_id: string;
        description: string;
        quantity: number;
        unit: string;
        unit_price: number;
        reasoning?: string;
        new_item?: boolean;
        category?: string;
      }) => {
        let pricingId = item.pricing_id;

        // If it's a new item, add it to the pricing database
        if (item.new_item && item.pricing_id === 'NEW' && supabase) {
          try {
            const { data: newPricing, error } = await supabase
              .from('pricing')
              .insert({
                category: item.category || 'overig',
                item_name: item.description,
                unit: item.unit,
                selling_price_default: item.unit_price,
                is_active: true,
                ai_generated: true, // Mark as AI-generated for review
                notes: `Automatisch toegevoegd door AI op basis van offerte. Originele redenering: ${item.reasoning || 'Geen'}`
              })
              .select()
              .single();

            if (!error && newPricing) {
              pricingId = newPricing.id;
              newItemsAdded.push(item.description);
              console.log(`Nieuw prijsitem toegevoegd: ${item.description} (${newPricing.id})`);
            }
          } catch (err) {
            console.error('Error adding new pricing item:', err);
          }
        }

        return {
          id: crypto.randomUUID(),
          pricing_id: pricingId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price,
          reasoning: item.reasoning || '',
          is_new: item.new_item || false
        };
      }));

      return NextResponse.json({
        analysis: result.analysis,
        lineItems: lineItemsWithTotals,
        suggestions: result.suggestions || [],
        newItemsAdded: newItemsAdded // Return list of new items that were added
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
