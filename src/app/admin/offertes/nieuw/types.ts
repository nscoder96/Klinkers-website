import type { QuoteFlag } from '@/lib/quote-flags';

export interface EditableLine {
  id: string;
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
