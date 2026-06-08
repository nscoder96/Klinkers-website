import { describe, it, expect } from "vitest";
import {
  groupComponents,
  AssemblyRow,
  AssemblyComponentRow,
} from "../assembly-loader";

const assemblyRows: AssemblyRow[] = [
  { id: "a-nieuw", name: "bestrating_nieuw", trigger_category: "bestrating", trigger_action: "nieuw,vervangen", unit: "m2", is_active: true },
  { id: "a-grond", name: "grondwerk_afgraven", trigger_category: "grondwerk", trigger_action: "nieuw,verwijderen", unit: "m2", is_active: true },
];

const componentRows: AssemblyComponentRow[] = [
  // bewust door elkaar qua sort_order om sortering te toetsen
  { id: "c2", assembly_id: "a-nieuw", item_name_match: "Straatzand big bag incl. levering", pricing_item_id: null, component_type: "materiaal", quantity_per_unit: 1, quantity_formula: "qty * zanddikte_cm / 100 * 1.10", is_optional: false, flag_when_missing: "⚠️ Zanddikte controleren", sort_order: 2 },
  { id: "c1", assembly_id: "a-nieuw", item_name_match: "Afgraven + afvoeren grond", pricing_item_id: null, component_type: "arbeid", quantity_per_unit: 1, quantity_formula: "qty * afgraafdiepte_cm / 100", is_optional: true, flag_when_missing: "⚠️ Afgraafdiepte controleren", sort_order: 1 },
  { id: "c3", assembly_id: "a-grond", item_name_match: "Container 10 m³", pricing_item_id: null, component_type: "materieel", quantity_per_unit: 1, quantity_formula: "greatest(ceil(cunet_m3 * 1.25 / 10), 1)", is_optional: false, flag_when_missing: null, sort_order: 2 },
];

describe("groupComponents — koppelt componenten aan hun assembly en sorteert", () => {
  const grouped = groupComponents(assemblyRows, componentRows);

  it("levert één entry per assembly", () => {
    expect(grouped).toHaveLength(2);
    expect(grouped.map((g) => g.name).sort()).toEqual(["bestrating_nieuw", "grondwerk_afgraven"]);
  });

  it("groepeert componenten onder de juiste assembly", () => {
    const nieuw = grouped.find((g) => g.name === "bestrating_nieuw")!;
    expect(nieuw.components).toHaveLength(2);
    const grond = grouped.find((g) => g.name === "grondwerk_afgraven")!;
    expect(grond.components).toHaveLength(1);
  });

  it("sorteert componenten op sort_order", () => {
    const nieuw = grouped.find((g) => g.name === "bestrating_nieuw")!;
    expect(nieuw.components.map((c) => c.sort_order)).toEqual([1, 2]);
    expect(nieuw.components[0].item_name_match).toBe("Afgraven + afvoeren grond");
  });

  it("mapt DB-rij naar de engine-vorm (item_name_match, component_type, quantity_formula, flags)", () => {
    const grond = grouped.find((g) => g.name === "grondwerk_afgraven")!;
    const c = grond.components[0];
    expect(c.component_type).toBe("materieel");
    expect(c.quantity_formula).toBe("greatest(ceil(cunet_m3 * 1.25 / 10), 1)");
    expect(c.is_optional).toBe(false);
    expect(c.flag_when_missing).toBeNull();
  });

  it("behoudt de trigger-velden op de assembly (voor selectAssembly)", () => {
    const nieuw = grouped.find((g) => g.name === "bestrating_nieuw")!;
    expect(nieuw.trigger_category).toBe("bestrating");
    expect(nieuw.trigger_action).toBe("nieuw,vervangen");
  });

  it("geeft een lege componentenlijst voor een assembly zonder componenten", () => {
    const grouped2 = groupComponents(
      [{ id: "a-leeg", name: "leeg", trigger_category: null, trigger_action: null, unit: "m2", is_active: true }],
      []
    );
    expect(grouped2[0].components).toEqual([]);
  });
});
