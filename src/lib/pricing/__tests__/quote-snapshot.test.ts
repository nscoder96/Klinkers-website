import { describe, it, expect } from "vitest";
import { makeFlag } from "../../quote-flags";
import { toLineItemInserts } from "../quote-snapshot.service";
import type { MethodLine } from "../pricing-methods.service";

const lines: MethodLine[] = [
  {
    description: "Straatzand big bag incl. levering",
    line_type: "materiaal",
    quantity: 7.7,
    unit: "m³",
    unit_price_cents: 10500,
    total_cents: 80850,
    pricing_id: "p-zand",
    price_source: "database",
    flags: [],
  },
  {
    description: "(handmatig in te vullen)",
    line_type: "materiaal",
    quantity: 73.5,
    unit: "m²",
    unit_price_cents: null,
    total_cents: null,
    pricing_id: null,
    price_source: "missing",
    flags: [makeFlag("MISSING_PRICE", "Materiaalkeuze/prijs handmatig invullen")],
  },
  {
    description: "Legarbeid klinkers simpel (halfsteens)",
    line_type: "arbeid",
    quantity: 70,
    unit: "m²",
    unit_price_cents: 1600,
    total_cents: 112000,
    pricing_id: "p-leg",
    price_source: "database",
    flags: [],
  },
];

const opts = {
  sectionId: "sec-1",
  assemblyId: "asm-1",
  taxRateId: "tax-21",
  startDisplayOrder: 0,
};

describe("toLineItemInserts — bevroren snapshot bij aanmaken", () => {
  const rows = toLineItemInserts(lines, opts);

  it("maakt één payload per regel", () => {
    expect(rows).toHaveLength(3);
  });

  it("bevriest unit_price_snapshot in euro's gelijk aan unit_price", () => {
    expect(rows[0].unit_price_snapshot).toBe(105);
    expect(rows[0].unit_price).toBe(105);
    expect(rows[0].total_price).toBeCloseTo(808.5, 2);
    expect(rows[0].description_snapshot).toBe("Straatzand big bag incl. levering");
  });

  it("zet sectie-, assembly-, pricing- en tax_rate-koppelingen", () => {
    expect(rows[0].section_id).toBe("sec-1");
    expect(rows[0].assembly_id).toBe("asm-1");
    expect(rows[0].pricing_id).toBe("p-zand");
    expect(rows[0].tax_rate_id).toBe("tax-21");
    expect(rows[0].vat_rate).toBe(21);
  });

  it("behoudt line_type en markeert auto-berekend", () => {
    expect(rows[2].line_type).toBe("arbeid");
    expect(rows[0].is_auto_calculated).toBe(true);
  });

  it("missing-regel: geen snapshot/prijs, blijft zichtbaar én gevlagd", () => {
    const missing = rows[1];
    expect(missing.unit_price).toBeNull();
    expect(missing.unit_price_snapshot).toBeNull();
    expect(missing.total_price).toBeNull();
    expect(missing.needs_manual_price).toBe(true);
  });

  it("laat display_order oplopen vanaf startDisplayOrder", () => {
    expect(rows.map((r) => r.display_order)).toEqual([0, 1, 2]);
  });

  it("respecteert een afwijkende startDisplayOrder", () => {
    const offset = toLineItemInserts(lines, { ...opts, startDisplayOrder: 10 });
    expect(offset.map((r) => r.display_order)).toEqual([10, 11, 12]);
  });
});
