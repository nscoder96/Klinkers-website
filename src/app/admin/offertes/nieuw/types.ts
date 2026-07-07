import type { QuoteFlag } from '@/lib/quote-flags';

export interface EditableLine {
  id: string;
  /**
   * Herkomst-sleutel `p-{sectie}-{regel}` voor regels die uit de pipeline
   * komen; ontbreekt bij handmatig toegevoegde regels. De server difft
   * hierop bij opslaan (stap 3-correcties als leerdata).
   */
  source_key?: string;
  /** Prijskoppeling uit de pipeline; null bij handmatige regels. */
  pricing_id?: string | null;
  description: string;
  line_type: string;
  quantity: number;
  unit: string;
  unit_price_cents: number | null;
}

export interface EditableSection {
  id: string;
  title: string;
  flags: QuoteFlag[];
  unmatched: boolean;
  lines: EditableLine[];
}
