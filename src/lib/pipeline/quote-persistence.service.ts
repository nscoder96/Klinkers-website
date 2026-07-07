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
import { fromCents, sumCents, multiplyCents, Cents } from "../money";
import type { PipelineResult, PipelineSection } from "./quote-pipeline.service";
import type {
  EditedSectionInput,
  QuoteLineSnapshot,
} from "./quote-corrections.service";

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
  /**
   * De aangemaakte regels mét rij-ids — snapshot voor `generated_lines` in
   * quote_generation_runs, zodat de verzendflow kan diffen (B3).
   */
  lineItems: QuoteLineSnapshot[];
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
  const createdLineItems: QuoteLineSnapshot[] = [];

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
      // .select() geeft de aangemaakte rijen mét id terug — de snapshot
      // waartegen de verzendflow correcties dift (B3).
      const { data: createdRows, error: liErr } = await supabase
        .from("quote_line_items")
        .insert(
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
        )
        .select("id, description, quantity, unit, unit_price, line_type, section_id");

      if (liErr) {
        throw new Error(`Kon offerteregels niet aanmaken: ${liErr.message}`);
      }
      createdLineItems.push(...((createdRows ?? []) as QuoteLineSnapshot[]));
      lineItemsCreated += inserts.length;
    }
  }

  return {
    quoteId: quote.id,
    quoteNumber: quote.quote_number,
    sectionsCreated,
    lineItemsCreated,
    lineItems: createdLineItems,
  };
}

/**
 * R1.1: schrijft de stap 3-staat exact weg zoals de gebruiker hem ziet —
 * inclusief zelf toegevoegde regels en complete zelfgebouwde secties.
 * Totalen zijn de som van de meegezonden regels (in centen), zodat het
 * opgeslagen totaal per definitie klopt met de opgeslagen regels.
 */
export async function persistEditedQuote(
  supabase: SupabaseClient,
  sections: EditedSectionInput[],
  opts: PersistOptions = {}
): Promise<PersistResult> {
  const todayIso = opts.today ?? new Date().toISOString().slice(0, 10);
  const year = parseInt(todayIso.slice(0, 4), 10);
  const validUntil = addDays(todayIso, opts.validityDays ?? 30);

  const lineTotalCents = (l: { quantity: number; unit_price_cents: number | null }): Cents =>
    l.unit_price_cents == null ? 0 : multiplyCents(l.unit_price_cents, l.quantity);
  const sectionCents = (s: EditedSectionInput): Cents =>
    sumCents(s.lines.map(lineTotalCents));

  const subtotalCents = sumCents(sections.map(sectionCents));
  const btwCents = Math.round(subtotalCents * 0.21);

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
      subtotal: fromCents(subtotalCents),
      btw_percentage: 21,
      btw_amount: fromCents(btwCents),
      total: fromCents(subtotalCents + btwCents),
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
  const createdLineItems: QuoteLineSnapshot[] = [];

  for (const [index, section] of sections.entries()) {
    const { data: sectionRow, error: sErr } = await supabase
      .from("quote_sections")
      .insert({
        quote_id: quote.id,
        title: section.title,
        display_order: index,
        subtotal: fromCents(sectionCents(section)),
      })
      .select("id")
      .single();

    if (sErr || !sectionRow) {
      throw new Error(`Kon sectie niet aanmaken: ${sErr?.message ?? "onbekend"}`);
    }
    sectionsCreated++;

    if (section.lines.length === 0) continue;

    const inserts = section.lines.map((l) => {
      const unitPrice = l.unit_price_cents != null ? fromCents(l.unit_price_cents) : 0;
      return {
        section_id: sectionRow.id,
        pricing_id: l.pricing_id ?? null,
        description: l.description,
        description_snapshot: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unit_price: unitPrice,
        unit_price_snapshot: l.unit_price_cents != null ? unitPrice : null,
        total_price: fromCents(lineTotalCents(l)),
        line_type: l.line_type,
        assembly_id: null,
        tax_rate_id: TAX_RATE_21_ID,
        vat_rate: 21,
        is_visible_on_pdf: true,
        is_auto_calculated: false,
        display_order: displayOrder++,
      };
    });

    const { data: createdRows, error: liErr } = await supabase
      .from("quote_line_items")
      .insert(inserts)
      .select("id, description, quantity, unit, unit_price, line_type, section_id");

    if (liErr) {
      throw new Error(`Kon offerteregels niet aanmaken: ${liErr.message}`);
    }
    createdLineItems.push(...((createdRows ?? []) as QuoteLineSnapshot[]));
    lineItemsCreated += inserts.length;
  }

  return {
    quoteId: quote.id,
    quoteNumber: quote.quote_number,
    sectionsCreated,
    lineItemsCreated,
    lineItems: createdLineItems,
  };
}

/** Telt N dagen bij een ISO-datum (YYYY-MM-DD) op, geeft ISO terug. */
function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
