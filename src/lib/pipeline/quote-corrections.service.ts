/**
 * Quote-corrections (B3) — legt bij verzenden het verschil vast tussen de
 * oorspronkelijk gegenereerde regels (snapshot in `quote_generation_runs.
 * generated_lines`) en de regels op het moment van verzenden. Per verschil
 * één rij in `quote_line_corrections`: dit is het leersignaal waarmee de
 * learning-loop straks patronen in handmatige correcties kan vinden.
 *
 * Diff op regel-id: de edit-endpoints muteren per rij (PATCH/DELETE op
 * quote_line_items.id), dus ids zijn stabiel onder bewerkingen.
 *
 * Niet-blokkerend (patroon learning.service/generation-log): een mislukte
 * correctielog mag de verzendflow nooit breken.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Activity } from "../schemas/ai-understanding.schema";

/** Snapshot van één offerteregel, zoals gepersisteerd (prijzen in euro's). */
export interface QuoteLineSnapshot {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  line_type: string;
  section_id: string;
}

export type CorrectionType =
  | "line_added"
  | "line_removed"
  | "quantity_changed"
  | "price_changed"
  | "description_changed"
  | "section_changed"
  | "extraction_corrected";

export interface CorrectionRow {
  correction_type: CorrectionType;
  line_description: string;
  old_value: unknown;
  new_value: unknown;
}

/** Getalvergelijking met kleine tolerantie (euro's/hoeveelheden als float). */
function numChanged(a: number, b: number): boolean {
  return Math.abs(Number(a) - Number(b)) > 0.0001;
}

/**
 * Puur: verschillen tussen gegenereerde en actuele regels, per verschil
 * één rij. Gewijzigde velden op dezelfde regel geven elk hun eigen rij.
 */
export function diffQuoteLines(
  original: QuoteLineSnapshot[],
  current: QuoteLineSnapshot[]
): CorrectionRow[] {
  const rows: CorrectionRow[] = [];
  const currentById = new Map(current.map((l) => [l.id, l]));
  const originalIds = new Set(original.map((l) => l.id));

  for (const o of original) {
    const c = currentById.get(o.id);
    if (!c) {
      rows.push({
        correction_type: "line_removed",
        line_description: o.description,
        old_value: o,
        new_value: null,
      });
      continue;
    }
    if (numChanged(o.quantity, c.quantity)) {
      rows.push({
        correction_type: "quantity_changed",
        line_description: o.description,
        old_value: { quantity: o.quantity },
        new_value: { quantity: c.quantity },
      });
    }
    if (numChanged(o.unit_price, c.unit_price)) {
      rows.push({
        correction_type: "price_changed",
        line_description: o.description,
        old_value: { unit_price: o.unit_price },
        new_value: { unit_price: c.unit_price },
      });
    }
    if (o.description !== c.description) {
      rows.push({
        correction_type: "description_changed",
        line_description: o.description,
        old_value: { description: o.description },
        new_value: { description: c.description },
      });
    }
    if (o.section_id !== c.section_id) {
      rows.push({
        correction_type: "section_changed",
        line_description: o.description,
        old_value: { section_id: o.section_id },
        new_value: { section_id: c.section_id },
      });
    }
  }

  for (const c of current) {
    if (!originalIds.has(c.id)) {
      rows.push({
        correction_type: "line_added",
        line_description: c.description,
        old_value: null,
        new_value: c,
      });
    }
  }

  return rows;
}

/**
 * Bevestigde activiteit uit de bevestigingsstap (C2.4): de AI-activiteit
 * zoals de gebruiker hem heeft goedgekeurd, met de index van het origineel
 * in `ai_output.activities` zodat de diff weet welke activiteit dit was.
 */
export type ConfirmedActivity = Activity & { original_index: number };

/** De velden die de gebruiker in de bevestigingsstap kan corrigeren. */
const EXTRACTION_DIM_FIELDS = [
  "length",
  "width",
  "area",
  "afgraafdiepte_cm",
  "zanddikte_cm",
  "opsluiting_lengte_m",
] as const;

function dimensionsChanged(a: Activity, b: Activity): boolean {
  return EXTRACTION_DIM_FIELDS.some(
    (f) => (a.dimensions?.[f] ?? null) !== (b.dimensions?.[f] ?? null)
  );
}

/**
 * Puur (C2.4): verschillen tussen de originele AI-extractie en de bevestigde
 * activiteiten. Eén rij per verwijderde activiteit (new_value null) en één
 * rij per activiteit met gecorrigeerde afmetingen — de correctie is één
 * bewuste handeling, dus geen rij per veld zoals bij de regel-diff.
 */
export function diffExtractionActivities(
  original: Activity[],
  confirmed: ConfirmedActivity[]
): CorrectionRow[] {
  const rows: CorrectionRow[] = [];
  const byIndex = new Map(confirmed.map((c) => [c.original_index, c]));

  original.forEach((o, i) => {
    const c = byIndex.get(i);
    if (!c) {
      rows.push({
        correction_type: "extraction_corrected",
        line_description: o.description,
        old_value: o,
        new_value: null,
      });
      return;
    }
    if (dimensionsChanged(o, c)) {
      rows.push({
        correction_type: "extraction_corrected",
        line_description: o.description,
        old_value: { dimensions: o.dimensions },
        new_value: { dimensions: c.dimensions },
      });
    }
  });

  return rows;
}

/**
 * Schrijft de extractie-correcties weg zodra de offerte bestaat (persist) —
 * eerder kan niet: quote_line_corrections.quote_id is not null. Zelfde
 * niet-blokkerende patroon als recordQuoteCorrections. Geeft het aantal
 * weggeschreven rijen terug, of null bij een fout.
 */
export async function recordExtractionCorrections(
  supabase: SupabaseClient,
  quoteId: string,
  generationRunId: string | null,
  original: Activity[],
  confirmed: ConfirmedActivity[]
): Promise<number | null> {
  try {
    const corrections = diffExtractionActivities(original, confirmed);
    if (corrections.length === 0) return 0;

    const { error } = await supabase.from("quote_line_corrections").insert(
      corrections.map((c) => ({
        quote_id: quoteId,
        generation_run_id: generationRunId,
        correction_type: c.correction_type,
        line_description: c.line_description,
        old_value: c.old_value,
        new_value: c.new_value,
      }))
    );

    if (error) {
      console.error("[QuoteCorrections] Wegschrijven extractie-correcties mislukt:", error.message);
      return null;
    }
    return corrections.length;
  } catch (e) {
    console.error(
      "[QuoteCorrections] Wegschrijven extractie-correcties mislukt:",
      e instanceof Error ? e.message : e
    );
    return null;
  }
}

/**
 * Orkestratie bij verzenden: haal de jongste generation run van de offerte,
 * diff de snapshot tegen de actuele regels en schrijf de verschillen weg.
 *
 * Geeft het aantal weggeschreven correctierijen terug, of null als er niets
 * te diffen viel (geen run / geen snapshot — bv. een offerte van vóór B3)
 * of het wegschrijven mislukte. Gooit nooit.
 */
export async function recordQuoteCorrections(
  supabase: SupabaseClient,
  quoteId: string
): Promise<number | null> {
  try {
    const { data: run } = await supabase
      .from("quote_generation_runs")
      .select("id, generated_lines")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!run?.id || !Array.isArray(run.generated_lines)) {
      // Geen leerdata-snapshot voor deze offerte — niets te diffen.
      return null;
    }

    const { data: sections } = await supabase
      .from("quote_sections")
      .select("id")
      .eq("quote_id", quoteId);
    const sectionIds = (sections ?? []).map((s: { id: string }) => s.id);

    const { data: items } = sectionIds.length
      ? await supabase
          .from("quote_line_items")
          .select("id, description, quantity, unit, unit_price, line_type, section_id")
          .in("section_id", sectionIds)
      : { data: [] };

    const corrections = diffQuoteLines(
      run.generated_lines as QuoteLineSnapshot[],
      (items ?? []) as QuoteLineSnapshot[]
    );

    if (corrections.length === 0) return 0;

    const { error } = await supabase.from("quote_line_corrections").insert(
      corrections.map((c) => ({
        quote_id: quoteId,
        generation_run_id: run.id,
        correction_type: c.correction_type,
        line_description: c.line_description,
        old_value: c.old_value,
        new_value: c.new_value,
      }))
    );

    if (error) {
      console.error("[QuoteCorrections] Wegschrijven correcties mislukt:", error.message);
      return null;
    }
    return corrections.length;
  } catch (e) {
    console.error(
      "[QuoteCorrections] Wegschrijven correcties mislukt:",
      e instanceof Error ? e.message : e
    );
    return null;
  }
}
