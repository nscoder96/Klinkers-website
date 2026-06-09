import { describe, it, expect } from "vitest";
import { consolidatePavingActivities } from "../activity-consolidation";
import type { PipelineActivity } from "../quote-pipeline.service";

function act(p: Partial<PipelineActivity>): PipelineActivity {
  return {
    type: "bestrating",
    action: "nieuw",
    description: "Oprit",
    area_m2: 0,
    ...p,
  };
}

describe("consolidatePavingActivities", () => {
  it("vouwt een losse afgraven-activiteit in de bestrating-aanleg (diepte verhuist)", () => {
    const result = consolidatePavingActivities([
      act({ type: "grondwerk", action: "nieuw", description: "Afgraven cunet", area_m2: 70, afgraafdiepte_cm: 20 }),
      act({ type: "bestrating", action: "nieuw", description: "Oprit klinkers", area_m2: 70, zanddikte_cm: 10 }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("bestrating");
    expect(result[0].afgraafdiepte_cm).toBe(20);
    expect(result[0].zanddikte_cm).toBe(10);
  });

  it("gooit een losse opsluitband-activiteit zonder oppervlak weg", () => {
    const result = consolidatePavingActivities([
      act({ type: "bestrating", action: "nieuw", description: "Oprit klinkers", area_m2: 70 }),
      act({ type: "bestrating", action: "nieuw", description: "Opsluitbanden beton rondom", area_m2: 0 }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe("Oprit klinkers");
  });

  it("behoudt los grondwerk zonder bestrating erbovenop", () => {
    const result = consolidatePavingActivities([
      act({ type: "grondwerk", action: "nieuw", description: "Tuin uitgraven", area_m2: 200, afgraafdiepte_cm: 30 }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("grondwerk");
  });

  it("raakt verwijderen-activiteiten niet aan (Test 3)", () => {
    const result = consolidatePavingActivities([
      act({ type: "bestrating", action: "nieuw", description: "Nieuw pad", area_m2: 9.6 }),
      act({ type: "bestrating", action: "verwijderen", description: "Tegels opbreken", area_m2: 9 }),
    ]);
    expect(result).toHaveLength(2);
  });

  it("is idempotent op een al-schone enkele activiteit", () => {
    const input = [act({ type: "bestrating", action: "nieuw", description: "Oprit", area_m2: 70, afgraafdiepte_cm: 20, zanddikte_cm: 10 })];
    const result = consolidatePavingActivities(input);
    expect(result).toEqual(input);
  });

  it("behoudt forfaitaire posten zonder oppervlak (kolkaansluiting)", () => {
    const result = consolidatePavingActivities([
      act({ type: "bestrating", action: "nieuw", description: "Oprit", area_m2: 70 }),
      act({ type: "overig", action: "nieuw", description: "Kolkaansluiting straatzijde", area_m2: 0 }),
    ]);
    expect(result.some((a) => a.description.includes("Kolkaansluiting"))).toBe(true);
  });

  it("vouwt afgraven met benaderend gelijk oppervlak in (binnen 5%)", () => {
    const result = consolidatePavingActivities([
      act({ type: "grondwerk", action: "nieuw", description: "Afgraven", area_m2: 71, afgraafdiepte_cm: 25 }),
      act({ type: "bestrating", action: "nieuw", description: "Terras", area_m2: 70 }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].afgraafdiepte_cm).toBe(25);
  });
});
