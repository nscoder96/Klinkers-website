/**
 * Flag-gate (C2.1) — dwingt de invariant "een offerte met blocking flags kan
 * niet verstuurd worden" server-side af.
 *
 * Ontwerp (beslispunt C2.1): gate op de gepersisteerde flags uit de jongste
 * `quote_generation_runs`-rij van de offerte. Een blocking flag telt niet meer
 * mee zodra er een expliciete oplos-actie voor is gelogd in
 * `quote_flag_resolutions` (wie/wanneer/welke flag — zelf een leersignaal).
 * Resolutie matcht op code + message: dezelfde code voor een ándere post
 * blijft blokkeren.
 *
 * Fail hard, gok nooit: kan de resolutie-tabel niet gelezen worden, dan geldt
 * niets als opgelost (de gate wordt strenger, nooit ruimer).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuoteFlag } from "../quote-flags";

export interface QuoteFlagWithResolution extends QuoteFlag {
  resolved: boolean;
}

export interface QuoteFlagsResult {
  /** Jongste generation run van de offerte; null = geen run (pre-B1 offerte). */
  runId: string | null;
  flags: QuoteFlagWithResolution[];
}

/** Defensieve parse van de flags-jsonb: alleen goedgevormde vlaggen tellen. */
function parseFlags(raw: unknown): QuoteFlag[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (f): f is QuoteFlag =>
      f != null &&
      typeof f === "object" &&
      typeof (f as QuoteFlag).code === "string" &&
      typeof (f as QuoteFlag).severity === "string" &&
      typeof (f as QuoteFlag).message === "string"
  );
}

async function latestRun(
  supabase: SupabaseClient,
  quoteId: string
): Promise<{ id: string; flags: unknown } | null> {
  const { data } = await supabase
    .from("quote_generation_runs")
    .select("id, flags")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { id: string; flags: unknown } | null) ?? null;
}

/**
 * Alle flags van de jongste generation run, met per flag of er een
 * oplos-actie voor gelogd is. Geen run = geen flags (offertes van vóór de
 * logging hebben geen vlag-snapshot om op te gaten).
 */
export async function getQuoteFlags(
  supabase: SupabaseClient,
  quoteId: string
): Promise<QuoteFlagsResult> {
  const run = await latestRun(supabase, quoteId);
  if (!run) return { runId: null, flags: [] };

  const flags = parseFlags(run.flags);

  const { data: resolutions, error } = await supabase
    .from("quote_flag_resolutions")
    .select("flag_code, flag_message")
    .eq("generation_run_id", run.id);

  if (error) {
    // Strenger, nooit ruimer: zonder leesbare resoluties is niets opgelost.
    console.error("[FlagGate] Kon flag-resoluties niet lezen:", error.message);
  }

  const resolved = new Set(
    ((resolutions ?? []) as Array<{ flag_code: string; flag_message: string }>).map(
      (r) => `${r.flag_code}|${r.flag_message}`
    )
  );

  return {
    runId: run.id,
    flags: flags.map((f) => ({
      ...f,
      resolved: resolved.has(`${f.code}|${f.message}`),
    })),
  };
}

/** De vlaggen waarop de send-route moet weigeren: blocking én niet opgelost. */
export async function getUnresolvedBlockingFlags(
  supabase: SupabaseClient,
  quoteId: string
): Promise<QuoteFlag[]> {
  const { flags } = await getQuoteFlags(supabase, quoteId);
  return flags
    .filter((f) => f.severity === "blocking" && !f.resolved)
    .map(({ code, severity, message }) => ({ code, severity, message }));
}

/**
 * Expliciete oplos-actie: logt dat deze flag handmatig is afgehandeld.
 * Idempotent (unieke combinatie run+code+message). Gooit bij falen — oplossen
 * is een bewuste gebruikersactie en mag niet stil mislukken.
 */
export async function resolveQuoteFlag(
  supabase: SupabaseClient,
  quoteId: string,
  code: string,
  message: string
): Promise<void> {
  const run = await latestRun(supabase, quoteId);
  if (!run) {
    throw new Error("Geen generation run voor deze offerte — niets op te lossen");
  }

  const { error } = await supabase.from("quote_flag_resolutions").upsert(
    {
      quote_id: quoteId,
      generation_run_id: run.id,
      flag_code: code,
      flag_message: message,
    },
    { onConflict: "generation_run_id,flag_code,flag_message", ignoreDuplicates: true }
  );

  if (error) {
    throw new Error(`Kon flag-resolutie niet opslaan: ${error.message}`);
  }
}
