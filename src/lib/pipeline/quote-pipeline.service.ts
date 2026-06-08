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
import type { AssemblyWithComponents } from "../assembly/assembly-loader";
import {
  expandAssembly,
  type ExpandResult,
  type PricingRow,
} from "../assembly/assembly-expansion.service";
import {
  applyPricingMethod,
  type MethodResult,
  type PriceMethod,
} from "../pricing/pricing-methods.service";
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
  /** Vrije materiaalvoorkeur, voor de hoofd-materiaalregel. */
  materialPreference?: string;
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
  flags: string[];
  /** Geen assembly gevuurd → activiteit valt terug op handmatige afhandeling. */
  unmatched: boolean;
}

export interface PipelineResult {
  sections: PipelineSection[];
  /** Offerte-brede totalen + verdeling over alle secties. */
  combined: { breakdown: TotalsBreakdown; distribution: CostDistribution };
  /** Alle gededupliceerde vlaggen over de hele offerte. */
  flags: string[];
  /**
   * Of er blokkerende vlaggen zijn (Gouda-info ontbreekt of een prijs mist) —
   * de offerte mag dan aangemaakt worden maar niet verstuurd (Test 1b).
   */
  hasBlockingFlags: boolean;
}

const BLOCKING_FLAG_MARKERS = [
  "Afgraafdiepte niet opgegeven",
  "Zanddikte niet opgegeven",
  "Geen prijs gevonden",
  "handmatig",
];

function isBlocking(flag: string): boolean {
  return BLOCKING_FLAG_MARKERS.some((m) => flag.includes(m));
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
      flags: [`⚠️ Geen werk-template voor "${activity.description}" — handmatig opbouwen`],
      unmatched: true,
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
      materialPreference: activity.materialPreference,
    },
    pricingDb
  );

  // Granulaire regels → BTW per regel toekennen (deze sessie alles 21%).
  const structureLines: StructureLine[] = expand.lines.map((l) => ({
    ...l,
    vat_pct: config.vat_pct ?? 21,
  }));

  const structured = structureQuote({
    lines: structureLines,
    layout: config.layout,
    action: activity.action,
  });

  const display = applyPricingMethod(expand, config.method, {
    area_m2: activity.area_m2,
    assemblyLabel: activity.description,
    hourly_rate: config.hourly_rate,
    min_hours_per_day: config.min_hours_per_day,
    day_rounding: config.day_rounding,
  });

  const flags = dedupe([...expand.flags, ...structured.flags]);

  return { activity, assembly, expand, display, structured, flags, unmatched: false };
}

function dedupe(flags: string[]): string[] {
  return [...new Set(flags)];
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
  const sections = activities.map((a) =>
    processActivity(a, assemblies, pricingDb, config)
  );

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
    hasBlockingFlags: flags.some(isBlocking),
  };
}
