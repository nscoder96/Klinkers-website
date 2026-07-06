/**
 * Fase 9 — End-to-end test tegen de LIVE geseede database.
 *
 * Draait de geconsolideerde pipeline (assemblies + pricing uit Supabase) voor de
 * vier spec-opdrachten (Test 1, 1b, 2, 3). De activiteiten zijn handmatig
 * opgebouwd volgens de gedocumenteerde AI-extractie (geen live AI-call → geen
 * kosten); de AI-prompt zelf is los unit-getest.
 *
 * Skipt automatisch als de Supabase-env ontbreekt. Print per test een rapport
 * (AI-extractie, pricing matches/misses, totaalprijs, kostenverdeling) en valideert
 * één persist-round-trip (met cleanup).
 *
 * Draaien:  set -a; source .env.local; set +a; npx vitest run fase9
 */

import { describe, it, expect } from "vitest";
import { createServerClient } from "../../lib/supabase/client";
import { loadActiveAssemblies } from "../../lib/assembly/assembly-loader";
import { loadActivePricing } from "../../lib/pipeline/pricing-loader";
import {
  runQuotePipeline,
  type PipelineActivity,
  type PipelineResult,
} from "../../lib/pipeline/quote-pipeline.service";
import { persistQuote } from "../../lib/pipeline/quote-persistence.service";
import { fromCents } from "../../lib/money";

const supabase = createServerClient();
const run = supabase ? describe : describe.skip;

const eur = (cents: number) => `€${fromCents(cents).toFixed(2)}`;

function report(name: string, input: string, result: PipelineResult) {
  const lines: string[] = [`\n══════ ${name} ══════`, `Input: ${input}`];
  for (const s of result.sections) {
    lines.push(`\n  Sectie: ${s.activity.description} → assembly: ${s.assembly?.name ?? "GEEN"}`);
    if (s.expand) {
      const priced = s.expand.lines.filter((l) => l.price_source === "database").length;
      const missing = s.expand.lines.filter((l) => l.price_source === "missing").length;
      lines.push(`    Pricing: ${priced} match / ${missing} mis (${s.expand.lines.length} regels)`);
      for (const l of s.expand.lines) {
        const price = l.total_cents != null ? eur(l.total_cents) : "MIS";
        lines.push(`      - [${l.line_type}] ${l.description} ${l.quantity}${l.unit} → ${price}`);
      }
    }
    if (s.structured) {
      const b = s.structured.breakdown;
      const d = s.structured.distribution;
      lines.push(
        `    Subtotaal ${eur(b.subtotal)} · BTW ${eur(b.vat_9_amount + b.vat_21_amount)} · Totaal ${eur(b.grand_total)}`
      );
      lines.push(
        `    Verdeling arbeid ${d.labor_pct}% / materiaal ${d.materials_pct}% / materieel ${d.equipment_pct}% (norm ${d.within_norm ? "OK" : "AFWIJKING"})`
      );
    }
  }
  const cb = result.combined;
  lines.push(
    `\n  TOTAAL: ${eur(cb.breakdown.grand_total)} · verdeling ${cb.distribution.labor_pct}/${cb.distribution.materials_pct}/${cb.distribution.equipment_pct} · vlaggen: ${result.flags.length}`
  );
  if (result.flags.length) lines.push("  Vlaggen: " + result.flags.join(" | "));
  console.log(lines.join("\n"));
}

run("Fase 9 — end-to-end tegen live DB", () => {
  const config = { method: "uitgesplitst" as const, layout: "uitgesplitst" as const, vat_pct: 21 };

  it("laadt geseede assemblies + pricing", async () => {
    const [assemblies, pricing] = await Promise.all([
      loadActiveAssemblies(),
      loadActivePricing(supabase!),
    ]);
    expect(assemblies.length).toBeGreaterThanOrEqual(4);
    expect(pricing.length).toBeGreaterThanOrEqual(20);
  });

  it("Test 1: standaard oprit (Gouda, met aantekeningen)", async () => {
    const [assemblies, pricing] = await Promise.all([loadActiveAssemblies(), loadActivePricing(supabase!)]);
    const activities: PipelineActivity[] = [
      {
        type: "bestrating", action: "nieuw", description: "Oprit klinkers waalformaat antraciet",
        area_m2: 70, length_m: 14, width_m: 5, afgraafdiepte_cm: 20, zanddikte_cm: 10,
        materialPreference: "klinkers waalformaat antraciet",
      },
    ];
    const result = runQuotePipeline(activities, assemblies, pricing, config);
    report("TEST 1 — oprit met aantekeningen", "Oprit 5×14m, afgraven 20cm, zandbed 10cm, klinkers waalformaat antraciet, opsluitbanden rondom", result);

    const sec = result.sections[0];
    expect(sec.assembly?.name).toBe("bestrating_nieuw");
    // Geen Gouda-vlaggen want diepte + zand opgegeven.
    const teksten = result.flags.map((f) => f.message).join(" ");
    expect(teksten).not.toContain("Afgraafdiepte niet opgegeven");
    expect(teksten).not.toContain("Zanddikte niet opgegeven");
    // Container = 2 (14 m³ × 1.25 / 10 → ceil = 2).
    const container = sec.expand!.lines.find((l) => l.description.includes("Container"));
    expect(container?.quantity).toBe(2);
    // Hoofdmateriaal opgelost via voorkeur.
    expect(sec.expand!.lines.some((l) => /waalformaat/i.test(l.description) && l.price_source === "database")).toBe(true);
  });

  it("Test 1b: oprit zonder zandinfo → twee vlaggen, niet verstuurbaar", async () => {
    const [assemblies, pricing] = await Promise.all([loadActiveAssemblies(), loadActivePricing(supabase!)]);
    const result = runQuotePipeline(
      [{ type: "bestrating", action: "nieuw", description: "Oprit klinkers waalformaat antraciet", area_m2: 70, materialPreference: "klinkers waalformaat antraciet" }],
      assemblies, pricing, config
    );
    report("TEST 1b — oprit zonder zandinfo", "Oprit 5×14m bestraten met klinkers waalformaat antraciet", result);

    expect(result.flags.join(" ")).toContain("Afgraafdiepte niet opgegeven");
    expect(result.flags.join(" ")).toContain("Zanddikte niet opgegeven");
    expect(result.hasBlockingFlags).toBe(true);
  });

  it("Test 2: herstraten → geen steenmateriaal, arbeid-dominant", async () => {
    const [assemblies, pricing] = await Promise.all([loadActiveAssemblies(), loadActivePricing(supabase!)]);
    const result = runQuotePipeline(
      [{ type: "bestrating", action: "herstraten", description: "Terras herstraten", area_m2: 24 }],
      assemblies, pricing, config
    );
    report("TEST 2 — herstraten terras", "Terras 4×6m herstraten, zelfde tegels terugleggen", result);

    const sec = result.sections[0];
    expect(sec.assembly?.name).toBe("herstraten");
    const stoneMat = sec.expand!.lines.find((l) => l.line_type === "materiaal" && /klinker|tegel|waalformaat|natuursteen/i.test(l.description));
    expect(stoneMat).toBeUndefined();
    expect(sec.structured!.distribution.labor_pct).toBeGreaterThan(60);
  });

  it("Test 3: gemengd nieuw + verwijderen → 2 secties, geen kruiscontaminatie", async () => {
    const [assemblies, pricing] = await Promise.all([loadActiveAssemblies(), loadActivePricing(supabase!)]);
    const result = runQuotePipeline(
      [
        { type: "bestrating", action: "nieuw", description: "Pad betonstraatstenen 30x30", area_m2: 9.6, length_m: 8, width_m: 1.2, afgraafdiepte_cm: 15, zanddikte_cm: 8, materialPreference: "betonstraatstenen 30x30" },
        { type: "bestrating", action: "verwijderen", description: "Tegels voor schuur opbreken", area_m2: 9 },
      ],
      assemblies, pricing, config
    );
    report("TEST 3 — gemengd nieuw + verwijderen", "Nieuw pad 1,2×8m betonstraatstenen + tegels 3×3m opbreken/afvoeren", result);

    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].assembly?.name).toBe("bestrating_nieuw");
    expect(result.sections[1].assembly?.name).toBe("verwijderen_bestrating");
    // Verwijder-sectie heeft geen bestratingmateriaal.
    expect(result.sections[1].expand!.lines.filter((l) => l.line_type === "materiaal")).toHaveLength(0);
  });

  it("persist-round-trip: schrijft quote + sections + line_items en ruimt op", async () => {
    const [assemblies, pricing] = await Promise.all([loadActiveAssemblies(), loadActivePricing(supabase!)]);
    const result = runQuotePipeline(
      [{ type: "bestrating", action: "herstraten", description: "E2E persist test", area_m2: 20 }],
      assemblies, pricing, config
    );
    const persisted = await persistQuote(supabase!, result, {
      projectDescription: "[E2E-TEST] verwijderbaar",
      today: "2026-06-08",
    });
    try {
      expect(persisted.quoteId).toBeTruthy();
      expect(persisted.sectionsCreated).toBe(1);
      expect(persisted.lineItemsCreated).toBeGreaterThan(0);

      // Snapshot écht aanwezig in quote_line_items?
      const { data: sections } = await supabase!.from("quote_sections").select("id").eq("quote_id", persisted.quoteId);
      const sectionIds = (sections ?? []).map((s) => s.id);
      const { data: items } = await supabase!.from("quote_line_items").select("unit_price_snapshot").in("section_id", sectionIds);
      expect((items ?? []).some((i) => i.unit_price_snapshot != null)).toBe(true);
    } finally {
      // Cleanup (line_items cascade via section delete is niet gegarandeerd → expliciet).
      const { data: sections } = await supabase!.from("quote_sections").select("id").eq("quote_id", persisted.quoteId);
      const sectionIds = (sections ?? []).map((s) => s.id);
      if (sectionIds.length) await supabase!.from("quote_line_items").delete().in("section_id", sectionIds);
      await supabase!.from("quote_sections").delete().eq("quote_id", persisted.quoteId);
      await supabase!.from("quotes").delete().eq("id", persisted.quoteId);
    }
  });
});
