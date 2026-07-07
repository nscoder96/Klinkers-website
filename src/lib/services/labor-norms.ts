/**
 * Urennormen (C3) — de normen die de Laag 1-prompt voedt, uit de database
 * in plaats van hardcoded in de prompttekst.
 *
 * Fail hard, gok nooit: kan de tabel niet gelezen worden of is hij leeg,
 * dan wordt de generatie geweigerd met een duidelijke fout. Er bestaat
 * bewust géén ingebakken terugval-prompt meer.
 *
 * `buildNormsBlock` is puur en wordt bewaakt door een golden-test die
 * garandeert dat de geseede tabel exact hetzelfde promptblok oplevert als
 * de oude hardcoded tekst.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface LaborNorm {
  id?: string;
  work_type_key: string;
  /** Weergavenaam in de prompt, bv. "Klinkers herstraten". */
  label: string;
  /** Groepskop in de prompt, bv. "Herstraten/herleggen". */
  category: string;
  /** Eenheid: "m²", "meter", "stuks", "stuk", "palen", "punten". */
  unit: string;
  /** Uren per basis_qty eenheden; null als display_text de regel bepaalt. */
  hours_per_unit: number | null;
  /** Basis van de norm, bv. 10 voor "per 10m²". */
  basis_qty: number;
  /** Vrije weergavetekst i.p.v. "X uur per Y" (bv. "meegerekend in afgraven"). */
  display_text: string | null;
  sort_order: number;
  source: "handmatig" | "geleerd";
  is_active: boolean;
}

/** Uren met minimaal één decimaal: 1 → "1.0", 0.75 → "0.75". */
function formatHours(hours: number): string {
  return Number.isInteger(hours) ? hours.toFixed(1) : String(hours);
}

/** "10m²" plakt aan het getal, woord-eenheden krijgen een spatie; basis 1 = alleen de eenheid. */
function formatBasis(basisQty: number, unit: string): string {
  if (basisQty === 1) return unit;
  return unit === "m²" ? `${basisQty}m²` : `${basisQty} ${unit}`;
}

/** Eén normregel zoals hij in de prompt staat. */
function formatNormLine(n: LaborNorm): string {
  if (n.display_text) return `- ${n.label}: ${n.display_text}`;
  return `- ${n.label}: ${formatHours(n.hours_per_unit ?? 0)} uur per ${formatBasis(n.basis_qty, n.unit)}`;
}

/**
 * Bouwt het normenblok voor de prompt: groepskoppen in volgorde van eerste
 * verschijning (op sort_order), daaronder de normregels.
 */
export function buildNormsBlock(norms: LaborNorm[]): string {
  const sorted = [...norms].sort((a, b) => a.sort_order - b.sort_order);
  const groups: { category: string; lines: string[] }[] = [];

  for (const n of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.category === n.category) {
      last.lines.push(formatNormLine(n));
    } else {
      groups.push({ category: n.category, lines: [formatNormLine(n)] });
    }
  }

  return groups
    .map((g) => `**${g.category}:**\n${g.lines.join("\n")}`)
    .join("\n\n");
}

/**
 * Laadt de actieve urennormen. Gooit bij een queryfout én bij een lege
 * uitkomst — zonder normen wordt er niet gegenereerd (geen stille terugval).
 */
export async function loadActiveLaborNorms(
  supabase: SupabaseClient
): Promise<LaborNorm[]> {
  const { data, error } = await supabase
    .from("labor_norms")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(
      `Urennormen niet beschikbaar (${error.message}) — offerte-generatie geweigerd`
    );
  }
  if (!data || data.length === 0) {
    throw new Error(
      "Geen actieve urennormen in de database — offerte-generatie geweigerd"
    );
  }
  return data as LaborNorm[];
}
