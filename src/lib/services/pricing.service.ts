/**
 * Pricing Service (Layer 3)
 *
 * Adds prices to work items by looking them up in the database.
 * This is the ONLY layer that handles prices.
 *
 * CRITICAL RULES:
 * 1. This service NEVER generates prices
 * 2. Prices ONLY come from database lookups
 * 3. If no match is found, item is flagged as 'missing' - never estimated
 *
 * The pricing lookup uses a multi-step matching strategy:
 * 1. Exact match on item_name + category + item_type
 * 2. Exact match on item_name + item_type (ignore category)
 * 3. Fuzzy match on description keywords
 * 4. No match -> flag as 'missing'
 */

import { createServerClient, Pricing } from "../supabase/client";
import { WorkBreakdown, WorkItem } from "../schemas/work-breakdown.schema";
import { PricedQuote, PricedItem } from "../schemas/priced-quote.schema";

/**
 * Database pricing entry type for internal use.
 * Maps to the Pricing interface from supabase/client.
 */
interface DatabasePricing extends Pricing {
  item_type?: "arbeid" | "materiaal";
}

/**
 * Result of a pricing match attempt.
 */
export interface PricingMatch {
  pricing_id: string;
  unit_price: number;
  match_type: "exact" | "partial" | "fuzzy";
}

/**
 * Finds a pricing match for a work item in the database.
 *
 * Matching strategy (in order of preference):
 * 1. Exact match: item_name + category + line_type all match
 * 2. Partial match: item_name + line_type match (category ignored)
 * 3. Fuzzy match: description contains keywords from item_name
 *
 * IMPORTANT: This function NEVER generates a price.
 * If no match is found, returns null.
 *
 * @param item - Work item to find pricing for
 * @param pricingDb - Array of all active pricing entries
 * @returns PricingMatch if found, null otherwise
 */
function findPricingMatch(
  item: WorkItem,
  pricingDb: DatabasePricing[]
): PricingMatch | null {
  // Normalize description for matching
  const itemDesc = item.description.toLowerCase().trim();
  const itemCategory = item.category.toLowerCase();
  const itemType = item.line_type; // 'arbeid' or 'materiaal'

  // Strategy 1: Exact match on item_name + category + line_type
  for (const pricing of pricingDb) {
    const pricingName = pricing.item_name.toLowerCase().trim();
    const pricingCategory = pricing.category.toLowerCase();
    const pricingType = pricing.item_type?.toLowerCase();

    if (
      itemDesc.includes(pricingName) &&
      pricingCategory === itemCategory &&
      (pricingType === itemType || !pricingType)
    ) {
      const unitPrice = getUnitPrice(pricing, itemType);
      if (unitPrice !== null) {
        return {
          pricing_id: pricing.id,
          unit_price: unitPrice,
          match_type: "exact",
        };
      }
    }
  }

  // Strategy 2: Exact match on item_name + line_type (ignore category)
  for (const pricing of pricingDb) {
    const pricingName = pricing.item_name.toLowerCase().trim();
    const pricingType = pricing.item_type?.toLowerCase();

    if (
      itemDesc.includes(pricingName) &&
      (pricingType === itemType || !pricingType)
    ) {
      const unitPrice = getUnitPrice(pricing, itemType);
      if (unitPrice !== null) {
        return {
          pricing_id: pricing.id,
          unit_price: unitPrice,
          match_type: "partial",
        };
      }
    }
  }

  // Strategy 3: Fuzzy match - description contains keywords
  // Split item_name into words and check if description contains them
  for (const pricing of pricingDb) {
    const pricingWords = pricing.item_name
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2); // Ignore short words

    if (pricingWords.length === 0) continue;

    const matchedWords = pricingWords.filter((word) =>
      itemDesc.includes(word)
    );

    // Require at least 50% word match for fuzzy matching
    if (matchedWords.length >= pricingWords.length * 0.5) {
      const unitPrice = getUnitPrice(pricing, itemType);
      if (unitPrice !== null) {
        return {
          pricing_id: pricing.id,
          unit_price: unitPrice,
          match_type: "fuzzy",
        };
      }
    }
  }

  // No match found - NEVER generate a price, return null
  return null;
}

/**
 * Extracts unit price from a pricing entry based on line type.
 *
 * For labor: uses labor_rate_per_hour
 * For materials: uses selling_price_default, falling back to min/max average
 *
 * @param pricing - Database pricing entry
 * @param lineType - Whether this is 'arbeid' or 'materiaal'
 * @returns Unit price in euros, or null if not available
 */
function getUnitPrice(
  pricing: DatabasePricing,
  lineType: "arbeid" | "materiaal"
): number | null {
  if (lineType === "arbeid") {
    // For labor, use hourly rate
    return pricing.labor_rate_per_hour ?? null;
  }

  // For materials, prefer default price, then average of min/max
  if (pricing.selling_price_default != null) {
    return pricing.selling_price_default;
  }

  if (pricing.selling_price_min != null && pricing.selling_price_max != null) {
    return (pricing.selling_price_min + pricing.selling_price_max) / 2;
  }

  if (pricing.selling_price_min != null) {
    return pricing.selling_price_min;
  }

  if (pricing.selling_price_max != null) {
    return pricing.selling_price_max;
  }

  return null;
}

/**
 * Looks up prices for all items in a work breakdown.
 *
 * Fetches all active pricing from the database ONCE, then matches
 * each work item against the pricing data.
 *
 * CRITICAL: This function NEVER generates prices.
 * - Items with database matches get price_source: 'database'
 * - Items without matches get price_source: 'missing'
 * - Missing items are flagged for manual review
 *
 * @param workBreakdown - Work breakdown from Layer 2
 * @returns PricedQuote with all items priced (or flagged as missing)
 *
 * @example
 * ```typescript
 * const breakdown = await generateWorkBreakdown(aiResult);
 * const pricedQuote = await lookupPricing(breakdown);
 *
 * if (pricedQuote.has_missing_prices) {
 *   console.warn('Some items need manual pricing:', pricedQuote.missing_items);
 * }
 * ```
 */
export async function lookupPricing(
  workBreakdown: WorkBreakdown
): Promise<PricedQuote> {
  const supabase = createServerClient();
  const pricedItems: PricedItem[] = [];
  const missingItems: string[] = [];

  // Fetch all active pricing from database ONCE
  let pricingDb: DatabasePricing[] = [];
  if (supabase) {
    const { data, error } = await supabase
      .from("pricing")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching pricing data:", error.message);
      // Continue with empty pricing - all items will be flagged as missing
    } else {
      pricingDb = (data ?? []) as DatabasePricing[];
    }
  } else {
    console.warn(
      "Supabase not configured - all items will be flagged as missing prices"
    );
  }

  // Process each work item
  for (const item of workBreakdown.items) {
    const match = findPricingMatch(item, pricingDb);

    if (match) {
      // Match found - use database price
      const totalPrice = item.quantity * match.unit_price;

      pricedItems.push({
        ...item,
        pricing_id: match.pricing_id,
        unit_price: match.unit_price,
        total_price: totalPrice,
        price_source: "database",
      });
    } else {
      // No match - flag as missing, NEVER generate a price
      pricedItems.push({
        ...item,
        pricing_id: null,
        unit_price: null,
        total_price: null,
        price_source: "missing",
      });
      missingItems.push(item.description);
    }
  }

  // Calculate totals
  const pricedCount = pricedItems.filter(
    (i) => i.price_source === "database"
  ).length;
  const totalPrice = pricedItems.reduce(
    (sum, i) => sum + (i.total_price ?? 0),
    0
  );

  const quote: PricedQuote = {
    items: pricedItems,
    summary: `Geprijsde offerte: ${pricedItems.length} items, ${pricedCount} geprijsd (totaal: €${totalPrice.toFixed(2)}), ${missingItems.length} ontbrekende prijzen.`,
    has_missing_prices: missingItems.length > 0,
    missing_items: missingItems,
  };

  return quote;
}
