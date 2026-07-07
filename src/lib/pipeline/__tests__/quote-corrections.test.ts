/**
 * Tests voor quote-corrections (B3).
 *
 * Acceptatie: genereer → wijzig één hoeveelheid, verwijder één regel →
 * verstuur → exact twee correctierijen met correcte old/new-waardes.
 * Diff op regel-id (stabiel onder de edit-endpoints); per verschil één rij.
 */

import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  diffQuoteLines,
  diffExtractionActivities,
  diffGeneratedVsEdited,
  recordQuoteCorrections,
  type ConfirmedActivity,
  type EditedLineInput,
  type GeneratedLineRef,
  type QuoteLineSnapshot,
} from "../quote-corrections.service";
import type { Activity } from "../../schemas/ai-understanding.schema";

function line(partial: Partial<QuoteLineSnapshot>): QuoteLineSnapshot {
  return {
    id: "l-1",
    description: "Legarbeid klinkers",
    quantity: 40,
    unit: "m²",
    unit_price: 16,
    line_type: "arbeid",
    section_id: "s-1",
    ...partial,
  };
}

describe("diffQuoteLines (B3)", () => {
  it("acceptatiegeval: één hoeveelheid gewijzigd + één regel verwijderd → exact twee rijen", () => {
    const origineel = [
      line({ id: "l-1", description: "Legarbeid klinkers", quantity: 40 }),
      line({ id: "l-2", description: "Voegzand zak 25 kg", quantity: 8, line_type: "materiaal" }),
      line({ id: "l-3", description: "Aantrillen", quantity: 40 }),
    ];
    const actueel = [
      line({ id: "l-1", description: "Legarbeid klinkers", quantity: 45 }), // gewijzigd
      line({ id: "l-3", description: "Aantrillen", quantity: 40 }), // ongewijzigd
      // l-2 verwijderd
    ];

    const diff = diffQuoteLines(origineel, actueel);

    expect(diff).toHaveLength(2);

    const qty = diff.find((d) => d.correction_type === "quantity_changed")!;
    expect(qty.line_description).toBe("Legarbeid klinkers");
    expect(qty.old_value).toEqual({ quantity: 40 });
    expect(qty.new_value).toEqual({ quantity: 45 });

    const removed = diff.find((d) => d.correction_type === "line_removed")!;
    expect(removed.line_description).toBe("Voegzand zak 25 kg");
    expect((removed.old_value as QuoteLineSnapshot).quantity).toBe(8);
    expect(removed.new_value).toBeNull();
  });

  it("toegevoegde regel → line_added met de nieuwe regel als new_value", () => {
    const diff = diffQuoteLines(
      [line({ id: "l-1" })],
      [line({ id: "l-1" }), line({ id: "l-9", description: "Voorrijkosten", quantity: 1 })]
    );
    expect(diff).toHaveLength(1);
    expect(diff[0].correction_type).toBe("line_added");
    expect(diff[0].line_description).toBe("Voorrijkosten");
    expect((diff[0].new_value as QuoteLineSnapshot).id).toBe("l-9");
  });

  it("meerdere veldwijzigingen op één regel → per verschil één rij", () => {
    const diff = diffQuoteLines(
      [line({ id: "l-1", quantity: 40, unit_price: 16, description: "Legarbeid klinkers" })],
      [line({ id: "l-1", quantity: 45, unit_price: 18, description: "Legarbeid klinkers complex" })]
    );
    const types = diff.map((d) => d.correction_type).sort();
    expect(types).toEqual(["description_changed", "price_changed", "quantity_changed"]);
  });

  it("regel naar andere sectie verplaatst → section_changed", () => {
    const diff = diffQuoteLines(
      [line({ id: "l-1", section_id: "s-1" })],
      [line({ id: "l-1", section_id: "s-2" })]
    );
    expect(diff).toHaveLength(1);
    expect(diff[0].correction_type).toBe("section_changed");
    expect(diff[0].old_value).toEqual({ section_id: "s-1" });
    expect(diff[0].new_value).toEqual({ section_id: "s-2" });
  });

  it("geen wijzigingen → lege diff", () => {
    const regels = [line({ id: "l-1" }), line({ id: "l-2" })];
    expect(diffQuoteLines(regels, regels)).toHaveLength(0);
  });
});

// ── diffExtractionActivities: bevestigingsstap (C2.4) ─────────────────────────

function activity(partial: Partial<Activity>): Activity {
  return {
    type: "bestrating",
    action: "nieuw",
    description: "Oprit klinkers",
    dimensions: {},
    source_text: "oprit klinkers",
    materials_mentioned: [],
    ...partial,
  } as Activity;
}

describe("diffExtractionActivities (C2.4)", () => {
  it("afmeting gecorrigeerd + activiteit verwijderd → twee extraction_corrected rijen", () => {
    const origineel = [
      activity({ description: "Oprit klinkers", dimensions: {} }),
      activity({ description: "Pad tegels", dimensions: { area: 8 } }),
    ];
    const bevestigd: ConfirmedActivity[] = [
      // Afmeting aangevuld in de bevestigingsstap:
      { ...activity({ description: "Oprit klinkers", dimensions: { area: 24 } }), original_index: 0 },
      // "Pad tegels" verwijderd.
    ];

    const diff = diffExtractionActivities(origineel, bevestigd);

    expect(diff).toHaveLength(2);
    expect(diff.every((d) => d.correction_type === "extraction_corrected")).toBe(true);

    const gewijzigd = diff.find((d) => d.line_description === "Oprit klinkers")!;
    expect(gewijzigd.old_value).toEqual({ dimensions: {} });
    expect(gewijzigd.new_value).toEqual({ dimensions: { area: 24 } });

    const verwijderd = diff.find((d) => d.line_description === "Pad tegels")!;
    expect(verwijderd.new_value).toBeNull();
    expect((verwijderd.old_value as Activity).dimensions.area).toBe(8);
  });

  it("ongewijzigd bevestigd → lege diff", () => {
    const origineel = [activity({ dimensions: { area: 24, afgraafdiepte_cm: 20 } })];
    const bevestigd: ConfirmedActivity[] = [
      { ...origineel[0], original_index: 0 },
    ];
    expect(diffExtractionActivities(origineel, bevestigd)).toHaveLength(0);
  });

  it("afgraafdiepte aangevuld telt als correctie", () => {
    const origineel = [activity({ dimensions: { area: 24 } })];
    const bevestigd: ConfirmedActivity[] = [
      { ...activity({ dimensions: { area: 24, afgraafdiepte_cm: 20 } }), original_index: 0 },
    ];
    const diff = diffExtractionActivities(origineel, bevestigd);
    expect(diff).toHaveLength(1);
    expect(diff[0].new_value).toEqual({ dimensions: { area: 24, afgraafdiepte_cm: 20 } });
  });
});

// ── diffGeneratedVsEdited: stap 3-opslaan (R1.1) ──────────────────────────────

function genLine(partial: Partial<GeneratedLineRef>): GeneratedLineRef {
  return {
    source_key: "p-0-0",
    description: "Legarbeid klinkers",
    line_type: "arbeid",
    quantity: 70,
    unit: "m²",
    unit_price_cents: 1600,
    ...partial,
  };
}

function editedLine(partial: Partial<EditedLineInput>): EditedLineInput {
  return { ...genLine({}), ...partial };
}

describe("diffGeneratedVsEdited (R1.1)", () => {
  it("acceptatiegeval: hoeveelheid gewijzigd + eigen regel toegevoegd + regel verwijderd", () => {
    const generated = [
      genLine({ source_key: "p-0-0", description: "Legarbeid klinkers", quantity: 70 }),
      genLine({ source_key: "p-0-1", description: "Voegzand zak 25 kg", line_type: "materiaal", quantity: 14, unit_price_cents: 2000 }),
    ];
    const edited: EditedLineInput[] = [
      editedLine({ source_key: "p-0-0", quantity: 75 }), // gewijzigd
      // p-0-1 verwijderd
      editedLine({ source_key: null, description: "Boomstronk rooien (groot)", line_type: "arbeid", quantity: 3, unit: "stuk", unit_price_cents: null }), // eigen regel
    ];

    const diff = diffGeneratedVsEdited(generated, edited);

    expect(diff.map((d) => d.correction_type).sort()).toEqual([
      "line_added",
      "line_removed",
      "quantity_changed",
    ]);
    const qty = diff.find((d) => d.correction_type === "quantity_changed")!;
    expect(qty.old_value).toEqual({ quantity: 70 });
    expect(qty.new_value).toEqual({ quantity: 75 });
    const added = diff.find((d) => d.correction_type === "line_added")!;
    expect(added.line_description).toBe("Boomstronk rooien (groot)");
    const removed = diff.find((d) => d.correction_type === "line_removed")!;
    expect(removed.line_description).toBe("Voegzand zak 25 kg");
  });

  it("prijswijziging wordt in euro's gelogd (consistent met de verzend-diff)", () => {
    const diff = diffGeneratedVsEdited(
      [genLine({ unit_price_cents: 1600 })],
      [editedLine({ unit_price_cents: 1850 })]
    );
    expect(diff).toHaveLength(1);
    expect(diff[0].correction_type).toBe("price_changed");
    expect(diff[0].old_value).toEqual({ unit_price: 16 });
    expect(diff[0].new_value).toEqual({ unit_price: 18.5 });
  });

  it("ongewijzigde staat → lege diff", () => {
    const generated = [genLine({})];
    expect(diffGeneratedVsEdited(generated, [editedLine({})])).toHaveLength(0);
  });
});

// ── recordQuoteCorrections: orkestratie + niet-blokkerend ─────────────────────

interface Captured {
  corrections: Array<Record<string, unknown>>;
}

function fakeSupabase(opts: {
  run: { id: string; generated_lines: QuoteLineSnapshot[] | null } | null;
  sections: Array<{ id: string }>;
  items: QuoteLineSnapshot[];
  captured: Captured;
  failInsert?: boolean;
}): SupabaseClient {
  const from = (table: string) => {
    const builder = {
      select: () => builder,
      eq: () => builder,
      in: () => builder,
      order: () => builder,
      limit: () => builder,
      maybeSingle: () =>
        table === "quote_generation_runs"
          ? { data: opts.run, error: null }
          : { data: null, error: null },
      insert(payload: Record<string, unknown>[]) {
        if (table === "quote_line_corrections") {
          if (opts.failInsert) return { error: { message: "insert mislukt" } };
          opts.captured.corrections.push(...payload);
        }
        return { error: null };
      },
      then(resolve: (v: unknown) => void) {
        // awaitbare select-resultaten voor sections/items
        const data =
          table === "quote_sections"
            ? opts.sections
            : table === "quote_line_items"
              ? opts.items
              : [];
        resolve({ data, error: null });
      },
    };
    return builder;
  };
  return { from } as unknown as SupabaseClient;
}

describe("recordQuoteCorrections (B3)", () => {
  const origineel = [
    line({ id: "l-1", quantity: 40 }),
    line({ id: "l-2", description: "Voegzand zak 25 kg", quantity: 8 }),
  ];
  const actueel = [line({ id: "l-1", quantity: 45 })];

  it("schrijft per verschil één rij, gekoppeld aan quote en generation run", async () => {
    const captured: Captured = { corrections: [] };
    const n = await recordQuoteCorrections(
      fakeSupabase({
        run: { id: "run-1", generated_lines: origineel },
        sections: [{ id: "s-1" }],
        items: actueel,
        captured,
      }),
      "q-1"
    );

    expect(n).toBe(2);
    expect(captured.corrections).toHaveLength(2);
    for (const rij of captured.corrections) {
      expect(rij.quote_id).toBe("q-1");
      expect(rij.generation_run_id).toBe("run-1");
    }
  });

  it("geen generation run (oude offerte) → niets schrijven, geen throw", async () => {
    const captured: Captured = { corrections: [] };
    const n = await recordQuoteCorrections(
      fakeSupabase({ run: null, sections: [], items: [], captured }),
      "q-1"
    );
    expect(n).toBeNull();
    expect(captured.corrections).toHaveLength(0);
  });

  it("insert-fout → null, geen throw (verzendflow mag niet breken)", async () => {
    const captured: Captured = { corrections: [] };
    const n = await recordQuoteCorrections(
      fakeSupabase({
        run: { id: "run-1", generated_lines: origineel },
        sections: [{ id: "s-1" }],
        items: actueel,
        captured,
        failInsert: true,
      }),
      "q-1"
    );
    expect(n).toBeNull();
  });
});
