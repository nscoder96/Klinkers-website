/**
 * Tests voor ensureLead (A4).
 *
 * - Gebruikersinvoer gaat via losse .eq()-queries, nooit een PostgREST
 *   .or()-filterstring: een e-mailadres met komma en haakjes mag geen
 *   filterfout geven.
 * - Naamcheck op béide matchpaden (e-mail én telefoon): zelfde nummer of
 *   gedeeld zakelijk mailadres met een andere contactpersoon → nieuwe lead.
 */

import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureLead, type LeadInput } from "../ensure-lead";

interface ExistingLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Captured {
  eqCalls: Array<{ column: string; value: string }>;
  orCalls: string[];
  inserts: Array<Record<string, unknown>>;
}

/** Fake leads-tabel: matcht .eq() op email/phone tegen de gegeven rijen. */
function fakeSupabase(rows: ExistingLead[], captured: Captured): SupabaseClient {
  const from = (table: string) => {
    let matched: ExistingLead | null = null;

    const builder = {
      select: () => builder,
      eq(column: string, value: string) {
        captured.eqCalls.push({ column, value });
        matched =
          rows.find(
            (r) => (r as unknown as Record<string, string>)[column] === value
          ) ?? null;
        return builder;
      },
      or(filter: string) {
        captured.orCalls.push(filter);
        return builder;
      },
      limit: () => builder,
      maybeSingle: () =>
        matched
          ? { data: { id: matched.id, name: matched.name }, error: null }
          : { data: null, error: null },
      insert(payload: Record<string, unknown>) {
        if (table === "leads") captured.inserts.push(payload);
        return builder;
      },
      single: () => ({ data: { id: "nieuw-lead-id" }, error: null }),
    };
    return builder;
  };
  return { from } as unknown as SupabaseClient;
}

function input(partial: Partial<LeadInput>): LeadInput {
  return { name: "", phone: "", email: "", address: "", ...partial };
}

describe("ensureLead (A4)", () => {
  it("e-mailadres met komma en haakjes gaat als losse .eq()-waarde, zonder .or()-filter", async () => {
    const captured: Captured = { eqCalls: [], orCalls: [], inserts: [] };
    const gekkeEmail = 'jan,(privé)@voorbeeld.nl';

    const id = await ensureLead(
      fakeSupabase([], captured),
      input({ name: "Jan Jansen", email: gekkeEmail })
    );

    expect(captured.orCalls).toHaveLength(0); // nooit een filterstring
    expect(captured.eqCalls).toContainEqual({ column: "email", value: gekkeEmail });
    expect(id).toBe("nieuw-lead-id"); // geen match → nieuwe lead, geen fout
  });

  it("gedeeld telefoonnummer + afwijkende naam → nieuwe lead", async () => {
    const captured: Captured = { eqCalls: [], orCalls: [], inserts: [] };
    const bestaand = [{ id: "lead-1", name: "Piet Peters", phone: "0612345678" }];

    const id = await ensureLead(
      fakeSupabase(bestaand, captured),
      input({ name: "Klaas Klaassen", phone: "0612345678" })
    );

    expect(id).toBe("nieuw-lead-id");
    expect(captured.inserts).toHaveLength(1);
    expect(captured.inserts[0].name).toBe("Klaas Klaassen");
  });

  it("gedeeld e-mailadres + afwijkende naam → nieuwe lead (zelfde risico als telefoon)", async () => {
    const captured: Captured = { eqCalls: [], orCalls: [], inserts: [] };
    const bestaand = [{ id: "lead-1", name: "Piet Peters", email: "info@bedrijf.nl" }];

    const id = await ensureLead(
      fakeSupabase(bestaand, captured),
      input({ name: "Klaas Klaassen", email: "info@bedrijf.nl" })
    );

    expect(id).toBe("nieuw-lead-id");
    expect(captured.inserts).toHaveLength(1);
  });

  it("zelfde naam (case-insensitief, getrimd) → bestaande lead hergebruikt", async () => {
    const captured: Captured = { eqCalls: [], orCalls: [], inserts: [] };
    const bestaand = [{ id: "lead-1", name: "Piet Peters", email: "piet@voorbeeld.nl" }];

    const id = await ensureLead(
      fakeSupabase(bestaand, captured),
      input({ name: "  PIET peters ", email: "piet@voorbeeld.nl" })
    );

    expect(id).toBe("lead-1");
    expect(captured.inserts).toHaveLength(0);
  });

  it("e-mailmatch met afwijkende naam, maar telefoonmatch met zelfde naam → die lead hergebruikt", async () => {
    const captured: Captured = { eqCalls: [], orCalls: [], inserts: [] };
    const bestaand = [
      { id: "lead-1", name: "Piet Peters", email: "info@bedrijf.nl" },
      { id: "lead-2", name: "Klaas Klaassen", phone: "0687654321" },
    ];

    const id = await ensureLead(
      fakeSupabase(bestaand, captured),
      input({ name: "Klaas Klaassen", email: "info@bedrijf.nl", phone: "0687654321" })
    );

    expect(id).toBe("lead-2");
    expect(captured.inserts).toHaveLength(0);
  });

  it("zonder naam → null, geen queries of inserts", async () => {
    const captured: Captured = { eqCalls: [], orCalls: [], inserts: [] };
    const id = await ensureLead(fakeSupabase([], captured), input({ email: "x@y.nl" }));
    expect(id).toBeNull();
    expect(captured.eqCalls).toHaveLength(0);
    expect(captured.inserts).toHaveLength(0);
  });
});
