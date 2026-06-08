import { describe, it, expect } from "vitest";
import {
  computePctChange,
  shouldAlert,
  buildAlertPayload,
} from "../price-change-alert.service";

describe("computePctChange", () => {
  it("stijging 105 → 115 ≈ +9,52%", () => {
    expect(computePctChange(105, 115)).toBeCloseTo(9.52, 2);
  });

  it("daling 100 → 90 = -10%", () => {
    expect(computePctChange(100, 90)).toBeCloseTo(-10, 2);
  });

  it("geen verandering = 0%", () => {
    expect(computePctChange(50, 50)).toBe(0);
  });

  it("oude prijs 0 (of ontbrekend) → 0% i.p.v. delen door nul", () => {
    expect(computePctChange(0, 50)).toBe(0);
  });
});

describe("shouldAlert — drempel (default 3%)", () => {
  it("stijging boven drempel alarmeert", () => {
    expect(shouldAlert(9.52)).toBe(true);
  });

  it("daling onder -drempel alarmeert ook (absolute waarde)", () => {
    expect(shouldAlert(-5)).toBe(true);
  });

  it("kleine wijziging onder drempel alarmeert niet", () => {
    expect(shouldAlert(2)).toBe(false);
  });

  it("respecteert een afwijkende drempel", () => {
    expect(shouldAlert(4, 5)).toBe(false);
    expect(shouldAlert(6, 5)).toBe(true);
  });
});

describe("buildAlertPayload", () => {
  const payload = buildAlertPayload({
    pricingItemId: "p-zand",
    oldPrice: 105,
    newPrice: 115,
    source: "manual",
    affectedDraftQuoteIds: ["q-1", "q-2"],
  });

  it("bevat prijzen, bron en afgeronde pct_change", () => {
    expect(payload.pricing_item_id).toBe("p-zand");
    expect(payload.old_price).toBe(105);
    expect(payload.new_price).toBe(115);
    expect(payload.source).toBe("manual");
    expect(payload.pct_change).toBeCloseTo(9.52, 2);
  });

  it("zet de geraakte concept-offertes als JSON-array", () => {
    expect(payload.affected_draft_quotes).toEqual(["q-1", "q-2"]);
  });

  it("default bron = manual, lege lijst bij geen geraakte offertes", () => {
    const minimal = buildAlertPayload({
      pricingItemId: "p-x",
      oldPrice: 10,
      newPrice: 12,
    });
    expect(minimal.source).toBe("manual");
    expect(minimal.affected_draft_quotes).toEqual([]);
  });
});
