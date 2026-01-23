/**
 * Structured Quote Schema (Layer 4 - Output)
 *
 * Groups priced items by category with arbeid/materiaal separation.
 * This is the final output format for quote generation.
 *
 * Data flow: AI → WorkBreakdown → PricedQuote → StructuredQuote
 */

import { z } from "zod";
import { WorkCategoryEnum, LineTypeEnum, UnitEnum } from "./work-breakdown.schema";
import { PriceSourceEnum } from "./priced-quote.schema";

/**
 * A structured line item within a category section.
 * Contains all display fields: description, quantity, unit, unit_price, total.
 */
export const StructuredLineItemSchema = z.object({
  id: z.string().uuid(),
  description: z.string(),
  line_type: LineTypeEnum,
  quantity: z.number().positive(),
  unit: UnitEnum,
  unit_price: z.number().nullable(),
  total_price: z.number().nullable(),
  price_source: PriceSourceEnum,
  pricing_id: z.string().nullable(),
  is_herstraten: z.boolean(),
});

/**
 * A section grouping related work items by tuinelement.
 * Contains separate arbeid and materiaal arrays with subtotals.
 * Grouped by source_activity_id (element) rather than category.
 */
export const CategorySectionSchema = z.object({
  category: WorkCategoryEnum,
  category_label: z.string().describe("Dutch display name for the category"),
  element_title: z.string().describe("Description of the tuinelement (e.g. 'Overkapping 4x3m douglas')"),
  source_activity_id: z.string().nullable().describe("Link to the original activity, null for 'Overig' section"),
  arbeid_items: z.array(StructuredLineItemSchema),
  materiaal_items: z.array(StructuredLineItemSchema),
  arbeid_subtotal: z.number(),
  materiaal_subtotal: z.number(),
  category_total: z.number(),
  has_missing_prices: z.boolean(),
});

/**
 * Grand totals for the entire quote.
 */
export const QuoteTotalsSchema = z.object({
  arbeid_total: z.number(),
  materiaal_total: z.number(),
  subtotal: z.number(),
  btw_percentage: z.number().default(21),
  btw_amount: z.number(),
  total_incl_btw: z.number(),
});

/**
 * Complete structured quote with categories and totals.
 */
export const StructuredQuoteSchema = z.object({
  categories: z.array(CategorySectionSchema),
  totals: QuoteTotalsSchema,
  has_missing_prices: z.boolean(),
  missing_items: z.array(z.string()),
  item_count: z.number(),
  summary: z.string(),
});

// Inferred TypeScript types
export type StructuredLineItem = z.infer<typeof StructuredLineItemSchema>;
export type CategorySection = z.infer<typeof CategorySectionSchema>;
export type QuoteTotals = z.infer<typeof QuoteTotalsSchema>;
export type StructuredQuote = z.infer<typeof StructuredQuoteSchema>;
