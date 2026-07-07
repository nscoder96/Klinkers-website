/**
 * A3-acceptatie: per code ligt het blocking-gedrag vast via severity,
 * en géén enkele berichttekst kan dat gedrag beïnvloeden.
 */

import { describe, it, expect } from "vitest";
import {
  makeFlag,
  hasBlockingFlags,
  dedupeQuoteFlags,
  FLAG_SEVERITY,
  type FlagCode,
} from "../quote-flags";

const BLOCKING_CODES: FlagCode[] = [
  "MISSING_DEPTH",
  "MISSING_SAND_THICKNESS",
  "MISSING_PRICE",
  "UNMATCHED_ACTIVITY",
  "MISSING_DIMENSIONS",
  "MISSING_LABOR_NORM",
];

const WARNING_CODES: FlagCode[] = [
  "WEAK_MATERIAL_MATCH",
  "DISTRIBUTION_OUT_OF_NORM",
];

describe("quote-flags — blocking-gedrag per code (A3)", () => {
  it.each(BLOCKING_CODES)("%s is blocking", (code) => {
    expect(FLAG_SEVERITY[code]).toBe("blocking");
    expect(hasBlockingFlags([makeFlag(code, "willekeurige tekst")])).toBe(true);
  });

  it.each(WARNING_CODES)("%s is warning (niet blocking)", (code) => {
    expect(FLAG_SEVERITY[code]).toBe("warning");
    expect(hasBlockingFlags([makeFlag(code, "willekeurige tekst")])).toBe(false);
  });

  it("de berichttekst heeft géén invloed op blocking-gedrag", () => {
    // Oude substring-triggers ('handmatig', 'Geen prijs gevonden') in een
    // warning-bericht mogen NIET blokkeren…
    const warning = makeFlag(
      "DISTRIBUTION_OUT_OF_NORM",
      "Geen prijs gevonden — handmatig controleren"
    );
    expect(hasBlockingFlags([warning])).toBe(false);

    // …en een blocking code blokkeert ook met een onschuldige tekst.
    const blocking = makeFlag("MISSING_PRICE", "alles prima hier");
    expect(hasBlockingFlags([blocking])).toBe(true);
  });

  it("dedupliceert op code + message, niet op code alleen", () => {
    const flags = [
      makeFlag("MISSING_PRICE", "Geen prijs voor A"),
      makeFlag("MISSING_PRICE", "Geen prijs voor A"),
      makeFlag("MISSING_PRICE", "Geen prijs voor B"),
    ];
    const deduped = dedupeQuoteFlags(flags);
    expect(deduped).toHaveLength(2);
  });
});
