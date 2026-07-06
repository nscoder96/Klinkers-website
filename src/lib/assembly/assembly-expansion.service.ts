/**
 * Assembly-expansie (Deel B3 — "het hart van de automatisering").
 *
 * Klapt één assembly uit naar geprijsde regels: bereken hoeveelheid per
 * component via `quantity_formula`, koppel een prijs uit de bibliotheek en
 * bevries die als snapshot (in centen). Genereert NOOIT een prijs — geen
 * match = regel gemarkeerd als 'missing'.
 *
 * Afgeleide variabelen (lost spec-inconsistenties op, gedocumenteerd in
 * F5-IMPLEMENTATIE.md):
 *   - perimeter_m : exacte omtrek als L×B bekend, anders sqrt(area)*4 (schatting)
 *   - cunet_m3    : afgraafvolume = area × afgraafdiepte_cm / 100
 *   - zanddikte_cm: minimaal 8 cm (ook bij herstraten)
 */

import { evaluateAssemblyFormula, AssemblyVars } from "./formula-evaluator";
import { toCents, multiplyCents, Cents } from "../money";

export interface AssemblyComponent {
  item_name_match: string | null;
  component_type: "arbeid" | "materiaal" | "materieel";
  quantity_formula: string | null;
  quantity_per_unit?: number;
  is_optional: boolean;
  flag_when_missing: string | null;
  sort_order: number;
}

export interface PricingRow {
  id: string;
  item_name: string;
  item_type?: string | null;
  unit: string;
  selling_price_default?: number | null;
  selling_price_min?: number | null;
  selling_price_max?: number | null;
  labor_rate_per_hour?: number | null;
}

export interface AssemblyInput {
  /** Oppervlak in m² (de hoofd-invoer; = `qty`). */
  area_m2: number;
  length_m?: number;
  width_m?: number;
  afgraafdiepte_cm?: number;
  zanddikte_cm?: number;
  /**
   * Door AI berekende opsluitbandenlengte (m¹) op basis van genoemde zijdes
   * ("links en rechts" = 2×langste zijde + 1×kortste zijde).
   * Als aanwezig, overschrijft dit de standaard omtrekformule.
   */
  opsluiting_lengte_m?: number;
  /**
   * Door de klant gekozen bestratingmateriaal (bv. "klinkers waalformaat
   * antraciet"). Wordt gebruikt om de hoofd-materiaalregel met een lege
   * `item_name_match` aan een prijs te koppelen (token-overlap).
   */
  materialPreference?: string;
}

export interface ExpandedLine {
  description: string;
  line_type: "arbeid" | "materiaal" | "materieel";
  quantity: number;
  unit: string;
  unit_price_cents: Cents | null;
  total_cents: Cents | null;
  pricing_id: string | null;
  price_source: "database" | "missing";
  flags: string[];
}

export interface ExpandResult {
  lines: ExpandedLine[];
  /** Offerte-brede vlaggen (bv. ontbrekende afgraafdiepte/zanddikte). */
  flags: string[];
}

const MIN_ZANDDIKTE_CM = 8;

/** Eenheidsprijs uit een pricing-rij, op basis van regeltype. Null = onbekend. */
function unitPriceFor(
  pricing: PricingRow,
  lineType: "arbeid" | "materiaal" | "materieel"
): number | null {
  if (lineType === "arbeid" && pricing.labor_rate_per_hour != null) {
    // Arbeid in de assembly wordt per eenheid (m²/m¹) geprijsd via
    // selling_price_default; labor_rate_per_hour alleen als fallback.
    if (pricing.selling_price_default != null) return pricing.selling_price_default;
    return pricing.labor_rate_per_hour;
  }
  if (pricing.selling_price_default != null) return pricing.selling_price_default;
  if (pricing.selling_price_min != null && pricing.selling_price_max != null) {
    return (pricing.selling_price_min + pricing.selling_price_max) / 2;
  }
  return pricing.selling_price_min ?? pricing.selling_price_max ?? null;
}

function findPricing(
  itemNameMatch: string,
  pricingDb: PricingRow[]
): PricingRow | null {
  const needle = itemNameMatch.toLowerCase().trim();
  // Exact op naam
  const exact = pricingDb.find((p) => p.item_name.toLowerCase().trim() === needle);
  if (exact) return exact;
  // Gedeeltelijk: pricing-naam zit in de match of omgekeerd
  const partial = pricingDb.find(
    (p) =>
      needle.includes(p.item_name.toLowerCase().trim()) ||
      p.item_name.toLowerCase().trim().includes(needle)
  );
  return partial ?? null;
}

/** Betekenisvolle tokens (≥4 letters) uit een naam, voor token-overlap. */
function significantTokens(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[^a-zà-ÿ]+/)
    .filter((t) => t.length >= 4);
}

/**
 * Koppelt een vrije materiaalvoorkeur ("klinkers waalformaat antraciet") aan de
 * prijsbibliotheek via token-overlap. Kleur-/restwoorden (antraciet) tellen niet
 * mee omdat ze niet in de prijsnamen voorkomen. Null = geen voldoende match.
 */
function matchMaterialPreference(
  preference: string,
  pricingDb: PricingRow[]
): PricingRow | null {
  const exact = findPricing(preference, pricingDb);
  if (exact) return exact;

  const prefLower = preference.toLowerCase();
  let best: { row: PricingRow; score: number } | null = null;
  for (const row of pricingDb) {
    if (row.item_type != null && row.item_type !== "materiaal") continue;
    const tokens = significantTokens(row.item_name);
    const score = tokens.filter((t) => prefLower.includes(t)).length;
    if (score > 0 && (!best || score > best.score)) {
      best = { row, score };
    }
  }
  return best?.row ?? null;
}

/**
 * Klapt de componenten van één assembly uit naar geprijsde regels.
 *
 * @param components - assembly_components (gesorteerd op sort_order)
 * @param input - invoer (oppervlak + optioneel L×B, diepte, zanddikte)
 * @param pricingDb - actieve pricing-rijen (vooraf geladen, geen live-join per regel)
 */
export function expandAssembly(
  components: AssemblyComponent[],
  input: AssemblyInput,
  pricingDb: PricingRow[]
): ExpandResult {
  const area = input.area_m2;
  const hasDepth = input.afgraafdiepte_cm != null && input.afgraafdiepte_cm > 0;
  const hasZand = input.zanddikte_cm != null && input.zanddikte_cm > 0;

  const depth = hasDepth ? input.afgraafdiepte_cm! : 0;
  const zand = hasZand ? input.zanddikte_cm! : MIN_ZANDDIKTE_CM;
  // Gebruik AI-berekende opsluitbandenlengte als die beschikbaar is;
  // anders standaard omtrekformule (exact als L×B bekend, anders schatting).
  const perimeter =
    input.opsluiting_lengte_m != null && input.opsluiting_lengte_m > 0
      ? input.opsluiting_lengte_m
      : input.length_m && input.width_m
        ? (input.length_m + input.width_m) * 2
        : Math.sqrt(area) * 4;
  const cunet = (area * depth) / 100;

  const vars: AssemblyVars = {
    qty: area,
    area,
    length_m: input.length_m ?? 0,
    width_m: input.width_m ?? 0,
    afgraafdiepte_cm: depth,
    zanddikte_cm: zand,
    perimeter_m: perimeter,
    cunet_m3: cunet,
  };

  const quoteFlags: string[] = [];

  const lines: ExpandedLine[] = [];

  for (const c of [...components].sort((a, b) => a.sort_order - b.sort_order)) {
    const dependsOnDepth =
      !!c.quantity_formula &&
      (c.quantity_formula.includes("afgraafdiepte_cm") ||
        c.quantity_formula.includes("cunet_m3"));

    // Afgraven overslaan als afgraafdiepte niet is opgegeven.
    const isAfgraafComponent =
      c.item_name_match?.toLowerCase().includes("afgraven") ?? false;
    if (isAfgraafComponent && !hasDepth) {
      continue;
    }

    // Optionele dieptegebonden regels overslaan als diepte ontbreekt.
    if (c.is_optional && dependsOnDepth && !hasDepth) {
      continue;
    }

    // Zand overslaan als zanddikte niet is opgegeven — geen zand vermeld = geen zand.
    const isZandComponent = c.quantity_formula?.includes("zanddikte_cm") ?? false;
    if (isZandComponent && !hasZand) {
      continue;
    }

    const quantityRaw = c.quantity_formula
      ? evaluateAssemblyFormula(c.quantity_formula, vars)
      : area * (c.quantity_per_unit ?? 1);

    const lineFlags: string[] = [];

    // Prijs opzoeken (geen match-naam = handmatige keuze nodig).
    // Een lege match op de hoofd-materiaalregel (oppervlakteformule, niet de
    // opsluitband op de omtrek) wordt opgelost via de materiaalvoorkeur.
    let pricing: PricingRow | null = null;
    let resolvedName: string | null = c.item_name_match;
    if (c.item_name_match) {
      pricing = findPricing(c.item_name_match, pricingDb);
    } else if (
      c.component_type === "materiaal" &&
      input.materialPreference &&
      !c.quantity_formula?.includes("perimeter")
    ) {
      pricing = matchMaterialPreference(input.materialPreference, pricingDb);
      if (pricing) resolvedName = input.materialPreference;
    }

    // Hoeveelheid afronden: m³ (bulk/zand) altijd naar boven op halve kuip,
    // overige eenheden op 3 decimalen.
    const resolvedUnit = pricing?.unit ?? "m²";
    const quantity =
      resolvedUnit === "m3"
        ? Math.ceil(quantityRaw * 2) / 2
        : Math.round(quantityRaw * 1000) / 1000;

    let unitPriceCents: Cents | null = null;
    let totalCents: Cents | null = null;
    let priceSource: "database" | "missing" = "missing";
    let pricingId: string | null = null;

    if (pricing) {
      const unit = unitPriceFor(pricing, c.component_type);
      if (unit != null) {
        unitPriceCents = toCents(unit);
        totalCents = multiplyCents(unitPriceCents, quantity);
        priceSource = "database";
        pricingId = pricing.id;
      }
    }

    if (priceSource === "missing") {
      lineFlags.push(
        resolvedName
          ? `Geen prijs gevonden voor "${resolvedName}" — vul handmatig in`
          : "Materiaalkeuze/prijs handmatig invullen"
      );
    }

    lines.push({
      description: resolvedName ?? "(handmatig in te vullen)",
      line_type: c.component_type,
      quantity,
      unit: resolvedUnit,
      unit_price_cents: unitPriceCents,
      total_cents: totalCents,
      pricing_id: pricingId,
      price_source: priceSource,
      flags: lineFlags,
    });
  }

  return { lines, flags: quoteFlags };
}
