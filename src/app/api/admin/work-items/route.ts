/**
 * Work Items API
 *
 * Slaat interne werkitems op voor een offerte (v2 pipeline).
 * Naast de klantofferte-secties bevat een v2 offerte ook work_items
 * voor het interne werkdocument en leerdata.
 *
 * POST /api/admin/work-items
 *   body: { quote_id, items: WorkItemDbRow[], trigger_learning?: boolean }
 *
 * GET /api/admin/work-items?quote_id=...
 *   Returns alle work_items voor een offerte
 *
 * DELETE /api/admin/work-items?quote_id=...
 *   Verwijdert alle work_items voor een offerte (voor her-opslaan)
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { saveEstimates } from "@/lib/services/learning.service";

// ─────────────────────────────────────────────────────────────────────────────
// Supabase client
// ─────────────────────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — opslaan
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { quote_id, items, trigger_learning = false } = body;

    if (!quote_id || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "quote_id en items zijn verplicht" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Verwijder bestaande items eerst (idempotent opslaan)
    await supabase.from("work_items").delete().eq("quote_id", quote_id);

    if (items.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Voeg nieuwe items toe
    const rows = items.map(
      (
        item: {
          section_name: string;
          description: string;
          hours_estimated: number;
          hours_actual?: number;
          material_flag?: string;
          material_qty?: number;
          material_unit?: string;
          material_desc?: string;
          material_price?: number;
          material_price_incl_btw?: boolean;
          display_order?: number;
          work_type_key?: string;
        },
        idx: number
      ) => ({
        quote_id,
        section_name: item.section_name,
        description: item.description,
        hours_estimated: item.hours_estimated,
        hours_actual: item.hours_actual ?? null,
        material_flag: item.material_flag ?? "geen",
        material_qty: item.material_qty ?? null,
        material_unit: item.material_unit ?? null,
        material_desc: item.material_desc ?? null,
        material_price: item.material_price ?? null,
        material_price_incl_btw: item.material_price_incl_btw ?? true,
        display_order: item.display_order ?? idx,
        work_type_key: item.work_type_key ?? null,
      })
    );

    const { data, error } = await supabase
      .from("work_items")
      .insert(rows)
      .select("id");

    if (error) {
      console.error("[work-items POST] Supabase fout:", error.message);
      return NextResponse.json(
        { error: "Opslaan mislukt: " + error.message },
        { status: 500 }
      );
    }

    // Optioneel: leerdata opslaan
    if (trigger_learning) {
      const estimates = items
        .filter((item: { work_type_key?: string }) => Boolean(item.work_type_key))
        .map((item: { work_type_key: string; hours_estimated: number; hours_actual?: number }) => ({
          work_type_key: item.work_type_key,
          hours_estimated: item.hours_estimated,
          hours_actual: item.hours_actual,
          quote_id,
          user_adjusted: true,
        }));

      if (estimates.length > 0) {
        await saveEstimates(estimates);
      }
    }

    return NextResponse.json({ success: true, count: data?.length ?? 0 });
  } catch (error) {
    console.error("[work-items POST] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Onverwachte fout bij opslaan" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — ophalen
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const quote_id = searchParams.get("quote_id");

    if (!quote_id) {
      return NextResponse.json(
        { error: "quote_id is verplicht" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("work_items")
      .select("*")
      .eq("quote_id", quote_id)
      .order("display_order", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Ophalen mislukt: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    console.error("[work-items GET] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Onverwachte fout bij ophalen" },
      { status: 500 }
    );
  }
}
