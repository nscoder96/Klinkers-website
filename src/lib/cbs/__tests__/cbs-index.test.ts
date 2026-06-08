import { describe, it, expect } from "vitest";
import {
  parseCBSReadings,
  computeIndexChangePct,
  shouldAlertIndex,
  latestTwo,
} from "../cbs-index.service";

describe("parseCBSReadings", () => {
  it("mapt OData-rijen naar metingen en slaat onbruikbare rijen over", () => {
    const odata = {
      value: [
        { Perioden: "2025M01", Inputprijsindex_1: 160.0 },
        { Perioden: "2025M02", Inputprijsindex_1: "162.4" },
        { Perioden: "2025M03" }, // geen waarde → overslaan
      ],
    };
    const readings = parseCBSReadings(odata);
    expect(readings).toHaveLength(2);
    expect(readings[1]).toEqual({ datum: "2025M02", waarde: 162.4, categorie: "4211b" });
  });

  it("geeft lege lijst bij onverwachte invoer", () => {
    expect(parseCBSReadings(null)).toEqual([]);
    expect(parseCBSReadings({})).toEqual([]);
  });
});

describe("computeIndexChangePct", () => {
  it("berekent een stijging", () => {
    expect(computeIndexChangePct(100, 105)).toBe(5);
  });
  it("berekent een daling", () => {
    expect(computeIndexChangePct(100, 96)).toBe(-4);
  });
  it("is veilig bij prev = 0", () => {
    expect(computeIndexChangePct(0, 100)).toBe(0);
  });
});

describe("shouldAlertIndex", () => {
  it("alert bij stijging boven 3%", () => {
    expect(shouldAlertIndex(3.5)).toBe(true);
  });
  it("geen alert bij 3% of lager", () => {
    expect(shouldAlertIndex(3)).toBe(false);
    expect(shouldAlertIndex(1)).toBe(false);
  });
  it("geen alert bij daling", () => {
    expect(shouldAlertIndex(-5)).toBe(false);
  });
});

describe("latestTwo", () => {
  it("kiest de twee meest recente periodes", () => {
    const pair = latestTwo([
      { datum: "2025M01", waarde: 100, categorie: "x" },
      { datum: "2025M03", waarde: 110, categorie: "x" },
      { datum: "2025M02", waarde: 105, categorie: "x" },
    ]);
    expect(pair?.prev.datum).toBe("2025M02");
    expect(pair?.latest.datum).toBe("2025M03");
  });
  it("null bij minder dan twee metingen", () => {
    expect(latestTwo([])).toBeNull();
  });
});
