/**
 * CBS Index Monitor API (Fase 6 / Deel C2).
 *
 * POST  → draait de monitor: haalt CBS 84538NED op (of accepteert stub-data in
 *         de body), bewaart nieuwe metingen in `cbs_index_readings` en maakt bij
 *         een stijging > 3% een `price_change_alert` (source 'cbs_index').
 * GET    → status voor de dashboard-banner: aantal onbevestigde alerts + laatste
 *         meting.
 *
 * Mag als stub draaien: POST { stub: [{datum,waarde,categorie}, ...] } slaat de
 * live CBS-fetch over (handig zonder netwerk).
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import {
  fetchCBSIndex,
  parseCBSReadings,
  computeIndexChangePct,
  shouldAlertIndex,
  latestTwo,
  type CBSIndexRecord,
} from "@/lib/cbs/cbs-index.service";

export async function POST(request: Request) {
  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database niet geconfigureerd" }, { status: 503 });
  }

  let stub: CBSIndexRecord[] | null = null;
  try {
    const body = await request.json();
    if (Array.isArray(body?.stub)) stub = parseCBSReadings({ value: body.stub });
  } catch {
    // geen body → live fetch
  }

  const fetched = stub ?? (await fetchCBSIndex());
  if (!fetched || fetched.length === 0) {
    return NextResponse.json(
      { ok: false, reason: "Geen CBS-data beschikbaar (netwerk of dataset leeg)" },
      { status: 502 }
    );
  }

  // Nieuwe metingen idempotent opslaan (datum+categorie uniek genoeg voor stub).
  const { data: existing } = await supabase
    .from("cbs_index_readings")
    .select("datum, categorie");
  const seen = new Set((existing ?? []).map((r) => `${r.datum}|${r.categorie}`));
  const fresh = fetched.filter((r) => !seen.has(`${r.datum}|${r.categorie}`));

  if (fresh.length > 0) {
    await supabase.from("cbs_index_readings").insert(fresh);
  }

  // Vergelijk de twee meest recente metingen uit de opgehaalde reeks.
  const pair = latestTwo(fetched);
  let alertCreated = false;
  let pctChange = 0;

  if (pair) {
    pctChange = computeIndexChangePct(pair.prev.waarde, pair.latest.waarde);
    if (shouldAlertIndex(pctChange)) {
      // Niet dubbel alerten voor dezelfde meting.
      const { data: dup } = await supabase
        .from("price_change_alerts")
        .select("id")
        .eq("source", "cbs_index")
        .gte("detected_at", new Date(Date.now() - 60_000).toISOString())
        .limit(1);

      if (!dup || dup.length === 0) {
        await supabase.from("price_change_alerts").insert({
          source: "cbs_index",
          old_price: pair.prev.waarde,
          new_price: pair.latest.waarde,
          pct_change: pctChange,
          affected_draft_quotes: [],
        });
        alertCreated = true;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    readings_stored: fresh.length,
    latest: pair?.latest ?? null,
    pct_change: pctChange,
    alert_created: alertCreated,
  });
}

export async function GET() {
  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database niet geconfigureerd" }, { status: 503 });
  }

  const { count } = await supabase
    .from("price_change_alerts")
    .select("id", { count: "exact", head: true })
    .is("acknowledged_at", null);

  const { data: latest } = await supabase
    .from("cbs_index_readings")
    .select("datum, waarde, categorie, fetched_at")
    .order("datum", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    unacknowledged_alerts: count ?? 0,
    latest_reading: latest ?? null,
  });
}
