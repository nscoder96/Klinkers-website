/**
 * Getalnotatie voor klantgerichte weergave (PDF, offerte-regels).
 * Nederlandse notatie: komma als decimaalteken. Bewust zonder
 * toLocaleString zodat de uitvoer niet van de ICU-data van de
 * runtime afhangt.
 */

/** Aantal in Nederlandse notatie: 2.92 → "2,92", 70 → "70". Max 3 decimalen. */
export function formatAantal(n: number): string {
  const afgerond = Math.round(n * 1000) / 1000;
  return String(afgerond).replace(".", ",");
}
