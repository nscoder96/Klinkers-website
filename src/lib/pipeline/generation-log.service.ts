/**
 * Generation-run logging (B1) — schrijft elke generate-v2-aanroep als één
 * rij naar `quote_generation_runs`: input (notities), volledige AI-output,
 * model + promptversie, vlaggen, config en duur.
 *
 * Niet-blokkerend, zelfde patroon als learning.service: een mislukte
 * logregel mag de offertestroom nooit breken — fout wordt gelogd naar de
 * console en de functie geeft null terug.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface GenerationRunInput {
  /** Gekoppelde offerte (na persist), anders null. */
  quote_id: string | null;
  /** Letterlijke schouwnotities. */
  notes_raw: string;
  /** Volledige structured output van Laag 1. */
  ai_output: unknown;
  model: string;
  prompt_version: string;
  confidence: number | null;
  /** QuoteFlag[] van de pipeline. */
  flags: unknown;
  /** De gebruikte PipelineConfig. */
  config: unknown;
  duration_ms: number;
  /**
   * Snapshot van de gepersisteerde regels mét rij-ids (B3) — null bij een
   * run zonder persist. Bron voor de correctie-diff bij verzenden.
   */
  generated_lines?: unknown;
}

/**
 * Schrijft één generation run weg. Geeft de rij-id terug (voor koppeling
 * met correcties, B3) of null als het wegschrijven mislukte.
 */
export async function logGenerationRun(
  supabase: SupabaseClient,
  run: GenerationRunInput
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("quote_generation_runs")
      .insert({
        quote_id: run.quote_id,
        notes_raw: run.notes_raw,
        ai_output: run.ai_output,
        model: run.model,
        prompt_version: run.prompt_version,
        confidence: run.confidence,
        flags: run.flags,
        config: run.config,
        duration_ms: run.duration_ms,
        generated_lines: run.generated_lines ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[GenerationLog] Wegschrijven generation run mislukt:", error.message);
      return null;
    }
    return (data?.id as string) ?? null;
  } catch (e) {
    console.error(
      "[GenerationLog] Wegschrijven generation run mislukt:",
      e instanceof Error ? e.message : e
    );
    return null;
  }
}
