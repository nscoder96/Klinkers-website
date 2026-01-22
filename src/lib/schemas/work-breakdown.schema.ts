/**
 * Work Breakdown Schema (Layer 2)
 *
 * Defines the output contract for the Work Breakdown service.
 * This layer transforms AI-detected activities into concrete work items
 * with quantities and units, but WITHOUT prices.
 *
 * CRITICAL: NO price fields in this schema.
 * This layer calculates quantities only.
 */

import { z } from "zod";

/**
 * Categories matching Layer 1 for consistency.
 */
export const WorkCategoryEnum = z.enum([
  "grondwerk",
  "bestrating",
  "erfafscheiding",
  "vlonders",
  "gazon",
  "beplanting",
  "overkappingen",
  "waterwerken",
  "verlichting",
  "overig",
]);

/**
 * Type of work item: labor or material.
 * Essential for pricing lookup in Layer 3.
 */
export const LineTypeEnum = z.enum([
  "arbeid", // Labor/work hours
  "materiaal", // Materials/products
]);

/**
 * Common units used in hovenier calculations.
 */
export const UnitEnum = z.enum([
  "m2", // Square meters
  "m3", // Cubic meters
  "stuk", // Pieces/items
  "meter", // Linear meters
  "uur", // Hours (for labor)
  "ton", // Tons (for bulk materials)
  "liter", // Liters
]);

/**
 * A single work item in the breakdown.
 * Represents a concrete line item with quantity but no price.
 */
export const WorkItemSchema = z.object({
  id: z.string().uuid().describe("Unique identifier for this work item"),
  category: WorkCategoryEnum.describe("Category of work"),
  description: z
    .string()
    .describe("Human-readable description of the work item"),
  line_type: LineTypeEnum.describe("Whether this is labor or material"),
  quantity: z.number().positive().describe("Amount of work/material"),
  unit: UnitEnum.describe("Unit of measurement"),
  source_activity_id: z
    .string()
    .optional()
    .describe("Links back to the Layer 1 activity that generated this item"),
  is_herstraten: z
    .boolean()
    .describe("True if reusing existing materials (affects pricing differently)"),
});

/**
 * Complete work breakdown result.
 * Contains all work items derived from Layer 1 activities.
 */
export const WorkBreakdownSchema = z.object({
  items: z
    .array(WorkItemSchema)
    .describe("All work items in the breakdown"),
  summary: z
    .string()
    .describe("Summary of the work breakdown"),
});

// Inferred TypeScript types from Zod schemas
export type WorkCategory = z.infer<typeof WorkCategoryEnum>;
export type LineType = z.infer<typeof LineTypeEnum>;
export type Unit = z.infer<typeof UnitEnum>;
export type WorkItem = z.infer<typeof WorkItemSchema>;
export type WorkBreakdown = z.infer<typeof WorkBreakdownSchema>;
