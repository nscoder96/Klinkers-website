/**
 * Pricing-loader (F5 V1/V2 — DB → engine-vorm).
 *
 * Laadt de actieve prijsbibliotheek één keer (geen live-join per regel, Deel B1)
 * en mapt naar `PricingRow` voor de expansie-engine. Alleen huidige versies
 * (`valid_until IS NULL`).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PricingRow } from "../assembly/assembly-expansion.service";

/**
 * Laadt actieve, huidige pricing-rijen. Geeft een lege lijst terug als de query
 * faalt (de pipeline markeert dan alles als handmatig in te vullen).
 */
export async function loadActivePricing(
  supabase: SupabaseClient
): Promise<PricingRow[]> {
  const { data, error } = await supabase
    .from("pricing")
    .select(
      "id, item_name, item_type, unit, selling_price_default, selling_price_min, selling_price_max, labor_rate_per_hour"
    )
    .eq("is_active", true)
    .is("valid_until", null);

  if (error || !data) {
    console.warn("loadActivePricing: kon pricing niet laden:", error?.message);
    return [];
  }

  return data.map((r) => ({
    id: r.id as string,
    item_name: r.item_name as string,
    item_type: (r.item_type as string | null) ?? null,
    unit: (r.unit as string) ?? "m²",
    selling_price_default: numOrNull(r.selling_price_default),
    selling_price_min: numOrNull(r.selling_price_min),
    selling_price_max: numOrNull(r.selling_price_max),
    labor_rate_per_hour: numOrNull(r.labor_rate_per_hour),
  }));
}

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : null;
}
