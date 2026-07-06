/**
 * Tests voor de geconsolideerde offerte-pipeline (F5 V1/V2-consolidatie).
 *
 * Knoopt de zuivere modules aan elkaar: selectAssembly → expandAssembly →
 * applyPricingMethod → structureQuote, per activiteit, met een gecombineerde
 * totalen-breakdown. Fixtures spiegelen de geseede assemblies/pricing.
 */

import { describe, it, expect } from "vitest";
import { runQuotePipeline } from "../quote-pipeline.service";
import type { AssemblyWithComponents } from "../../assembly/assembly-loader";
import type { PricingRow } from "../../assembly/assembly-expansion.service";

// ── Fixtures (subset van de seed, genoeg om de pipeline te valideren) ──────────

const PRICING: PricingRow[] = [
  { id: "p-afgraven", item_name: "Afgraven + afvoeren grond", item_type: "arbeid", unit: "m²", selling_price_default: 12 },
  { id: "p-container", item_name: "Container 10 m³", item_type: "materieel", unit: "stuk", selling_price_default: 280 },
  { id: "p-straatzand", item_name: "Straatzand big bag incl. levering", item_type: "materiaal", unit: "m³", selling_price_default: 105 },
  { id: "p-egaliseren", item_name: "Zandbed egaliseren + afreien", item_type: "arbeid", unit: "m²", selling_price_default: 5 },
  { id: "p-waalformaat", item_name: "Gebakken klinkers waalformaat", item_type: "materiaal", unit: "m²", selling_price_default: 45 },
  { id: "p-betonstraat", item_name: "Betonstraatstenen 30x30", item_type: "materiaal", unit: "m²", selling_price_default: 14 },
  { id: "p-legarbeid", item_name: "Legarbeid klinkers simpel (halfsteens)", item_type: "arbeid", unit: "m²", selling_price_default: 16 },
  { id: "p-aantrillen", item_name: "Aantrillen", item_type: "arbeid", unit: "m²", selling_price_default: 3 },
  { id: "p-voegen", item_name: "Invegen / voegen", item_type: "arbeid", unit: "m²", selling_price_default: 3 },
  { id: "p-voegzand", item_name: "Voegzand zak 25 kg", item_type: "materiaal", unit: "zak", selling_price_default: 7 },
  { id: "p-opsluit", item_name: "Opsluitband stellen incl. beton", item_type: "arbeid", unit: "m¹", selling_price_default: 11 },
  { id: "p-afvoerpuin", item_name: "Afvoer puin / oud materiaal", item_type: "arbeid", unit: "m²", selling_price_default: 15 },
];

const bestratingNieuw: AssemblyWithComponents = {
  id: "a-nieuw",
  name: "bestrating_nieuw",
  trigger_category: "bestrating",
  trigger_action: "nieuw,vervangen",
  unit: "m2",
  is_active: true,
  components: [
    { item_name_match: "Afgraven + afvoeren grond", component_type: "arbeid", quantity_formula: "qty * 1.0", is_optional: false, flag_when_missing: null, sort_order: 1 },
    { item_name_match: "Container 10 m³", component_type: "materieel", quantity_formula: "greatest(ceil(cunet_m3 * 1.25 / 10), 1)", is_optional: true, flag_when_missing: "⚠️ Afgraafdiepte niet opgegeven — controleer voor berekening", sort_order: 2 },
    { item_name_match: "Straatzand big bag incl. levering", component_type: "materiaal", quantity_formula: "qty * zanddikte_cm / 100 * 1.10", is_optional: false, flag_when_missing: "⚠️ Zanddikte niet opgegeven — minimaal 8 cm, controleer", sort_order: 3 },
    { item_name_match: "Zandbed egaliseren + afreien", component_type: "arbeid", quantity_formula: "qty * 1.0", is_optional: false, flag_when_missing: null, sort_order: 4 },
    { item_name_match: null, component_type: "materiaal", quantity_formula: "qty * 1.05", is_optional: false, flag_when_missing: null, sort_order: 5 },
    { item_name_match: "Legarbeid klinkers simpel (halfsteens)", component_type: "arbeid", quantity_formula: "qty * 1.0", is_optional: false, flag_when_missing: null, sort_order: 6 },
    { item_name_match: "Aantrillen", component_type: "arbeid", quantity_formula: "qty * 1.0", is_optional: false, flag_when_missing: null, sort_order: 7 },
    { item_name_match: "Invegen / voegen", component_type: "arbeid", quantity_formula: "qty * 1.0", is_optional: false, flag_when_missing: null, sort_order: 8 },
    { item_name_match: "Voegzand zak 25 kg", component_type: "materiaal", quantity_formula: "qty * 1.0", is_optional: false, flag_when_missing: null, sort_order: 9 },
    { item_name_match: null, component_type: "materiaal", quantity_formula: "perimeter_m * 1.1", is_optional: false, flag_when_missing: null, sort_order: 10 },
    { item_name_match: "Opsluitband stellen incl. beton", component_type: "arbeid", quantity_formula: "perimeter_m * 1.1", is_optional: false, flag_when_missing: null, sort_order: 11 },
  ],
};

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

const verwijderen: AssemblyWithComponents = {
  id: "a-verwijderen",
  name: "verwijderen_bestrating",
  trigger_category: "bestrating",
  trigger_action: "verwijderen",
  unit: "m2",
  is_active: true,
  components: [
    { item_name_match: "Afvoer puin / oud materiaal", component_type: "arbeid", quantity_formula: "qty * 1.0", is_optional: false, flag_when_missing: null, sort_order: 1 },
    { item_name_match: "Afvoer puin / oud materiaal", component_type: "arbeid", quantity_formula: "qty * 1.0", is_optional: false, flag_when_missing: null, sort_order: 2 },
    { item_name_match: "Container 10 m³", component_type: "materieel", quantity_formula: "greatest(ceil(qty * 0.15 * 1.25 / 10), 1)", is_optional: false, flag_when_missing: null, sort_order: 3 },
  ],
};

const ASSEMBLIES = [bestratingNieuw, herstraten, verwijderen];

describe("runQuotePipeline — meerdere activiteiten", () => {
  it("Test 1: nieuwe oprit met aantekeningen → geen Gouda-vlaggen, container = 2", () => {
    const result = runQuotePipeline(
      [
        {
          type: "bestrating",
          action: "nieuw",
          description: "Oprit klinkers waalformaat antraciet",
          area_m2: 70,
          length_m: 14,
          width_m: 5,
          afgraafdiepte_cm: 20,
          zanddikte_cm: 10,
          materialPreference: "klinkers waalformaat antraciet",
        },
      ],
      ASSEMBLIES,
      PRICING,
      { method: "uitgesplitst", layout: "uitgesplitst" }
    );

    const section = result.sections[0];
    expect(section.unmatched).toBe(false);
    // Geen ontbrekende Gouda-info → geen afgraaf/zand-vlaggen.
    expect(result.flags.join(" ")).not.toContain("Afgraafdiepte niet opgegeven");
    expect(result.flags.join(" ")).not.toContain("Zanddikte niet opgegeven");
    // Container: ceil(14 m³ × 1.25 / 10) = 2.
    const container = section.expand!.lines.find((l) => l.description.includes("Container"));
    expect(container!.quantity).toBe(2);
    // Hoofdmateriaal opgelost via voorkeur → waalformaat-prijs.
    const klinker = section.expand!.lines.find((l) => l.description.includes("waalformaat"));
    expect(klinker!.price_source).toBe("database");
  });

  it("Test 1b: oprit zonder zandinfo → afgraven/zand overgeslagen, geen Gouda-vlaggen", () => {
    const result = runQuotePipeline(
      [
        {
          type: "bestrating",
          action: "nieuw",
          description: "Oprit klinkers waalformaat antraciet",
          area_m2: 70,
          materialPreference: "klinkers waalformaat antraciet",
        },
      ],
      ASSEMBLIES,
      PRICING,
      { method: "uitgesplitst", layout: "uitgesplitst" }
    );

    const flags = result.flags.join(" ");
    expect(flags).not.toContain("Afgraafdiepte niet opgegeven");
    expect(flags).not.toContain("Zanddikte niet opgegeven");
  });

  it("Test 2: herstraten → geen steenmateriaal, arbeid-dominant", () => {
    const result = runQuotePipeline(
      [
        {
          type: "bestrating",
          action: "herstraten",
          description: "Terras herstraten",
          area_m2: 24,
        },
      ],
      ASSEMBLIES,
      PRICING,
      { method: "uitgesplitst", layout: "uitgesplitst" }
    );

    const section = result.sections[0];
    expect(section.assembly!.name).toBe("herstraten");
    // Geen klinker-/steen-MATERIAALregel (arbeid mag 'klinkers' heten).
    const stone = section.expand!.lines.find(
      (l) => l.line_type === "materiaal" && /klinker|tegel|steen|waalformaat/i.test(l.description)
    );
    expect(stone).toBeUndefined();
    // Arbeid-dominant (seed-prijzen geven ~68%; voegzand-formule overschat
    // materiaal — gerapporteerd in Fase 9 / bugs-and-risks).
    expect(section.structured!.distribution.labor_pct).toBeGreaterThan(60);
  });

  it("Test 3: gemengd nieuw + verwijderen → 2 secties, geen kruiscontaminatie", () => {
    const result = runQuotePipeline(
      [
        { type: "bestrating", action: "nieuw", description: "Pad betonstraatstenen", area_m2: 9.6, length_m: 8, width_m: 1.2, afgraafdiepte_cm: 15, zanddikte_cm: 8, materialPreference: "betonstraatstenen 30x30" },
        { type: "bestrating", action: "verwijderen", description: "Tegels opbreken", area_m2: 9 },
      ],
      ASSEMBLIES,
      PRICING,
      { method: "uitgesplitst", layout: "uitgesplitst" }
    );

    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].assembly!.name).toBe("bestrating_nieuw");
    expect(result.sections[1].assembly!.name).toBe("verwijderen_bestrating");
    // Verwijder-sectie heeft geen bestratingmateriaal.
    const removalMaterials = result.sections[1].expand!.lines.filter((l) => l.line_type === "materiaal");
    expect(removalMaterials).toHaveLength(0);
  });

  it("ongematchte activiteit → unmatched sectie, geen crash", () => {
    const result = runQuotePipeline(
      [{ type: "verlichting", action: "nieuw", description: "Tuinverlichting", area_m2: 0 }],
      ASSEMBLIES,
      PRICING,
      { method: "uitgesplitst", layout: "uitgesplitst" }
    );
    expect(result.sections[0].unmatched).toBe(true);
    expect(result.sections[0].expand).toBeNull();
  });

  it("Consistentie uitgesplitst vs uren (A1): identieke materialen en flags, arbeid verschilt qua opbouw", () => {
    const activiteit = {
      type: "bestrating",
      action: "nieuw",
      description: "Oprit klinkers waalformaat antraciet",
      area_m2: 70,
      length_m: 14,
      width_m: 5,
      afgraafdiepte_cm: 20,
      zanddikte_cm: 10,
      materialPreference: "klinkers waalformaat antraciet",
      estimated_hours: 25.5,
    };

    const uitgesplitst = runQuotePipeline([activiteit], ASSEMBLIES, PRICING, {
      method: "uitgesplitst",
      layout: "uitgesplitst",
    });
    const uren = runQuotePipeline([activiteit], ASSEMBLIES, PRICING, {
      method: "uren",
      layout: "uitgesplitst",
    });

    // Materiaal- en materieelregels zijn identiek tussen beide methodes.
    const nietArbeid = (r: typeof uitgesplitst) =>
      r.sections[0].display!.lines.filter((l) => l.line_type !== "arbeid");
    expect(nietArbeid(uren)).toEqual(nietArbeid(uitgesplitst));

    // Extractie-/prijsvlaggen identiek; verdelingswaarschuwingen (55/35/10)
    // mogen verschillen omdat de arbeidsopbouw bewust verschilt.
    const zonderVerdeling = (flags: string[]) =>
      flags.filter((f) => !f.includes("— controleer de berekening"));
    expect(zonderVerdeling(uren.flags)).toEqual(zonderVerdeling(uitgesplitst.flags));
    expect(uren.hasBlockingFlags).toBe(uitgesplitst.hasBlockingFlags);

    // Arbeid verschilt bewust qua opbouw: rauwe uren-regel + één dagafronding.
    const arbeidUren = uren.sections[0].display!.lines.filter((l) => l.line_type === "arbeid");
    expect(arbeidUren).toHaveLength(2);
    expect(arbeidUren[0].unit).toBe("uur");
    expect(arbeidUren[0].quantity).toBe(25.5); // rauwe AI-schatting
    expect(arbeidUren[1].description).toContain("Afronding naar hele werkdagen");
    expect(arbeidUren[1].quantity).toBe(6.5); // ceil(25.5/8) = 4 dagen × 8 u − 25.5 u
    const somUren = arbeidUren.reduce((acc, l) => acc + l.quantity, 0);
    expect(somUren).toBe(32);

    // Materiaal/materieel identiek in de totalen; arbeid blijft in dezelfde orde.
    expect(uren.combined.breakdown.subtotal_materials).toBe(
      uitgesplitst.combined.breakdown.subtotal_materials
    );
    expect(uren.combined.breakdown.subtotal_materieel).toBe(
      uitgesplitst.combined.breakdown.subtotal_materieel
    );
    const ratio =
      uren.combined.breakdown.grand_total / uitgesplitst.combined.breakdown.grand_total;
    expect(ratio).toBeGreaterThan(0.5);
    expect(ratio).toBeLessThan(2);

    // Totalen en 55/35/10-check rekenen op de offerte-regels zelf: de
    // breakdown volgt exact wat er op de offerte staat, ook de arbeid in uren.
    const displaySom = uren.sections[0]
      .display!.lines.reduce((acc, l) => acc + (l.total_cents ?? 0), 0);
    expect(uren.combined.breakdown.subtotal).toBe(displaySom);
    expect(uren.combined.breakdown.subtotal_labor).toBe(272000); // 32 u × €85
  });

  it("dagafronding geldt één keer over het offertetotaal, niet per sectie (3 × 2,5 u → 1 dag) (A1)", () => {
    const terras = (name: string) => ({
      type: "bestrating",
      action: "herstraten",
      description: name,
      area_m2: 20,
      estimated_hours: 2.5,
    });
    const result = runQuotePipeline(
      [terras("Terras A"), terras("Pad B"), terras("Oprit C")],
      ASSEMBLIES,
      PRICING,
      { method: "uren", layout: "uitgesplitst" }
    );

    const arbeid = result.sections.flatMap((s) =>
      s.display!.lines.filter((l) => l.line_type === "arbeid")
    );
    // Drie rauwe uren-regels + één dagafrondingsregel — géén drie losse afrondingen.
    expect(arbeid).toHaveLength(4);
    const afronding = arbeid.filter((l) =>
      l.description.includes("Afronding naar hele werkdagen")
    );
    expect(afronding).toHaveLength(1);
    expect(afronding[0].quantity).toBe(0.5); // 8 u (1 dag) − 7,5 u geschat
    // Klantleesbaar: Nederlandse notatie in de omschrijving.
    expect(afronding[0].description).toContain("1 werkdag · 8 uur");

    // Totaal: ceil(7,5/8) = 1 dag = 8 u × €85 = €680.
    // Per sectie afronden zou 3 × 8 u = 24 u = €2.040 geven.
    const totaalUren = arbeid.reduce((acc, l) => acc + l.quantity, 0);
    expect(totaalUren).toBe(8);
    const totaalCents = arbeid.reduce((acc, l) => acc + (l.total_cents ?? 0), 0);
    expect(totaalCents).toBe(68000);

    // De 55/35/10-check en combined-totalen rekenen op de offerte-regels
    // (incl. dagafronding), niet op de interne per-m²-decompositie.
    expect(result.combined.breakdown.subtotal_labor).toBe(68000);
    const somRegels = result.sections
      .flatMap((s) => s.display!.lines)
      .reduce((acc, l) => acc + (l.total_cents ?? 0), 0);
    expect(result.combined.breakdown.subtotal).toBe(somRegels);

    // De dagafronding telt mee in de totalen van de laatste sectie, maar
    // vertekent de sectie-verdeling niet: drie identieke secties houden een
    // identieke 55/35/10-beoordeling (de afronding is offerte-overhead).
    const [s1, , s3] = result.sections;
    expect(s3.structured!.breakdown.subtotal_labor).toBe(
      s1.structured!.breakdown.subtotal_labor + 4250 // + 0,5 u × €85
    );
    expect(s3.structured!.distribution).toEqual(s1.structured!.distribution);
    expect(s3.flags).toEqual(s1.flags);
  });

  it("meterprijs: totalen en 55/35/10-check rekenen op exact het bedrag van de all-in offerte-regel (A1)", () => {
    // Bewust een fixture MET een prijsloze regel (hoofdmateriaal zonder match):
    // ook dan moet de all-in regel exact gelijk zijn aan de check-basis.
    const result = runQuotePipeline(
      [
        {
          type: "bestrating",
          action: "nieuw",
          description: "Oprit klinkers",
          area_m2: 70,
          length_m: 14,
          width_m: 5,
          afgraafdiepte_cm: 20,
          zanddikte_cm: 10,
          // Geen materialPreference → hoofdmateriaalregel blijft 'missing'.
        },
      ],
      ASSEMBLIES,
      PRICING,
      { method: "meterprijs", layout: "uitgesplitst" }
    );

    const display = result.sections[0].display!.lines;
    expect(display).toHaveLength(1);
    expect(display[0].line_type).toBe("all_in");

    // Wat de klant ziet (all-in regel) == waar totalen en check op rekenen.
    expect(result.sections[0].structured!.breakdown.subtotal).toBe(display[0].total_cents);
    expect(result.combined.breakdown.subtotal).toBe(display[0].total_cents);

    // De prijsloze regel blijft wél zichtbaar als blokkerende vlag.
    expect(result.hasBlockingFlags).toBe(true);
  });

  it("uren-methode zonder urenschatting → terugval-vlag zichtbaar op de sectie (A1)", () => {
    const result = runQuotePipeline(
      [{ type: "bestrating", action: "herstraten", description: "Terras herstraten", area_m2: 24 }],
      ASSEMBLIES,
      PRICING,
      { method: "uren", layout: "uitgesplitst" }
    );
    expect(result.flags.some((f) => f.includes("Urenschatting ontbreekt"))).toBe(true);
    // De terugval is een waarschuwing, geen blokkade.
    expect(result.hasBlockingFlags).toBe(false);
  });

  it("combineert breakdowns over secties (grand_total = som)", () => {
    const result = runQuotePipeline(
      [
        { type: "bestrating", action: "herstraten", description: "Terras A", area_m2: 20 },
        { type: "bestrating", action: "herstraten", description: "Terras B", area_m2: 20 },
      ],
      ASSEMBLIES,
      PRICING,
      { method: "uitgesplitst", layout: "uitgesplitst" }
    );
    const perSection = result.sections.reduce((acc, s) => acc + (s.structured?.breakdown.grand_total ?? 0), 0);
    expect(result.combined.breakdown.grand_total).toBe(perSection);
  });
});
