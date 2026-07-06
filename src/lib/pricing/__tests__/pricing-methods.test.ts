import { describe, it, expect } from "vitest";
import { applyPricingMethod } from "../pricing-methods.service";
import type { ExpandResult } from "../../assembly/assembly-expansion.service";
import { fromCents } from "../../money";

/**
 * Vereenvoudigde bestrating_nieuw-expansie (70 m²), conform de Fase 9-getallen.
 * Eén materiaalregel zonder prijs ('missing') om het handmatig-pad te dekken.
 */
const expand: ExpandResult = {
  flags: [],
  lines: [
    {
      description: "Straatzand big bag incl. levering",
      line_type: "materiaal",
      quantity: 7.7,
      unit: "m³",
      unit_price_cents: 10500,
      total_cents: 80850, // €808,50
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
      flags: ["⚠️ Materiaalkeuze/prijs handmatig invullen"],
    },
    {
      description: "Legarbeid klinkers simpel (halfsteens)",
      line_type: "arbeid",
      quantity: 70,
      unit: "m²",
      unit_price_cents: 1600,
      total_cents: 112000, // €1.120
      pricing_id: "p-leg",
      price_source: "database",
      flags: [],
    },
    {
      description: "Opsluitband stellen incl. beton",
      line_type: "arbeid",
      quantity: 41.8,
      unit: "m¹",
      unit_price_cents: 1100,
      total_cents: 45980, // €459,80
      pricing_id: "p-opsl",
      price_source: "database",
      flags: [],
    },
  ],
};

const baseConfig = { area_m2: 70, assemblyLabel: "Oprit klinkers waalformaat aanleggen" };

describe("applyPricingMethod — uitgesplitst (Methode B)", () => {
  const result = applyPricingMethod(expand, "uitgesplitst", baseConfig);

  it("laat de regels ongewijzigd (arbeid + materiaal gescheiden)", () => {
    expect(result.lines).toHaveLength(4);
    expect(result.lines.map((l) => l.line_type)).toEqual([
      "materiaal",
      "materiaal",
      "arbeid",
      "arbeid",
    ]);
  });

  it("behoudt de snapshot-prijzen in centen", () => {
    expect(result.lines[0].unit_price_cents).toBe(10500);
    expect(result.lines[3].total_cents).toBe(45980);
  });
});

describe("applyPricingMethod — meterprijs/aanneemsom (Methode A)", () => {
  const result = applyPricingMethod(expand, "meterprijs", baseConfig);

  it("aggregeert tot één all-in regel met assembly-label", () => {
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].line_type).toBe("all_in");
    expect(result.lines[0].description).toBe("Oprit klinkers waalformaat aanleggen");
  });

  it("totaal = som van geprijsde regels (80850 + 112000 + 45980 = 238830)", () => {
    expect(result.lines[0].total_cents).toBe(238830);
    expect(fromCents(result.lines[0].total_cents!)).toBeCloseTo(2388.3, 2);
  });

  it("eenheidsprijs = totaal / oppervlak, afgerond op centen (€34,12/m²)", () => {
    expect(result.lines[0].unit_price_cents).toBe(3412);
    expect(result.lines[0].quantity).toBe(70);
  });

  it("markeert handmatig na te kijken omdat één regel geen prijs had", () => {
    expect(result.lines[0].flags.some((f) => f.includes("handmatig"))).toBe(true);
  });
});

describe("applyPricingMethod — uren × uurtarief (Methode C)", () => {
  const result = applyPricingMethod(expand, "uren", baseConfig);

  it("behoudt materiaalregels, vervangt arbeid door één uren-regel", () => {
    const materiaal = result.lines.filter((l) => l.line_type === "materiaal");
    const arbeid = result.lines.filter((l) => l.line_type === "arbeid");
    expect(materiaal).toHaveLength(2);
    expect(arbeid).toHaveLength(1);
  });

  it("CROW-terugval geeft rauwe uren: 70 m² / 5 = 14 u × €85 = €1.190 (dagafronding is offerteniveau)", () => {
    const arbeid = result.lines.find((l) => l.line_type === "arbeid")!;
    expect(arbeid.quantity).toBe(14); // rauwe uren, niet per sectie afgerond
    expect(arbeid.unit).toBe("uur");
    expect(arbeid.total_cents).toBe(119000);
    expect(fromCents(arbeid.total_cents!)).toBe(1190);
    expect(arbeid.description).toContain("14 uur");
  });

  it("respecteert een afwijkend uurtarief", () => {
    const dearder = applyPricingMethod(expand, "uren", { ...baseConfig, hourly_rate: 95 });
    const arbeid = dearder.lines.find((l) => l.line_type === "arbeid")!;
    expect(arbeid.total_cents).toBe(14 * 95 * 100); // €1.330
  });

  it("zonder urenschatting → CROW-terugval mét waarschuwingsvlag", () => {
    expect(result.flags.some((f) => f.includes("Urenschatting ontbreekt"))).toBe(true);
  });
});

describe("applyPricingMethod — uren met AI-urenschatting (A1)", () => {
  const result = applyPricingMethod(expand, "uren", {
    ...baseConfig,
    estimated_hours: 25.5,
  });

  it("gebruikt de geschatte uren ongerond: 25,5 u × €85 = €2.167,50", () => {
    const arbeid = result.lines.find((l) => l.line_type === "arbeid")!;
    expect(arbeid.quantity).toBe(25.5); // rauwe AI-schatting; dagafronding op offerteniveau
    expect(arbeid.total_cents).toBe(216750);
    expect(arbeid.description).toContain("25.5 uur");
  });

  it("geeft géén terugval-vlag als de urenschatting aanwezig is", () => {
    expect(result.flags.some((f) => f.includes("Urenschatting ontbreekt"))).toBe(false);
  });

  it("laat materiaalregels ongemoeid (identiek aan uitgesplitst)", () => {
    const uitgesplitst = applyPricingMethod(expand, "uitgesplitst", baseConfig);
    const materiaalUren = result.lines.filter((l) => l.line_type === "materiaal");
    const materiaalB = uitgesplitst.lines.filter((l) => l.line_type === "materiaal");
    expect(materiaalUren).toEqual(materiaalB);
  });
});
