/**
 * Quote Structure Service (Layer 4 - Output Formatting)
 *
 * Takes flat PricedQuote output from Layer 3 and organizes it
 * into element-grouped sections with arbeid/materiaal separation.
 *
 * This service:
 * 1. Groups items by source_activity_id (tuinelement)
 * 2. Separates arbeid and materiaal within each element
 * 3. Calculates subtotals per element
 * 4. Calculates grand totals with BTW
 * 5. Uses activity_map for element titles
 */

import { PricedQuote, PricedItem } from "../schemas/priced-quote.schema";
import {
  StructuredQuote,
  CategorySection,
  StructuredLineItem,
} from "../schemas/structured-quote.schema";
import { WorkCategory, ActivityMetadata } from "../schemas/work-breakdown.schema";

/**
 * Standard category order for sorting element sections.
 * Elements are sorted by their category in this order.
 */
const CATEGORY_ORDER: WorkCategory[] = [
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
];

/**
 * Dutch display labels for each category (used as fallback).
 */
const CATEGORY_LABELS: Record<WorkCategory, string> = {
  grondwerk: "Grondwerk",
  bestrating: "Bestrating",
  erfafscheiding: "Erfafscheiding",
  vlonders: "Vlonders & Terrassen",
  gazon: "Gazon",
  beplanting: "Beplanting",
  overkappingen: "Overkappingen",
  waterwerken: "Waterwerken",
  verlichting: "Verlichting",
  overig: "Overig",
};

/**
 * Converts a PricedItem to a StructuredLineItem for display.
 */
function toLineItem(item: PricedItem): StructuredLineItem {
  return {
    id: item.id,
    description: item.description,
    line_type: item.line_type,
    quantity: item.quantity,
    unit: item.unit,
    unit_price: item.unit_price,
    total_price: item.total_price,
    price_source: item.price_source,
    pricing_id: item.pricing_id,
    is_herstraten: item.is_herstraten,
  };
}

/**
 * Calculates the sum of total_price for items (treating null as 0).
 */
function sumPrices(items: StructuredLineItem[]): number {
  return items.reduce((sum, item) => sum + (item.total_price ?? 0), 0);
}

/**
 * Structures a flat PricedQuote into element-grouped output.
 *
 * Groups items by source_activity_id (tuinelement) using the activity_map
 * for section titles. Items without a source_activity_id are grouped
 * into an "Overig" section.
 *
 * @param pricedQuote - Flat list of priced items from Layer 3
 * @param btwPercentage - BTW percentage (default 21%)
 * @param activityMap - Maps activity IDs to metadata (description, type)
 * @returns StructuredQuote with element sections, subtotals, and grand totals
 */
export function structureQuote(
  pricedQuote: PricedQuote,
  btwPercentage: number = 21,
  activityMap: Record<string, ActivityMetadata> = {}
): StructuredQuote {
  // Group items by source_activity_id
  const elementMap = new Map<string, PricedItem[]>();
  for (const item of pricedQuote.items) {
    const key = item.source_activity_id ?? "__overig__";
    if (!elementMap.has(key)) {
      elementMap.set(key, []);
    }
    elementMap.get(key)!.push(item);
  }

  // Build element sections, sorted by category order
  const sections: Array<{ key: string; section: CategorySection }> = [];

  for (const [key, items] of elementMap.entries()) {
    const metadata = key !== "__overig__" ? activityMap[key] : undefined;
    const category: WorkCategory = metadata?.type ?? (items[0]?.category as WorkCategory) ?? "overig";
    const elementTitle = metadata?.description ?? CATEGORY_LABELS[category];

    const arbeidItems = items
      .filter((i) => i.line_type === "arbeid")
      .map(toLineItem);
    const materiaalItems = items
      .filter((i) => i.line_type === "materiaal")
      .map(toLineItem);

    const arbeidSubtotal = sumPrices(arbeidItems);
    const materiaalSubtotal = sumPrices(materiaalItems);

    sections.push({
      key,
      section: {
        category,
        category_label: CATEGORY_LABELS[category],
        element_title: elementTitle,
        source_activity_id: key !== "__overig__" ? key : null,
        arbeid_items: arbeidItems,
        materiaal_items: materiaalItems,
        arbeid_subtotal: arbeidSubtotal,
        materiaal_subtotal: materiaalSubtotal,
        category_total: arbeidSubtotal + materiaalSubtotal,
        has_missing_prices: items.some((i) => i.price_source === "missing"),
      },
    });
  }

  // Sort sections by category order (Overig always last)
  sections.sort((a, b) => {
    if (a.key === "__overig__") return 1;
    if (b.key === "__overig__") return -1;
    const orderA = CATEGORY_ORDER.indexOf(a.section.category);
    const orderB = CATEGORY_ORDER.indexOf(b.section.category);
    return orderA - orderB;
  });

  const categories = sections.map((s) => s.section);

  // Calculate grand totals
  const arbeidTotal = categories.reduce((s, c) => s + c.arbeid_subtotal, 0);
  const materiaalTotal = categories.reduce((s, c) => s + c.materiaal_subtotal, 0);
  const subtotal = arbeidTotal + materiaalTotal;
  const btwAmount = subtotal * (btwPercentage / 100);

  return {
    categories,
    totals: {
      arbeid_total: arbeidTotal,
      materiaal_total: materiaalTotal,
      subtotal,
      btw_percentage: btwPercentage,
      btw_amount: Math.round(btwAmount * 100) / 100,
      total_incl_btw: Math.round((subtotal + btwAmount) * 100) / 100,
    },
    has_missing_prices: pricedQuote.has_missing_prices,
    missing_items: pricedQuote.missing_items,
    item_count: pricedQuote.items.length,
    summary: pricedQuote.summary,
  };
}
