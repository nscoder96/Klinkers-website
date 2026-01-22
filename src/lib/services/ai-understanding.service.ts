/**
 * AI Understanding Service (Layer 1)
 *
 * Analyzes Dutch schouwnotities (inspection notes) from hoveniers (landscapers)
 * to detect and categorize work that needs to be done.
 *
 * CRITICAL: This service NEVER generates prices.
 * It only identifies WHAT work needs to be done, not what it costs.
 * Prices are added later in Layer 3 via database lookup.
 *
 * Uses Claude Structured Outputs (beta) for guaranteed valid responses.
 */

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import {
  AIUnderstandingResultSchema,
  AIUnderstandingResult,
} from "../schemas/ai-understanding.schema";

/**
 * System prompt for the AI Understanding service.
 *
 * Key characteristics:
 * - Written in Dutch for better understanding of domain terminology
 * - Explicitly states NO prices should be generated
 * - Explains the 10 work categories
 * - Explains the 5 action types
 * - Focuses on extracting dimensions and materials
 */
const UNDERSTANDING_PROMPT = `Je bent een AI-assistent die schouwnotities van hoveniers analyseert.

## Jouw Taak
Analyseer de schouwnotities en identificeer alle werkzaamheden die uitgevoerd moeten worden.
Extraheer voor elke werkzaamheid:
- Het type werk (categorie)
- De actie (nieuw, herstraten, verwijderen, repareren, vervangen)
- Afmetingen waar mogelijk (lengte, breedte, hoogte, oppervlakte, aantal)
- Materialen die genoemd worden

## BELANGRIJK
- GEEN prijzen berekenen of noemen
- GEEN kostenramingen maken
- GEEN tarieven of eenheidsprijzen vermelden
- Focus ALLEEN op wat er moet gebeuren, niet wat het kost

## Categorieën
1. **grondwerk** - Graafwerk, grond verplaatsen, egaliseren, afgraven
2. **bestrating** - Klinkers, tegels, sierbestrating, opritten
3. **erfafscheiding** - Schuttingen, hekken, heggen, muren
4. **vlonders** - Houten vlonders, terrassen, steigerhout
5. **gazon** - Gras aanleggen, graszoden, gazononderhoud
6. **beplanting** - Planten, struiken, bomen, borders
7. **overkappingen** - Pergola's, veranda's, carports
8. **waterwerken** - Vijvers, drainage, bewatering
9. **verlichting** - Tuinverlichting, elektrische aansluitingen
10. **overig** - Alles wat niet in bovenstaande past

## Acties
- **nieuw** - Nieuwe aanleg, er is nog niets
- **herstraten** - Bestaande materialen hergebruiken
- **verwijderen** - Weghalen zonder vervanging
- **repareren** - Bestaand herstellen
- **vervangen** - Oud weg, nieuw terug

## Herstraten vs Nieuw
Let goed op het verschil:
- "bestaande klinkers opnieuw leggen" → herstraten
- "nieuwe klinkers" → nieuw
- "tegels eruit en nieuwe klinkers" → vervangen (of nieuw als volledig andere materialen)

## Afmetingen
Extraheer alle genoemde afmetingen:
- "5 bij 3 meter" → length: 5, width: 3
- "15m2" → area: 15
- "20 meter schutting" → length: 20
- "3 bomen" → count: 3

Als je afmetingen kunt afleiden (bijv. 5x3m = 15m2), geef dan beide.`;

/**
 * Analyzes schouwnotities (inspection notes) to detect work activities.
 *
 * Uses Claude Structured Outputs with the beta API for guaranteed
 * schema-valid responses.
 *
 * @param notes - The raw schouwnotities text in Dutch
 * @returns Structured understanding result with detected activities
 *
 * @example
 * ```typescript
 * const result = await analyzeNotes(`
 *   Voortuin 6x4m bestaande tegels eruit, nieuwe klinkers
 *   Schutting 12 meter plaatsen, beton palen
 * `);
 * // result.activities contains detected work
 * // result.summary contains narrative description
 * ```
 */
export async function analyzeNotes(
  notes: string
): Promise<AIUnderstandingResult> {
  const client = new Anthropic();

  const response = await client.beta.messages.parse({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 2000,
    betas: ["structured-outputs-2025-11-13"],
    system: UNDERSTANDING_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyseer deze schouwnotities:\n\n${notes}`,
      },
    ],
    output_format: betaZodOutputFormat(AIUnderstandingResultSchema),
  });

  // With Structured Outputs, parsed_output is guaranteed to match the schema
  // when the response completes successfully. A null value indicates the
  // response was interrupted (max_tokens reached or stop sequence).
  if (!response.parsed_output) {
    throw new Error(
      "AI response was incomplete. The schouwnotities may be too complex to analyze in a single request."
    );
  }

  return response.parsed_output;
}
