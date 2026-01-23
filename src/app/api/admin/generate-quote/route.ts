/**
 * Generate Quote API Endpoint
 *
 * Runs the full pipeline:
 * 1. AI Understanding: Parse schouwnotities → activities
 * 2. Business Logic: Generate work items + expand with work rules
 * 2.5. Rules Engine: Validate + correct (remove duplicates, add dependencies)
 * 3. Pricing: Lookup prices from database
 * 4. Structure: Group by category with subtotals
 *
 * Returns a StructuredQuote with categories, arbeid/materiaal split,
 * calculated totals including BTW, and rules audit trail.
 */

import { NextResponse } from "next/server";
import { analyzeNotes } from "@/lib/services/ai-understanding.service";
import {
  generateWorkBreakdown,
  expandWithWorkRules,
  ValidationError,
} from "@/lib/services/business-logic.service";
import { validateWorkBreakdown } from "@/lib/rules/rules-engine.service";
import { lookupPricing } from "@/lib/services/pricing.service";
import { structureQuote } from "@/lib/services/quote-structure.service";
import { validateQuote } from "@/lib/services/quote-validation.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { notes, btw_percentage } = body;

    if (!notes || typeof notes !== "string" || notes.trim().length === 0) {
      return NextResponse.json(
        { error: "Schouwnotities zijn verplicht" },
        { status: 400 }
      );
    }

    // Layer 1: AI Understanding
    const aiResult = await analyzeNotes(notes.trim());

    if (aiResult.activities.length === 0) {
      return NextResponse.json(
        {
          error: "Geen werkzaamheden gedetecteerd in de notities",
          suggestion:
            "Probeer meer detail toe te voegen, bijv. afmetingen of materialen",
        },
        { status: 422 }
      );
    }

    // Layer 2: Business Logic (work items + work rules expansion)
    const breakdown = await generateWorkBreakdown(aiResult);
    const expandedBreakdown = await expandWithWorkRules(breakdown);

    // Layer 2.5: Rules Engine (validate + correct)
    const rulesResult = validateWorkBreakdown(expandedBreakdown.items, expandedBreakdown.activity_map);
    const validatedBreakdown = {
      items: rulesResult.items,
      activity_map: rulesResult.activity_map,
      summary: `${expandedBreakdown.summary} ${rulesResult.summary}`,
    };

    // Layer 3: Pricing Lookup
    const pricedQuote = await lookupPricing(validatedBreakdown);

    // Layer 4: Structure (group by element)
    const structured = structureQuote(pricedQuote, btw_percentage ?? 21, validatedBreakdown.activity_map);

    // Layer 5: Validation
    const validation = validateQuote(structured);

    return NextResponse.json({
      quote: structured,
      validation,
      rules_applied: rulesResult.applied_rules,
      rules_warnings: rulesResult.warnings,
      metadata: {
        activities_detected: aiResult.activities.length,
        items_generated: structured.item_count,
        items_priced:
          structured.item_count - structured.missing_items.length,
        items_missing: structured.missing_items.length,
        rules_corrections: rulesResult.applied_rules.length,
        rules_warnings: rulesResult.warnings.length,
        confidence: aiResult.confidence,
      },
    });
  } catch (error) {
    console.error("Generate quote error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: "AI output kon niet worden verwerkt", details: error.message },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: "Er ging iets mis bij het genereren van de offerte" },
      { status: 500 }
    );
  }
}
