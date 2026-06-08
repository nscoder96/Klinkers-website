/**
 * Learning Service (C1)
 *
 * Slaat werkitem-ramingen op als leerdata en haalt historische gemiddelden op.
 * Die gemiddelden worden meegegeven aan de v2 AI prompt voor betere urenramingen.
 *
 * Werkt via de `hour_estimates_history` tabel.
 */

import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface EstimateToSave {
  work_type_key: string;
  unit?: string;
  qty_per_unit?: number;
  hours_estimated: number;
  hours_actual?: number;
  quote_id?: string;
  user_adjusted?: boolean;
}

export interface HistoricalRate {
  work_type_key: string;
  unit?: string;
  /** Gemiddeld aantal uren per eenheid */
  avg_hours_per_unit: number;
  /** Aantal offertes waarop dit gebaseerd is */
  sample_count: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────────────────────

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase URL of sleutel ontbreekt in omgevingsvariabelen");
  }

  return createClient(url, key);
}

// ─────────────────────────────────────────────────────────────────────────────
// Opslaan
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sla een uurschatting op als leerdata.
 * Wordt aangeroepen nadat de gebruiker het werkdocument opslaat.
 */
export async function saveEstimate(estimate: EstimateToSave): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from("hour_estimates_history").insert({
    work_type_key: estimate.work_type_key,
    unit: estimate.unit ?? null,
    qty_per_unit: estimate.qty_per_unit ?? null,
    hours_estimated: estimate.hours_estimated,
    hours_actual: estimate.hours_actual ?? null,
    quote_id: estimate.quote_id ?? null,
    user_adjusted: estimate.user_adjusted ?? false,
  });

  if (error) {
    // Niet-kritiek: leerdata opslaan mislukt mag de offertestroom niet blokkeren
    console.error("[LearningService] Opslaan leerdata mislukt:", error.message);
  }
}

/**
 * Sla meerdere schattingen tegelijk op (voor werkdocument opslaan).
 */
export async function saveEstimates(
  estimates: EstimateToSave[]
): Promise<void> {
  const supabase = getSupabaseClient();

  const rows = estimates.map((e) => ({
    work_type_key: e.work_type_key,
    unit: e.unit ?? null,
    qty_per_unit: e.qty_per_unit ?? null,
    hours_estimated: e.hours_estimated,
    hours_actual: e.hours_actual ?? null,
    quote_id: e.quote_id ?? null,
    user_adjusted: e.user_adjusted ?? false,
  }));

  const { error } = await supabase.from("hour_estimates_history").insert(rows);

  if (error) {
    console.error("[LearningService] Bulk opslaan leerdata mislukt:", error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ophalen
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Haal historische uurgemiddelden op voor de gegeven work_type_keys.
 * Wordt gebruikt om de AI v2 prompt te verrijken.
 *
 * @param workTypeKeys - Lijst van work_type_keys om op te zoeken
 * @param minSamples - Minimaal aantal offertes voor betrouwbaar gemiddelde (default: 2)
 */
export async function getHistoricalRates(
  workTypeKeys: string[],
  minSamples = 2
): Promise<HistoricalRate[]> {
  if (workTypeKeys.length === 0) return [];

  const supabase = getSupabaseClient();

  // Haal alle relevante records op, bereken gemiddelde per werk_type + eenheid
  const { data, error } = await supabase
    .from("hour_estimates_history")
    .select("work_type_key, unit, hours_estimated, qty_per_unit")
    .in("work_type_key", workTypeKeys);

  if (error || !data) {
    console.error("[LearningService] Ophalen historische data mislukt:", error?.message);
    return [];
  }

  // Groepeer + gemiddelde berekenen
  const grouped = new Map<
    string,
    { total_hours: number; count: number; unit?: string }
  >();

  for (const row of data) {
    const key = `${row.work_type_key}__${row.unit ?? ""}`;

    if (!grouped.has(key)) {
      grouped.set(key, { total_hours: 0, count: 0, unit: row.unit ?? undefined });
    }

    const entry = grouped.get(key)!;
    // Normaliseer op per-eenheid basis als qty beschikbaar
    const hoursPerUnit =
      row.qty_per_unit && row.qty_per_unit > 0
        ? row.hours_estimated / row.qty_per_unit
        : row.hours_estimated;

    entry.total_hours += hoursPerUnit;
    entry.count += 1;
  }

  return Array.from(grouped.entries())
    .filter(([, v]) => v.count >= minSamples)
    .map(([key, v]) => {
      const workTypeKey = key.split("__")[0];
      return {
        work_type_key: workTypeKey,
        unit: v.unit,
        avg_hours_per_unit: v.total_hours / v.count,
        sample_count: v.count,
      };
    });
}
