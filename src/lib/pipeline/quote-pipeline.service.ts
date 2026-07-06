/**
 * Geconsolideerde offerte-pipeline (F5 V1/V2-consolidatie).
 *
 * Knoopt de zuivere lagen aan elkaar tot één keten, per activiteit:
 *
 *   selectAssembly  (Laag 2 — welke template vuurt)
 *     → expandAssembly   (Laag 2/3 — uitklappen + bevroren snapshot-prijzen)
 *     → applyPricingMethod (Laag 3 — A/B/C uit Deel D, voor weergave)
 *     → structureQuote     (Laag 4 — totalen, 55/35/10, herstraten-guardrail)
 *
 * Daarna een offerte-brede combinatie van alle breakdowns. Puur: geen DB, geen
 * AI-call. De aanroeper (API-route) laadt assemblies/pricing en schrijft het
 * resultaat weg via `toLineItemInserts`.
 */

import { selectAssembly, type Assembly } from "../assembly/assembly-firing.service";
import { consolidatePavingActivities } from "./activity-consolidation";
import type { AssemblyWithComponents } from "../assembly/assembly-loader";
import {
  expandAssembly,
  type ExpandResult,
  type PricingRow,
} from "../assembly/assembly-expansion.service";
import {
  applyPricingMethod,
  type MethodLine,
  type MethodResult,
  type PriceMethod,
} from "../pricing/pricing-methods.service";
import { calculateFromHours } from "../services/hours-pricing.service";
import { toCents, multiplyCents } from "../money";
import { formatAantal } from "../format";
import {
  makeFlag,
  dedupeQuoteFlags,
  hasBlockingFlags as hasBlockingQuoteFlags,
  type QuoteFlag,
} from "../quote-flags";
import {
  structureQuote,
  addBreakdowns,
  distributionFromBreakdown,
  emptyBreakdown,
  type StructuredQuote,
  type StructureLine,
  type LayoutOption,
  type TotalsBreakdown,
  type CostDistribution,
} from "../pricing/quote-structuring.service";

/** Eén activiteit uit Laag 1 (AI), genormaliseerd voor de pipeline. */
export interface PipelineActivity {
  /** Categorie uit de AI-output (bv. 'bestrating', 'grondwerk'). */
  type: string;
  /** Actie: nieuw / vervangen / herstraten / verwijderen / repareren. */
  action: string;
  description: string;
  area_m2: number;
  length_m?: number;
  width_m?: number;
  afgraafdiepte_cm?: number;
  zanddikte_cm?: number;
  /** Door AI berekende opsluitbandenlengte (m¹) op basis van genoemde zijdes. */
  opsluiting_lengte_m?: number;
  /** Vrije materiaalvoorkeur, voor de hoofd-materiaalregel. */
  materialPreference?: string;
  /**
   * AI-geschatte arbeidsuren (2-mans koppel) voor deze activiteit, op basis
   * van de urennormen in de Laag 1-prompt. Urenbasis voor method 'uren' (A1).
   */
  estimated_hours?: number;
}

export interface PipelineConfig {
  /** Prijsmethode (Deel D) voor de weergegeven regels. */
  method: PriceMethod;
  /** Layout voor de totalen-structuur (Laag 4). */
  layout: LayoutOption;
  hourly_rate?: number;
  min_hours_per_day?: number;
  day_rounding?: "ceil" | "round" | "floor";
  /** BTW-percentage per regel (deze sessie: 21 voor alles). */
  vat_pct?: number;
}

/** Resultaat per activiteit. */
export interface PipelineSection {
  activity: PipelineActivity;
  assembly: Assembly | null;
  /** Granulaire expansie (bron voor totalen). Null als niets vuurde. */
  expand: ExpandResult | null;
  /** Methode-regels voor weergave (A/B/C). Null als niets vuurde. */
  display: MethodResult | null;
  /** Totalen + verdeling + layout (Laag 4). Null als niets vuurde. */
  structured: StructuredQuote | null;
  flags: QuoteFlag[];
  /** Geen assembly gevuurd → activiteit valt terug op handmatige afhandeling. */
  unmatched: boolean;
}

export interface PipelineResult {
  sections: PipelineSection[];
  /** Offerte-brede totalen + verdeling over alle secties. */
  combined: { breakdown: TotalsBreakdown; distribution: CostDistribution };
  /** Alle gededupliceerde vlaggen over de hele offerte. */
  flags: QuoteFlag[];
  /**
   * Of er blokkerende vlaggen zijn (severity 'blocking', bv. ontbrekende
   * prijs) — de offerte mag dan aangemaakt worden maar niet verstuurd.
   * Bepaald door severity per code (A3), nooit door de berichttekst.
   */
  hasBlockingFlags: boolean;
}

/** Verwerkt één activiteit door de hele keten. */
function processActivity(
  activity: PipelineActivity,
  assemblies: AssemblyWithComponents[],
  pricingDb: PricingRow[],
  config: PipelineConfig
): PipelineSection {
  const assembly = selectAssembly(activity.type, activity.action, assemblies);

  if (!assembly) {
    return {
      activity,
      assembly: null,
      expand: null,
      display: null,
      structured: null,
      flags: [
        makeFlag(
          "UNMATCHED_ACTIVITY",
          `Geen werk-template voor "${activity.description}" — handmatig opbouwen`
        ),
      ],
      unmatched: true,
    };
  }

  // C2.2: zonder bruikbare afmeting valt er niets te rekenen. Geen regels met
  // hoeveelheid 0 genereren (stille gok) — hard flaggen, blocking.
  if (!hasUsableDimension(activity, assembly.unit)) {
    return {
      activity,
      assembly,
      expand: null,
      display: null,
      structured: null,
      flags: [
        makeFlag(
          "MISSING_DIMENSIONS",
          `Geen bruikbare afmeting voor "${activity.description}" — vul oppervlakte of lengte aan`
        ),
      ],
      unmatched: false,
    };
  }

  const withComponents = assemblies.find((a) => a.id === assembly.id)!;

  const expand = expandAssembly(
    withComponents.components,
    {
      area_m2: activity.area_m2,
      length_m: activity.length_m,
      width_m: activity.width_m,
      afgraafdiepte_cm: activity.afgraafdiepte_cm,
      zanddikte_cm: activity.zanddikte_cm,
      opsluiting_lengte_m: activity.opsluiting_lengte_m,
      materialPreference: activity.materialPreference,
    },
    pricingDb
  );

  const display = applyPricingMethod(expand, config.method, {
    area_m2: activity.area_m2,
    assemblyLabel: activity.description,
    hourly_rate: config.hourly_rate,
    min_hours_per_day: config.min_hours_per_day,
    day_rounding: config.day_rounding,
    estimated_hours: activity.estimated_hours,
  });

  // Bron voor totalen + 55/35/10-check (Laag 4): de regels zoals ze op de
  // offerte komen. Bij 'uren' zijn dat de methode-regels (arbeid in uren) —
  // anders rekent de sanity-check op iets anders dan wat de klant ziet. Bij
  // 'uitgesplitst' identiek aan de expansie; bij 'meterprijs' blijft de
  // expansie de juiste decompositie van de all-in post.
  const structureSource = config.method === "uren" ? display.lines : expand.lines;
  const structured = structureQuote({
    lines: toStructureLines(structureSource, config),
    layout: config.layout,
    action: activity.action,
  });

  const flags = collectSectionFlags(expand, display, structured);

  return { activity, assembly, expand, display, structured, flags, unmatched: false };
}

/** Regels → structure-regels met BTW per regel (deze sessie alles 21%). */
function toStructureLines(
  lines: MethodLine[],
  config: PipelineConfig
): StructureLine[] {
  return lines.map((l) => ({ ...l, vat_pct: config.vat_pct ?? 21 }));
}

/**
 * Alle vlaggen van één sectie: per-regel (bv. "Geen prijs gevonden voor X",
 * zodat de gebruiker ziet WELKE post een prijs mist), expansie-, methode-
 * (bv. uren-terugval) en structuring-vlaggen (verdeling, ontbrekende prijs).
 */
function collectSectionFlags(
  expand: ExpandResult,
  display: MethodResult,
  structured: StructuredQuote
): QuoteFlag[] {
  const lineFlags = expand.lines.flatMap((l) => l.flags);
  return dedupe([...lineFlags, ...expand.flags, ...display.flags, ...structured.flags]);
}

const dedupe = dedupeQuoteFlags;

/**
 * Of de activiteit een afmeting heeft waar de assembly mee kan rekenen (C2.2):
 * m²-werk vereist een oppervlak, m¹-werk een lengte (of AI-berekende
 * opsluitingslengte), stuks-werk heeft geen afmeting nodig.
 */
function hasUsableDimension(activity: PipelineActivity, assemblyUnit: string): boolean {
  if (activity.area_m2 > 0) return true;
  if (
    assemblyUnit === "m1" &&
    ((activity.opsluiting_lengte_m ?? 0) > 0 || (activity.length_m ?? 0) > 0)
  ) {
    return true;
  }
  return assemblyUnit === "stuk";
}

/** Uren-regel van Methode C (arbeid in uren; rauwe sectie-uren). */
function isUrenLine(l: MethodLine): boolean {
  return l.line_type === "arbeid" && l.unit === "uur";
}

/**
 * Dagafronding voor methode 'uren' — vaste werking: één keer over het
 * offertetotaal, niet per sectie. Telt de rauwe uren van alle secties op,
 * rondt af op hele werkdagen (calculateFromHours) en voegt het verschil als
 * expliciete dagafrondingsregel toe aan de laatste sectie met arbeid, zodat
 * de som van de regels exact het afgeronde totaal is.
 */
function applyQuoteDayRounding(
  sections: PipelineSection[],
  config: PipelineConfig
): PipelineSection[] {
  const rawTotal = sections.reduce(
    (acc, s) =>
      acc +
      (s.display?.lines.filter(isUrenLine).reduce((a, l) => a + l.quantity, 0) ?? 0),
    0
  );
  if (rawTotal <= 0) return sections;

  // Alleen ingevulde waarden doorgeven: expliciete `undefined` zou de defaults
  // in calculateFromHours (spread-merge) overschrijven.
  const hoursConfig: Parameters<typeof calculateFromHours>[1] = {};
  if (config.hourly_rate != null) hoursConfig.hourly_rate = config.hourly_rate;
  if (config.min_hours_per_day != null) hoursConfig.min_hours_per_day = config.min_hours_per_day;
  if (config.day_rounding != null) hoursConfig.day_rounding = config.day_rounding;
  const rounded = calculateFromHours(rawTotal, hoursConfig);

  const delta = Math.round((rounded.billable_hours - rawTotal) * 100) / 100;
  if (delta <= 0) return sections;

  let lastIdx = -1;
  for (const [i, s] of sections.entries()) {
    if (s.display?.lines.some(isUrenLine)) lastIdx = i;
  }
  if (lastIdx < 0) return sections;

  const rateCents = toCents(rounded.hourly_rate);
  const roundingLine: MethodLine = {
    description: `Afronding naar hele werkdagen (totaal ${rounded.days} ${rounded.days === 1 ? "werkdag" : "werkdagen"} · ${formatAantal(rounded.billable_hours)} uur)`,
    line_type: "arbeid",
    quantity: delta,
    unit: "uur",
    unit_price_cents: rateCents,
    total_cents: multiplyCents(rateCents, delta),
    pricing_id: null,
    price_source: "database",
    flags: [],
  };

  return sections.map((s, i) => {
    if (i !== lastIdx) return s;
    const display = { ...s.display!, lines: [...s.display!.lines, roundingLine] };
    // Totalen opnieuw berekenen mét de dagafronding, maar de 55/35/10-
    // beoordeling van de sectie zélf (distribution + vlaggen) houden op de
    // eigen werkmix: de afronding is offerte-overhead en zou anders een valse
    // sectie-waarschuwing geven. Het offerteniveau (combined) rekent wél
    // inclusief afronding via de breakdown.
    const withRounding = structureQuote({
      lines: toStructureLines(display.lines, config),
      layout: config.layout,
      action: s.activity.action,
    });
    const structured = {
      ...withRounding,
      distribution: s.structured!.distribution,
      flags: s.structured!.flags,
    };
    return {
      ...s,
      display,
      structured,
      flags: collectSectionFlags(s.expand!, display, structured),
    };
  });
}

/**
 * Draait de volledige pipeline over alle activiteiten en aggregeert de totalen.
 *
 * @param activities - genormaliseerde activiteiten uit Laag 1
 * @param assemblies - vooraf geladen actieve assemblies + componenten
 * @param pricingDb - vooraf geladen actieve pricing-rijen
 * @param config - prijsmethode, layout en uren-/BTW-instellingen
 */
export function runQuotePipeline(
  activities: PipelineActivity[],
  assemblies: AssemblyWithComponents[],
  pricingDb: PricingRow[],
  config: PipelineConfig
): PipelineResult {
  // Consolideer losse onderdelen (afgraven, opsluitbanden) in hun bestratingsklus
  // vóór de firing — repareert hoe de AI realistische input opsplitst.
  const consolidated = consolidatePavingActivities(activities);

  const processed = consolidated.map((a) =>
    processActivity(a, assemblies, pricingDb, config)
  );

  // Methode 'uren': dagafronding één keer over het offertetotaal (vaste werking).
  const sections =
    config.method === "uren" ? applyQuoteDayRounding(processed, config) : processed;

  const combinedBreakdown = sections.reduce(
    (acc, s) => (s.structured ? addBreakdowns(acc, s.structured.breakdown) : acc),
    emptyBreakdown()
  );

  const flags = dedupe(sections.flatMap((s) => s.flags));

  return {
    sections,
    combined: {
      breakdown: combinedBreakdown,
      distribution: distributionFromBreakdown(combinedBreakdown),
    },
    flags,
    hasBlockingFlags: hasBlockingQuoteFlags(flags),
  };
}
