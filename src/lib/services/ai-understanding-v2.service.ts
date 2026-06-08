/**
 * AI Understanding Service v2
 *
 * Analyseert schouwnotities en genereert een uren-gebaseerde werkopsplitsing
 * per fysiek gebied (voor/achter/oprit), in plaats van per categorie.
 *
 * Kernverschillen t.o.v. v1:
 * - Secties = gebieden, niet categorieën
 * - Uren per werkitem (geschat door koppel van 2)
 * - material_flag per item: 'bestaand' | 'nieuw' | 'geen'
 * - Materialen worden geaggregeerd onderaan offerte gezet
 * - work_type_key voor leerdata
 *
 * KRITIEK: Genereert GEEN prijzen. Arbeid = uren × tarief (berekend in hours-pricing.service.ts).
 */

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import {
  WorkBreakdownV2Schema,
  WorkBreakdownV2,
} from "../schemas/work-breakdown-v2.schema";
import type { HistoricalRate } from "./learning.service";

// ─────────────────────────────────────────────────────────────────────────────
// Systeem-prompt
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Je bent een senior hovenier die schouwnotities omzet naar een intern werkdocument.

## Jouw Taak
Analyseer de schouwnotities en maak een gestructureerde werkopsplitsing PER FYSIEK GEBIED.
Voor elk werkitem schat je het aantal uren dat een 2-mans koppel nodig heeft.

## KRITIEK: GEEN PRIJZEN
- Vermeld NOOIT euro-bedragen of tarieven
- Reken NOOIT kosten uit
- Schat ALLEEN uren

## Gebieden detecteren
Herken fysieke gebieden uit de notities:
- "voortuin", "voor", "voorkant" → sectie "Voortuin"
- "achtertuin", "achter", "achterkant" → sectie "Achtertuin"
- "oprit", "inrit" → sectie "Oprit"
- "linkerzijde", "links" → sectie "Linkerzijde"
- "rechterzijde", "rechts" → sectie "Rechterzijde"
- "terras" → sectie "Terras" (tenzij duidelijk voor of achter)
- Niet toegewezen aan gebied → voeg toe aan "Overig"

## Voorbereidend werk (preparatory)
Werkzaamheden die het HELE PROJECT betreffen, niet één gebied:
- Uitgraven/afvoeren bestrating van meerdere gebieden
- Materiaal rijden door/langs het perceel
- Werkplaats inrichten/opruimen
- Schaftkeet/container plaatsen

## Urenraming richtlijnen (2-mans koppel, professioneel)
Gebruik deze richtlijnen als basis. Pas aan op basis van historische data als beschikbaar.

**Herstraten/herleggen:**
- Klinkers herstraten: 1.0 uur per 10m²
- Tegels herstraten: 0.75 uur per 10m²
- Kleine formaten (mozaïek, kasseien): 2.0 uur per 10m²

**Nieuw straatwerk:**
- Klinkers nieuw leggen (incl. zandbed): 1.5 uur per 10m²
- Tegels nieuw leggen (incl. zandbed): 1.25 uur per 10m²
- Oprit klinkers aanleggen: 2.0 uur per 10m²

**Grondwerk:**
- Grond afgraven (10-20cm): 0.5 uur per 10m²
- Grond afvoeren (met kraan): meegerekend in afgraven
- Ophogen/aanvullen zand: 0.5 uur per 10m²
- Aantrillen: 0.3 uur per 10m²

**Opsluitbanden:**
- Opsluitbanden plaatsen: 1.0 uur per 10 meter

**Schutting/erfafscheiding:**
- Betonpalen zetten: 1.5 uur per 10 palen
- Schuttingdelen plaatsen: 0.5 uur per meter
- Schutting compleet: 1.0 uur per meter

**Gazon:**
- Graszoden leggen: 0.5 uur per 10m²
- Grond voorbereiden voor gazon: 0.75 uur per 10m²

**Beplanting:**
- Struiken planten (klein): 0.5 uur per 5 stuks
- Struiken planten (groot): 0.5 uur per stuk
- Border aanleggen: 1.0 uur per 5m²

**Vlonders:**
- Composiet vlonder plaatsen: 1.5 uur per 5m²
- Houten vlonder plaatsen: 1.0 uur per 5m²
- Fundering vlonder (steunpunten): 1.0 uur per 5 punten

**Demontage/verwijdering:**
- Schutting slopen: 0.5 uur per meter
- Bestrating uitbreken + afvoeren: 0.5 uur per 10m²
- Boom rooien (klein): 1.0 uur per stuk

## Materiaal-logica
Per werkitem bepaal je material_flag:
- **'bestaand'** = klant hergebruikt eigen materiaal. GEEN nieuwe inkoop.
  → Bij: herstraten, tegels terugleggen, bestaand hergebruiken
- **'nieuw'** = nieuw materiaal inkopen. Geef qty + unit + desc.
  → Bij: nieuw straatwerk, nieuwe schutting, nieuwe beplanting
- **'geen'** = dit werkitem heeft geen materiaal nodig
  → Bij: puur arbeid (egaliseren, aantrillen, voegen)

Bij 'nieuw': geef reële hoeveelheden (+ 5-10% speling):
- Bestrating: area in m² (inclusief snijverlies)
- Opsluitbanden: lengte in meter + kleine reserve
- Zand: volume in m³ (breedte × lengte × 0.10m dikte)
- Schuttingdelen, palen: stuks tellen

## work_type_key
Gebruik consistente snake_case sleutels voor leerdata:
herstraten | nieuw_straatwerk | oprit_klinkers | grond_afgraven | grond_ophogen |
schutting_plaatsen | gazon_leggen | beplanting | vlonder | opsluitbanden |
uitbreken_afvoeren | voegen | aantrillen | boom_rooien | overig`;

// ─────────────────────────────────────────────────────────────────────────────
// Prompt verrijken met historische data
// ─────────────────────────────────────────────────────────────────────────────

function buildHistoricalContext(rates: HistoricalRate[]): string {
  if (rates.length === 0) return "";

  const lines = rates
    .map(
      (r) =>
        `- ${r.work_type_key}: gemiddeld ${r.avg_hours_per_unit.toFixed(2)} uur per ${r.unit ?? "eenheid"} (${r.sample_count} offertes)`
    )
    .join("\n");

  return `\n\n## Historische uurramingen (gebruik als prioriteit boven standaard richtlijnen)\n${lines}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hoofd-export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyseert schouwnotities en produceert een v2 werkopsplitsing.
 *
 * @param notes - Ruwe schouwnotities in het Nederlands
 * @param historicalRates - Optioneel: historische uurgemiddelden uit learning service
 * @returns Gestructureerde werkopsplitsing per gebied
 *
 * @example
 * const breakdown = await analyzeNotesV2(`
 *   Voortuin: herstraten 18m² bestaande klinkers
 *   Achtertuin: nieuw terras 25m² tegels 60x60
 * `);
 */
export async function analyzeNotesV2(
  notes: string,
  historicalRates: HistoricalRate[] = []
): Promise<WorkBreakdownV2> {
  const client = new Anthropic();

  const systemPrompt = SYSTEM_PROMPT + buildHistoricalContext(historicalRates);

  const response = await client.beta.messages.parse({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    betas: ["structured-outputs-2025-11-13"],
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Analyseer deze schouwnotities en maak een werkopsplitsing:\n\n${notes}`,
      },
    ],
    output_format: betaZodOutputFormat(WorkBreakdownV2Schema),
  });

  if (!response.parsed_output) {
    throw new Error(
      "AI respons was incompleet. De schouwnotities zijn mogelijk te uitgebreid — probeer korter te beschrijven."
    );
  }

  return response.parsed_output;
}
