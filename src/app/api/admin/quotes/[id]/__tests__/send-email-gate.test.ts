/**
 * Acceptatietest C2.1 — het hele verzendpad:
 * een offerte met een onopgeloste blocking flag krijgt 422 met de flag-codes,
 * de status gaat niet naar sent, er wordt geen mail verstuurd (ook niet
 * gesimuleerd) en er worden geen correctierijen gelogd. Zonder blocking
 * flags loopt verzenden gewoon door.
 *
 * Draait op het gesimuleerde pad (geen RESEND_API_KEY): de gate zit vóór
 * beide paden, dus vóór álle mutaties.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

interface Captured {
  quoteUpdates: Array<Record<string, unknown>>;
  inserts: Array<{ table: string; payload: unknown }>;
}

interface FakeDb {
  quote: Record<string, unknown>;
  run: { id: string; flags: unknown; generated_lines?: unknown } | null;
  resolutions: Array<{ flag_code: string; flag_message: string }>;
  captured: Captured;
}

const db: FakeDb = {
  quote: {},
  run: null,
  resolutions: [],
  captured: { quoteUpdates: [], inserts: [] },
};

function makeBuilder(table: string) {
  const awaited = () => {
    if (table === "quote_flag_resolutions") return { data: db.resolutions, error: null };
    return { data: [], error: null };
  };
  const builder: Record<string, unknown> = {};
  Object.assign(builder, {
    select: () => builder,
    eq: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    single: async () =>
      table === "quotes" ? { data: db.quote, error: null } : { data: null, error: null },
    maybeSingle: async () =>
      table === "quote_generation_runs" ? { data: db.run, error: null } : { data: null, error: null },
    update: (payload: Record<string, unknown>) => {
      if (table === "quotes") db.captured.quoteUpdates.push(payload);
      return builder;
    },
    insert: (payload: unknown) => {
      db.captured.inserts.push({ table, payload });
      return builder;
    },
    upsert: async () => ({ data: null, error: null }),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(awaited()).then(resolve),
  });
  return builder;
}

vi.mock("@/lib/supabase/client", () => ({
  createServerClient: () => ({ from: (table: string) => makeBuilder(table) }),
}));

import { POST } from "../send-email/route";

function makeRequest(): Request {
  return { json: async () => ({ customMessage: "" }) } as unknown as Request;
}

const params = Promise.resolve({ id: "q-1" });

const BLOCKING = {
  code: "MISSING_PRICE",
  severity: "blocking",
  message: "Geen prijs gevonden — vul handmatig in",
};

beforeEach(() => {
  db.quote = {
    id: "q-1",
    lead_id: "lead-1",
    quote_number: "OFF-2026-001",
    accept_token: null,
    leads: { name: "Test", email: "test@example.com", phone: null, address: null, city: null },
  };
  db.run = null;
  db.resolutions = [];
  db.captured = { quoteUpdates: [], inserts: [] };
  delete process.env.RESEND_API_KEY;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("send-email route — blocking-gate (C2.1)", () => {
  it("onopgeloste blocking flag → 422 met flag-codes, géén mutaties", async () => {
    db.run = { id: "run-1", flags: [BLOCKING] };

    const res = await POST(makeRequest(), { params });
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(JSON.stringify(body.blockingFlags)).toContain("MISSING_PRICE");
    // Geen status-update, geen sent_at, geen correctierijen, geen activiteit.
    expect(db.captured.quoteUpdates).toHaveLength(0);
    expect(db.captured.inserts).toHaveLength(0);
  });

  it("opgeloste blocking flag → verzenden loopt door", async () => {
    db.run = { id: "run-1", flags: [BLOCKING] };
    db.resolutions = [{ flag_code: BLOCKING.code, flag_message: BLOCKING.message }];

    const res = await POST(makeRequest(), { params });

    expect(res.status).toBe(200);
    expect(db.captured.quoteUpdates).toHaveLength(1);
    expect(db.captured.quoteUpdates[0]).toMatchObject({ status: "sent" });
  });

  it("geen blocking flags (alleen warning) → verzenden loopt door", async () => {
    db.run = {
      id: "run-1",
      flags: [{ code: "WEAK_MATERIAL_MATCH", severity: "warning", message: "controleer" }],
    };

    const res = await POST(makeRequest(), { params });

    expect(res.status).toBe(200);
    expect(db.captured.quoteUpdates).toHaveLength(1);
    expect(db.captured.quoteUpdates[0]).toMatchObject({ status: "sent" });
  });
});
