/**
 * Tests urennormen (C3).
 *
 * De golden-test garandeert dat de geseede tabel exact hetzelfde promptblok
 * oplevert als de oude hardcoded tekst — de omschakeling naar de database
 * verandert de prompt dus met geen letter (alleen PROMPT_VERSION gaat om).
 */

import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildNormsBlock,
  loadActiveLaborNorms,
  type LaborNorm,
} from "../labor-norms";

/** Zelfde 25 normen als de SQL-seed (migratie 18), in dezelfde volgorde. */
function norm(
  sort: number,
  category: string,
  key: string,
  label: string,
  hours: number | null,
  basis: number,
  unit: string,
  displayText: string | null = null
): LaborNorm {
  return {
    work_type_key: key,
    label,
    category,
    unit,
    hours_per_unit: hours,
    basis_qty: basis,
    display_text: displayText,
    sort_order: sort,
    source: "handmatig",
    is_active: true,
  };
}

export const SEED_NORMS: LaborNorm[] = [
  norm(10, "Herstraten/herleggen", "klinkers-herstraten", "Klinkers herstraten", 1.0, 10, "m²"),
  norm(20, "Herstraten/herleggen", "tegels-herstraten", "Tegels herstraten", 0.75, 10, "m²"),
  norm(30, "Herstraten/herleggen", "kleine-formaten-herstraten", "Kleine formaten (mozaïek, kasseien)", 2.0, 10, "m²"),
  norm(40, "Nieuw straatwerk", "klinkers-nieuw", "Klinkers nieuw leggen (incl. zandbed)", 1.5, 10, "m²"),
  norm(50, "Nieuw straatwerk", "tegels-nieuw", "Tegels nieuw leggen (incl. zandbed)", 1.25, 10, "m²"),
  norm(60, "Nieuw straatwerk", "oprit-klinkers", "Oprit klinkers aanleggen", 2.0, 10, "m²"),
  norm(70, "Grondwerk", "grond-afgraven", "Grond afgraven (10-20cm)", 0.5, 10, "m²"),
  norm(80, "Grondwerk", "grond-afvoeren", "Grond afvoeren (met kraan)", null, 10, "m²", "meegerekend in afgraven"),
  norm(90, "Grondwerk", "ophogen-zand", "Ophogen/aanvullen zand", 0.5, 10, "m²"),
  norm(100, "Grondwerk", "aantrillen", "Aantrillen", 0.3, 10, "m²"),
  norm(110, "Opsluitbanden", "opsluitbanden-plaatsen", "Opsluitbanden plaatsen", 1.0, 10, "meter"),
  norm(120, "Schutting/erfafscheiding", "betonpalen-zetten", "Betonpalen zetten", 1.5, 10, "palen"),
  norm(130, "Schutting/erfafscheiding", "schuttingdelen-plaatsen", "Schuttingdelen plaatsen", 0.5, 1, "meter"),
  norm(140, "Schutting/erfafscheiding", "schutting-compleet", "Schutting compleet", 1.0, 1, "meter"),
  norm(150, "Gazon", "graszoden-leggen", "Graszoden leggen", 0.5, 10, "m²"),
  norm(160, "Gazon", "grond-voorbereiden-gazon", "Grond voorbereiden voor gazon", 0.75, 10, "m²"),
  norm(170, "Beplanting", "struiken-klein", "Struiken planten (klein)", 0.5, 5, "stuks"),
  norm(180, "Beplanting", "struiken-groot", "Struiken planten (groot)", 0.5, 1, "stuk"),
  norm(190, "Beplanting", "border-aanleggen", "Border aanleggen", 1.0, 5, "m²"),
  norm(200, "Vlonders", "composiet-vlonder", "Composiet vlonder plaatsen", 1.5, 5, "m²"),
  norm(210, "Vlonders", "houten-vlonder", "Houten vlonder plaatsen", 1.0, 5, "m²"),
  norm(220, "Vlonders", "fundering-vlonder", "Fundering vlonder (steunpunten)", 1.0, 5, "punten"),
  norm(230, "Demontage/verwijdering", "schutting-slopen", "Schutting slopen", 0.5, 1, "meter"),
  norm(240, "Demontage/verwijdering", "bestrating-uitbreken", "Bestrating uitbreken + afvoeren", 0.5, 10, "m²"),
  norm(250, "Demontage/verwijdering", "boom-rooien-klein", "Boom rooien (klein)", 1.0, 1, "stuk"),
];

/** Het normenblok exact zoals het tot C3 hardcoded in de prompt stond. */
const GOLDEN_BLOCK = `**Herstraten/herleggen:**
- Klinkers herstraten: 1.0 uur per 10m²
- Tegels herstraten: 0.75 uur per 10m²
- Kleine formaten (mozaïek, kasseien): 2.0 uur per 10m²

**Nieuw straatwerk:**
- Klinkers nieuw leggen (incl. zandbed): 1.5 uur per 10m²
- Tegels nieuw leggen (incl. zandbed): 1.25 uur per 10m²
- Oprit klinkers aanleggen: 2.0 uur per 10m²

**Grondwerk:**
- Grond afgraven (10-20cm): 0.5 uur per 10m²
- Grond afvoeren (met kraan): meegerekend in afgraven
- Ophogen/aanvullen zand: 0.5 uur per 10m²
- Aantrillen: 0.3 uur per 10m²

**Opsluitbanden:**
- Opsluitbanden plaatsen: 1.0 uur per 10 meter

**Schutting/erfafscheiding:**
- Betonpalen zetten: 1.5 uur per 10 palen
- Schuttingdelen plaatsen: 0.5 uur per meter
- Schutting compleet: 1.0 uur per meter

**Gazon:**
- Graszoden leggen: 0.5 uur per 10m²
- Grond voorbereiden voor gazon: 0.75 uur per 10m²

**Beplanting:**
- Struiken planten (klein): 0.5 uur per 5 stuks
- Struiken planten (groot): 0.5 uur per stuk
- Border aanleggen: 1.0 uur per 5m²

**Vlonders:**
- Composiet vlonder plaatsen: 1.5 uur per 5m²
- Houten vlonder plaatsen: 1.0 uur per 5m²
- Fundering vlonder (steunpunten): 1.0 uur per 5 punten

**Demontage/verwijdering:**
- Schutting slopen: 0.5 uur per meter
- Bestrating uitbreken + afvoeren: 0.5 uur per 10m²
- Boom rooien (klein): 1.0 uur per stuk`;

describe("buildNormsBlock (C3) — golden test", () => {
  it("seed-normen leveren exact het oude hardcoded promptblok op", () => {
    expect(buildNormsBlock(SEED_NORMS)).toBe(GOLDEN_BLOCK);
  });

  it("alle actieve normen landen in de prompt", () => {
    const block = buildNormsBlock(SEED_NORMS);
    for (const n of SEED_NORMS) {
      expect(block).toContain(`- ${n.label}:`);
    }
  });

  it("een normwijziging is direct zichtbaar in het blok", () => {
    const adjusted = SEED_NORMS.map((n) =>
      n.work_type_key === "klinkers-herstraten"
        ? { ...n, hours_per_unit: 1.2 }
        : n
    );
    expect(buildNormsBlock(adjusted)).toContain("Klinkers herstraten: 1.2 uur per 10m²");
  });
});

describe("loadActiveLaborNorms (C3) — fail hard", () => {
  function fakeSupabase(result: { data: unknown; error: { message: string } | null }): SupabaseClient {
    const builder: Record<string, unknown> = {};
    Object.assign(builder, {
      select: () => builder,
      eq: () => builder,
      order: async () => result,
    });
    return { from: () => builder } as unknown as SupabaseClient;
  }

  it("queryfout → duidelijke fout, geen stille terugval", async () => {
    const sb = fakeSupabase({ data: null, error: { message: "relation does not exist" } });
    await expect(loadActiveLaborNorms(sb)).rejects.toThrow(/Urennormen niet beschikbaar/);
  });

  it("lege tabel → generatie geweigerd", async () => {
    const sb = fakeSupabase({ data: [], error: null });
    await expect(loadActiveLaborNorms(sb)).rejects.toThrow(/Geen actieve urennormen/);
  });

  it("gevulde tabel → normen terug", async () => {
    const sb = fakeSupabase({ data: SEED_NORMS, error: null });
    await expect(loadActiveLaborNorms(sb)).resolves.toHaveLength(25);
  });
});
