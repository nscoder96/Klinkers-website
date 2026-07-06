/**
 * Tests voor de flag-gate (C2.1).
 *
 * Ontwerp: gate op de gepersisteerde flags van de jongste generation run;
 * een gelogde oplos-actie (code + message) haalt een flag uit de gate.
 * Resoluties onleesbaar = niets opgelost (strenger, nooit ruimer).
 */

import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getQuoteFlags,
  getUnresolvedBlockingFlags,
  resolveQuoteFlag,
} from "../flag-gate.service";

interface FakeOpts {
  run: { id: string; flags: unknown } | null;
  resolutions?: Array<{ flag_code: string; flag_message: string }>;
  resolutionsError?: boolean;
  captured?: { upserts: Array<Record<string, unknown>> };
}

function fakeSupabase(opts: FakeOpts): SupabaseClient {
  const from = (table: string) => {
    const awaited =
      table === "quote_flag_resolutions"
        ? opts.resolutionsError
          ? { data: null, error: { message: "relation does not exist" } }
          : { data: opts.resolutions ?? [], error: null }
        : { data: null, error: null };

    const builder: Record<string, unknown> = {};
    Object.assign(builder, {
      select: () => builder,
      eq: () => builder,
      order: () => builder,
      limit: () => builder,
      maybeSingle: async () =>
        table === "quote_generation_runs"
          ? { data: opts.run, error: null }
          : { data: null, error: null },
      upsert: async (payload: Record<string, unknown>) => {
        opts.captured?.upserts.push({ table, ...payload });
        return { data: null, error: null };
      },
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve(awaited).then(resolve),
    });
    return builder;
  };
  return { from } as unknown as SupabaseClient;
}

const BLOCKING = {
  code: "MISSING_PRICE",
  severity: "blocking",
  message: 'Geen prijs gevonden voor "Voegzand zak 25 kg" — vul handmatig in',
};
const WARNING = {
  code: "WEAK_MATERIAL_MATCH",
  severity: "warning",
  message: "Zwakke match — controleer",
};

describe("getUnresolvedBlockingFlags (C2.1)", () => {
  it("geen generation run → geen flags, gate open (pre-B1 offerte)", async () => {
    const sb = fakeSupabase({ run: null });
    expect(await getUnresolvedBlockingFlags(sb, "q-1")).toEqual([]);
  });

  it("blocking + warning zonder resoluties → alleen de blocking flag", async () => {
    const sb = fakeSupabase({ run: { id: "run-1", flags: [BLOCKING, WARNING] } });
    const result = await getUnresolvedBlockingFlags(sb, "q-1");
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("MISSING_PRICE");
  });

  it("opgeloste flag (code + message) telt niet meer mee", async () => {
    const sb = fakeSupabase({
      run: { id: "run-1", flags: [BLOCKING] },
      resolutions: [{ flag_code: BLOCKING.code, flag_message: BLOCKING.message }],
    });
    expect(await getUnresolvedBlockingFlags(sb, "q-1")).toEqual([]);
  });

  it("zelfde code maar andere message blijft blokkeren", async () => {
    const sb = fakeSupabase({
      run: { id: "run-1", flags: [BLOCKING] },
      resolutions: [{ flag_code: "MISSING_PRICE", flag_message: "andere post" }],
    });
    expect(await getUnresolvedBlockingFlags(sb, "q-1")).toHaveLength(1);
  });

  it("resoluties onleesbaar → niets geldt als opgelost (strenger, nooit ruimer)", async () => {
    const sb = fakeSupabase({
      run: { id: "run-1", flags: [BLOCKING] },
      resolutionsError: true,
    });
    expect(await getUnresolvedBlockingFlags(sb, "q-1")).toHaveLength(1);
  });

  it("misvormde flags-jsonb telt niet mee als vlag", async () => {
    const sb = fakeSupabase({
      run: { id: "run-1", flags: [{ onzin: true }, "tekst", BLOCKING] },
    });
    expect(await getUnresolvedBlockingFlags(sb, "q-1")).toHaveLength(1);
  });
});

describe("getQuoteFlags (C2.1)", () => {
  it("markeert per flag of hij opgelost is", async () => {
    const sb = fakeSupabase({
      run: { id: "run-1", flags: [BLOCKING, WARNING] },
      resolutions: [{ flag_code: BLOCKING.code, flag_message: BLOCKING.message }],
    });
    const { runId, flags } = await getQuoteFlags(sb, "q-1");
    expect(runId).toBe("run-1");
    expect(flags.find((f) => f.code === "MISSING_PRICE")!.resolved).toBe(true);
    expect(flags.find((f) => f.code === "WEAK_MATERIAL_MATCH")!.resolved).toBe(false);
  });
});

describe("resolveQuoteFlag (C2.1)", () => {
  it("logt de oplos-actie gekoppeld aan de jongste run", async () => {
    const captured = { upserts: [] as Array<Record<string, unknown>> };
    const sb = fakeSupabase({ run: { id: "run-1", flags: [BLOCKING] }, captured });
    await resolveQuoteFlag(sb, "q-1", BLOCKING.code, BLOCKING.message);
    expect(captured.upserts).toHaveLength(1);
    expect(captured.upserts[0]).toMatchObject({
      table: "quote_flag_resolutions",
      quote_id: "q-1",
      generation_run_id: "run-1",
      flag_code: "MISSING_PRICE",
      flag_message: BLOCKING.message,
    });
  });

  it("zonder generation run → fout (niets op te lossen)", async () => {
    const sb = fakeSupabase({ run: null });
    await expect(resolveQuoteFlag(sb, "q-1", "X", "y")).rejects.toThrow();
  });
});
