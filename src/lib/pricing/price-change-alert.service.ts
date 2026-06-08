/**
 * Prijswijziging-signalering (Laag 3 / Deel C2). Wanneer een prijs in de
 * bibliotheek verandert, maakt dit een `price_change_alert` aan en markeert het de
 * concept-offertes die nog op de óúde snapshot-prijs staan — die vragen review.
 *
 * Pure rekenfuncties (pct-verschil, drempel, payload) + één dunne DB-schil
 * (`recordPriceChange`), conform het patroon van `assembly-loader.ts`.
 */

import { createServerClient } from "../supabase/client";

/** Bron van de prijswijziging. */
export type AlertSource = "manual" | "cbs_index";

/** Drempel (%) waarboven een wijziging een alert verdient. */
const DEFAULT_THRESHOLD_PCT = 3;

/** Insert-payload voor `price_change_alerts`. */
export interface AlertInsert {
  pricing_item_id: string;
  old_price: number;
  new_price: number;
  pct_change: number;
  source: AlertSource;
  affected_draft_quotes: string[];
}

export interface BuildAlertInput {
  pricingItemId: string;
  oldPrice: number;
  newPrice: number;
  source?: AlertSource;
  affectedDraftQuoteIds?: string[];
}

/**
 * Procentuele wijziging van oud → nieuw. Oude prijs 0/ontbrekend → 0% (geen
 * deling door nul; een prijs die "uit het niets" verschijnt is geen wijziging).
 */
export function computePctChange(oldPrice: number, newPrice: number): number {
  if (!oldPrice || oldPrice === 0) return 0;
  return ((newPrice - oldPrice) / oldPrice) * 100;
}

/** Of een wijziging (in %) de drempel haalt — in beide richtingen. */
export function shouldAlert(pctChange: number, thresholdPct = DEFAULT_THRESHOLD_PCT): boolean {
  return Math.abs(pctChange) >= thresholdPct;
}

/** Bouwt een alert-payload met afgerond pct-verschil. */
export function buildAlertPayload(input: BuildAlertInput): AlertInsert {
  const pct = computePctChange(input.oldPrice, input.newPrice);
  return {
    pricing_item_id: input.pricingItemId,
    old_price: input.oldPrice,
    new_price: input.newPrice,
    pct_change: Math.round(pct * 100) / 100,
    source: input.source ?? "manual",
    affected_draft_quotes: input.affectedDraftQuoteIds ?? [],
  };
}

/**
 * Zoekt concept-offertes die een snapshot van dit prijs-item bevatten.
 * Pad: `quote_line_items.pricing_id` → `quote_sections.quote_id` → `quotes(status='draft')`.
 * Faalt zacht (lege lijst) als Supabase niet beschikbaar is.
 */
export async function findAffectedDraftQuotes(
  pricingItemId: string
): Promise<string[]> {
  const supabase = createServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("quote_line_items")
    .select("quote_sections!inner(quote_id, quotes!inner(status))")
    .eq("pricing_id", pricingItemId)
    .eq("quote_sections.quotes.status", "draft");

  if (error || !data) {
    console.warn("findAffectedDraftQuotes:", error?.message);
    return [];
  }

  const ids = new Set<string>();
  for (const row of data as unknown as Array<{ quote_sections?: { quote_id?: string } }>) {
    const id = row.quote_sections?.quote_id;
    if (id) ids.add(id);
  }
  return [...ids];
}

/**
 * Registreert een prijswijziging: berekent het verschil, en als dat de drempel
 * haalt, vindt de geraakte concept-offertes en schrijft een `price_change_alert`.
 * Onder de drempel of zonder DB → `null` (geen alert).
 *
 * @returns het aangemaakte alert-record, of null als er geen alert nodig/mogelijk was
 */
export async function recordPriceChange(
  pricingItemId: string,
  oldPrice: number,
  newPrice: number,
  source: AlertSource = "manual",
  thresholdPct = DEFAULT_THRESHOLD_PCT
): Promise<AlertInsert | null> {
  const pct = computePctChange(oldPrice, newPrice);
  if (!shouldAlert(pct, thresholdPct)) return null;

  const supabase = createServerClient();
  if (!supabase) return null;

  const affected = await findAffectedDraftQuotes(pricingItemId);
  const payload = buildAlertPayload({
    pricingItemId,
    oldPrice,
    newPrice,
    source,
    affectedDraftQuoteIds: affected,
  });

  const { error } = await supabase.from("price_change_alerts").insert(payload);
  if (error) {
    console.error("recordPriceChange: kon alert niet opslaan:", error.message);
    return null;
  }
  return payload;
}
