/**
 * Analyze V2 API Endpoint
 *
 * Nieuwe pipeline: schouwnotitie → uren-gebaseerde werkopsplitsing per gebied.
 * Vervangt uiteindelijk /api/admin/generate-quote voor nieuwe offertes.
 *
 * POST body:
 *   notes: string             — schouwnotities (verplicht)
 *   work_type_keys?: string[] — voor historische data verrijking (optioneel)
 *
 * Response:
 *   breakdown: WorkBreakdownV2
 *   historical_rates: HistoricalRate[]
 */

import { NextResponse } from "next/server";
import { analyzeNotesV2 } from "@/lib/services/ai-understanding-v2.service";
import { getHistoricalRates } from "@/lib/services/learning.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { notes, work_type_keys } = body;

    if (!notes || typeof notes !== "string" || notes.trim().length === 0) {
      return NextResponse.json(
        { error: "Schouwnotities zijn verplicht" },
        { status: 400 }
      );
    }

    // Haal historische uurgemiddelden op (verrijkt de AI prompt)
    const historicalRates =
      work_type_keys && Array.isArray(work_type_keys) && work_type_keys.length > 0
        ? await getHistoricalRates(work_type_keys)
        : [];

    // Roep v2 AI service aan
    const breakdown = await analyzeNotesV2(notes.trim(), historicalRates);

    return NextResponse.json({ breakdown, historical_rates: historicalRates });
  } catch (error) {
    console.error("[analyze-v2] Fout tijdens analyse:", error);

    const message =
      error instanceof Error ? error.message : "Onbekende fout";

    return NextResponse.json(
      { error: `Analyse mislukt: ${message}` },
      { status: 500 }
    );
  }
}
