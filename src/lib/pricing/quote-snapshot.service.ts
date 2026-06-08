/**
 * Snapshot-mapping (Laag 3 — Deel B1). Zet geprijsde methode-regels om in
 * insert-payloads voor `quote_line_items`, met de **bevroren** eenheidsprijs als
 * `unit_price_snapshot`.
 *
 * Kernregel (Deel B1): de prijs wordt vastgezet op het moment van aanmaken, nooit
 * live-gejoined bij weergave. Wijzigt de prijsbibliotheek later, dan blijft de
 * offerte op zijn snapshot staan — een `price_change_alert` signaleert het verschil.
 *
 * Puur en testbaar: geen DB-call. De aanroeper inserteert de payloads.
 */

import type { MethodLine } from "./pricing-methods.service";
import { fromCents } from "../money";

export interface SnapshotOptions {
  /** FK naar `quote_sections`. */
  sectionId: string;
  /** FK naar `assemblies` (welke template deze regels voortbracht). */
  assemblyId?: string | null;
  /** FK naar `tax_rates` (deze sessie: altijd 21%). */
  taxRateId: string;
  /** BTW-percentage als getal voor de legacy `vat_rate`-kolom (default 21). */
  vatRatePct?: number;
  /** Startwaarde voor `display_order` (default 0). */
  startDisplayOrder?: number;
  /** Standaard PDF-zichtbaarheid (default true). */
  isVisibleDefault?: boolean;
}

/** Insert-payload voor één rij in `quote_line_items`. */
export interface LineItemInsert {
  section_id: string;
  description: string;
  description_snapshot: string;
  quantity: number;
  unit: string;
  unit_price: number | null;
  unit_price_snapshot: number | null;
  total_price: number | null;
  line_type: MethodLine["line_type"];
  pricing_id: string | null;
  assembly_id: string | null;
  tax_rate_id: string;
  vat_rate: number;
  is_visible_on_pdf: boolean;
  is_auto_calculated: boolean;
  display_order: number;
  /** Hint voor de UI: prijs ontbreekt en moet handmatig ingevuld worden. */
  needs_manual_price: boolean;
}

/**
 * Mapt methode-regels naar `quote_line_items`-payloads met bevroren snapshot.
 *
 * @param lines - regels na `applyPricingMethod`
 * @param opts - sectie-/assembly-/tax-koppelingen + display-offset
 */
export function toLineItemInserts(
  lines: MethodLine[],
  opts: SnapshotOptions
): LineItemInsert[] {
  const start = opts.startDisplayOrder ?? 0;
  const vatRate = opts.vatRatePct ?? 21;
  const isVisible = opts.isVisibleDefault ?? true;

  return lines.map((line, index) => {
    const hasPrice = line.unit_price_cents != null;
    const unitPrice = line.unit_price_cents != null ? fromCents(line.unit_price_cents) : null;
    const totalPrice = line.total_cents != null ? fromCents(line.total_cents) : null;

    return {
      section_id: opts.sectionId,
      description: line.description,
      description_snapshot: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unit_price: unitPrice,
      // Bevriezen: snapshot = de eenheidsprijs zoals die NU geldt.
      unit_price_snapshot: unitPrice,
      total_price: totalPrice,
      line_type: line.line_type,
      pricing_id: line.pricing_id,
      assembly_id: opts.assemblyId ?? null,
      tax_rate_id: opts.taxRateId,
      vat_rate: vatRate,
      is_visible_on_pdf: isVisible,
      is_auto_calculated: true,
      display_order: start + index,
      needs_manual_price: !hasPrice,
    };
  });
}
