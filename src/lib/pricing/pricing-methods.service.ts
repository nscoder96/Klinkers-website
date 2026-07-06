/**
 * Prijsmethoden (Laag 3 — Deel D). Past één van de drie prijsmethoden toe op een
 * assembly-expansie:
 *
 *   - 'uitgesplitst' (B): arbeid- en materiaalregels apart, ongewijzigd.
 *   - 'meterprijs'   (A): alle geprijsde regels samengevoegd tot één all-in regel
 *                         (aanneemsom per m²/m¹).
 *   - 'uren'         (C): arbeidregels vervangen door één uren-regel (rauwe
 *                         uren; dagafronding gebeurt op offerteniveau),
 *                         materiaal/materieel blijft staan.
 *
 * Puur: geen DB, geen mutatie. Geld altijd in centen (zie money.ts). Genereert
 * nooit een prijs — een regel zonder snapshot blijft 'missing' en wordt gevlagd.
 */

import type { ExpandResult, ExpandedLine } from "../assembly/assembly-expansion.service";
import { sumCents, toCents, multiplyCents, Cents } from "../money";
import { formatAantal } from "../format";

export type PriceMethod = "uitgesplitst" | "meterprijs" | "uren";

/** Regeltype incl. de samengestelde all-in post van Methode A. */
export type MethodLineType = ExpandedLine["line_type"] | "all_in";

/** Een geprijsde regel na methode-toepassing (verbreedt alleen `line_type`). */
export interface MethodLine extends Omit<ExpandedLine, "line_type"> {
  line_type: MethodLineType;
}

export interface MethodResult {
  method: PriceMethod;
  lines: MethodLine[];
  /** Offerte-brede vlaggen, overgenomen uit de expansie. */
  flags: string[];
}

export interface PricingMethodConfig {
  /** Oppervlak in m² — drijft de all-in eenheidsprijs en de urenberekening. */
  area_m2: number;
  /** Label voor de all-in post (Methode A). */
  assemblyLabel?: string;
  /** Uurtarief excl. BTW (default €85, koppelprijs eigenaar). */
  hourly_rate?: number;
  /** Uren per werkdag voor dagafronding (default 8). */
  min_hours_per_day?: number;
  /** Afrondingsrichting van dagen (default 'ceil'). */
  day_rounding?: "ceil" | "round" | "floor";
  /** CROW-dagproductie omgerekend naar m²/uur (default 5 = 40 m²/dag ÷ 8u). */
  crow_m2_per_hour?: number;
  /**
   * AI-geschatte arbeidsuren voor deze activiteit (Laag 1, 2-mans koppel).
   * Aanwezig → gebruikt als urenbasis; afwezig → CROW-terugval mét vlag.
   */
  estimated_hours?: number;
}

const MANUAL_FLAG = "Bevat een post zonder prijs — controleer handmatig vóór verzenden";

/** Methode B: regels ongewijzigd doorzetten. */
function asMethodLines(lines: ExpandedLine[]): MethodLine[] {
  return lines.map((l) => ({ ...l }));
}

/** Methode A: alle geprijsde regels samenvoegen tot één all-in post per m²/m¹. */
function toAllIn(expand: ExpandResult, config: PricingMethodConfig): MethodLine[] {
  const priced = expand.lines.filter(
    (l) => l.price_source === "database" && l.total_cents != null
  );
  const hasMissing = expand.lines.some((l) => l.price_source === "missing");

  const totalCents: Cents = sumCents(priced.map((l) => l.total_cents!));
  const area = config.area_m2 > 0 ? config.area_m2 : 1;
  const unitPriceCents: Cents = Math.round(totalCents / area);

  const flags = [...dedupeFlags(expand.lines.flatMap((l) => l.flags))];
  if (hasMissing) flags.push(MANUAL_FLAG);

  return [
    {
      description: config.assemblyLabel ?? "Aanneemsom",
      line_type: "all_in",
      quantity: area,
      unit: "m²",
      unit_price_cents: unitPriceCents,
      total_cents: totalCents,
      pricing_id: null,
      price_source: "database",
      flags,
    },
  ];
}

const HOURS_FALLBACK_FLAG =
  "Urenschatting ontbreekt — arbeid geschat via CROW-norm, controleer de uren";

/** Uurtarief excl. BTW als er geen instelling is (koppelprijs eigenaar). */
const DEFAULT_HOURLY_RATE = 85;

/**
 * Methode C: arbeidregels vervangen door één uren-regel met de RAUWE uren van
 * deze sectie. Urenbasis: de AI-schatting per activiteit (A1); zonder schatting
 * valt de berekening terug op de CROW-norm en krijgt de offerte een
 * waarschuwingsvlag. De dagafronding gebeurt bewust NIET hier maar één keer
 * over het offertetotaal, in runQuotePipeline — vaste werking.
 */
function toHours(
  expand: ExpandResult,
  config: PricingMethodConfig
): { lines: MethodLine[]; flags: string[] } {
  const nonLabor = expand.lines.filter((l) => l.line_type !== "arbeid");
  const laborLines = expand.lines.filter((l) => l.line_type === "arbeid");
  if (laborLines.length === 0) return { lines: asMethodLines(expand.lines), flags: [] };

  const hasEstimate = config.estimated_hours != null && config.estimated_hours > 0;
  const crow = config.crow_m2_per_hour ?? 5;
  const rawHours = hasEstimate ? config.estimated_hours! : config.area_m2 / crow;
  const hours = Math.round(rawHours * 100) / 100;
  const rateCents = toCents(config.hourly_rate ?? DEFAULT_HOURLY_RATE);

  const laborFlags = dedupeFlags(laborLines.flatMap((l) => l.flags));

  const laborLine: MethodLine = {
    description: `Arbeid (${formatAantal(hours)} uur)`,
    line_type: "arbeid",
    quantity: hours,
    unit: "uur",
    unit_price_cents: rateCents,
    total_cents: multiplyCents(rateCents, hours),
    pricing_id: null,
    price_source: "database",
    flags: laborFlags,
  };

  return {
    lines: [...asMethodLines(nonLabor), laborLine],
    flags: hasEstimate ? [] : [HOURS_FALLBACK_FLAG],
  };
}

function dedupeFlags(flags: string[]): string[] {
  return [...new Set(flags)];
}

/**
 * Past een prijsmethode toe op een assembly-expansie.
 *
 * @param expand - resultaat van `expandAssembly`
 * @param method - gekozen prijsmethode (A/B/C uit Deel D)
 * @param config - oppervlak, label en uren-/tariefinstellingen
 */
export function applyPricingMethod(
  expand: ExpandResult,
  method: PriceMethod,
  config: PricingMethodConfig
): MethodResult {
  switch (method) {
    case "uitgesplitst":
      return { method, lines: asMethodLines(expand.lines), flags: expand.flags };
    case "meterprijs":
      return { method, lines: toAllIn(expand, config), flags: expand.flags };
    case "uren": {
      const hours = toHours(expand, config);
      return { method, lines: hours.lines, flags: [...expand.flags, ...hours.flags] };
    }
  }
}
