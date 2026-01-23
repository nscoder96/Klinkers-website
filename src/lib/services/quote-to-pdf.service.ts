/**
 * Quote to PDF Converter
 *
 * Converts a StructuredQuote (from the pipeline) into the format
 * expected by PDFDownloadButton (sections with line items).
 *
 * This bridges the new four-layer pipeline output with the existing
 * PDF generation component.
 */

import { StructuredQuote, CategorySection, StructuredLineItem } from "../schemas/structured-quote.schema";

interface PDFLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  total_price?: number;
  line_type?: "arbeid" | "materiaal";
}

interface PDFSection {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
  subtotal: number;
  line_items: PDFLineItem[];
}

interface PDFQuoteData {
  subtotal: number;
  btw_percentage: number;
  btw_amount: number;
  total: number;
}

/**
 * Converts a StructuredQuote to PDF sections format.
 *
 * Each category becomes a section with arbeid and materiaal
 * items combined into the section's line_items array.
 */
export function structuredQuoteToPDFSections(quote: StructuredQuote): PDFSection[] {
  return quote.categories.map((category, index) => ({
    id: `section-${category.source_activity_id ?? category.category}`,
    title: category.element_title,
    description: null,
    display_order: index,
    subtotal: category.category_total,
    line_items: [
      ...category.arbeid_items.map(toPDFLineItem),
      ...category.materiaal_items.map(toPDFLineItem),
    ],
  }));
}

/**
 * Extracts PDF-compatible totals from a StructuredQuote.
 */
export function structuredQuoteToPDFTotals(quote: StructuredQuote): PDFQuoteData {
  return {
    subtotal: quote.totals.subtotal,
    btw_percentage: quote.totals.btw_percentage,
    btw_amount: quote.totals.btw_amount,
    total: quote.totals.total_incl_btw,
  };
}

/**
 * Converts a StructuredLineItem to the PDF LineItem format.
 */
function toPDFLineItem(item: StructuredLineItem): PDFLineItem {
  return {
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unit_price: item.unit_price ?? 0,
    total: item.total_price ?? 0,
    total_price: item.total_price ?? 0,
    line_type: item.line_type,
  };
}
