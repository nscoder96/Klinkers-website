import { describe, it, expect } from "vitest";
import {
  expandAssembly,
  AssemblyComponent,
  PricingRow,
} from "../assembly-expansion.service";
import { fromCents } from "../../money";

const pricingDb: PricingRow[] = [
  { id: "p-zand", item_name: "Straatzand big bag incl. levering", item_type: "materiaal", unit: "m³", selling_price_default: 105 },
  { id: "p-opsl", item_name: "Opsluitband stellen incl. beton", item_type: "arbeid", unit: "m¹", selling_price_default: 11, labor_rate_per_hour: 85 },
  { id: "p-cont", item_name: "Container 10 m³", item_type: "materieel", unit: "stuk", selling_price_default: 280 },
  { id: "p-leg", item_name: "Legarbeid klinkers simpel (halfsteens)", item_type: "arbeid", unit: "m²", selling_price_default: 16 },
];

// Vereenvoudigde bestrating_nieuw-componenten (subset, conform seed + perimeter_m).
const bestratingNieuw: AssemblyComponent[] = [
  { item_name_match: "Container 10 m³", component_type: "materieel", quantity_formula: "greatest(ceil(cunet_m3 * 1.25 / 10), 1)", is_optional: true, flag_when_missing: "⚠️ Afgraafdiepte niet opgegeven — controleer voor berekening", sort_order: 1 },
  { item_name_match: "Straatzand big bag incl. levering", component_type: "materiaal", quantity_formula: "qty * zanddikte_cm / 100 * 1.10", is_optional: false, flag_when_missing: "⚠️ Zanddikte niet opgegeven — minimaal 8 cm, controleer", sort_order: 2 },
  { item_name_match: null, component_type: "materiaal", quantity_formula: "qty * 1.05", is_optional: false, flag_when_missing: null, sort_order: 3 },
  { item_name_match: "Legarbeid klinkers simpel (halfsteens)", component_type: "arbeid", quantity_formula: "qty * 1.0", is_optional: false, flag_when_missing: null, sort_order: 4 },
  { item_name_match: "Opsluitband stellen incl. beton", component_type: "arbeid", quantity_formula: "perimeter_m * 1.1", is_optional: false, flag_when_missing: null, sort_order: 5 },
];

describe("expandAssembly — Test 1: oprit 5×14m, afgraven 20cm, zandbed 10cm", () => {
  const result = expandAssembly(
    bestratingNieuw,
    { area_m2: 70, length_m: 14, width_m: 5, afgraafdiepte_cm: 20, zanddikte_cm: 10 },
    pricingDb
  );

  it("geeft geen offerte-brede vlaggen (alles opgegeven)", () => {
    expect(result.flags).toHaveLength(0);
  });

  it("zand = 7,7 m³ à €105 = €808,50 (snapshot in centen)", () => {
    const zand = result.lines.find((l) => l.description.includes("Straatzand"))!;
    expect(zand.quantity).toBeCloseTo(7.7, 3);
    expect(zand.unit_price_cents).toBe(10500);
    expect(fromCents(zand.total_cents!)).toBeCloseTo(808.5, 2);
    expect(zand.price_source).toBe("database");
  });

  it("klinkers = 73,5 m² (snijverlies), maar prijs handmatig (geen match-naam)", () => {
    const klinkers = result.lines.find(
      (l) => l.line_type === "materiaal" && l.pricing_id === null
    )!;
    expect(klinkers.quantity).toBeCloseTo(73.5, 3);
    expect(klinkers.price_source).toBe("missing");
    expect(klinkers.flags.some((f) => f.code === "MISSING_PRICE")).toBe(true);
  });

  it("opsluitband = 41,8 m¹ à €11 = €459,80", () => {
    const opsl = result.lines.find((l) => l.description.includes("Opsluitband"))!;
    expect(opsl.quantity).toBeCloseTo(41.8, 3);
    expect(opsl.unit_price_cents).toBe(1100);
    expect(fromCents(opsl.total_cents!)).toBeCloseTo(459.8, 2);
  });

  it("container = 2 stuks (cunet 14 m³ × 1,25 / 10 → ceil)", () => {
    const cont = result.lines.find((l) => l.description.includes("Container"))!;
    expect(cont.quantity).toBe(2);
  });
});

describe("expandAssembly — Test 1b: zelfde oprit zonder afgraaf/zand info", () => {
  const result = expandAssembly(
    bestratingNieuw,
    { area_m2: 70 },
    pricingDb
  );

  it("geeft geen offerte-brede vlaggen (ontbrekende afgraaf/zand worden stil overgeslagen)", () => {
    expect(result.flags).toHaveLength(0);
  });

  it("laat de dieptegebonden container weg", () => {
    expect(result.lines.find((l) => l.description.includes("Container"))).toBeUndefined();
  });

  it("laat zand weg als zanddikte niet is opgegeven", () => {
    expect(result.lines.find((l) => l.description.includes("Straatzand"))).toBeUndefined();
  });

  it("schat opsluitband uit oppervlak (sqrt) i.p.v. exacte omtrek", () => {
    const opsl = result.lines.find((l) => l.description.includes("Opsluitband"))!;
    expect(opsl.quantity).toBeCloseTo(Math.sqrt(70) * 4 * 1.1, 3);
  });
});

describe("expandAssembly — C1: exact-of-flag prijsmatching", () => {
  const legDb: PricingRow[] = [
    { id: "p-complex", item_name: "Legarbeid klinkers complex (visgraat)", item_type: "arbeid", unit: "m²", selling_price_default: 24 },
    { id: "p-simpel", item_name: "Legarbeid klinkers simpel (halfsteens)", item_type: "arbeid", unit: "m²", selling_price_default: 16 },
  ];

  function singleComponent(overrides: Partial<AssemblyComponent>): AssemblyComponent[] {
    return [{
      item_name_match: null,
      component_type: "arbeid",
      quantity_formula: "qty * 1.0",
      is_optional: false,
      flag_when_missing: null,
      sort_order: 1,
      ...overrides,
    }];
  }

  it("'Legarbeid klinkers simpel' matcht nooit per ongeluk 'complex' — geen match = MISSING_PRICE (blocking)", () => {
    // 'Legarbeid klinkers simpel' is een substring-achtige variant die vroeger
    // via de partial-fallback op de eerstvolgende rij ('complex') kon landen.
    const result = expandAssembly(
      singleComponent({ item_name_match: "Legarbeid klinkers simpel" }),
      { area_m2: 10 },
      legDb
    );
    const line = result.lines[0];
    expect(line.pricing_id).not.toBe("p-complex");
    expect(line.price_source).toBe("missing");
    expect(line.flags.some((f) => f.code === "MISSING_PRICE" && f.severity === "blocking")).toBe(true);
  });

  it("exacte naam (case-insensitief, getrimd) matcht wél", () => {
    const result = expandAssembly(
      singleComponent({ item_name_match: "  legarbeid klinkers SIMPEL (halfsteens) " }),
      { area_m2: 10 },
      legDb
    );
    expect(result.lines[0].pricing_id).toBe("p-simpel");
    expect(result.lines[0].price_source).toBe("database");
  });

  it("pricing_item_id slaat naam-matching volledig over", () => {
    // De naam zou exact op 'complex' matchen, maar de expliciete koppeling wint.
    const result = expandAssembly(
      singleComponent({
        pricing_item_id: "p-simpel",
        item_name_match: "Legarbeid klinkers complex (visgraat)",
      }),
      { area_m2: 10 },
      legDb
    );
    expect(result.lines[0].pricing_id).toBe("p-simpel");
    expect(result.lines[0].unit_price_cents).toBe(1600);
  });

  it("ontbrekende pricing_item_id-koppeling geeft blocking flag, geen naam-gok", () => {
    // Dangling koppeling (prijsregel verwijderd/inactief) — de exacte naam zou
    // matchen, maar terugvallen op naam zou een stille gok zijn.
    const result = expandAssembly(
      singleComponent({
        pricing_item_id: "p-bestaat-niet",
        item_name_match: "Legarbeid klinkers simpel (halfsteens)",
      }),
      { area_m2: 10 },
      legDb
    );
    const line = result.lines[0];
    expect(line.price_source).toBe("missing");
    expect(line.pricing_id).toBeNull();
    expect(line.flags.some((f) => f.code === "MISSING_PRICE" && f.severity === "blocking")).toBe(true);
  });
});

describe("expandAssembly — C1: materiaalvoorkeur via token-overlap", () => {
  const materiaalDb: PricingRow[] = [
    { id: "p-waal", item_name: "Gebakken klinkers waalformaat", item_type: "materiaal", unit: "m²", selling_price_default: 45 },
  ];

  const hoofdMateriaal: AssemblyComponent[] = [
    { item_name_match: null, component_type: "materiaal", quantity_formula: "qty * 1.05", is_optional: false, flag_when_missing: null, sort_order: 1 },
  ];

  it("sterke match (≥2 significante tokens) krijgt geen WEAK_MATERIAL_MATCH", () => {
    const result = expandAssembly(
      hoofdMateriaal,
      { area_m2: 10, materialPreference: "klinkers waalformaat antraciet" },
      materiaalDb
    );
    const line = result.lines[0];
    expect(line.pricing_id).toBe("p-waal");
    expect(line.flags.some((f) => f.code === "WEAK_MATERIAL_MATCH")).toBe(false);
  });

  it("zwakke match (1 token) prijst wél maar flagt WEAK_MATERIAL_MATCH (warning) met de gekozen prijsregel", () => {
    const result = expandAssembly(
      hoofdMateriaal,
      { area_m2: 10, materialPreference: "klinkers antraciet" },
      materiaalDb
    );
    const line = result.lines[0];
    expect(line.pricing_id).toBe("p-waal");
    expect(line.price_source).toBe("database");
    const weak = line.flags.find((f) => f.code === "WEAK_MATERIAL_MATCH");
    expect(weak).toBeDefined();
    expect(weak!.severity).toBe("warning");
    expect(weak!.message).toContain("Gebakken klinkers waalformaat");
  });

  it("geen token-overlap = MISSING_PRICE, geen stille gok", () => {
    const result = expandAssembly(
      hoofdMateriaal,
      { area_m2: 10, materialPreference: "hardhouten vlonderplank" },
      materiaalDb
    );
    const line = result.lines[0];
    expect(line.price_source).toBe("missing");
    expect(line.flags.some((f) => f.code === "MISSING_PRICE")).toBe(true);
    expect(line.flags.some((f) => f.code === "WEAK_MATERIAL_MATCH")).toBe(false);
  });
});

describe("expandAssembly — herstraten: geen materiaalkosten voor de stenen", () => {
  const herstraten: AssemblyComponent[] = [
    { item_name_match: "Straatzand big bag incl. levering", component_type: "materiaal", quantity_formula: "qty * 0.055", is_optional: false, flag_when_missing: null, sort_order: 1 },
    { item_name_match: "Legarbeid klinkers simpel (halfsteens)", component_type: "arbeid", quantity_formula: "qty * 1.0", is_optional: false, flag_when_missing: null, sort_order: 2 },
  ];
  const result = expandAssembly(herstraten, { area_m2: 24, zanddikte_cm: 8 }, pricingDb);

  it("enige materiaalregel is correctiezand (1,32 m³), geen klinkers-materiaal", () => {
    const materiaal = result.lines.filter((l) => l.line_type === "materiaal");
    expect(materiaal).toHaveLength(1);
    expect(materiaal[0].description).toContain("Straatzand");
    expect(materiaal[0].quantity).toBeCloseTo(1.32, 3);
  });
});
