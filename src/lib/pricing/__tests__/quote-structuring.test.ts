/**
 * Tests voor quote-structuring.service (Laag 4 — Deel B4 + A4).
 *
 * Dekt: totals-breakdown per BTW-tarief en per regeltype, de 3 layout-opties,
 * de 55/35/10 sanity-check en de herstraten-materiaalguardrail.
 */

import { describe, it, expect } from "vitest";
import { makeFlag } from "../../quote-flags";
import {
  structureQuote,
  HerstratenMaterialError,
  type StructureLine,
} from "../quote-structuring.service";
import { toCents } from "../../money";

/** Bouwt een geprijsde regel; centen afgeleid uit euro's voor leesbaarheid. */
function line(
  partial: Partial<StructureLine> & {
    line_type: StructureLine["line_type"];
    description: string;
    totalEuros: number;
  }
): StructureLine {
  const total = toCents(partial.totalEuros);
  return {
    description: partial.description,
    line_type: partial.line_type,
    quantity: partial.quantity ?? 1,
    unit: partial.unit ?? "m²",
    unit_price_cents: partial.unit_price_cents ?? total,
    total_cents: total,
    pricing_id: partial.pricing_id ?? "p1",
    price_source: "database",
    flags: partial.flags ?? [],
    vat_pct: partial.vat_pct,
  };
}

describe("structureQuote — totals breakdown (Deel B4)", () => {
  it("sommeert per regeltype (arbeid / materiaal / materieel)", () => {
    const lines: StructureLine[] = [
      line({ line_type: "arbeid", description: "Legarbeid", totalEuros: 500 }),
      line({ line_type: "arbeid", description: "Aantrillen", totalEuros: 100 }),
      line({ line_type: "materiaal", description: "Klinkers", totalEuros: 300 }),
      line({ line_type: "materieel", description: "Container", totalEuros: 200 }),
    ];

    const { breakdown } = structureQuote({ lines });

    expect(breakdown.subtotal_labor).toBe(toCents(600));
    expect(breakdown.subtotal_materials).toBe(toCents(300));
    expect(breakdown.subtotal_materieel).toBe(toCents(200));
    expect(breakdown.subtotal).toBe(toCents(1100));
  });

  it("zet standaard alles op 21% BTW", () => {
    const lines: StructureLine[] = [
      line({ line_type: "arbeid", description: "Legarbeid", totalEuros: 1000 }),
      line({ line_type: "materiaal", description: "Klinkers", totalEuros: 1000 }),
    ];

    const { breakdown } = structureQuote({ lines });

    expect(breakdown.vat_21_base).toBe(toCents(2000));
    expect(breakdown.vat_9_base).toBe(0);
    expect(breakdown.vat_21_amount).toBe(toCents(420));
    expect(breakdown.vat_9_amount).toBe(0);
    expect(breakdown.grand_total).toBe(toCents(2420));
  });

  it("splitst BTW per regel als sommige regels 9% zijn", () => {
    const lines: StructureLine[] = [
      line({ line_type: "arbeid", description: "Legarbeid", totalEuros: 1000, vat_pct: 9 }),
      line({ line_type: "materiaal", description: "Klinkers", totalEuros: 1000, vat_pct: 21 }),
    ];

    const { breakdown } = structureQuote({ lines });

    expect(breakdown.vat_9_base).toBe(toCents(1000));
    expect(breakdown.vat_21_base).toBe(toCents(1000));
    expect(breakdown.vat_9_amount).toBe(toCents(90));
    expect(breakdown.vat_21_amount).toBe(toCents(210));
    expect(breakdown.grand_total).toBe(toCents(2300));
  });

  it("sluit regels zonder prijs uit van de totalen maar vlagt ze", () => {
    const lines: StructureLine[] = [
      line({ line_type: "arbeid", description: "Legarbeid", totalEuros: 500 }),
      {
        description: "Sierbestrating",
        line_type: "materiaal",
        quantity: 10,
        unit: "m²",
        unit_price_cents: null,
        total_cents: null,
        pricing_id: null,
        price_source: "missing",
        flags: [makeFlag("MISSING_PRICE", "Geen prijs gevonden")],
      },
    ];

    const { breakdown, flags } = structureQuote({ lines });

    expect(breakdown.subtotal).toBe(toCents(500));
    expect(flags.some((f) => f.code === "MISSING_PRICE")).toBe(true);
  });
});

describe("structureQuote — layout-opties (Deel D / Fase 5 Laag 4)", () => {
  const lines: StructureLine[] = [
    line({ line_type: "arbeid", description: "Legarbeid", totalEuros: 500 }),
    line({ line_type: "arbeid", description: "Aantrillen", totalEuros: 100 }),
    line({ line_type: "materiaal", description: "Klinkers", totalEuros: 300 }),
    line({ line_type: "materieel", description: "Container", totalEuros: 100 }),
  ];

  it("'uitgesplitst' laat alle regels ongewijzigd", () => {
    const { display_lines } = structureQuote({ lines, layout: "uitgesplitst" });
    expect(display_lines).toHaveLength(4);
    expect(display_lines.map((l) => l.line_type)).toEqual([
      "arbeid",
      "arbeid",
      "materiaal",
      "materieel",
    ]);
  });

  it("'arbeid_totaalpost' bundelt alle arbeid tot één post, materiaal blijft apart", () => {
    const { display_lines } = structureQuote({ lines, layout: "arbeid_totaalpost" });

    const labor = display_lines.filter((l) => l.line_type === "arbeid");
    expect(labor).toHaveLength(1);
    expect(labor[0].total_cents).toBe(toCents(600));
    // Materiaal + materieel blijven zichtbaar.
    expect(display_lines.filter((l) => l.line_type === "materiaal")).toHaveLength(1);
    expect(display_lines.filter((l) => l.line_type === "materieel")).toHaveLength(1);
  });

  it("'aanneemsom' bundelt alles tot één all-in post", () => {
    const { display_lines } = structureQuote({ lines, layout: "aanneemsom" });

    expect(display_lines).toHaveLength(1);
    expect(display_lines[0].line_type).toBe("all_in");
    expect(display_lines[0].total_cents).toBe(toCents(1000));
  });

  it("breakdown blijft identiek ongeacht layout", () => {
    const split = structureQuote({ lines, layout: "uitgesplitst" }).breakdown;
    const aanneem = structureQuote({ lines, layout: "aanneemsom" }).breakdown;
    expect(aanneem.subtotal_labor).toBe(split.subtotal_labor);
    expect(aanneem.grand_total).toBe(split.grand_total);
  });
});

describe("structureQuote — 55/35/10 sanity-check (Deel A4)", () => {
  it("geen waarschuwing bij een normale verdeling (~50/35/12)", () => {
    const lines: StructureLine[] = [
      line({ line_type: "arbeid", description: "Legarbeid", totalEuros: 500 }),
      line({ line_type: "materiaal", description: "Klinkers", totalEuros: 350 }),
      line({ line_type: "materieel", description: "Container", totalEuros: 120 }),
    ];

    const { distribution } = structureQuote({ lines });

    expect(distribution.within_norm).toBe(true);
    expect(distribution.warnings).toHaveLength(0);
  });

  it("waarschuwt als arbeid sterk afwijkt (herstraten >80% arbeid)", () => {
    const lines: StructureLine[] = [
      line({ line_type: "arbeid", description: "Opnemen", totalEuros: 900 }),
      line({ line_type: "materiaal", description: "Straatzand", totalEuros: 100 }),
    ];

    const { distribution } = structureQuote({ lines });

    expect(distribution.labor_pct).toBeGreaterThan(80);
    expect(distribution.within_norm).toBe(false);
    expect(distribution.warnings.length).toBeGreaterThan(0);
  });
});

describe("structureQuote — herstraten-guardrail (kwaliteitseis)", () => {
  it("gooit een fout als herstraten materiaalkosten voor bestrating bevat", () => {
    const lines: StructureLine[] = [
      line({ line_type: "arbeid", description: "Klinkers opnemen", totalEuros: 400 }),
      line({ line_type: "materiaal", description: "Gebakken klinkers waalformaat", totalEuros: 300 }),
    ];

    expect(() => structureQuote({ lines, action: "herstraten" })).toThrow(
      HerstratenMaterialError
    );
  });

  it("staat straat-/voegzand wél toe bij herstraten", () => {
    const lines: StructureLine[] = [
      line({ line_type: "arbeid", description: "Klinkers opnemen", totalEuros: 400 }),
      line({ line_type: "materiaal", description: "Straatzand big bag", totalEuros: 100 }),
      line({ line_type: "materiaal", description: "Voegzand", totalEuros: 20 }),
    ];

    expect(() => structureQuote({ lines, action: "herstraten" })).not.toThrow();
  });

  it("raakt niet-herstraten offertes niet (nieuw mag steenmateriaal hebben)", () => {
    const lines: StructureLine[] = [
      line({ line_type: "materiaal", description: "Gebakken klinkers waalformaat", totalEuros: 300 }),
    ];

    expect(() => structureQuote({ lines, action: "nieuw" })).not.toThrow();
  });
});
