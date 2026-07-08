/**
 * Regressietest: unmatched activiteiten (geen werk-template) moeten in stap 3
 * als bewerkbare sectie verschijnen — met placeholder-regel en badge — zodat
 * de gebruiker ze zelf kan opbouwen (melding OFF 2026-07-08, drie activiteiten
 * waarvan twee zonder template).
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { toEditableSections } from "../page";
import { SectionDndList } from "../SectionDndList";

// Exact de vorm van de price-respons van 2026-07-08 (ingekort).
const API_SECTIONS = [
  {
    title: "Verwijderen van 3 middelgrote boomstronken inclusief afvoer (3 stuks)",
    assembly: null,
    unmatched: true,
    display_lines: [],
    breakdown: null,
    distribution: null,
    flags: [
      { code: "UNMATCHED_ACTIVITY" as const, severity: "blocking" as const, message: "Geen werk-template voor deze activiteit" },
    ],
  },
  {
    title: "Verwijderen van circa 20m2 plantenvak inclusief afvoer 20 m²",
    assembly: null,
    unmatched: true,
    display_lines: [],
    breakdown: null,
    distribution: null,
    flags: [
      { code: "UNMATCHED_ACTIVITY" as const, severity: "blocking" as const, message: "Geen werk-template voor deze activiteit" },
    ],
  },
  {
    title: "Volledige achtertuin 70m2 bestraten met keramische tegels 70 m²",
    assembly: "bestrating_nieuw",
    unmatched: false,
    display_lines: [
      { description: "Legarbeid klinkers simpel (halfsteens)", line_type: "arbeid", quantity: 70, unit: "m²", unit_price_cents: 1600, total_cents: 112000 },
    ],
    breakdown: null,
    distribution: null,
    flags: [],
  },
];

describe("stap 3 — unmatched secties zichtbaar en bewerkbaar", () => {
  it("toEditableSections maakt voor élke activiteit een sectie, unmatched mét placeholder-regel", () => {
    const sections = toEditableSections(API_SECTIONS);
    expect(sections).toHaveLength(3);
    expect(sections[0].unmatched).toBe(true);
    expect(sections[0].lines).toHaveLength(1); // placeholder om aan te vullen
    expect(sections[0].lines[0].source_key).toBeUndefined(); // telt straks als line_added
    expect(sections[2].lines[0].source_key).toBe("p-2-0");
  });

  it("SectionDndList rendert alle drie de secties, incl. de 'handmatig opbouwen'-badge", async () => {
    const sections = toEditableSections(API_SECTIONS);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const noop = () => {};

    await act(async () => {
      root.render(
        <SectionDndList
          sections={sections}
          showIncl={false}
          onUpdateLine={noop}
          onAddLine={noop}
          onDeleteLine={noop}
          onDeleteSection={noop}
          onRenameSection={noop}
          onReorderLines={noop}
          onReorderSections={noop}
        />
      );
    });

    const html = container.innerHTML;
    expect(html).toContain("boomstronken inclusief afvoer");
    expect(html).toContain("plantenvak inclusief afvoer");
    expect(html).toContain("achtertuin 70m2 bestraten");
    expect((html.match(/handmatig opbouwen/g) ?? []).length).toBe(2);

    await act(async () => root.unmount());
    container.remove();
  });
});
