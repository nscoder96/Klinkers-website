/**
 * B2-acceptatie: de promptversie-constante bestaat, is niet leeg en volgt
 * het datumformaat, en het model is expliciet gepind.
 */

import { describe, it, expect } from "vitest";
import {
  PROMPT_VERSION,
  UNDERSTANDING_MODEL,
} from "../ai-understanding.service";

describe("ai-understanding — promptversie en model (B2)", () => {
  it("PROMPT_VERSION bestaat en is niet leeg", () => {
    expect(typeof PROMPT_VERSION).toBe("string");
    expect(PROMPT_VERSION.length).toBeGreaterThan(0);
  });

  it("PROMPT_VERSION volgt het formaat JJJJ-MM-DD.N", () => {
    expect(PROMPT_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/);
  });

  it("het model is expliciet gepind (geen lege string)", () => {
    expect(typeof UNDERSTANDING_MODEL).toBe("string");
    expect(UNDERSTANDING_MODEL.length).toBeGreaterThan(0);
  });
});
