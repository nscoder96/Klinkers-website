/**
 * Gestructureerde offerte-vlaggen (A3).
 *
 * Eén vlag = { code, severity, message }. Blocking-gedrag hangt ALLEEN aan de
 * severity (via de code), nooit aan de berichttekst — de Nederlandse message
 * is puur presentatie en mag vrij wijzigen zonder gedragseffect.
 */

export type FlagSeverity = "blocking" | "warning" | "info";

export type FlagCode =
  | "MISSING_DEPTH"
  | "MISSING_SAND_THICKNESS"
  | "MISSING_PRICE"
  | "UNMATCHED_ACTIVITY"
  | "MISSING_DIMENSIONS"
  | "WEAK_MATERIAL_MATCH"
  | "DISTRIBUTION_OUT_OF_NORM"
  | "MISSING_HOURS_ESTIMATE";

export interface QuoteFlag {
  code: FlagCode;
  severity: FlagSeverity;
  message: string;
}

/**
 * Vaste severity per code. Blocking = offerte mag niet verstuurd worden;
 * de send-route dwingt dit server-side af (C2.1). Elke code heeft een
 * emitter: MISSING_DEPTH/MISSING_SAND_THICKNESS en MISSING_DIMENSIONS in de
 * pipeline (C2.2/C2.5), WEAK_MATERIAL_MATCH en MISSING_PRICE in de
 * assembly-expansie (C1), UNMATCHED_ACTIVITY en DISTRIBUTION_OUT_OF_NORM in
 * pipeline/structurering, MISSING_HOURS_ESTIMATE in de uren-methode.
 */
export const FLAG_SEVERITY: Record<FlagCode, FlagSeverity> = {
  MISSING_DEPTH: "blocking",
  MISSING_SAND_THICKNESS: "blocking",
  MISSING_PRICE: "blocking",
  UNMATCHED_ACTIVITY: "blocking",
  MISSING_DIMENSIONS: "blocking",
  WEAK_MATERIAL_MATCH: "warning",
  DISTRIBUTION_OUT_OF_NORM: "warning",
  MISSING_HOURS_ESTIMATE: "warning",
};

/** Maakt een vlag met de vaste severity van de code. */
export function makeFlag(code: FlagCode, message: string): QuoteFlag {
  return { code, severity: FLAG_SEVERITY[code], message };
}

/** Of er blokkerende vlaggen zijn — kijkt uitsluitend naar severity. */
export function hasBlockingFlags(flags: QuoteFlag[]): boolean {
  return flags.some((f) => f.severity === "blocking");
}

/** Dedupliceert op code + message (zelfde code met andere post blijft staan). */
export function dedupeQuoteFlags(flags: QuoteFlag[]): QuoteFlag[] {
  const seen = new Set<string>();
  return flags.filter((f) => {
    const key = `${f.code}|${f.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
