/**
 * Materials Aggregation Service (A5)
 *
 * Groepeert materialen uit een v2 werkopsplitsing.
 * Filtert op material_flag === 'nieuw', telt hoeveelheden op per materiaaltype,
 * en past BTW-correctie toe.
 *
 * De service berekent excl. BTW prijzen als materiaalprijs incl. BTW is ingevoerd.
 * Standaard 10% marge op materialen (configureerbaar).
 */

import type {
  WorkBreakdownV2,
  WorkSectionV2,
  WorkItemV2,
  AggregatedMaterial,
} from "../schemas/work-breakdown-v2.schema";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MaterialLineItem {
  /** Beschrijving van het materiaal */
  description: string;
  /** Totale hoeveelheid (opgeteld uit alle werkitems) */
  qty: number;
  /** Eenheid (m2, stuks, m3, meter, etc.) */
  unit: string;
  /** Prijs per eenheid excl. BTW (0 als niet opgegeven → handmatig invullen) */
  unit_price_excl: number;
  /** Totaalprijs excl. BTW */
  total_excl: number;
  /** Of de prijs is ingevoerd als incl. BTW */
  was_incl_btw: boolean;
  /** Werkitems die dit materiaal genereerden */
  source_items: string[];
}

export interface AggregatedMaterialsResult {
  /** Alle materiaalregels */
  lines: MaterialLineItem[];
  /** Totaal materiaalkosten excl. BTW */
  total_materials_excl: number;
  /** BTW bedrag (21%) */
  btw_amount: number;
  /** Totaal incl. BTW */
  total_materials_incl: number;
}

export interface MaterialsAggregationConfig {
  /** BTW percentage (default: 21) */
  btw_percentage?: number;
  /** Marge op materialen als percentage (default: 10) */
  material_margin_percentage?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Implementatie
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: Required<MaterialsAggregationConfig> = {
  btw_percentage: 21,
  material_margin_percentage: 10,
};

/**
 * Aggregeer alle 'nieuw' materialen uit een v2 werkopsplitsing.
 *
 * Werkitems met material_flag='bestaand' of 'geen' worden overgeslagen.
 * Gelijke materialen (zelfde description + unit) worden opgeteld.
 */
export function aggregateMaterials(
  breakdown: WorkBreakdownV2,
  manualPrices: Record<string, number> = {},
  config: MaterialsAggregationConfig = {}
): AggregatedMaterialsResult {
  const { btw_percentage, material_margin_percentage } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Verzamel alle werkitems met material_flag='nieuw'
  const allSections: WorkSectionV2[] = [
    breakdown.preparatory,
    ...breakdown.areas,
  ];

  const newMaterialItems = allSections
    .flatMap((s) => s.items)
    .filter(
      (item): item is WorkItemV2 & { material_flag: "nieuw" } =>
        item.material_flag === "nieuw" &&
        Boolean(item.material_desc) &&
        Boolean(item.material_unit)
    );

  // Groepeer op beschrijving + eenheid
  const grouped = new Map<string, MaterialLineItem>();

  for (const item of newMaterialItems) {
    const key = normalizeKey(item.material_desc!, item.material_unit!);

    if (!grouped.has(key)) {
      grouped.set(key, {
        description: item.material_desc!,
        qty: 0,
        unit: item.material_unit!,
        unit_price_excl: 0,
        total_excl: 0,
        was_incl_btw: false,
        source_items: [],
      });
    }

    const line = grouped.get(key)!;
    line.qty += item.material_qty ?? 1;
    line.source_items.push(item.description);
  }

  // Gebruik ook de geaggregeerde materialen van de AI (als aanvulling)
  for (const aggMaterial of breakdown.materials) {
    const key = normalizeKey(aggMaterial.material_desc, aggMaterial.material_unit);

    if (!grouped.has(key)) {
      grouped.set(key, {
        description: aggMaterial.material_desc,
        qty: aggMaterial.material_qty,
        unit: aggMaterial.material_unit,
        unit_price_excl: 0,
        total_excl: 0,
        was_incl_btw: false,
        source_items: aggMaterial.source_items,
      });
    }
  }

  // Prijzen toewijzen + BTW-correctie
  const lines: MaterialLineItem[] = Array.from(grouped.values()).map((line) => {
    const priceKey = normalizeKey(line.description, line.unit);
    const rawPrice = manualPrices[priceKey] ?? 0;

    // Als prijs is ingevoerd als incl. BTW: omrekenen naar excl.
    const unitPriceExcl =
      rawPrice > 0
        ? excludeBtw(rawPrice, btw_percentage)
        : 0;

    // Marge toepassen
    const unitPriceWithMargin =
      unitPriceExcl > 0
        ? unitPriceExcl * (1 + material_margin_percentage / 100)
        : 0;

    const totalExcl = unitPriceWithMargin * line.qty;

    return {
      ...line,
      unit_price_excl: unitPriceExcl,
      total_excl: totalExcl,
      was_incl_btw: rawPrice > 0,
    };
  });

  const total_materials_excl = lines.reduce((acc, l) => acc + l.total_excl, 0);
  const btw_amount = total_materials_excl * (btw_percentage / 100);
  const total_materials_incl = total_materials_excl + btw_amount;

  return {
    lines,
    total_materials_excl,
    btw_amount,
    total_materials_incl,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function normalizeKey(description: string, unit: string): string {
  return `${description.toLowerCase().trim()}__${unit.toLowerCase().trim()}`;
}

function excludeBtw(priceInclBtw: number, btwPercentage: number): number {
  return priceInclBtw / (1 + btwPercentage / 100);
}

/**
 * Converteert AggregatedMaterial[] (van AI schema) naar MaterialLineItem[].
 * Handig als je direct het AI output wil omzetten zonder werkitem-scan.
 */
export function fromAggregatedMaterials(
  materials: AggregatedMaterial[],
  config: MaterialsAggregationConfig = {}
): AggregatedMaterialsResult {
  const { btw_percentage } = { ...DEFAULT_CONFIG, ...config };

  const lines: MaterialLineItem[] = materials.map((m) => ({
    description: m.material_desc,
    qty: m.material_qty,
    unit: m.material_unit,
    unit_price_excl: 0,
    total_excl: 0,
    was_incl_btw: false,
    source_items: m.source_items,
  }));

  const total_materials_excl = 0;
  const btw_amount = total_materials_excl * (btw_percentage / 100);
  const total_materials_incl = total_materials_excl + btw_amount;

  return { lines, total_materials_excl, btw_amount, total_materials_incl };
}
