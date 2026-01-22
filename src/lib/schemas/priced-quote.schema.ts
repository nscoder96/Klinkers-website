/**
 * Priced Quote Schema (Layer 3)
 *
 * Defines the output contract for the Pricing Lookup service.
 * This layer adds prices to work items by looking them up in the database.
 *
 * IMPORTANT: This is the ONLY layer that contains price information.
 * Prices come from the database, NEVER from AI generation.
 */

import { z } from "zod";
import { WorkCategoryEnum, LineTypeEnum, UnitEnum } from "./work-breakdown.schema";

/**
 * Source of the price for a line item.
 * Tracks whether price was found in database or is missing.
 */
export const PriceSourceEnum = z.enum([
  "database", // Price found in pricing database
  "missing", // No matching price found
]);

/**
 * A priced work item - extends WorkItem with price information.
 * Contains all WorkItem fields plus pricing data.
 */
export const PricedItemSchema = z.object({
  // Fields from WorkItem
  id: z.string().uuid().describe("Unique identifier for this item"),
  category: WorkCategoryEnum.describe("Category of work"),
  description: z.string().describe("Human-readable description"),
  line_type: LineTypeEnum.describe("Whether this is labor or material"),
  quantity: z.number().positive().describe("Amount of work/material"),
  unit: UnitEnum.describe("Unit of measurement"),
  source_activity_id: z
    .string()
    .optional()
    .describe("Links back to the Layer 1 activity"),
  is_herstraten: z
    .boolean()
    .describe("True if reusing existing materials"),

  // Price fields - ONLY in this schema
  pricing_id: z
    .string()
    .nullable()
    .describe("ID of the matched pricing entry from database, null if no match"),
  unit_price: z
    .number()
    .nullable()
    .describe("Price per unit in euros, null if no match found"),
  total_price: z
    .number()
    .nullable()
    .describe("Total price (quantity * unit_price), null if no match found"),
  price_source: PriceSourceEnum.describe(
    "Where the price came from - database lookup or missing"
  ),
});

/**
 * Complete priced quote result.
 * Contains all priced items plus metadata about pricing coverage.
 */
export const PricedQuoteSchema = z.object({
  items: z
    .array(PricedItemSchema)
    .describe("All priced items in the quote"),
  summary: z
    .string()
    .describe("Summary of the priced quote"),
  has_missing_prices: z
    .boolean()
    .describe("True if any items could not be priced from database"),
  missing_items: z
    .array(z.string())
    .describe("Descriptions of items that could not be priced"),
});

// Inferred TypeScript types from Zod schemas
export type PriceSource = z.infer<typeof PriceSourceEnum>;
export type PricedItem = z.infer<typeof PricedItemSchema>;
export type PricedQuote = z.infer<typeof PricedQuoteSchema>;
