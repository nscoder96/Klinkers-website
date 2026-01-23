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
 * Metadata about a source activity from Layer 1.
 * Used to group work items by tuinelement in the final quote.
 */
export const ActivityMetadataSchema = z.object({
  description: z.string().describe("Human-readable description of the element"),
  type: WorkCategoryEnum.describe("Work category of the activity"),
  action: z.string().describe("Action performed (nieuw, herstraten, etc.)"),
  dimensions: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    area: z.number().optional(),
    count: z.number().optional(),
  }).describe("Dimensions of the activity"),
});

/**
 * Complete work breakdown result.
 * Contains all work items derived from Layer 1 activities.
 */
export const WorkBreakdownSchema = z.object({
  items: z
    .array(WorkItemSchema)
    .describe("All work items in the breakdown"),
  activity_map: z
    .record(z.string(), ActivityMetadataSchema)
    .describe("Maps source_activity_id to activity metadata for element grouping"),
  summary: z
    .string()
    .describe("Summary of the work breakdown"),
});

// Inferred TypeScript types from Zod schemas
export type WorkCategory = z.infer<typeof WorkCategoryEnum>;
export type LineType = z.infer<typeof LineTypeEnum>;
export type Unit = z.infer<typeof UnitEnum>;
export type WorkItem = z.infer<typeof WorkItemSchema>;
export type ActivityMetadata = z.infer<typeof ActivityMetadataSchema>;
export type WorkBreakdown = z.infer<typeof WorkBreakdownSchema>;
