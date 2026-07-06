/**
 * Generate Quote V2 — geconsolideerde stratenmaker-pipeline.
 *
 * Keten: analyzeNotes (Laag 1) → toPipelineActivities → loadActiveAssemblies +
 * loadActivePricing → runQuotePipeline (Laag 2–4) → optioneel persistQuote
 * (snapshot écht wegschrijven naar quote_line_items, Deel B1).
 *
 * Body: { notes, method?, layout?, persist?, projectDescription?, projectAddress? }
 */

import { NextResponse } from "next/server";
import {
  analyzeNotes,
  PROMPT_VERSION,
  UNDERSTANDING_MODEL,
} from "@/lib/services/ai-understanding.service";
import { logGenerationRun } from "@/lib/pipeline/generation-log.service";
import { toPipelineActivities } from "@/lib/pipeline/activity-mapper";
import { loadActiveAssemblies } from "@/lib/assembly/assembly-loader";
import { loadActivePricing } from "@/lib/pipeline/pricing-loader";
import {
  runQuotePipeline,
  type PipelineConfig,
} from "@/lib/pipeline/quote-pipeline.service";
import { persistQuote } from "@/lib/pipeline/quote-persistence.service";
import { ensureLead } from "@/lib/pipeline/ensure-lead";
import { createServerClient } from "@/lib/supabase/client";
import type { PriceMethod } from "@/lib/pricing/pricing-methods.service";
import type { LayoutOption } from "@/lib/pricing/quote-structuring.service";

const VALID_METHODS: PriceMethod[] = ["uitgesplitst", "meterprijs", "uren"];
const VALID_LAYOUTS: LayoutOption[] = ["uitgesplitst", "arbeid_totaalpost", "aanneemsom"];

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

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database niet geconfigureerd" },
        { status: 503 }
      );
    }

    // Laag 1: AI Understanding
    const aiResult = await analyzeNotes(notes.trim());

    // Instellingen + overrides (vóór de 422-check, zodat elke run — ook één
    // zonder gedetecteerde werkzaamheden — met config gelogd kan worden, B1).
    const { data: settings } = await supabase
      .from("quote_settings")
      .select(
        "default_pricing_method, default_labor_display, default_hourly_rate, min_hours_per_day, day_rounding"
      )
      .limit(1)
      .maybeSingle();

    const config: PipelineConfig = {
      method: pickMethod(method, settings?.default_pricing_method),
      layout: pickLayout(layout, settings?.default_labor_display),
      hourly_rate: numOr(settings?.default_hourly_rate, 85),
      min_hours_per_day: numOr(settings?.min_hours_per_day, 8),
      day_rounding: (settings?.day_rounding as PipelineConfig["day_rounding"]) ?? "ceil",
      vat_pct: 21,
    };

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
        name: typeof customerName === "string" ? customerName.trim() : "",
        phone: typeof customerPhone === "string" ? customerPhone.trim() : "",
        email: typeof customerEmail === "string" ? customerEmail.trim() : "",
        address: typeof customerAddress === "string" ? customerAddress.trim() : "",
      });

      persistence = await persistQuote(supabase, pipeline, {
        projectDescription: projectDescription ?? aiResult.summary,
        projectAddress: projectAddress ?? (customerAddress || undefined),
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
      pipeline: {
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
      },
      persistence,
    });
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
