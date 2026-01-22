/**
 * Business Logic Service (Layer 2)
 *
 * Transforms AI-detected activities from Layer 1 into concrete work items
 * with calculated quantities. This layer validates AI output and generates
 * a structured work breakdown.
 *
 * CRITICAL: This service NEVER generates prices.
 * It only calculates quantities. Prices are added in Layer 3.
 *
 * Key responsibility: Herstraten logic
 * When action is 'herstraten' or 'repareren', only generate arbeid items
 * (no materials) because the customer reuses existing materials.
 */

import { z } from "zod";
import {
  AIUnderstandingResultSchema,
  AIUnderstandingResult,
  Activity,
} from "../schemas/ai-understanding.schema";
import {
  WorkBreakdownSchema,
  WorkBreakdown,
  WorkItem,
  WorkCategory,
  LineType,
  Unit,
} from "../schemas/work-breakdown.schema";

/**
 * Custom error class for validation failures at layer boundaries.
 * Contains the underlying Zod error for detailed error reporting.
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly zodError: z.ZodError
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validates and processes raw AI output into a typed AIUnderstandingResult.
 *
 * Uses Zod safeParse for boundary validation - if the AI output doesn't
 * match the expected schema, throws a descriptive ValidationError.
 *
 * @param input - Raw AI output (unknown type)
 * @returns Validated AIUnderstandingResult
 * @throws ValidationError if input doesn't match schema
 *
 * @example
 * ```typescript
 * try {
 *   const validated = processAIOutput(rawAIResponse);
 *   // validated is now typed as AIUnderstandingResult
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error('AI output invalid:', error.zodError.issues);
 *   }
 * }
 * ```
 */
export function processAIOutput(input: unknown): AIUnderstandingResult {
  const result = AIUnderstandingResultSchema.safeParse(input);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new ValidationError(
      `AI output validation failed: ${issues}`,
      result.error
    );
  }

  return result.data;
}

/**
 * Maps AI activity types to work item units based on typical measurement patterns.
 */
function getDefaultUnit(
  category: WorkCategory,
  lineType: LineType
): Unit {
  if (lineType === "arbeid") {
    return "uur";
  }

  // Material units by category
  switch (category) {
    case "bestrating":
    case "gazon":
    case "vlonders":
      return "m2";
    case "grondwerk":
      return "m3";
    case "erfafscheiding":
      return "meter";
    case "beplanting":
    case "verlichting":
      return "stuk";
    default:
      return "stuk";
  }
}

/**
 * Calculates quantity from activity dimensions.
 * Attempts to calculate area from length x width if area not directly provided.
 */
function calculateQuantity(
  activity: Activity,
  lineType: LineType,
  unit: Unit
): number {
  const dims = activity.dimensions;

  // For labor, estimate based on area or count
  if (lineType === "arbeid") {
    // Base labor hours estimation
    // This is a simplified calculation - real implementation would use
    // category-specific labor rates from database
    if (dims.area) {
      return Math.ceil(dims.area / 5); // Rough: 1 hour per 5m2
    }
    if (dims.length && dims.width) {
      return Math.ceil((dims.length * dims.width) / 5);
    }
    if (dims.length) {
      return Math.ceil(dims.length / 3); // Rough: 1 hour per 3m linear
    }
    if (dims.count) {
      return Math.ceil(dims.count / 2); // Rough: 30 min per item
    }
    return 1; // Minimum 1 hour
  }

  // For materials
  switch (unit) {
    case "m2":
      if (dims.area) return dims.area;
      if (dims.length && dims.width) return dims.length * dims.width;
      return 1;
    case "m3":
      if (dims.length && dims.width && dims.height) {
        return dims.length * dims.width * dims.height;
      }
      if (dims.area && dims.height) return dims.area * dims.height;
      return 1;
    case "meter":
      return dims.length ?? 1;
    case "stuk":
      return dims.count ?? 1;
    default:
      return 1;
  }
}

/**
 * Generates work items from a single activity.
 * Handles herstraten logic: only arbeid items for herstraten/repareren actions.
 */
function generateItemsForActivity(activity: Activity): WorkItem[] {
  const items: WorkItem[] = [];
  const isHerstraten =
    activity.action === "herstraten" || activity.action === "repareren";

  // Base item properties shared by all items from this activity
  const baseProps = {
    category: activity.type as WorkCategory,
    source_activity_id: undefined, // Will be set by caller if needed
    is_herstraten: isHerstraten,
  };

  // CRITICAL: Herstraten logic
  // When action is 'herstraten' or 'repareren', only generate arbeid items
  // because the customer reuses existing materials (no new materials needed)
  if (isHerstraten) {
    // Only generate arbeid items - NO materials
    const unit = getDefaultUnit(activity.type as WorkCategory, "arbeid");
    const quantity = calculateQuantity(activity, "arbeid", unit);

    items.push({
      ...baseProps,
      id: crypto.randomUUID(),
      description: `Arbeid: ${activity.description}`,
      line_type: "arbeid",
      quantity,
      unit,
    });
  } else {
    // For 'nieuw', 'vervangen', 'verwijderen' - include both materials and labor

    // Material item
    const materialUnit = getDefaultUnit(
      activity.type as WorkCategory,
      "materiaal"
    );
    const materialQuantity = calculateQuantity(
      activity,
      "materiaal",
      materialUnit
    );

    items.push({
      ...baseProps,
      id: crypto.randomUUID(),
      description: activity.description,
      line_type: "materiaal",
      quantity: materialQuantity,
      unit: materialUnit,
      is_herstraten: false,
    });

    // Labor item
    const laborUnit = getDefaultUnit(activity.type as WorkCategory, "arbeid");
    const laborQuantity = calculateQuantity(activity, "arbeid", laborUnit);

    items.push({
      ...baseProps,
      id: crypto.randomUUID(),
      description: `Arbeid: ${activity.description}`,
      line_type: "arbeid",
      quantity: laborQuantity,
      unit: laborUnit,
      is_herstraten: false,
    });
  }

  return items;
}

/**
 * Generates a complete work breakdown from AI understanding result.
 *
 * Transforms each detected activity into work items with calculated quantities.
 * Applies herstraten logic: activities with action 'herstraten' or 'repareren'
 * only generate arbeid (labor) items, not material items.
 *
 * @param aiResult - Validated AI understanding result from Layer 1
 * @returns WorkBreakdown with all work items and summary
 *
 * @example
 * ```typescript
 * const aiResult = await analyzeNotes(notes);
 * const breakdown = await generateWorkBreakdown(aiResult);
 * // breakdown.items contains all work items
 * // breakdown.summary describes the work
 * ```
 */
export async function generateWorkBreakdown(
  aiResult: AIUnderstandingResult
): Promise<WorkBreakdown> {
  const allItems: WorkItem[] = [];

  for (const activity of aiResult.activities) {
    const items = generateItemsForActivity(activity);
    allItems.push(...items);
  }

  // Count summary statistics
  const materialCount = allItems.filter((i) => i.line_type === "materiaal").length;
  const laborCount = allItems.filter((i) => i.line_type === "arbeid").length;
  const herstratenCount = allItems.filter((i) => i.is_herstraten).length;

  const breakdown: WorkBreakdown = {
    items: allItems,
    summary: `Werkuitsplitsing: ${allItems.length} items (${materialCount} materiaal, ${laborCount} arbeid). ${herstratenCount > 0 ? `${herstratenCount} items zijn herstraat-werk (alleen arbeid, geen materialen).` : ""} Gebaseerd op ${aiResult.activities.length} gedetecteerde activiteiten.`,
  };

  // Validate output matches schema
  const validated = WorkBreakdownSchema.safeParse(breakdown);
  if (!validated.success) {
    throw new ValidationError(
      "Generated work breakdown failed validation",
      validated.error
    );
  }

  return validated.data;
}
