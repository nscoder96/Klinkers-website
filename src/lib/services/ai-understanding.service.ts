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
import { TOP_20_RULES_FOR_PROMPT } from "../rules/garden-element-rules";

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
- "tegels rechtzetten" → repareren (niet herstraten - alleen aanpassen, niet opnieuw leggen)
- "opnieuw voegen" → repareren (alleen voegen herstellen, niet opnieuw leggen)
- "verzakte bestrating ophogen" → herstraten (opnieuw leggen na nivelleren)
- "bestaande klinkers in ander patroon" → herstraten (zelfde materialen, nieuwe lay-out)
- "bestaande tegels eruit, nieuwe klinkers erin" → vervangen (ander materiaal terug)
- "terras opbreken en opnieuw leggen" → herstraten (zelfde materialen opnieuw gelegd)
- "oude tegels eruit, zelfde soort terug" → vervangen (zelfs als zelfde type, volledig vervangen)

## Gemengde Werkzaamheden
Als één schouwnotitie zowel herstraten ALS nieuw werk bevat, maak dan APARTE activiteiten voor elk:
- Voorbeeld: "herstraten pad 15m2, nieuw terras 20m2" wordt TWEE activiteiten: één herstraten, één nieuw
- Elke activiteit krijgt zijn eigen afmetingen geëxtraheerd uit het relevante deel van de tekst
- Behandel ook combinaties van verwijderen + nieuw, repareren + nieuw, etc. als aparte activiteiten

## Verwijderen
Classificeer alleen als verwijderen wanneer er GEEN vervangingswerk wordt genoemd:
- "schutting afbreken en afvoeren" → verwijderen (alleen verwijdering, geen vervanging)
- "bomen rooien" → verwijderen
- "bestrating opbreken en afvoeren" → verwijderen (als geen nieuw werk genoemd)
- Als er wel vervangingswerk wordt genoemd voor hetzelfde item, gebruik dan "vervangen" in plaats van "verwijderen"

## Afmetingen
Extraheer alle genoemde afmetingen:
- "5 bij 3 meter" → length: 5, width: 3
- "15m2" → area: 15
- "20 meter schutting" → length: 20
- "3 bomen" → count: 3

Als je afmetingen kunt afleiden (bijv. 5x3m = 15m2), geef dan beide.

## Opsluitbanden — zijdeberekening (KRITIEK)
Als de notitie aangeeft welke zijdes opsluitbanden krijgen, bereken dan opsluiting_lengte_m:
- "links en rechts" → 2 × (langste zijde) + 1 × (kortste zijde)
  Voorbeeld: oprit 6×12 m, "links en rechts" → 2×12 + 6 = 30 m
- "rondom" of geen vermelding → laat opsluiting_lengte_m WEG (systeem gebruikt omtrek als standaard)
- "links, rechts en voorkant" → 2 × (langste zijde) + 2 × (kortste zijde) = volledige omtrek
- Gebruik altijd de LANGSTE zijde voor de twee parallelle kanten en de KORTSTE voor de kopse kant(en).
- Sla opsluiting_lengte_m op bij de bijbehorende bestratingsactiviteit.

## VERPLICHTE AFMETINGEN (KRITIEK)
Voor elk bestratings-, pad-, terras-, oprit- of grondwerkonderdeel zijn afmetingen VERPLICHT.
- Afmetingen WEL aanwezig in de notitie → extraheer ze EN zet missing_dimensions: false
- Afmetingen NIET aanwezig voor dit onderdeel → zet missing_dimensions: true
GOK of VERZIN NOOIT afmetingen. Als ze er niet staan, is missing_dimensions: true.
Dit geldt voor alle activiteiten — ook erfafscheidingen, vlonders en gazon.

## Stratenmaker-terminologie (KEN deze termen)
Dit is een stratenmakersbedrijf. Herken en gebruik deze vaktermen:
- **Constructie/grondwerk:** cunet, afgraven, menggranulaat, straatzand, zandbed, zandpakket, afreien, verdichten, aantrillen, afschot
- **Bestratingmateriaal:** waalformaat, dikformaat, waaltjes, koppelstones, betonklinkers, gebakken klinkers, betonstraatstenen, sierbestrating, natuursteen, flagstones, graniet, basalt
- **Randwerk:** opsluitband, trottoirband, opsluiten
- **Legpatronen:** visgraat, wildverband, elleboogverband, halfsteens
- **Afwerking:** invegen, voegen, voegzand, voegmortel
- **Water:** kolk, kolkaansluiting, drainagegoot
- **Materieel:** trilplaat, minigraver, steenknipper, container

## KRITIEK — Onderdelen vs losse activiteiten (stratenmaker)
Een bestratingsklus bestaat uit veel handelingen die SAMEN één activiteit vormen.
Maak NOOIT losse activiteiten van deze onderdelen — ze horen bij het bestratingswerk
en worden automatisch toegevoegd door het systeem:
- afgraven / cunet / grondwerk vooraf
- zandbed / straatzand aanbrengen
- opsluitbanden / trottoirbanden stellen, herstellen of repareren
- aantrillen, invegen, voegen, afreien, afschot

## KRITIEK — Context koppelen (wat hoort bij wat)
Als een notitie meerdere werkzaamheden beschrijft, koppel elk onderdeel aan het
juiste tuinelement. Gebruik de context om te bepalen wat bij wat hoort:
- "Terras achtertuin 5×4m herstraten. Opsluitbanden rondom herstellen."
  → dit zijn TWEE regels over HETZELFDE terras achtertuin.
  → maak ÉÉN activiteit: type=bestrating, action=herstraten, area=20m², beschrijving=terras achtertuin
  → opsluitbanden zijn onderdeel van die activiteit, GEEN aparte activiteit
- "Oprit nieuw aanleggen 6×12m. Terras 5×4m herstraten."
  → dit zijn TWO APARTE oppervlakken → twee activiteiten

Voeg in plaats van losse activiteiten de relevante maten toe aan de
bestratingsactiviteit zélf:
- "afgraven 20cm" → zet afgraafdiepte_cm: 20 op de bestratingsactiviteit (GEEN aparte grondwerk-activiteit)
- "zandbed 10cm" of "ophogen 15cm" → zet zanddikte_cm: 10 (of 15) op de bestratingsactiviteit
- "opsluitbanden rondom" of "opsluitbanden herstellen" → GEEN aparte activiteit (zit al in de bestrating)

Maak ALLEEN een aparte activiteit bij:
- een fysiek ander oppervlak/onderdeel (bv. losse oprit én los terras)
- verwijderen/opbreken van bestaand werk dat los staat van de nieuwe aanleg
- echt los grondwerk waar GEEN bestrating bovenop komt
Forfaitaire extra's (kolkaansluiting, drainagegoot) mogen een eigen activiteit
zijn met categorie 'overig'.

## KRITIEK — Gouda/eigenaar-specifieke extractie (afgraafdiepte + zanddikte)
De eigenaar werkt in Gouda (veengrond) en noteert ZELF of er afgegraven moet
worden en hoeveel cm zand erop moet.
- Extraheer **afgraafdiepte_cm** ALLEEN als expliciet genoemd. Voorbeelden:
  "afgraven 20cm" → afgraafdiepte_cm: 20. "cunet 25 cm" → afgraafdiepte_cm: 25.
- Extraheer **zanddikte_cm** ALLEEN als expliciet genoemd. Voorbeelden:
  "zandbed 10cm" → zanddikte_cm: 10. "8 cm straatzand" → zanddikte_cm: 8.
- **GOK of VERZIN NOOIT een diepte of zandhoeveelheid.** Staat het er niet, laat
  het veld dan weg (undefined). Het systeem zet dan zelf een waarschuwingsvlag.
- Menggranulaat hoort NIET in een offerte tenzij de eigenaar het expliciet noemt.

${TOP_20_RULES_FOR_PROMPT}`;

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
    model: "claude-sonnet-4-6",
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
