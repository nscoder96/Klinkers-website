/**
 * Acceptatietests C2.4 — gefaseerde generate-v2:
 *   1. phase 'extract' draait GEEN assembly-expansie en GEEN prijsberekening —
 *      niets gaat de pipeline in zonder expliciete bevestiging.
 *   2. phase 'price' rekent met de bevestigde (gecorrigeerde) activiteiten —
 *      een correctie in de bevestigingsstap is terug te zien in de regels.
 *   3. phase 'price' + persist logt de extractie-correcties als
 *      extraction_corrected rijen (diff origineel vs. bevestigd).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ORIG_A = {
  type: "bestrating",
  action: "nieuw",
  description: "Oprit klinkers",
  dimensions: {},
  source_text: "oprit klinkers",
  materials_mentioned: [],
};
const ORIG_B = {
  type: "bestrating",
  action: "nieuw",
  description: "Pad tegels",
  dimensions: { area: 8 },
  source_text: "pad tegels 8m2",
  materials_mentioned: [],
};

const ASSEMBLIES = [
  {
    id: "a-1",
    name: "bestrating_nieuw",
    trigger_category: "bestrating",
    trigger_action: "nieuw,vervangen",
    unit: "m2",
    is_active: true,
    components: [
      {
        item_name_match: "Legarbeid klinkers simpel (halfsteens)",
        component_type: "arbeid",
        quantity_formula: "qty * 1.0",
        is_optional: false,
        flag_when_missing: null,
        sort_order: 1,
      },
    ],
  },
];

const PRICING = [
  {
    id: "p-leg",
    item_name: "Legarbeid klinkers simpel (halfsteens)",
    item_type: "arbeid",
    unit: "m²",
    selling_price_default: 16,
  },
];

// ── Mock supabase ─────────────────────────────────────────────────────────────

interface Captured {
  inserts: Array<{ table: string; payload: unknown }>;
  updates: Array<{ table: string; payload: unknown }>;
}

const NORM_ROW = {
  work_type_key: "klinkers-herstraten",
  label: "Klinkers herstraten",
  category: "Herstraten/herleggen",
  unit: "m²",
  hours_per_unit: 1,
  basis_qty: 10,
  display_text: null,
  sort_order: 1,
  source: "handmatig",
  is_active: true,
};

const db: { aiOutput: unknown; norms: unknown[]; captured: Captured } = {
  aiOutput: null,
  norms: [NORM_ROW],
  captured: { inserts: [], updates: [] },
};

function makeBuilder(table: string) {
  const builder: Record<string, unknown> = {};
  Object.assign(builder, {
    select: () => builder,
    eq: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    like: () => builder,
    single: async () => {
      if (table === "quotes") {
        return { data: { id: "q-1", quote_number: "OFF-2026-001" }, error: null };
      }
      if (table === "quote_sections") return { data: { id: "s-1" }, error: null };
      if (table === "quote_generation_runs") return { data: { id: "run-1" }, error: null };
      return { data: null, error: null };
    },
    maybeSingle: async () => {
      if (table === "quote_generation_runs") {
        return { data: { id: "run-1", ai_output: db.aiOutput }, error: null };
      }
      return { data: null, error: null };
    },
    insert: (payload: unknown) => {
      db.captured.inserts.push({ table, payload });
      return builder;
    },
    update: (payload: unknown) => {
      db.captured.updates.push({ table, payload });
      return builder;
    },
    then: (resolve: (v: unknown) => unknown) => {
      if (table === "labor_norms") {
        return Promise.resolve({ data: db.norms, error: null }).then(resolve);
      }
      const value =
        table === "quote_line_items"
          ? {
              data: [
                {
                  id: "li-1",
                  description: "Legarbeid klinkers simpel (halfsteens)",
                  quantity: 24,
                  unit: "m²",
                  unit_price: 16,
                  line_type: "arbeid",
                  section_id: "s-1",
                },
              ],
              error: null,
            }
          : { data: [], error: null };
      return Promise.resolve(value).then(resolve);
    },
  });
  return builder;
}

vi.mock("@/lib/supabase/client", () => ({
  createServerClient: () => ({ from: (table: string) => makeBuilder(table) }),
}));

const analyzeNotesMock = vi.fn();
vi.mock("@/lib/services/ai-understanding.service", () => ({
  analyzeNotes: (notes: string) => analyzeNotesMock(notes),
  PROMPT_VERSION: "test.1",
  UNDERSTANDING_MODEL: "test-model",
}));

const loadAssembliesMock = vi.fn(async () => ASSEMBLIES);
vi.mock("@/lib/assembly/assembly-loader", () => ({
  loadActiveAssemblies: () => loadAssembliesMock(),
}));

vi.mock("@/lib/pipeline/pricing-loader", () => ({
  loadActivePricing: async () => PRICING,
}));

import { POST } from "../route";

function makeRequest(body: unknown): Request {
  return { json: async () => body } as unknown as Request;
}

beforeEach(() => {
  db.aiOutput = null;
  db.norms = [NORM_ROW];
  db.captured = { inserts: [], updates: [] };
  analyzeNotesMock.mockReset();
  loadAssembliesMock.mockClear();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("generate-v2 phase 'extract' (C2.4)", () => {
  it("draait alleen Laag 1: geen assemblies geladen, geen pipeline in de response", async () => {
    analyzeNotesMock.mockResolvedValue({
      summary: "Oprit klinkers",
      confidence: 0.9,
      activities: [ORIG_A],
    });

    const res = await POST(makeRequest({ phase: "extract", notes: "oprit klinkers" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.generationRunId).toBe("run-1");
    expect(body.ai.activities).toHaveLength(1);
    expect(body.pipeline).toBeUndefined();
    // Kern van de bevestigingsstap: de rekenlaag is niet aangeraakt.
    expect(loadAssembliesMock).not.toHaveBeenCalled();
    // De run is wél gelogd (koppeling voor latere correcties).
    expect(
      db.captured.inserts.filter((i) => i.table === "quote_generation_runs")
    ).toHaveLength(1);
  });
});

describe("generate-v2 — urennormen fail hard (C3)", () => {
  it("lege labor_norms-tabel → 503 met duidelijke fout, AI niet aangeroepen", async () => {
    db.norms = [];

    const res = await POST(makeRequest({ phase: "extract", notes: "oprit klinkers" }));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toContain("urennormen");
    expect(analyzeNotesMock).not.toHaveBeenCalled();
    // Geen run gelogd — er is geen AI-output om te loggen.
    expect(
      db.captured.inserts.filter((i) => i.table === "quote_generation_runs")
    ).toHaveLength(0);
  });
});

describe("generate-v2 phase 'price' (C2.4)", () => {
  it("rekent met de bevestigde correctie: aangevulde afmeting zichtbaar in de regels", async () => {
    const res = await POST(
      makeRequest({
        phase: "price",
        generationRunId: "run-1",
        activities: [{ ...ORIG_A, dimensions: { area: 24 }, original_index: 0 }],
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    // AI is niet opnieuw aangeroepen — de bevestigde activiteiten zijn de bron.
    expect(analyzeNotesMock).not.toHaveBeenCalled();
    expect(body.pipeline.sections).toHaveLength(1);
    expect(body.pipeline.sections[0].title).toContain("24 m²");
    const arbeid = body.pipeline.sections[0].display_lines.find(
      (l: { description: string }) => l.description.includes("Legarbeid")
    );
    expect(arbeid.quantity).toBe(24);
    // Run bijgewerkt met de definitieve flags (bron van de verzend-gate).
    const runUpdates = db.captured.updates.filter(
      (u) => u.table === "quote_generation_runs"
    );
    expect(runUpdates).toHaveLength(1);
  });

  it("ongeldige activiteiten → 400 (systeemgrens-validatie)", async () => {
    const res = await POST(
      makeRequest({ phase: "price", activities: [{ onzin: true }] })
    );
    expect(res.status).toBe(400);
  });

  it("persist logt extractie-correcties: afmeting aangevuld + activiteit verwijderd → 2 rijen", async () => {
    db.aiOutput = { activities: [ORIG_A, ORIG_B] };

    const res = await POST(
      makeRequest({
        phase: "price",
        generationRunId: "run-1",
        persist: true,
        activities: [{ ...ORIG_A, dimensions: { area: 24 }, original_index: 0 }],
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.persistence.quoteId).toBe("q-1");

    const correctieInserts = db.captured.inserts.filter(
      (i) => i.table === "quote_line_corrections"
    );
    expect(correctieInserts).toHaveLength(1);
    const rows = correctieInserts[0].payload as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.correction_type === "extraction_corrected")).toBe(true);
    expect(rows.every((r) => r.quote_id === "q-1")).toBe(true);

    const gewijzigd = rows.find((r) => r.line_description === "Oprit klinkers")!;
    expect(gewijzigd.new_value).toEqual({ dimensions: { area: 24 } });
    const verwijderd = rows.find((r) => r.line_description === "Pad tegels")!;
    expect(verwijderd.new_value).toBeNull();

    // Run gekoppeld aan de offerte + snapshot voor de verzend-diff (B3).
    const runUpdate = db.captured.updates.find(
      (u) => u.table === "quote_generation_runs"
    )!;
    expect(runUpdate.payload).toMatchObject({ quote_id: "q-1" });
  });
});
