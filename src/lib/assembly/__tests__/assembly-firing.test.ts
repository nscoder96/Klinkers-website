import { describe, it, expect } from "vitest";
import {
  selectAssembly,
  mapToTriggerCategory,
  Assembly,
} from "../assembly-firing.service";

// Seed-conforme assemblies (zie migration 20260608_08_seed_assemblies.sql).
const assemblies: Assembly[] = [
  { id: "a-nieuw", name: "bestrating_nieuw", trigger_category: "bestrating", trigger_action: "nieuw,vervangen", unit: "m2" },
  { id: "a-herstr", name: "herstraten", trigger_category: "bestrating", trigger_action: "herstraten", unit: "m2" },
  { id: "a-grond", name: "grondwerk_afgraven", trigger_category: "grondwerk", trigger_action: "nieuw,verwijderen", unit: "m2" },
  { id: "a-verw", name: "verwijderen_bestrating", trigger_category: "bestrating", trigger_action: "verwijderen", unit: "m2" },
];

describe("mapToTriggerCategory — stratenmaker-subcategorieën → brede triggercategorie", () => {
  it("brengt bestrating-subcategorieën terug naar 'bestrating'", () => {
    expect(mapToTriggerCategory("bestrating_gebakken")).toBe("bestrating");
    expect(mapToTriggerCategory("bestrating_beton")).toBe("bestrating");
    expect(mapToTriggerCategory("bestrating_sier")).toBe("bestrating");
    expect(mapToTriggerCategory("bestrating_natuur")).toBe("bestrating");
    expect(mapToTriggerCategory("opsluitwerk")).toBe("bestrating");
  });

  it("brengt 'fundering' terug naar 'grondwerk'", () => {
    expect(mapToTriggerCategory("fundering")).toBe("grondwerk");
  });

  it("laat brede categorieën ongewijzigd", () => {
    expect(mapToTriggerCategory("bestrating")).toBe("bestrating");
    expect(mapToTriggerCategory("grondwerk")).toBe("grondwerk");
  });

  it("is hoofdletter-/spatie-ongevoelig en geeft onbekend ongewijzigd terug", () => {
    expect(mapToTriggerCategory("  Bestrating_Gebakken ")).toBe("bestrating");
    expect(mapToTriggerCategory("overig")).toBe("overig");
  });
});

describe("selectAssembly — welke assembly vuurt per (categorie, actie)", () => {
  it("bestrating + nieuw → bestrating_nieuw", () => {
    expect(selectAssembly("bestrating", "nieuw", assemblies)?.name).toBe("bestrating_nieuw");
  });

  it("bestrating + vervangen → bestrating_nieuw (comma-lijst trigger_action)", () => {
    expect(selectAssembly("bestrating", "vervangen", assemblies)?.name).toBe("bestrating_nieuw");
  });

  it("bestrating + herstraten → herstraten", () => {
    expect(selectAssembly("bestrating", "herstraten", assemblies)?.name).toBe("herstraten");
  });

  it("bestrating + verwijderen → verwijderen_bestrating (niet grondwerk_afgraven)", () => {
    expect(selectAssembly("bestrating", "verwijderen", assemblies)?.name).toBe("verwijderen_bestrating");
  });

  it("grondwerk + nieuw → grondwerk_afgraven", () => {
    expect(selectAssembly("grondwerk", "nieuw", assemblies)?.name).toBe("grondwerk_afgraven");
  });

  it("subcategorie bestrating_gebakken + nieuw → bestrating_nieuw (via mapping)", () => {
    expect(selectAssembly("bestrating_gebakken", "nieuw", assemblies)?.name).toBe("bestrating_nieuw");
  });

  it("fundering + nieuw → grondwerk_afgraven (via mapping)", () => {
    expect(selectAssembly("fundering", "nieuw", assemblies)?.name).toBe("grondwerk_afgraven");
  });

  it("geen match → null (bv. gazon, geen stratenmaker-assembly)", () => {
    expect(selectAssembly("gazon", "nieuw", assemblies)).toBeNull();
  });

  it("geen match → null (bestrating + repareren: geen assembly voor repareren)", () => {
    expect(selectAssembly("bestrating", "repareren", assemblies)).toBeNull();
  });

  it("negeert inactieve assemblies", () => {
    const inactief: Assembly[] = [
      { ...assemblies[0], is_active: false },
    ];
    expect(selectAssembly("bestrating", "nieuw", inactief)).toBeNull();
  });

  it("kiest bij meerdere matches de meest specifieke trigger", () => {
    const withCatchAll: Assembly[] = [
      { id: "a-any", name: "catch_all", trigger_category: null, trigger_action: null, unit: "m2" },
      ...assemblies,
    ];
    // bestrating_nieuw (cat+actie specifiek) wint van catch_all (geen triggers)
    expect(selectAssembly("bestrating", "nieuw", withCatchAll)?.name).toBe("bestrating_nieuw");
  });
});
