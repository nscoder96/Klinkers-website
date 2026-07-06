import { describe, it, expect } from "vitest";
import { formatAantal } from "../format";

describe("formatAantal — Nederlandse notatie voor aantallen", () => {
  it("gebruikt een komma als decimaalteken", () => {
    expect(formatAantal(2.92)).toBe("2,92");
    expect(formatAantal(0.495)).toBe("0,495");
    expect(formatAantal(25.5)).toBe("25,5");
  });

  it("laat hele getallen zonder decimalen zien", () => {
    expect(formatAantal(70)).toBe("70");
    expect(formatAantal(8)).toBe("8");
  });

  it("rondt op maximaal 3 decimalen (eenheden als m³ gaan tot 3)", () => {
    expect(formatAantal(1.23456)).toBe("1,235");
  });
});
