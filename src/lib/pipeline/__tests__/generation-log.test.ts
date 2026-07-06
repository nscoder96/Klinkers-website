/**
 * Tests voor generation-run logging (B1).
 *
 * - Elke run wordt als één rij weggeschreven, mét model en promptversie (B2).
 * - Niet-blokkerend: een insert-fout of exception geeft null terug en gooit
 *   nooit — de offertestroom mag er niet op breken.
 */

import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logGenerationRun, type GenerationRunInput } from "../generation-log.service";

interface Captured {
  inserts: Array<Record<string, unknown>>;
}

function fakeSupabase(
  captured: Captured,
  behavior: "ok" | "insert-error" | "throws" = "ok"
): SupabaseClient {
  const from = () => {
    const builder = {
      insert(payload: Record<string, unknown>) {
        if (behavior === "throws") throw new Error("tabel bestaat niet");
        captured.inserts.push(payload);
        return builder;
      },
      select: () => builder,
      single: () =>
        behavior === "insert-error"
          ? { data: null, error: { message: "insert mislukt" } }
          : { data: { id: "run-1" }, error: null },
    };
    return builder;
  };
  return { from } as unknown as SupabaseClient;
}

function run(partial: Partial<GenerationRunInput> = {}): GenerationRunInput {
  return {
    quote_id: null,
    notes_raw: "Terras 4x5m herstraten",
    ai_output: { activities: [], summary: "test", confidence: 0.9 },
    model: "claude-sonnet-4-6",
    prompt_version: "2026-07-06.1",
    confidence: 0.9,
    flags: [],
    config: { method: "uitgesplitst", layout: "uitgesplitst" },
    duration_ms: 1234,
    ...partial,
  };
}

describe("logGenerationRun (B1)", () => {
  it("schrijft één rij weg met model én promptversie (B2)", async () => {
    const captured: Captured = { inserts: [] };
    const id = await logGenerationRun(fakeSupabase(captured), run());

    expect(id).toBe("run-1");
    expect(captured.inserts).toHaveLength(1);
    const rij = captured.inserts[0];
    expect(rij.model).toBe("claude-sonnet-4-6");
    expect(rij.prompt_version).toBe("2026-07-06.1");
    expect(rij.notes_raw).toBe("Terras 4x5m herstraten");
    expect(rij.duration_ms).toBe(1234);
  });

  it("run zonder persist: quote_id null wordt gewoon gelogd", async () => {
    const captured: Captured = { inserts: [] };
    await logGenerationRun(fakeSupabase(captured), run({ quote_id: null }));
    expect(captured.inserts[0].quote_id).toBeNull();
  });

  it("insert-fout → null, geen throw (niet-blokkerend)", async () => {
    const captured: Captured = { inserts: [] };
    const id = await logGenerationRun(fakeSupabase(captured, "insert-error"), run());
    expect(id).toBeNull();
  });

  it("exception (bv. tabel bestaat niet) → null, geen throw", async () => {
    const captured: Captured = { inserts: [] };
    const id = await logGenerationRun(fakeSupabase(captured, "throws"), run());
    expect(id).toBeNull();
  });
});
