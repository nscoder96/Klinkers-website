/**
 * Tests voor quote-persistence: het opgeslagen totaal moet uit dezelfde bron
 * komen als de opgeslagen regels (A1). Bij methode 'uren' wijken de
 * weergaveregels af van de expand-regels; totalen uit de expand-breakdown
 * zouden dan stil verschillen van de som van de opgeslagen line-items.
 *
 * Fake Supabase-client: vangt alle inserts op, geen netwerk.
 */

import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runQuotePipeline } from "../quote-pipeline.service";
import { persistQuote } from "../quote-persistence.service";
import type { AssemblyWithComponents } from "../../assembly/assembly-loader";
import type { PricingRow } from "../../assembly/assembly-expansion.service";

// ── Fixtures (subset van de seed, zelfde als quote-pipeline.test) ─────────────

const PRICING: PricingRow[] = [
  { id: "p-straatzand", item_name: "Straatzand big bag incl. levering", item_type: "materiaal", unit: "m³", selling_price_default: 105 },
  { id: "p-egaliseren", item_name: "Zandbed egaliseren + afreien", item_type: "arbeid", unit: "m²", selling_price_default: 5 },
  { id: "p-legarbeid", item_name: "Legarbeid klinkers simpel (halfsteens)", item_type: "arbeid", unit: "m²", selling_price_default: 16 },
  { id: "p-aantrillen", item_name: "Aantrillen", item_type: "arbeid", unit: "m²", selling_price_default: 3 },
  { id: "p-voegen", item_name: "Invegen / voegen", item_type: "arbeid", unit: "m²", selling_price_default: 3 },
  { id: "p-voegzand", item_name: "Voegzand zak 25 kg", item_type: "materiaal", unit: "zak", selling_price_default: 7 },
];

const herstraten: AssemblyWithComponents = {
  id: "a-herstraten",
  name: "herstraten",
  trigger_category: "bestrating",
  trigger_action: "herstraten",
  unit: "m2",
  is_active: true,
  components: [
    { item_name_match: "Zandbed egaliseren + afreien", component_type: "arbeid", quantity_formula: "qty * 1.0", is_optional: false, flag_when_missing: null, sort_order: 1 },
    { item_name_match: "Straatzand big bag incl. levering", component_type: "materiaal", quantity_formula: "qty * 0.055", is_optional: false, flag_when_missing: null, sort_order: 2 },
    { item_name_match: "Legarbeid klinkers simpel (halfsteens)", component_type: "arbeid", quantity_formula: "qty * 1.0", is_optional: false, flag_when_missing: null, sort_order: 3 },
    { item_name_match: "Aantrillen", component_type: "arbeid", quantity_formula: "qty * 1.0", is_optional: false, flag_when_missing: null, sort_order: 4 },
    { item_name_match: "Invegen / voegen", component_type: "arbeid", quantity_formula: "qty * 1.0", is_optional: false, flag_when_missing: null, sort_order: 5 },
    { item_name_match: "Voegzand zak 25 kg", component_type: "materiaal", quantity_formula: "qty * 1.0", is_optional: false, flag_when_missing: null, sort_order: 6 },
  ],
};

// ── Fake Supabase-client ──────────────────────────────────────────────────────

interface QuoteInsert {
  subtotal: number;
  btw_amount: number;
  total: number;
}
interface SectionInsert {
  subtotal: number;
}
interface LineItemInsert {
  total_price: number | null;
  section_id: string;
}

interface Captured {
  quotes: QuoteInsert[];
  sections: SectionInsert[];
  lineItems: LineItemInsert[];
}

/**
 * Minimale chainbare stub voor precies de calls die persistQuote doet:
 *   quotes:           select().like().order().limit() en insert().select().single()
 *   quote_sections:   insert().select().single()
 *   quote_line_items: insert()
 */
function fakeSupabase(captured: Captured): SupabaseClient {
  let sectionSeq = 0;
  let lineSeq = 0;

  const from = (table: string) => {
    let inserted: unknown = null;

    const builder = {
      insert(payload: unknown) {
        inserted = payload;
        if (table === "quote_line_items") {
          const rows = payload as LineItemInsert[];
          captured.lineItems.push(...rows);
          // .insert(...).select(...) geeft de aangemaakte rijen mét id terug.
          return {
            select: () => ({
              data: rows.map((r) => ({ ...r, id: `li-${++lineSeq}` })),
              error: null,
            }),
          };
        }
        return builder;
      },
      select: () => builder,
      like: () => builder,
      order: () => builder,
      limit: () => ({ data: [] }),
      single() {
        if (table === "quotes") {
          captured.quotes.push(inserted as QuoteInsert);
          return { data: { id: "q-1", quote_number: "OFF-2026-001" }, error: null };
        }
        if (table === "quote_sections") {
          captured.sections.push(inserted as SectionInsert);
          return { data: { id: `s-${++sectionSeq}` }, error: null };
        }
        return { data: null, error: null };
      },
    };
    return builder;
  };

  return { from } as unknown as SupabaseClient;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

const drieSecties = [
  { type: "bestrating", action: "herstraten", description: "Terras A", area_m2: 20, estimated_hours: 2.5 },
  { type: "bestrating", action: "herstraten", description: "Pad B", area_m2: 20, estimated_hours: 2.5 },
  { type: "bestrating", action: "herstraten", description: "Oprit C", area_m2: 20, estimated_hours: 2.5 },
];

async function persistAndCheck(
  method: "uitgesplitst" | "uren" | "meterprijs"
): Promise<Captured> {
  const pipeline = runQuotePipeline(drieSecties, [herstraten], PRICING, {
    method,
    layout: "uitgesplitst",
  });
  const captured: Captured = { quotes: [], sections: [], lineItems: [] };
  await persistQuote(fakeSupabase(captured), pipeline, { today: "2026-07-06" });
  return captured;
}

describe("persistQuote — totalen uit dezelfde bron als de opgeslagen regels (A1)", () => {
  it.each(["uitgesplitst", "uren", "meterprijs"] as const)(
    "methode %s: opgeslagen subtotaal = som van de opgeslagen line-items",
    async (method) => {
      const captured = await persistAndCheck(method);
      const quote = captured.quotes[0];
      const itemSum = captured.lineItems.reduce(
        (acc, i) => acc + (i.total_price ?? 0),
        0
      );

      expect(captured.lineItems.length).toBeGreaterThan(0);
      expect(quote.subtotal).toBeCloseTo(itemSum, 2);
      expect(quote.total).toBeCloseTo(quote.subtotal + quote.btw_amount, 2);
    }
  );

  it("sectie-subtotalen komen ook uit de opgeslagen regels (methode uren)", async () => {
    const captured = await persistAndCheck("uren");
    expect(captured.sections).toHaveLength(3);

    for (const [i, section] of captured.sections.entries()) {
      const sectionItems = captured.lineItems.filter(
        (l) => l.section_id === `s-${i + 1}`
      );
      const itemSum = sectionItems.reduce((acc, l) => acc + (l.total_price ?? 0), 0);
      expect(section.subtotal).toBeCloseTo(itemSum, 2);
    }
  });

  it("methode uren: arbeid in de opgeslagen regels = 1 dag totaal (8 u × €85 = €680)", async () => {
    const captured = await persistAndCheck("uren");
    const arbeidSum = captured.lineItems
      .filter((l) => (l as LineItemInsert & { line_type?: string }).line_type === "arbeid")
      .reduce((acc, l) => acc + (l.total_price ?? 0), 0);
    expect(arbeidSum).toBeCloseTo(680, 2);
  });
});
