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
  flags: string[];
  unmatched: boolean;
  lines: EditableLine[];
}
