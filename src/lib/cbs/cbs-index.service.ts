/**
 * CBS Index Monitor (Fase 6 / Deel C2).
 *
 * Haalt maandelijks de GWW-inputprijsindex op (CBS dataset 84538NED, gratis
 * OData v4) en signaleert materiaalprijsstijgingen. Bij een stijging > 3% t.o.v.
 * de vorige meting hoort een `price_change_alert` (source 'cbs_index') te
 * ontstaan zodat de eigenaar zijn prijslijst controleert.
 *
 * De pure functies (parsen + vergelijken + drempel) zijn los testbaar; de
 * netwerk-fetch is een dunne, defensieve schil eromheen (stub-vriendelijk).
 */

/** Eén indexmeting (zie Deel C2). */
export interface CBSIndexRecord {
  /** Periode, bv. "2025M03". */
  datum: string;
  /** Indexwaarde, bv. 162.4. */
  waarde: number;
  /** Sub-categorie, bv. "4211b" (gesloten verharding). */
  categorie: string;
}

/** Drempel waarboven een prijsreview-alert ontstaat (procent). */
export const CBS_ALERT_THRESHOLD_PCT = 3;

const CBS_DATASET_URL =
  "https://opendata.cbs.nl/ODataApi/odata/84538NED/TypedDataSet";

/** Mogelijke veldnamen voor de periode in de OData-respons. */
const PERIOD_KEYS = ["Perioden", "perioden", "datum", "Datum"];
/** Mogelijke veldnamen voor de indexwaarde. */
const VALUE_KEYS = ["Inputprijsindex_1", "Inputprijsindex", "waarde", "Waarde", "CijferA_1"];

function pickKey(row: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (row[k] != null) return row[k];
  }
  return null;
}

/**
 * Parset een CBS OData TypedDataSet-respons naar indexmetingen. Defensief: rijen
 * zonder bruikbare periode/waarde worden overgeslagen.
 *
 * @param odata - geparste JSON van de OData-endpoint ({ value: [...] })
 * @param categorie - sub-categorie-label om mee te taggen (default '4211b')
 */
export function parseCBSReadings(
  odata: unknown,
  categorie = "4211b"
): CBSIndexRecord[] {
  const value = (odata as { value?: unknown })?.value;
  if (!Array.isArray(value)) return [];

  const readings: CBSIndexRecord[] = [];
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) continue;
    const row = raw as Record<string, unknown>;
    const datum = pickKey(row, PERIOD_KEYS);
    const waardeRaw = pickKey(row, VALUE_KEYS);
    const waarde = typeof waardeRaw === "string" ? parseFloat(waardeRaw) : waardeRaw;
    if (typeof datum !== "string" || typeof waarde !== "number" || !Number.isFinite(waarde)) {
      continue;
    }
    readings.push({ datum: datum.trim(), waarde, categorie });
  }
  return readings;
}

/** Procentuele verandering van `prev` naar `latest` (positief = stijging). */
export function computeIndexChangePct(prev: number, latest: number): number {
  if (prev <= 0) return 0;
  return Math.round(((latest - prev) / prev) * 1000) / 10;
}

/** Of een stijging een alert verdient (> drempel, alleen stijgingen). */
export function shouldAlertIndex(
  pctChange: number,
  threshold = CBS_ALERT_THRESHOLD_PCT
): boolean {
  return pctChange > threshold;
}

/** De twee meest recente metingen (op periode-string gesorteerd). */
export function latestTwo(
  readings: CBSIndexRecord[]
): { prev: CBSIndexRecord; latest: CBSIndexRecord } | null {
  if (readings.length < 2) return null;
  const sorted = [...readings].sort((a, b) => a.datum.localeCompare(b.datum));
  return {
    prev: sorted[sorted.length - 2],
    latest: sorted[sorted.length - 1],
  };
}

/**
 * Haalt de CBS-index op. Dunne, defensieve schil — geeft `null` bij netwerk-/
 * parse-fouten zodat de aanroeper kan stub-en of overslaan (Fase 6 mag stub).
 *
 * @param timeoutMs - hard timeout (default 8s)
 */
export async function fetchCBSIndex(
  timeoutMs = 8000
): Promise<CBSIndexRecord[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(CBS_DATASET_URL, { signal: controller.signal });
    if (!res.ok) return null;
    const json = await res.json();
    return parseCBSReadings(json);
  } catch (error) {
    console.warn("fetchCBSIndex: ophalen mislukt:", (error as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
