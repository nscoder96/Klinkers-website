/**
 * Quote-structuring (Laag 4 — Deel B4 + A4).
 *
 * Neemt de geprijsde, uitgesplitste regels (arbeid / materiaal / materieel) en:
 *   1. berekent `quote_totals_breakdown`: subtotalen per regeltype + BTW per tarief
 *      (Deel B4-volgorde: subtotaal → BTW per tarief → eindtotaal);
 *   2. produceert de gekozen layout (volledig uitgesplitst / arbeid als totaalpost
 *      / aanneemsom — Deel D);
 *   3. doet de 55/35/10 sanity-check (Deel A4) en vlagt afwijkingen;
 *   4. bewaakt de herstraten-regel: geen materiaalkosten voor de bestrating zelf.
 *
 * Puur: geen DB, geen mutatie. Geld altijd in centen (zie money.ts). De BTW per
 * regel komt mee als `vat_pct` (default 21 — deze sessie zet alles op hoog tarief).
 */

import type { MethodLine } from "./pricing-methods.service";
import { sumCents, pctOfCents, Cents } from "../money";

/** Regel die de structuring binnenkomt: een methode-regel + optioneel BTW-tarief. */
export interface StructureLine extends MethodLine {
  /** BTW-percentage (9 of 21). Default 21. */
  vat_pct?: number;
}

/** De drie layout-opties uit Deel D / Fase 5 Laag 4. */
export type LayoutOption = "uitgesplitst" | "arbeid_totaalpost" | "aanneemsom";

/** Tussen- en eindwaarden per quote (Deel B4). Alles in centen. */
export interface TotalsBreakdown {
  subtotal_labor: Cents;
  subtotal_materials: Cents;
  subtotal_materieel: Cents;
  subtotal: Cents;
  vat_9_base: Cents;
  vat_21_base: Cents;
  vat_9_amount: Cents;
  vat_21_amount: Cents;
  grand_total: Cents;
}

/** Kostenverdeling t.o.v. de 55/35/10-norm (Deel A4). */
export interface CostDistribution {
  labor_pct: number;
  materials_pct: number;
  /** Materieel + afvoer + voorrijkosten. */
  equipment_pct: number;
  within_norm: boolean;
  warnings: string[];
}

export interface StructuredQuote {
  layout: LayoutOption;
  display_lines: MethodLine[];
  breakdown: TotalsBreakdown;
  distribution: CostDistribution;
  flags: string[];
}

export interface StructureInput {
  /** Geprijsde, uitgesplitste regels (arbeid / materiaal / materieel). */
  lines: StructureLine[];
  /** Gekozen weergave (default 'uitgesplitst'). */
  layout?: LayoutOption;
  /** Activiteit-actie; 'herstraten' activeert de materiaalguardrail. */
  action?: string;
}

/** Fout: herstraten mag nooit materiaalkosten voor de bestrating zelf bevatten. */
export class HerstratenMaterialError extends Error {
  constructor(public readonly offendingDescriptions: string[]) {
    super(
      `Herstraten bevat materiaalkosten voor bestrating (${offendingDescriptions.join(
        ", "
      )}). Bij herstraten hergebruikt de klant het materiaal — alleen arbeid.`
    );
    this.name = "HerstratenMaterialError";
  }
}

const DEFAULT_VAT_PCT = 21;

/** Steen-/bestratingmateriaal dat bij herstraten NIET in de offerte hoort. */
const PAVING_MATERIAL_KEYWORDS = [
  "klinker",
  "tegel",
  "waalt", // waaltje(s)
  "koppelstone",
  "sierbestrating",
  "natuursteen",
  "flagstone",
  "graniet",
  "basalt",
  "dikformaat",
];

const norm = (s: string): string => s.toLowerCase();

/** Of een omschrijving een steen-/bestratingmateriaal beschrijft (geen zand). */
function isPavingMaterial(description: string): boolean {
  const d = norm(description);
  return PAVING_MATERIAL_KEYWORDS.some((kw) => d.includes(kw));
}

/**
 * Bewaakt de herstraten-regel: gooit een fout zodra een materiaalregel met
 * kosten een steen-/bestratingmateriaal blijkt te zijn.
 */
function assertNoHerstratenPavingMaterial(lines: StructureLine[]): void {
  const offending = lines.filter(
    (l) =>
      l.line_type === "materiaal" &&
      (l.total_cents ?? 0) > 0 &&
      isPavingMaterial(l.description)
  );
  if (offending.length > 0) {
    throw new HerstratenMaterialError(offending.map((l) => l.description));
  }
}

/** Som van geprijsde regels (null-totalen tellen niet mee) voor een filter. */
function sumPriced(lines: StructureLine[], pred: (l: StructureLine) => boolean): Cents {
  return sumCents(
    lines.filter((l) => pred(l) && l.total_cents != null).map((l) => l.total_cents!)
  );
}

function computeBreakdown(lines: StructureLine[]): TotalsBreakdown {
  const subtotal_labor = sumPriced(lines, (l) => l.line_type === "arbeid");
  const subtotal_materials = sumPriced(lines, (l) => l.line_type === "materiaal");
  const subtotal_materieel = sumPriced(lines, (l) => l.line_type === "materieel");
  const subtotal = subtotal_labor + subtotal_materials + subtotal_materieel;

  const vatPct = (l: StructureLine): number => l.vat_pct ?? DEFAULT_VAT_PCT;
  const vat_9_base = sumPriced(lines, (l) => vatPct(l) === 9);
  const vat_21_base = sumPriced(lines, (l) => vatPct(l) === 21);
  const vat_9_amount = pctOfCents(vat_9_base, 0.09);
  const vat_21_amount = pctOfCents(vat_21_base, 0.21);
  const grand_total = subtotal + vat_9_amount + vat_21_amount;

  return {
    subtotal_labor,
    subtotal_materials,
    subtotal_materieel,
    subtotal,
    vat_9_base,
    vat_21_base,
    vat_9_amount,
    vat_21_amount,
    grand_total,
  };
}

/** Bandbreedtes uit Deel A4 (percentages van het subtotaal ex BTW). */
const NORM_BANDS = {
  labor: { low: 45, high: 55, label: "Arbeid" },
  materials: { low: 30, high: 40, label: "Materiaal" },
  equipment: { low: 10, high: 15, label: "Materieel + afvoer + voorrijden" },
} as const;
/** Toegestane afwijking buiten de band (procentpunten) voor de sanity-check. */
const NORM_TOLERANCE_PP = 15;

function pct(part: Cents, whole: Cents): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function checkBand(
  value: number,
  band: { low: number; high: number; label: string }
): string | null {
  if (value < band.low - NORM_TOLERANCE_PP || value > band.high + NORM_TOLERANCE_PP) {
    return `${band.label} is ${value}% (norm ${band.low}–${band.high}%) — controleer de berekening`;
  }
  return null;
}

function computeDistribution(breakdown: TotalsBreakdown): CostDistribution {
  const base = breakdown.subtotal;
  const labor_pct = pct(breakdown.subtotal_labor, base);
  const materials_pct = pct(breakdown.subtotal_materials, base);
  const equipment_pct = pct(breakdown.subtotal_materieel, base);

  const warnings = [
    checkBand(labor_pct, NORM_BANDS.labor),
    checkBand(materials_pct, NORM_BANDS.materials),
    checkBand(equipment_pct, NORM_BANDS.equipment),
  ].filter((w): w is string => w !== null);

  return {
    labor_pct,
    materials_pct,
    equipment_pct,
    within_norm: warnings.length === 0,
    warnings,
  };
}

/** Bundelt alle regels van één type tot één post met gesommeerd totaal. */
function collapse(
  lines: StructureLine[],
  lineType: MethodLine["line_type"],
  description: string,
  unit: string
): MethodLine {
  const matching = lines.filter((l) => l.line_type === lineType);
  const total = sumCents(matching.map((l) => l.total_cents ?? 0));
  return {
    description,
    line_type: lineType,
    quantity: 1,
    unit,
    unit_price_cents: total,
    total_cents: total,
    pricing_id: null,
    price_source: "database",
    flags: [],
  };
}

/** Past de gekozen layout toe op de uitgesplitste regels. */
function applyLayout(lines: StructureLine[], layout: LayoutOption): MethodLine[] {
  if (layout === "uitgesplitst") {
    return lines.map((l) => ({ ...l }));
  }

  if (layout === "arbeid_totaalpost") {
    const labor = collapse(lines, "arbeid", "Arbeid (totaal)", "post");
    const rest = lines.filter((l) => l.line_type !== "arbeid").map((l) => ({ ...l }));
    return [labor, ...rest];
  }

  // aanneemsom: alles op één all-in post.
  const total = sumCents(lines.map((l) => l.total_cents ?? 0));
  return [
    {
      description: "Aanneemsom",
      line_type: "all_in",
      quantity: 1,
      unit: "post",
      unit_price_cents: total,
      total_cents: total,
      pricing_id: null,
      price_source: "database",
      flags: [],
    },
  ];
}

const MISSING_PRICE_FLAG =
  "⚠️ Bevat een post zonder prijs — controleer handmatig vóór verzenden";

/**
 * Structureert geprijsde regels tot een offerte met totalen-breakdown,
 * kostenverdeling en de gekozen layout.
 *
 * @throws HerstratenMaterialError als `action === 'herstraten'` en er
 *   materiaalkosten voor de bestrating zelf in de regels zitten.
 */
export function structureQuote(input: StructureInput): StructuredQuote {
  const { lines, layout = "uitgesplitst", action } = input;

  if (action && norm(action) === "herstraten") {
    assertNoHerstratenPavingMaterial(lines);
  }

  const breakdown = computeBreakdown(lines);
  const distribution = computeDistribution(breakdown);
  const display_lines = applyLayout(lines, layout);

  const flags: string[] = [];
  if (lines.some((l) => l.total_cents == null)) flags.push(MISSING_PRICE_FLAG);
  flags.push(...distribution.warnings);

  return { layout, display_lines, breakdown, distribution, flags };
}

/** Een breakdown met alle waarden op 0 (startwaarde voor aggregatie). */
export function emptyBreakdown(): TotalsBreakdown {
  return {
    subtotal_labor: 0,
    subtotal_materials: 0,
    subtotal_materieel: 0,
    subtotal: 0,
    vat_9_base: 0,
    vat_21_base: 0,
    vat_9_amount: 0,
    vat_21_amount: 0,
    grand_total: 0,
  };
}

/** Telt twee breakdowns veld-voor-veld op (voor offerte-brede totalen). */
export function addBreakdowns(
  a: TotalsBreakdown,
  b: TotalsBreakdown
): TotalsBreakdown {
  return {
    subtotal_labor: a.subtotal_labor + b.subtotal_labor,
    subtotal_materials: a.subtotal_materials + b.subtotal_materials,
    subtotal_materieel: a.subtotal_materieel + b.subtotal_materieel,
    subtotal: a.subtotal + b.subtotal,
    vat_9_base: a.vat_9_base + b.vat_9_base,
    vat_21_base: a.vat_21_base + b.vat_21_base,
    vat_9_amount: a.vat_9_amount + b.vat_9_amount,
    vat_21_amount: a.vat_21_amount + b.vat_21_amount,
    grand_total: a.grand_total + b.grand_total,
  };
}

/** Kostenverdeling (55/35/10-norm) afgeleid uit een al berekende breakdown. */
export function distributionFromBreakdown(
  breakdown: TotalsBreakdown
): CostDistribution {
  return computeDistribution(breakdown);
}
