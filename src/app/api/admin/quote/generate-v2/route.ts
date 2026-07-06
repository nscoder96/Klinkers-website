/**
 * Generate Quote V2 — geconsolideerde stratenmaker-pipeline.
 *
 * Drie aanroepvormen (C2.4):
 *   phase 'extract' — alleen Laag 1 (AI Understanding) + generation-run-log.
 *     Er wordt níéts geëxpandeerd of geprijsd: de gebruiker bevestigt eerst.
 *   phase 'price'   — pipeline (Laag 2–4) over de BEVESTIGDE activiteiten uit
 *     de bevestigingsstap; optioneel persist. Extractie-correcties worden bij
 *     persist gelogd (extraction_corrected) en de run krijgt de definitieve
 *     flags + snapshot.
 *   geen phase      — volledige keten in één aanroep (bestaand gedrag, o.a.
 *     voor de demo-omgeving).
 *
 * Body extract: { phase, notes, method?, layout? }
 * Body price:   { phase, generationRunId, activities, method?, layout?,
 *                 persist?, projectDescription?, projectAddress?, customer* }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  analyzeNotes,
  PROMPT_VERSION,
  UNDERSTANDING_MODEL,
} from "@/lib/services/ai-understanding.service";
import {
  logGenerationRun,
  updateGenerationRun,
} from "@/lib/pipeline/generation-log.service";
import { toPipelineActivities } from "@/lib/pipeline/activity-mapper";
import { loadActiveAssemblies } from "@/lib/assembly/assembly-loader";
import { loadActivePricing } from "@/lib/pipeline/pricing-loader";
import {
  runQuotePipeline,
  type PipelineConfig,
  type PipelineResult,
} from "@/lib/pipeline/quote-pipeline.service";
import { persistQuote } from "@/lib/pipeline/quote-persistence.service";
import { recordExtractionCorrections } from "@/lib/pipeline/quote-corrections.service";
import { ensureLead } from "@/lib/pipeline/ensure-lead";
import { createServerClient } from "@/lib/supabase/client";
import { ActivitySchema, type Activity } from "@/lib/schemas/ai-understanding.schema";
import type { PriceMethod } from "@/lib/pricing/pricing-methods.service";
import type { LayoutOption } from "@/lib/pricing/quote-structuring.service";

const VALID_METHODS: PriceMethod[] = ["uitgesplitst", "meterprijs", "uren"];
const VALID_LAYOUTS: LayoutOption[] = ["uitgesplitst", "arbeid_totaalpost", "aanneemsom"];

/** Bevestigde activiteit uit de bevestigingsstap (systeemgrens → zod). */
const ConfirmedActivitySchema = ActivitySchema.extend({
  original_index: z.number().int().min(0),
});
const ConfirmedActivitiesSchema = z.array(ConfirmedActivitySchema).min(1);

function formatSectionTitle(
  description: string,
  area_m2: number,
  length_m: number | undefined,
  width_m: number | undefined
): string {
  if (length_m != null && width_m != null) {
    const a = Math.round(length_m * width_m * 10) / 10;
    return `${description} ${length_m}×${width_m} m (${a} m²)`;
  }
  if (area_m2 > 0) return `${description} ${area_m2} m²`;
  return `${description} [AFMETINGEN ONTBREKEN]`;
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const body = await request.json();

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database niet geconfigureerd" },
        { status: 503 }
      );
    }

    if (body.phase === "extract") return handleExtract(supabase, body, startedAt);
    if (body.phase === "price") return handlePrice(supabase, body);
    return handleFull(supabase, body, startedAt);
  } catch (error) {
    console.error("Generate quote v2 error:", error);
    return NextResponse.json(
      {
        error: "Er ging iets mis bij het genereren van de offerte",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/** Instellingen + overrides → PipelineConfig. */
async function loadConfig(
  supabase: SupabaseClient,
  method: unknown,
  layout: unknown
): Promise<PipelineConfig> {
  const { data: settings } = await supabase
    .from("quote_settings")
    .select(
      "default_pricing_method, default_labor_display, default_hourly_rate, min_hours_per_day, day_rounding"
    )
    .limit(1)
    .maybeSingle();

  return {
    method: pickMethod(method, settings?.default_pricing_method),
    layout: pickLayout(layout, settings?.default_labor_display),
    hourly_rate: numOr(settings?.default_hourly_rate, 85),
    min_hours_per_day: numOr(settings?.min_hours_per_day, 8),
    day_rounding: (settings?.day_rounding as PipelineConfig["day_rounding"]) ?? "ceil",
    vat_pct: 21,
  };
}

/**
 * Fase 1 (C2.4): alleen AI-extractie. Niets gaat de rekenpipeline in — de
 * gebruiker bevestigt (en corrigeert) eerst. De run wordt al gelogd zodat de
 * bevestigingscorrecties er straks aan gekoppeld kunnen worden.
 */
async function handleExtract(
  supabase: SupabaseClient,
  body: Record<string, unknown>,
  startedAt: number
) {
  const notes = body.notes;
  if (!notes || typeof notes !== "string" || notes.trim().length === 0) {
    return NextResponse.json(
      { error: "Schouwnotities zijn verplicht" },
      { status: 400 }
    );
  }

  const aiResult = await analyzeNotes(notes.trim());
  const config = await loadConfig(supabase, body.method, body.layout);

  const generationRunId = await logGenerationRun(supabase, {
    quote_id: null,
    notes_raw: notes.trim(),
    ai_output: aiResult,
    model: UNDERSTANDING_MODEL,
    prompt_version: PROMPT_VERSION,
    confidence: aiResult.confidence ?? null,
    flags: [],
    config,
    duration_ms: Date.now() - startedAt,
  });

  if (aiResult.activities.length === 0) {
    return NextResponse.json(
      {
        error: "Geen werkzaamheden gedetecteerd in de notities",
        suggestion: "Voeg afmetingen of materialen toe.",
      },
      { status: 422 }
    );
  }

  return NextResponse.json({
    generationRunId,
    ai: {
      summary: aiResult.summary,
      confidence: aiResult.confidence,
      activities: aiResult.activities,
    },
    config,
  });
}

/**
 * Fase 2 (C2.4): pipeline over de bevestigde activiteiten. Bij persist worden
 * de extractie-correcties gelogd (diff origineel vs. bevestigd) en krijgt de
 * run quote-koppeling + regel-snapshot; de definitieve pipeline-flags gaan
 * altijd naar de run (bron voor de verzend-gate, C2.1).
 */
async function handlePrice(supabase: SupabaseClient, body: Record<string, unknown>) {
  const parsed = ConfirmedActivitiesSchema.safeParse(body.activities);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ongeldige activiteiten", details: parsed.error.issues },
      { status: 400 }
    );
  }
  const confirmed = parsed.data;
  const generationRunId =
    typeof body.generationRunId === "string" ? body.generationRunId : null;

  const config = await loadConfig(supabase, body.method, body.layout);
  const activities = toPipelineActivities(confirmed);

  const [assemblies, pricing] = await Promise.all([
    loadActiveAssemblies(),
    loadActivePricing(supabase),
  ]);

  const pipeline = runQuotePipeline(activities, assemblies, pricing, config);

  let persistence = null;
  if (body.persist === true) {
    const leadId = await ensureLead(supabase, {
      name: strOr(body.customerName),
      phone: strOr(body.customerPhone),
      email: strOr(body.customerEmail),
      address: strOr(body.customerAddress),
    });

    persistence = await persistQuote(supabase, pipeline, {
      projectDescription:
        typeof body.projectDescription === "string" ? body.projectDescription : undefined,
      projectAddress:
        typeof body.projectAddress === "string" ? body.projectAddress : undefined,
      leadId,
    });

    // Extractie-correcties: diff tegen de originele AI-output uit de run.
    // Kan pas nu — quote_line_corrections.quote_id is not null.
    if (generationRunId) {
      const { data: run } = await supabase
        .from("quote_generation_runs")
        .select("ai_output")
        .eq("id", generationRunId)
        .maybeSingle();
      const original = (run?.ai_output as { activities?: Activity[] } | null)?.activities;
      if (Array.isArray(original)) {
        await recordExtractionCorrections(
          supabase,
          persistence.quoteId,
          generationRunId,
          original,
          confirmed
        );
      }
    }
  }

  if (generationRunId) {
    await updateGenerationRun(supabase, generationRunId, {
      flags: pipeline.flags,
      ...(persistence
        ? { quote_id: persistence.quoteId, generated_lines: persistence.lineItems }
        : {}),
    });
  }

  return NextResponse.json({
    generationRunId,
    config,
    pipeline: pipelineResponse(pipeline),
    persistence,
  });
}

/** Bestaand gedrag: volledige keten in één aanroep (o.a. demo-omgeving). */
async function handleFull(
  supabase: SupabaseClient,
  body: Record<string, unknown>,
  startedAt: number
) {
  const {
    notes,
    method,
    layout,
    persist,
    projectDescription,
    projectAddress,
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
  } = body;

  if (!notes || typeof notes !== "string" || notes.trim().length === 0) {
    return NextResponse.json(
      { error: "Schouwnotities zijn verplicht" },
      { status: 400 }
    );
  }

  // Laag 1: AI Understanding
  const aiResult = await analyzeNotes(notes.trim());

  // Instellingen + overrides (vóór de 422-check, zodat elke run — ook één
  // zonder gedetecteerde werkzaamheden — met config gelogd kan worden, B1).
  const config = await loadConfig(supabase, method, layout);

  if (aiResult.activities.length === 0) {
    await logGenerationRun(supabase, {
      quote_id: null,
      notes_raw: notes.trim(),
      ai_output: aiResult,
      model: UNDERSTANDING_MODEL,
      prompt_version: PROMPT_VERSION,
      confidence: aiResult.confidence ?? null,
      flags: [],
      config,
      duration_ms: Date.now() - startedAt,
    });
    return NextResponse.json(
      {
        error: "Geen werkzaamheden gedetecteerd in de notities",
        suggestion: "Voeg afmetingen of materialen toe.",
      },
      { status: 422 }
    );
  }

  const activities = toPipelineActivities(aiResult.activities);

  // Laag 2–4: assemblies + pricing laden, pipeline draaien
  const [assemblies, pricing] = await Promise.all([
    loadActiveAssemblies(),
    loadActivePricing(supabase),
  ]);

  const pipeline = runQuotePipeline(activities, assemblies, pricing, config);

  let persistence = null;
  if (persist === true) {
    // Maak — indien klantgegevens zijn ingevuld — direct een lead aan en
    // koppel die aan de offerte, zodat de offerte altijd een klant heeft.
    const leadId = await ensureLead(supabase, {
      name: strOr(customerName),
      phone: strOr(customerPhone),
      email: strOr(customerEmail),
      address: strOr(customerAddress),
    });

    persistence = await persistQuote(supabase, pipeline, {
      projectDescription:
        (typeof projectDescription === "string" ? projectDescription : undefined) ??
        aiResult.summary,
      projectAddress:
        (typeof projectAddress === "string" ? projectAddress : undefined) ??
        (strOr(customerAddress) || undefined),
      leadId,
    });
  }

  // B1: elke generatie als één rij loggen (ook zonder persist).
  // Niet-blokkerend — een mislukte logregel breekt de offertestroom niet.
  const generationRunId = await logGenerationRun(supabase, {
    quote_id: persistence?.quoteId ?? null,
    notes_raw: notes.trim(),
    ai_output: aiResult,
    model: UNDERSTANDING_MODEL,
    prompt_version: PROMPT_VERSION,
    confidence: aiResult.confidence ?? null,
    flags: pipeline.flags,
    config,
    duration_ms: Date.now() - startedAt,
    generated_lines: persistence?.lineItems ?? null,
  });

  return NextResponse.json({
    generationRunId,
    ai: {
      summary: aiResult.summary,
      confidence: aiResult.confidence,
      activities: aiResult.activities,
    },
    config,
    pipeline: pipelineResponse(pipeline),
    persistence,
  });
}

/** Pipeline-resultaat → response-vorm (gedeeld door 'price' en 'full'). */
function pipelineResponse(pipeline: PipelineResult) {
  return {
    sections: pipeline.sections.map((s) => ({
      title: formatSectionTitle(
        s.activity.description,
        s.activity.area_m2,
        s.activity.length_m,
        s.activity.width_m
      ),
      assembly: s.assembly?.name ?? null,
      unmatched: s.unmatched,
      display_lines: s.display?.lines ?? [],
      breakdown: s.structured?.breakdown ?? null,
      distribution: s.structured?.distribution ?? null,
      flags: s.flags,
    })),
    combined: pipeline.combined,
    flags: pipeline.flags,
    hasBlockingFlags: pipeline.hasBlockingFlags,
  };
}

function strOr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function pickMethod(override: unknown, fromSettings: unknown): PriceMethod {
  if (typeof override === "string" && VALID_METHODS.includes(override as PriceMethod)) {
    return override as PriceMethod;
  }
  if (
    typeof fromSettings === "string" &&
    VALID_METHODS.includes(fromSettings as PriceMethod)
  ) {
    return fromSettings as PriceMethod;
  }
  return "uitgesplitst";
}

function pickLayout(override: unknown, fromSettings: unknown): LayoutOption {
  if (typeof override === "string" && VALID_LAYOUTS.includes(override as LayoutOption)) {
    return override as LayoutOption;
  }
  // Settings 'default_labor_display': per_post → uitgesplitst, totaalpost → arbeid_totaalpost.
  if (fromSettings === "totaalpost") return "arbeid_totaalpost";
  return "uitgesplitst";
}

function numOr(v: unknown, fallback: number): number {
  if (v == null) return fallback;
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}
