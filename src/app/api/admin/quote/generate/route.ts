/**
 * Quote Generation API Route
 *
 * This endpoint provides the proper three-layer architecture implementation
 * that replaces the legacy monolithic /api/admin/analyze-notes endpoint.
 *
 * ARCHITECTURE:
 * Layer 1 (AI Understanding): Detects activities from schouwnotities
 * Layer 2 (Business Logic): Transforms activities into work items with quantities
 * Layer 3 (Pricing): Looks up prices from database (NEVER invents prices)
 *
 * This separation ensures:
 * 1. AI only does what it's good at (understanding natural language)
 * 2. Business rules are explicit and testable
 * 3. Pricing always comes from database (AI never generates prices)
 *
 * REQUEST:
 * POST /api/admin/quote/generate
 * Body: { notes: string } - Schouwnotities from the gardener
 *
 * RESPONSE (200):
 * {
 *   aiUnderstanding: { activities: [...], summary: "..." },
 *   workBreakdown: { items: [...], summary: "..." },
 *   pricedQuote: { items: [...], total_materials: X, total_labor: Y, ... },
 *   metadata: {
 *     generatedAt: "2026-01-22T...",
 *     inputLength: 42,
 *     activitiesDetected: 3,
 *     itemsGenerated: 6,
 *     itemsPriced: 5,
 *     itemsMissing: 1
 *   }
 * }
 *
 * ERRORS:
 * - 400: Invalid request (missing or empty notes)
 * - 422: Validation error (AI output or business logic validation failed)
 * - 503: AI service unavailable (Anthropic API error)
 * - 500: Generic server error
 */

import { NextRequest, NextResponse } from "next/server";
import {
  analyzeNotes,
  generateWorkBreakdown,
  lookupPricing,
  ValidationError,
} from "@/lib/services";

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const notes = body.notes;

    if (!notes || typeof notes !== "string" || notes.trim().length === 0) {
      return NextResponse.json(
        { error: "Geen schouwnotities ontvangen" },
        { status: 400 }
      );
    }

    // 2. Execute three-layer pipeline
    console.log("[Quote Generation] Starting pipeline for notes:", notes.substring(0, 100) + "...");

    // Layer 1: AI Understanding
    console.log("[Layer 1] Analyzing notes with AI...");
    const aiUnderstanding = await analyzeNotes(notes);
    console.log(`[Layer 1] Detected ${aiUnderstanding.activities.length} activities`);

    // Layer 2: Business Logic
    console.log("[Layer 2] Generating work breakdown...");
    const workBreakdown = await generateWorkBreakdown(aiUnderstanding);
    console.log(`[Layer 2] Generated ${workBreakdown.items.length} work items`);

    // Layer 3: Pricing
    console.log("[Layer 3] Looking up prices...");
    const pricedQuote = await lookupPricing(workBreakdown);
    console.log(`[Layer 3] Priced ${pricedQuote.items.filter(i => i.price_source === 'database').length} items from database`);

    // 3. Calculate metadata
    const itemsPriced = pricedQuote.items.filter(
      (i) => i.price_source === "database"
    ).length;
    const itemsMissing = pricedQuote.items.filter(
      (i) => i.price_source === "missing"
    ).length;

    // 4. Return complete pipeline result
    return NextResponse.json(
      {
        aiUnderstanding,
        workBreakdown,
        pricedQuote,
        metadata: {
          generatedAt: new Date().toISOString(),
          inputLength: notes.length,
          activitiesDetected: aiUnderstanding.activities.length,
          itemsGenerated: workBreakdown.items.length,
          itemsPriced,
          itemsMissing,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Error handling with proper logging
    console.error("[Quote Generation] Error:", error);

    // ValidationError: Business logic or AI output validation failed
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          error: error.message,
          details: error.zodError.issues,
        },
        { status: 422 }
      );
    }

    // Anthropic API errors: Service unavailable
    if (
      error instanceof Error &&
      (error.message.includes("Anthropic") ||
        error.name === "AnthropicError" ||
        error.constructor.name.includes("Anthropic"))
    ) {
      return NextResponse.json(
        {
          error: "AI service tijdelijk niet beschikbaar",
          details: "Probeer het later opnieuw.",
        },
        { status: 503 }
      );
    }

    // Generic errors
    return NextResponse.json(
      {
        error: "Er ging iets mis bij het genereren van de offerte",
        details:
          error instanceof Error ? error.message : "Onbekende fout",
      },
      { status: 500 }
    );
  }
}
