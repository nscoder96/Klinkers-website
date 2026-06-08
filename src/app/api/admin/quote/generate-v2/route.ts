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
import { analyzeNotes } from "@/lib/services/ai-understanding.service";
import { toPipelineActivities } from "@/lib/pipeline/activity-mapper";
import { loadActiveAssemblies } from "@/lib/assembly/assembly-loader";
import { loadActivePricing } from "@/lib/pipeline/pricing-loader";
import {
  runQuotePipeline,
  type PipelineConfig,
} from "@/lib/pipeline/quote-pipeline.service";
import { persistQuote } from "@/lib/pipeline/quote-persistence.service";
import { createServerClient } from "@/lib/supabase/client";
import type { PriceMethod } from "@/lib/pricing/pricing-methods.service";
import type { LayoutOption } from "@/lib/pricing/quote-structuring.service";

const VALID_METHODS: PriceMethod[] = ["uitgesplitst", "meterprijs", "uren"];
const VALID_LAYOUTS: LayoutOption[] = ["uitgesplitst", "arbeid_totaalpost", "aanneemsom"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { notes, method, layout, persist, projectDescription, projectAddress } = body;

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
    if (aiResult.activities.length === 0) {
      return NextResponse.json(
        {
          error: "Geen werkzaamheden gedetecteerd in de notities",
          suggestion: "Voeg afmetingen of materialen toe.",
        },
        { status: 422 }
      );
    }

    const activities = toPipelineActivities(aiResult.activities);

    // Instellingen + overrides
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

    // Laag 2–4: assemblies + pricing laden, pipeline draaien
    const [assemblies, pricing] = await Promise.all([
      loadActiveAssemblies(),
      loadActivePricing(supabase),
    ]);

    const pipeline = runQuotePipeline(activities, assemblies, pricing, config);

    let persistence = null;
    if (persist === true) {
      persistence = await persistQuote(supabase, pipeline, {
        projectDescription: projectDescription ?? aiResult.summary,
        projectAddress,
      });
    }

    return NextResponse.json({
      ai: {
        summary: aiResult.summary,
        confidence: aiResult.confidence,
        activities: aiResult.activities,
      },
      config,
      pipeline: {
        sections: pipeline.sections.map((s) => ({
          title: s.activity.description,
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
