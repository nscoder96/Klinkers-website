import { describe, it, expect } from "vitest";
import { evaluateAssemblyFormula } from "../formula-evaluator";

describe("evaluateAssemblyFormula", () => {
  it("berekent zandvolume (Fase 9 Test 1): 70 × 10cm × 1,10 = 7,7 m³", () => {
    expect(
      evaluateAssemblyFormula("qty * zanddikte_cm / 100 * 1.10", {
        qty: 70,
        zanddikte_cm: 10,
      })
    ).toBeCloseTo(7.7, 5);
  });

  it("berekent klinkers incl. 5% snijverlies: 70 × 1,05 = 73,5 m²", () => {
    expect(evaluateAssemblyFormula("qty * 1.05", { qty: 70 })).toBeCloseTo(73.5, 5);
  });

  it("berekent opsluitband uit exacte omtrek: (5+14)×2 ×1,1 = 41,8 m¹", () => {
    const perimeter = (5 + 14) * 2;
    expect(
      evaluateAssemblyFormula("perimeter_m * 1.1", { perimeter_m: perimeter })
    ).toBeCloseTo(41.8, 5);
  });

  it("schat omtrek uit oppervlak als L×B onbekend: sqrt(70)*4*1,1", () => {
    expect(
      evaluateAssemblyFormula("sqrt(qty) * 4 * 1.1", { qty: 70 })
    ).toBeCloseTo(Math.sqrt(70) * 4 * 1.1, 5);
  });

  it("berekent containers met greatest/ceil: cunet 14 m³ → 2 containers", () => {
    expect(
      evaluateAssemblyFormula("greatest(ceil(cunet_m3 * 1.25 / 10), 1)", {
        cunet_m3: 14,
      })
    ).toBe(2);
  });

  it("respecteert minimum 1 container bij 0 m³", () => {
    expect(
      evaluateAssemblyFormula("greatest(ceil(cunet_m3 * 1.25 / 10), 1)", {
        cunet_m3: 0,
      })
    ).toBe(1);
  });

  it("gooit bij onbekende variabele (gokt nooit)", () => {
    expect(() => evaluateAssemblyFormula("qty * onbekend", { qty: 5 })).toThrow(
      /Onbekende variabele/
    );
  });

  it("blokkeert injectie van globals", () => {
    expect(() =>
      evaluateAssemblyFormula("globalThis", { qty: 1 })
    ).toThrow(/Onbekende variabele/);
  });
});
