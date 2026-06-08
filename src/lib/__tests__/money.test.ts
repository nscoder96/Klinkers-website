import { describe, it, expect } from "vitest";
import {
  toCents,
  fromCents,
  multiplyCents,
  sumCents,
  pctOfCents,
  formatEuros,
} from "../money";

describe("money helpers", () => {
  it("toCents converteert euro's naar hele centen", () => {
    expect(toCents(18)).toBe(1800);
    expect(toCents(18.5)).toBe(1850);
    expect(toCents(0.1)).toBe(10);
    expect(toCents(105.05)).toBe(10505);
  });

  it("fromCents converteert centen terug naar euro's", () => {
    expect(fromCents(1850)).toBe(18.5);
    expect(fromCents(10)).toBe(0.1);
  });

  it("vermijdt float-drift bij optellen (0.1 + 0.2)", () => {
    const total = sumCents([toCents(0.1), toCents(0.2)]);
    expect(fromCents(total)).toBe(0.3); // zou 0.30000000000000004 zijn met floats
  });

  it("multiplyCents rondt correct af", () => {
    expect(multiplyCents(1100, 41.8)).toBe(45980); // €11 × 41,8 m¹
    expect(multiplyCents(10500, 7.7)).toBe(80850); // €105 × 7,7 m³
  });

  it("pctOfCents berekent BTW", () => {
    expect(pctOfCents(10000, 0.21)).toBe(2100);
    expect(pctOfCents(10000, 0.09)).toBe(900);
  });

  it("gooit bij ongeldige invoer", () => {
    expect(() => toCents(NaN)).toThrow();
    expect(() => fromCents(18.5)).toThrow(); // geen integer
    expect(() => multiplyCents(10.5, 2)).toThrow();
  });

  it("formatEuros geeft NL-notatie", () => {
    expect(formatEuros(185000)).toBe("€ 1.850,00");
  });
});
