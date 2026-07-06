/**
 * AI Understanding Schema (Layer 1)
 *
 * Defines the output contract for the AI Understanding service.
 * This layer detects work from schouwnotities WITHOUT generating prices.
 *
 * CRITICAL: NO price fields anywhere in this schema.
 * The AI only identifies what work needs to be done, not what it costs.
 */

import { z } from "zod";

/**
 * Categories of work a hovenier typically performs.
 * Used to classify detected activities.
 */
export const ActivityTypeEnum = z.enum([
  "grondwerk", // Excavation, soil work, leveling
  "bestrating", // Paving, tiles, klinkers
  "erfafscheiding", // Fencing, hedges, boundaries
  "vlonders", // Decking, wooden platforms
  "gazon", // Lawn work, grass
  "beplanting", // Planting, gardens, shrubs
  "overkappingen", // Pergolas, carports, roofing
  "waterwerken", // Ponds, drainage, irrigation
  "verlichting", // Lighting installation
  "overig", // Other/miscellaneous
]);

/**
 * Actions that can be performed on an activity.
 * Distinguishes between new work and modifications.
 */
export const ActionEnum = z.enum([
  "nieuw", // New installation
  "herstraten", // Re-laying existing materials
  "verwijderen", // Removal
  "repareren", // Repair
  "vervangen", // Replace
]);

/**
 * Dimensions detected from the schouwnotities.
 * All fields optional as not all work has all dimensions.
 */
export const DimensionsSchema = z.object({
  length: z.number().optional().describe("Length in meters"),
  width: z.number().optional().describe("Width in meters"),
  height: z.number().optional().describe("Height in meters"),
  count: z.number().optional().describe("Count of items"),
  area: z.number().optional().describe("Area in square meters (m2)"),
  afgraafdiepte_cm: z
    .number()
    .optional()
    .describe(
      "Afgraafdiepte/cunetdiepte in cm — ALLEEN als de stratenmaker dit expliciet noteert. NOOIT gokken of verzinnen."
    ),
  zanddikte_cm: z
    .number()
    .optional()
    .describe(
      "Dikte van het zandbed/zandpakket in cm — ALLEEN als de stratenmaker dit expliciet noteert. NOOIT gokken of verzinnen."
    ),
  opsluiting_lengte_m: z
    .number()
    .optional()
    .describe(
      "Berekende totale lengte opsluitbanden in strekkende meters. Alleen invullen als de notitie aangeeft welke zijdes opsluiting krijgen. Zie berekeningsregels in de prompt."
    ),
});

/**
 * A single detected activity from the schouwnotities.
 * Represents one piece of work the AI identified.
 */
export const ActivitySchema = z.object({
  type: ActivityTypeEnum.describe("Category of work"),
  action: ActionEnum.describe("What action to perform"),
  description: z
    .string()
    .describe("Human-readable description of the detected work"),
  dimensions: DimensionsSchema.describe("Detected dimensions"),
  source_text: z
    .string()
    .describe("Original text from schouwnotities that triggered this detection"),
  materials_mentioned: z
    .array(z.string())
    .describe("Materials explicitly mentioned in the source text"),
  missing_dimensions: z
    .boolean()
    .optional()
    .describe(
      "true als er GEEN lengte/breedte beschikbaar zijn voor dit bestratings-, pad-, terras- of opritonderdeel. false of weggelaten als afmetingen wel aanwezig zijn."
    ),
  estimated_hours: z
    .number()
    .min(0)
    .optional()
    .describe(
      "Geschatte arbeidsuren voor deze activiteit door een 2-mans koppel, berekend via de urennormen in de prompt (som van alle werkonderdelen: afgraven, zandbed, leggen, aantrillen, voegen, opsluitbanden). ALLEEN invullen als de afmetingen bekend zijn; bij missing_dimensions: true weglaten. GEEN prijzen — alleen uren."
    ),
});

/**
 * Complete result from the AI Understanding service.
 * Contains all detected activities and metadata.
 */
export const AIUnderstandingResultSchema = z.object({
  activities: z
    .array(ActivitySchema)
    .describe("All detected activities from the schouwnotities"),
  summary: z
    .string()
    .describe("Narrative description of the overall project"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Overall confidence score (0-1) of the analysis"),
});

// Inferred TypeScript types from Zod schemas
export type ActivityType = z.infer<typeof ActivityTypeEnum>;
export type Action = z.infer<typeof ActionEnum>;
export type Dimensions = z.infer<typeof DimensionsSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type AIUnderstandingResult = z.infer<typeof AIUnderstandingResultSchema>;
