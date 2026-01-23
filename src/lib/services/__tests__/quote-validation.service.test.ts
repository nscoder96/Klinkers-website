import { describe, it, expect } from "vitest";
import { validateQuote, getMissingPriceItems } from "../quote-validation.service";
import { StructuredQuote } from "../../schemas/structured-quote.schema";

function makeQuote(overrides: Partial<StructuredQuote> = {}): StructuredQuote {
  return {
    categories: [
      {
        category: "bestrating",
        category_label: "Bestrating",
        element_title: "Terras 20m2 klinkers",
        source_activity_id: "00000000-0000-0000-0000-000000000099",
        arbeid_items: [
          {
            id: "00000000-0000-0000-0000-000000000001",
            description: "Bestrating leggen",
            line_type: "arbeid",
            quantity: 20,
            unit: "m2",
            unit_price: 40,
            total_price: 800,
            price_source: "database",
            pricing_id: "p1",
            is_herstraten: false,
          },
        ],
        materiaal_items: [
          {
            id: "00000000-0000-0000-0000-000000000002",
            description: "Klinkers",
            line_type: "materiaal",
            quantity: 20,
            unit: "m2",
            unit_price: 75,
            total_price: 1500,
            price_source: "database",
            pricing_id: "p2",
            is_herstraten: false,
          },
        ],
        arbeid_subtotal: 800,
        materiaal_subtotal: 1500,
        category_total: 2300,
        has_missing_prices: false,
      },
    ],
    totals: {
      arbeid_total: 800,
      materiaal_total: 1500,
      subtotal: 2300,
      btw_percentage: 21,
      btw_amount: 483,
      total_incl_btw: 2783,
    },
    has_missing_prices: false,
    missing_items: [],
    item_count: 2,
    summary: "Test quote",
    ...overrides,
  };
}

describe("validateQuote", () => {
  it("validates a complete quote as finalizable", () => {
    const result = validateQuote(makeQuote());

    expect(result.is_valid).toBe(true);
    expect(result.can_finalize).toBe(true);
    expect(result.warnings).toHaveLength(0);
    expect(result.summary).toContain("compleet");
  });

  it("blocks finalization when items have missing prices", () => {
    const quote = makeQuote({
      categories: [
        {
          category: "bestrating",
          category_label: "Bestrating",
          element_title: "Bestrating",
          source_activity_id: null,
          arbeid_items: [
            {
              id: "00000000-0000-0000-0000-000000000001",
              description: "Onbekende activiteit",
              line_type: "arbeid",
              quantity: 10,
              unit: "m2",
              unit_price: null,
              total_price: null,
              price_source: "missing",
              pricing_id: null,
              is_herstraten: false,
            },
          ],
          materiaal_items: [],
          arbeid_subtotal: 0,
          materiaal_subtotal: 0,
          category_total: 0,
          has_missing_prices: true,
        },
      ],
      has_missing_prices: true,
      missing_items: ["Onbekende activiteit"],
    });

    const result = validateQuote(quote);

    expect(result.can_finalize).toBe(false);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].type).toBe("missing_price");
    expect(result.warnings[0].message).toContain("handmatige review nodig");
  });

  it("reports multiple missing prices", () => {
    const quote = makeQuote({
      categories: [
        {
          category: "bestrating",
          category_label: "Bestrating",
          element_title: "Bestrating",
          source_activity_id: null,
          arbeid_items: [
            {
              id: "00000000-0000-0000-0000-000000000001",
              description: "Item A",
              line_type: "arbeid",
              quantity: 5,
              unit: "uur",
              unit_price: null,
              total_price: null,
              price_source: "missing",
              pricing_id: null,
              is_herstraten: false,
            },
          ],
          materiaal_items: [
            {
              id: "00000000-0000-0000-0000-000000000002",
              description: "Item B",
              line_type: "materiaal",
              quantity: 10,
              unit: "m2",
              unit_price: null,
              total_price: null,
              price_source: "missing",
              pricing_id: null,
              is_herstraten: false,
            },
          ],
          arbeid_subtotal: 0,
          materiaal_subtotal: 0,
          category_total: 0,
          has_missing_prices: true,
        },
      ],
      has_missing_prices: true,
    });

    const result = validateQuote(quote);

    expect(result.can_finalize).toBe(false);
    expect(result.warnings.filter((w) => w.type === "missing_price")).toHaveLength(2);
    expect(result.summary).toContain("2 item(s)");
  });

  it("allows finalization when all prices are found", () => {
    const result = validateQuote(makeQuote());
    expect(result.can_finalize).toBe(true);
  });
});

describe("getMissingPriceItems", () => {
  it("returns empty array for complete quote", () => {
    const missing = getMissingPriceItems(makeQuote());
    expect(missing).toHaveLength(0);
  });

  it("returns items with missing prices", () => {
    const quote = makeQuote({
      categories: [
        {
          category: "grondwerk",
          category_label: "Grondwerk",
          element_title: "Grondwerk",
          source_activity_id: null,
          arbeid_items: [
            {
              id: "00000000-0000-0000-0000-000000000001",
              description: "Uitgraven",
              line_type: "arbeid",
              quantity: 30,
              unit: "m2",
              unit_price: null,
              total_price: null,
              price_source: "missing",
              pricing_id: null,
              is_herstraten: false,
            },
          ],
          materiaal_items: [],
          arbeid_subtotal: 0,
          materiaal_subtotal: 0,
          category_total: 0,
          has_missing_prices: true,
        },
      ],
      has_missing_prices: true,
    });

    const missing = getMissingPriceItems(quote);
    expect(missing).toHaveLength(1);
    expect(missing[0]).toEqual({
      category: "Grondwerk",
      description: "Uitgraven",
      quantity: 30,
      unit: "m2",
    });
  });
});
