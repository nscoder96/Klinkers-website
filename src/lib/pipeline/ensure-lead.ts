/**
 * ensureLead (A4) — zorgt dat er een lead bestaat voor de opgegeven
 * klantgegevens en geeft de lead-id terug. Zonder naam → geen lead (null).
 *
 * Duplicaat-preventie via losse .eq()-queries (eerst e-mail, dan telefoon),
 * zodat gebruikersinvoer nooit in een PostgREST-filterexpressie belandt —
 * een komma of haakje in een e-mailadres brak voorheen de .or()-filterstring.
 *
 * Naamcheck op béide matchpaden: een gedeeld telefoonnummer of gedeeld
 * (zakelijk) e-mailadres met een afwijkende contactnaam is géén duplicaat —
 * dan wordt een nieuwe lead aangemaakt in plaats van de offerte aan de
 * verkeerde persoon te hangen.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface LeadInput {
  name: string;
  phone: string;
  email: string;
  address: string;
}

/** Naamvergelijking: case-insensitief en getrimd. */
function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export async function ensureLead(
  supabase: SupabaseClient,
  input: LeadInput
): Promise<string | null> {
  if (!input.name) return null;

  const matchers = [
    input.email ? { column: "email", value: input.email } : null,
    input.phone ? { column: "phone", value: input.phone } : null,
  ].filter(Boolean) as Array<{ column: string; value: string }>;

  for (const m of matchers) {
    const { data: existing } = await supabase
      .from("leads")
      .select("id, name")
      .eq(m.column, m.value)
      .limit(1)
      .maybeSingle();

    // Alleen hergebruiken als ook de naam klopt; anders volgende matcher
    // proberen en desnoods een nieuwe lead aanmaken.
    if (existing?.id && sameName((existing.name as string) ?? "", input.name)) {
      return existing.id as string;
    }
  }

  const { data: newLead, error: leadError } = await supabase
    .from("leads")
    .insert({
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
      city: "",
      source: "other",
      status: "new",
    })
    .select("id")
    .single();

  if (leadError || !newLead) {
    throw new Error(`Kon klant niet aanmaken: ${leadError?.message ?? "onbekend"}`);
  }

  return newLead.id as string;
}
