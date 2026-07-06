/**
 * Quote-persistence (F5 V1/V2 — snapshot écht wegschrijven).
 *
 * Dunne DB-schil rond de pipeline: maakt een `quotes`-rij, één `quote_sections`
 * per activiteit en schrijft de regels weg in `quote_line_items` met de
 * **bevroren** `unit_price_snapshot` (via `toLineItemInserts`, Deel B1).
 *
 * Houdt de pure pipeline (runQuotePipeline) gescheiden van I/O. Faalt zacht als
 * Supabase niet geconfigureerd is (geeft dan een duidelijke fout terug).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { toLineItemInserts } from "../pricing/quote-snapshot.service";
import { fromCents, sumCents, Cents } from "../money";
import type { PipelineResult, PipelineSection } from "./quote-pipeline.service";

/** BTW Hoog 21% — zie tax_rates seed. */
const TAX_RATE_21_ID = "b63dbcd0-e69d-4281-94f7-7bb5458ed770";

export interface PersistOptions {
  projectDescription?: string;
  projectAddress?: string;
  customerId?: string | null;
  leadId?: string | null;
  /** Geldigheidsduur in dagen (default 30). */
  validityDays?: number;
  /** Vandaag als ISO-datum (YYYY-MM-DD); injecteerbaar voor tests. */
  today?: string;
}

export interface PersistResult {
  quoteId: string;
  quoteNumber: string;
  sectionsCreated: number;
  lineItemsCreated: number;
}

/**
 * Sectie-subtotaal in centen uit de DISPLAY-regels — dezelfde bron als de
 * regels die naar `quote_line_items` gaan. Zo is het opgeslagen totaal altijd
 * exact de som van de opgeslagen regels, ook bij methode 'uren' waar de
 * weergaveregels afwijken van de expand-regels (A1).
 */
function sectionSubtotalCents(section: PipelineSection): Cents {
  return sumCents(section.display?.lines.map((l) => l.total_cents ?? 0) ?? []);
}

/** Genereert het volgende offertenummer (OFF-YYYY-NNN). */
async function nextQuoteNumber(
  supabase: SupabaseClient,
  year: number
): Promise<string> {
  const prefix = `OFF-${year}-`;
  const { data } = await supabase
    .from("quotes")
    .select("quote_number")
    .like("quote_number", `${prefix}%`)
    .order("quote_number", { ascending: false })
    .limit(1);

  const last = data?.[0]?.quote_number as string | undefined;
  const lastSeq = last ? parseInt(last.slice(prefix.length), 10) : 0;
  const seq = Number.isFinite(lastSeq) ? lastSeq + 1 : 1;
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

/**
 * Schrijft een pipeline-resultaat weg als concept-offerte.
 *
 * @throws Error als Supabase niet beschikbaar is of een insert faalt.
 */
export async function persistQuote(
  supabase: SupabaseClient,
  pipeline: PipelineResult,
  opts: PersistOptions = {}
): Promise<PersistResult> {
  const todayIso = opts.today ?? new Date().toISOString().slice(0, 10);
  const year = parseInt(todayIso.slice(0, 4), 10);
  const validUntil = addDays(todayIso, opts.validityDays ?? 30);

  // Totalen uit de display-regels (de bron van de line-items), niet uit de
  // methode-onafhankelijke expand-breakdown — die twee verschillen bij 'uren'.
  const subtotalCents = sumCents(pipeline.sections.map(sectionSubtotalCents));
  const btwCents = Math.round(subtotalCents * 0.21);
  const subtotal = fromCents(subtotalCents);
  const btwAmount = fromCents(btwCents);
  const total = fromCents(subtotalCents + btwCents);

  const quoteNumber = await nextQuoteNumber(supabase, year);

  const { data: quote, error: qErr } = await supabase
    .from("quotes")
    .insert({
      quote_number: quoteNumber,
      status: "draft",
      valid_until: validUntil,
      project_description: opts.projectDescription ?? null,
      project_address: opts.projectAddress ?? null,
      customer_id: opts.customerId ?? null,
      lead_id: opts.leadId ?? null,
      subtotal,
      btw_percentage: 21,
      btw_amount: btwAmount,
      total,
      line_items: [],
    })
    .select("id, quote_number")
    .single();

  if (qErr || !quote) {
    throw new Error(`Kon offerte niet aanmaken: ${qErr?.message ?? "onbekend"}`);
  }

  let sectionsCreated = 0;
  let lineItemsCreated = 0;
  let displayOrder = 0;

  for (const [index, section] of pipeline.sections.entries()) {
    if (!section.display) continue; // unmatched → geen sectie

    const { data: sectionRow, error: sErr } = await supabase
      .from("quote_sections")
      .insert({
        quote_id: quote.id,
        title: section.activity.description,
        display_order: index,
        subtotal: fromCents(sectionSubtotalCents(section)),
      })
      .select("id")
      .single();

    if (sErr || !sectionRow) {
      throw new Error(`Kon sectie niet aanmaken: ${sErr?.message ?? "onbekend"}`);
    }
    sectionsCreated++;

    const inserts = toLineItemInserts(section.display.lines, {
      sectionId: sectionRow.id,
      assemblyId: section.assembly?.id ?? null,
      taxRateId: TAX_RATE_21_ID,
      vatRatePct: 21,
      startDisplayOrder: displayOrder,
    });
    displayOrder += inserts.length;

    if (inserts.length > 0) {
      const { error: liErr } = await supabase.from("quote_line_items").insert(
        inserts.map((i) => ({
          section_id: i.section_id,
          pricing_id: i.pricing_id,
          description: i.description,
          description_snapshot: i.description_snapshot,
          quantity: i.quantity,
          unit: i.unit,
          unit_price: i.unit_price ?? 0,
          unit_price_snapshot: i.unit_price_snapshot,
          total_price: i.total_price ?? 0,
          line_type: i.line_type,
          assembly_id: i.assembly_id,
          tax_rate_id: i.tax_rate_id,
          vat_rate: i.vat_rate,
          is_visible_on_pdf: i.is_visible_on_pdf,
          is_auto_calculated: i.is_auto_calculated,
          display_order: i.display_order,
        }))
      );

      if (liErr) {
        throw new Error(`Kon offerteregels niet aanmaken: ${liErr.message}`);
      }
      lineItemsCreated += inserts.length;
    }
  }

  return {
    quoteId: quote.id,
    quoteNumber: quote.quote_number,
    sectionsCreated,
    lineItemsCreated,
  };
}

/** Telt N dagen bij een ISO-datum (YYYY-MM-DD) op, geeft ISO terug. */
function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
