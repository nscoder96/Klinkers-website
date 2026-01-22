/**
 * Services Barrel Export
 *
 * Provides clean imports for the three-layer pipeline:
 * - Layer 1: AI Understanding - Detects work from schouwnotities
 * - Layer 2: Business Logic - Transforms AI output into work items
 * - Layer 3: Pricing - Looks up prices from database
 *
 * Usage:
 * ```typescript
 * import {
 *   analyzeNotes,
 *   processAIOutput,
 *   generateWorkBreakdown,
 *   lookupPricing
 * } from '@/lib/services';
 *
 * // Full pipeline
 * const aiResult = await analyzeNotes(notes);
 * const validated = processAIOutput(aiResult);
 * const breakdown = await generateWorkBreakdown(validated);
 * const pricedQuote = await lookupPricing(breakdown);
 * ```
 */

// Layer 1: AI Understanding
export { analyzeNotes } from "./ai-understanding.service";

// Layer 2: Business Logic
export {
  ValidationError,
  processAIOutput,
  generateWorkBreakdown,
} from "./business-logic.service";

// Layer 3: Pricing
export { lookupPricing } from "./pricing.service";
export type { PricingMatch } from "./pricing.service";

// Re-export types for convenience
export type {
  AIUnderstandingResult,
  Activity,
  ActivityType,
  Action,
  Dimensions,
} from "../schemas/ai-understanding.schema";

export type {
  WorkBreakdown,
  WorkItem,
  WorkCategory,
  LineType,
  Unit,
} from "../schemas/work-breakdown.schema";

export type {
  PricedQuote,
  PricedItem,
  PriceSource,
} from "../schemas/priced-quote.schema";
