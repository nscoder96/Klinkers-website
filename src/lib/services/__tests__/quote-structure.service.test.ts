import { describe, it, expect } from "vitest";
import { structureQuote } from "../quote-structure.service";
import { PricedQuote } from "../../schemas/priced-quote.schema";

function makePricedQuote(items: Partial<PricedQuote["items"][0]>[]): PricedQuote {
  const fullItems = items.map((item, i) => ({
    id: `00000000-0000-0000-0000-00000000000${i}`,
    category: "bestrating" as const,
    description: `Item ${i}`,
    line_type: "arbeid" as const,
    quantity: 10,
    unit: "m2" as const,
    pricing_id: `price-${i}`,
    unit_price: 25,
    total_price: 250,
    price_source: "database" as const,
    is_herstraten: false,
    source_activity_id: undefined,
    ...item,
  }));

  return {
    items: fullItems,
    summary: "Test quote",
    has_missing_prices: fullItems.some((i) => i.price_source === "missing"),
    missing_items: fullItems
      .filter((i) => i.price_source === "missing")
      .map((i) => i.description),
  };
}

describe("structureQuote", () => {
  it("groups items by source_activity_id (element)", () => {
    const quote = makePricedQuote([
      { category: "bestrating", description: "Leggen", source_activity_id: "act-terras" },
      { category: "grondwerk", description: "Uitgraven", source_activity_id: "act-grond" },
      { category: "bestrating", description: "Invoegen", source_activity_id: "act-terras" },
    ]);

    const activityMap = {
      "act-terras": { description: "Terras 20m2", type: "bestrating" as const, action: "nieuw", dimensions: {} },
      "act-grond": { description: "Uitgraven tuin", type: "grondwerk" as const, action: "nieuw", dimensions: {} },
    };

    const result = structureQuote(quote, 21, activityMap);

    expect(result.categories).toHaveLength(2);
    // grondwerk comes before bestrating in standard order
    expect(result.categories[0].category).toBe("grondwerk");
    expect(result.categories[0].element_title).toBe("Uitgraven tuin");
    expect(result.categories[1].category).toBe("bestrating");
    expect(result.categories[1].element_title).toBe("Terras 20m2");
    // Both bestrating items are in the same element section
    expect(result.categories[1].arbeid_items).toHaveLength(2);
  });

  it("separates arbeid and materiaal within category", () => {
    const quote = makePricedQuote([
      { category: "bestrating", line_type: "arbeid", total_price: 100 },
      { category: "bestrating", line_type: "materiaal", total_price: 200 },
      { category: "bestrating", line_type: "arbeid", total_price: 50 },
    ]);

    const result = structureQuote(quote);
    const bestrating = result.categories[0];

    expect(bestrating.arbeid_items).toHaveLength(2);
    expect(bestrating.materiaal_items).toHaveLength(1);
    expect(bestrating.arbeid_subtotal).toBe(150);
    expect(bestrating.materiaal_subtotal).toBe(200);
    expect(bestrating.category_total).toBe(350);
  });

  it("calculates grand totals correctly", () => {
    const quote = makePricedQuote([
      { category: "bestrating", line_type: "arbeid", total_price: 100 },
      { category: "bestrating", line_type: "materiaal", total_price: 200 },
      { category: "grondwerk", line_type: "arbeid", total_price: 50 },
    ]);

    const result = structureQuote(quote);

    expect(result.totals.arbeid_total).toBe(150);
    expect(result.totals.materiaal_total).toBe(200);
    expect(result.totals.subtotal).toBe(350);
    expect(result.totals.btw_percentage).toBe(21);
    expect(result.totals.btw_amount).toBe(73.5);
    expect(result.totals.total_incl_btw).toBe(423.5);
  });

  it("handles missing prices", () => {
    const quote = makePricedQuote([
      { category: "bestrating", price_source: "database", total_price: 100 },
      {
        category: "bestrating",
        price_source: "missing",
        total_price: null,
        unit_price: null,
        pricing_id: null,
        description: "Onbekend item",
      },
    ]);

    const result = structureQuote(quote);

    expect(result.has_missing_prices).toBe(true);
    expect(result.categories[0].has_missing_prices).toBe(true);
    expect(result.missing_items).toContain("Onbekend item");
    // Missing items contribute 0 to totals
    expect(result.totals.subtotal).toBe(100);
  });

  it("skips empty categories", () => {
    const quote = makePricedQuote([{ category: "bestrating" }]);

    const result = structureQuote(quote);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].category).toBe("bestrating");
  });

  it("provides Dutch category labels", () => {
    const quote = makePricedQuote([{ category: "erfafscheiding" }]);

    const result = structureQuote(quote);
    expect(result.categories[0].category_label).toBe("Erfafscheiding");
  });

  it("uses custom BTW percentage", () => {
    const quote = makePricedQuote([{ total_price: 100 }]);

    const result = structureQuote(quote, 9);
    expect(result.totals.btw_percentage).toBe(9);
    expect(result.totals.btw_amount).toBe(9);
    expect(result.totals.total_incl_btw).toBe(109);
  });

  it("maintains item count", () => {
    const quote = makePricedQuote([
      { category: "bestrating" },
      { category: "bestrating" },
      { category: "grondwerk" },
    ]);

    const result = structureQuote(quote);
    expect(result.item_count).toBe(3);
  });

  it("orders element sections by standard category sequence", () => {
    const quote = makePricedQuote([
      { category: "gazon", source_activity_id: "act-gazon" },
      { category: "bestrating", source_activity_id: "act-bestrating" },
      { category: "grondwerk", source_activity_id: "act-grondwerk" },
      { category: "erfafscheiding", source_activity_id: "act-erf" },
    ]);

    const activityMap = {
      "act-gazon": { description: "Gazon aanleggen", type: "gazon" as const, action: "nieuw", dimensions: {} },
      "act-bestrating": { description: "Terras", type: "bestrating" as const, action: "nieuw", dimensions: {} },
      "act-grondwerk": { description: "Ophogen", type: "grondwerk" as const, action: "nieuw", dimensions: {} },
      "act-erf": { description: "Schutting", type: "erfafscheiding" as const, action: "nieuw", dimensions: {} },
    };

    const result = structureQuote(quote, 21, activityMap);
    expect(result.categories.map((c) => c.category)).toEqual([
      "grondwerk",
      "bestrating",
      "erfafscheiding",
      "gazon",
    ]);
  });

  it("handles herstraten items correctly", () => {
    const quote = makePricedQuote([
      { category: "bestrating", line_type: "arbeid", is_herstraten: true, total_price: 300 },
    ]);

    const result = structureQuote(quote);
    expect(result.categories[0].arbeid_items[0].is_herstraten).toBe(true);
    expect(result.categories[0].materiaal_items).toHaveLength(0);
  });
});
