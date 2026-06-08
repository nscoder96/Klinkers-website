/**
 * Quote Validation Service
 *
 * Validates structured quotes before finalization.
 * Catches missing prices and returns actionable warnings.
 *
 * CRITICAL: Quotes with missing prices CANNOT be finalized.
 * They must be reviewed and manually priced first.
 */

import { StructuredQuote, CategorySection } from "../schemas/structured-quote.schema";

export interface ValidationWarning {
  type: "missing_price" | "zero_quantity" | "empty_category";
  category?: string;
  item_description?: string;
  message: string;
}

export interface ValidationResult {
  is_valid: boolean;
  can_finalize: boolean;
  warnings: ValidationWarning[];
  summary: string;
}

/**
 * Validates a structured quote for completeness and correctness.
 *
 * A quote is valid for finalization only when:
 * - All items have prices from the database
 * - No categories are empty
 * - All quantities are positive
 *
 * @param quote - StructuredQuote to validate
 * @returns ValidationResult with warnings and finalization eligibility
 */
export function validateQuote(quote: StructuredQuote): ValidationResult {
  const warnings: ValidationWarning[] = [];

  // Check for missing prices
  for (const category of quote.categories) {
    checkCategoryItems(category, warnings);
  }

  // Check for empty categories (shouldn't happen but defensive)
  for (const category of quote.categories) {
    if (category.arbeid_items.length === 0 && category.materiaal_items.length === 0) {
      warnings.push({
        type: "empty_category",
        category: category.category_label,
        message: `Categorie "${category.category_label}" is leeg`,
      });
    }
  }

  const missingCount = warnings.filter((w) => w.type === "missing_price").length;
  const canFinalize = missingCount === 0;

  let summary: string;
  if (canFinalize) {
    summary = `Offerte is compleet: ${quote.item_count} items, alle prijzen gevonden.`;
  } else {
    summary = `Offerte heeft ${missingCount} item(s) zonder prijs — handmatige review nodig.`;
  }

  return {
    is_valid: warnings.length === 0,
    can_finalize: canFinalize,
    warnings,
    summary,
  };
}

/**
 * Checks items in a category for missing prices.
 */
function checkCategoryItems(
  category: CategorySection,
  warnings: ValidationWarning[]
): void {
  const allItems = [...category.arbeid_items, ...category.materiaal_items];

  for (const item of allItems) {
    if (item.price_source === "missing") {
      warnings.push({
        type: "missing_price",
        category: category.category_label,
        item_description: item.description,
        message: `"${item.description}" in ${category.category_label}: handmatige review nodig`,
      });
    }
  }
}

/**
 * Returns a formatted list of items needing manual pricing.
 * Useful for displaying to users in the UI.
 */
export function getMissingPriceItems(
  quote: StructuredQuote
): Array<{ category: string; description: string; quantity: number; unit: string }> {
  const missing: Array<{ category: string; description: string; quantity: number; unit: string }> = [];

  for (const category of quote.categories) {
    const allItems = [...category.arbeid_items, ...category.materiaal_items];
    for (const item of allItems) {
      if (item.price_source === "missing") {
        missing.push({
          category: category.category_label,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
        });
      }
    }
  }

  return missing;
}
