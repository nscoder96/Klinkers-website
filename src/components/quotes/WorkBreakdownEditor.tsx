'use client';

/**
 * WorkBreakdownEditor (A3)
 *
 * Interne werkdocument editor voor de nieuwe uren-gebaseerde pipeline.
 * Toont secties (voorbereidend + gebieden) met bewerkbare werkitems en uren.
 * Materialen worden onderaan geaggregeerd met prijs + BTW-toggle.
 *
 * Layout:
 *   ┌─ Voorbereidend werk ──────────────────────────────┐
 *   │  Uitbreken bestrating 35m²    [3.0] uur   [🗑]    │
 *   │  + Werkitem toevoegen                             │
 *   └───────────────────────────────────────────────────┘
 *   ┌─ Voortuin ────────────────────────────────────────┐
 *   │  Herstraten 18m² (bestaand)   [2.0] uur   [🗑]    │
 *   └───────────────────────────────────────────────────┘
 *   ┌─ Materialen ──────────────────────────────────────┐
 *   │  25 st. Opsluitbanden 5/15cm  €7,00  [incl BTW]  │
 *   └───────────────────────────────────────────────────┘
 *   Totaal: 25,5 uur → 4 dagen × €85 = €2.720
 *           Materialen excl. BTW         = €  432
 *           ─────────────────────────────────────
 *           Subtotaal excl. BTW          = €3.152
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Clock,
  Package,
  ChevronDown,
  ChevronRight,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkBreakdownV2, WorkSectionV2, WorkItemV2 } from '@/lib/schemas/work-breakdown-v2.schema';
import { calculateFromHours } from '@/lib/services/hours-pricing.service';
import type { MaterialLineItem } from '@/lib/services/materials-aggregation.service';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MaterialPriceLine {
  key: string;          // normalizeKey(description, unit)
  description: string;
  qty: number;
  unit: string;
  unit_price: number;   // prijs als ingevoerd
  is_incl_btw: boolean;
  source_items: string[];
}

export interface WorkBreakdownEditorState {
  breakdown: WorkBreakdownV2;
  material_prices: MaterialPriceLine[];
}

interface WorkBreakdownEditorProps {
  /** Initiële werkopsplitsing van de AI */
  initialBreakdown: WorkBreakdownV2;
  /** Uurtarief (default 85) */
  hourlyRate?: number;
  /** Minimum uren per dag (default 8) */
  minHoursPerDay?: number;
  /** BTW percentage (default 21) */
  btwPercentage?: number;
  /** Callback bij wijziging */
  onChange?: (state: WorkBreakdownEditorState) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function normalizeKey(description: string, unit: string): string {
  return `${description.toLowerCase().trim()}__${unit.toLowerCase().trim()}`;
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function buildMaterialPriceLines(breakdown: WorkBreakdownV2): MaterialPriceLine[] {
  return breakdown.materials.map((m) => ({
    key: normalizeKey(m.material_desc, m.material_unit),
    description: m.material_desc,
    qty: m.material_qty,
    unit: m.material_unit,
    unit_price: 0,
    is_incl_btw: true,
    source_items: m.source_items,
  }));
}

function totalEstimatedHours(breakdown: WorkBreakdownV2): number {
  const prepHours = breakdown.preparatory.items.reduce(
    (s, i) => s + i.hours_estimated,
    0
  );
  const areaHours = breakdown.areas.reduce(
    (s, area) => s + area.items.reduce((si, i) => si + i.hours_estimated, 0),
    0
  );
  return prepHours + areaHours;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface WorkItemRowProps {
  item: WorkItemV2;
  onHoursChange: (hours: number) => void;
  onDescriptionChange: (desc: string) => void;
  onRemove: () => void;
}

function WorkItemRow({ item, onHoursChange, onDescriptionChange, onRemove }: WorkItemRowProps) {
  const materialBadge =
    item.material_flag === 'bestaand' ? (
      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
        bestaand
      </span>
    ) : item.material_flag === 'nieuw' ? (
      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
        nieuw mat.
      </span>
    ) : null;

  return (
    <div className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded group">
      <input
        type="text"
        value={item.description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        className="flex-1 text-sm bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-gray-400 focus:outline-none py-0.5 min-w-0"
        placeholder="Beschrijving werkitem..."
      />

      {materialBadge}

      <div className="flex items-center gap-1 shrink-0">
        <input
          type="number"
          value={item.hours_estimated}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v) && v >= 0) onHoursChange(v);
          }}
          step="0.5"
          min="0"
          className="w-16 text-sm text-right border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-orange-400 bg-white"
        />
        <span className="text-xs text-gray-400 shrink-0">uur</span>
      </div>

      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity p-1 rounded"
        title="Verwijder werkitem"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

interface SectionCardProps {
  section: WorkSectionV2;
  onItemHoursChange: (itemIdx: number, hours: number) => void;
  onItemDescChange: (itemIdx: number, desc: string) => void;
  onItemRemove: (itemIdx: number) => void;
  onAddItem: () => void;
  isPrepatory?: boolean;
}

function SectionCard({
  section,
  onItemHoursChange,
  onItemDescChange,
  onItemRemove,
  onAddItem,
  isPrepatory,
}: SectionCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  const sectionHours = section.items.reduce((s, i) => s + i.hours_estimated, 0);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
        {isPrepatory ? (
          <Wrench size={14} className="text-orange-500" />
        ) : (
          <div className="w-3 h-3 rounded-full bg-orange-400" />
        )}
        <span className="font-medium text-sm text-gray-800 flex-1">{section.name}</span>
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Clock size={12} />
          {sectionHours.toFixed(1)} uur
        </span>
      </button>

      {isOpen && (
        <div className="divide-y divide-gray-50">
          {section.items.map((item, idx) => (
            <WorkItemRow
              key={idx}
              item={item}
              onHoursChange={(h) => onItemHoursChange(idx, h)}
              onDescriptionChange={(d) => onItemDescChange(idx, d)}
              onRemove={() => onItemRemove(idx)}
            />
          ))}

          <div className="px-3 py-2">
            <button
              onClick={onAddItem}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition-colors"
            >
              <Plus size={13} />
              Werkitem toevoegen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface MaterialRowProps {
  line: MaterialPriceLine;
  btwPercentage: number;
  onPriceChange: (price: number) => void;
  onBtwToggle: () => void;
  onRemove: () => void;
}

function MaterialRow({ line, btwPercentage, onPriceChange, onBtwToggle, onRemove }: MaterialRowProps) {
  const exclPrice = line.is_incl_btw && line.unit_price > 0
    ? line.unit_price / (1 + btwPercentage / 100)
    : line.unit_price;
  const lineTotal = exclPrice * line.qty;

  return (
    <div className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded group text-sm">
      <Package size={13} className="text-green-500 shrink-0" />
      <span className="text-gray-500 shrink-0">{line.qty} {line.unit}</span>
      <span className="flex-1 text-gray-700 min-w-0 truncate">{line.description}</span>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-gray-400 text-xs">€</span>
        <input
          type="number"
          value={line.unit_price || ''}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onPriceChange(isNaN(v) ? 0 : v);
          }}
          placeholder="0,00"
          step="0.01"
          min="0"
          className="w-20 text-sm text-right border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-orange-400 bg-white"
        />
        <button
          onClick={onBtwToggle}
          className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${
            line.is_incl_btw
              ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
              : 'bg-gray-50 border-gray-200 text-gray-500'
          }`}
          title={line.is_incl_btw ? 'Prijs is incl. BTW — klik voor excl.' : 'Prijs is excl. BTW — klik voor incl.'}
        >
          {line.is_incl_btw ? 'incl.' : 'excl.'} BTW
        </button>
      </div>

      {lineTotal > 0 && (
        <span className="text-xs text-gray-500 shrink-0 w-20 text-right">
          {formatEuro(lineTotal)}
        </span>
      )}

      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity p-1 rounded"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hoofd component
// ─────────────────────────────────────────────────────────────────────────────

export default function WorkBreakdownEditor({
  initialBreakdown,
  hourlyRate = 85,
  minHoursPerDay = 8,
  btwPercentage = 21,
  onChange,
}: WorkBreakdownEditorProps) {
  const [breakdown, setBreakdown] = useState<WorkBreakdownV2>(() => ({
    ...initialBreakdown,
    preparatory: {
      ...initialBreakdown.preparatory,
      items: [...initialBreakdown.preparatory.items],
    },
    areas: initialBreakdown.areas.map((a) => ({
      ...a,
      items: [...a.items],
    })),
  }));

  const [materialPrices, setMaterialPrices] = useState<MaterialPriceLine[]>(
    () => buildMaterialPriceLines(initialBreakdown)
  );

  // ── Totaalberekening ──────────────────────────────────────────────────────

  const pricing = useMemo(() => {
    const hours = totalEstimatedHours(breakdown);
    return calculateFromHours(hours, { hourly_rate: hourlyRate, min_hours_per_day: minHoursPerDay });
  }, [breakdown, hourlyRate, minHoursPerDay]);

  const materialTotals = useMemo(() => {
    let exclTotal = 0;
    for (const line of materialPrices) {
      const exclPrice = line.is_incl_btw && line.unit_price > 0
        ? line.unit_price / (1 + btwPercentage / 100)
        : line.unit_price;
      exclTotal += exclPrice * line.qty;
    }
    return {
      excl: exclTotal,
      btw: exclTotal * (btwPercentage / 100),
      incl: exclTotal * (1 + btwPercentage / 100),
    };
  }, [materialPrices, btwPercentage]);

  const subtotalExcl = pricing.labor_cost + materialTotals.excl;

  // ── Emit change ───────────────────────────────────────────────────────────

  const emitChange = useCallback(
    (newBreakdown: WorkBreakdownV2, newPrices: MaterialPriceLine[]) => {
      onChange?.({
        breakdown: newBreakdown,
        material_prices: newPrices,
      });
    },
    [onChange]
  );

  // ── Mutaties: preparatory ─────────────────────────────────────────────────

  const updatePrepItem = useCallback(
    (itemIdx: number, update: Partial<WorkItemV2>) => {
      setBreakdown((prev) => {
        const items = prev.preparatory.items.map((it, i) =>
          i === itemIdx ? { ...it, ...update } : it
        );
        const next = {
          ...prev,
          preparatory: { ...prev.preparatory, items },
        };
        emitChange(next, materialPrices);
        return next;
      });
    },
    [materialPrices, emitChange]
  );

  const removePrepItem = useCallback(
    (itemIdx: number) => {
      setBreakdown((prev) => {
        const items = prev.preparatory.items.filter((_, i) => i !== itemIdx);
        const next = {
          ...prev,
          preparatory: { ...prev.preparatory, items },
        };
        emitChange(next, materialPrices);
        return next;
      });
    },
    [materialPrices, emitChange]
  );

  const addPrepItem = useCallback(() => {
    const newItem: WorkItemV2 = {
      description: '',
      hours_estimated: 1,
      material_flag: 'geen',
      work_type_key: 'overig',
    };
    setBreakdown((prev) => {
      const next = {
        ...prev,
        preparatory: {
          ...prev.preparatory,
          items: [...prev.preparatory.items, newItem],
        },
      };
      emitChange(next, materialPrices);
      return next;
    });
  }, [materialPrices, emitChange]);

  // ── Mutaties: gebieden ────────────────────────────────────────────────────

  const updateAreaItem = useCallback(
    (areaIdx: number, itemIdx: number, update: Partial<WorkItemV2>) => {
      setBreakdown((prev) => {
        const areas = prev.areas.map((area, ai) => {
          if (ai !== areaIdx) return area;
          return {
            ...area,
            items: area.items.map((it, ii) =>
              ii === itemIdx ? { ...it, ...update } : it
            ),
          };
        });
        const next = { ...prev, areas };
        emitChange(next, materialPrices);
        return next;
      });
    },
    [materialPrices, emitChange]
  );

  const removeAreaItem = useCallback(
    (areaIdx: number, itemIdx: number) => {
      setBreakdown((prev) => {
        const areas = prev.areas.map((area, ai) => {
          if (ai !== areaIdx) return area;
          return {
            ...area,
            items: area.items.filter((_, ii) => ii !== itemIdx),
          };
        });
        const next = { ...prev, areas };
        emitChange(next, materialPrices);
        return next;
      });
    },
    [materialPrices, emitChange]
  );

  const addAreaItem = useCallback(
    (areaIdx: number) => {
      const newItem: WorkItemV2 = {
        description: '',
        hours_estimated: 1,
        material_flag: 'geen',
        work_type_key: 'overig',
      };
      setBreakdown((prev) => {
        const areas = prev.areas.map((area, ai) => {
          if (ai !== areaIdx) return area;
          return { ...area, items: [...area.items, newItem] };
        });
        const next = { ...prev, areas };
        emitChange(next, materialPrices);
        return next;
      });
    },
    [materialPrices, emitChange]
  );

  // ── Mutaties: materialen ──────────────────────────────────────────────────

  const updateMaterialPrice = useCallback(
    (key: string, price: number) => {
      setMaterialPrices((prev) => {
        const next = prev.map((l) => (l.key === key ? { ...l, unit_price: price } : l));
        emitChange(breakdown, next);
        return next;
      });
    },
    [breakdown, emitChange]
  );

  const toggleMaterialBtw = useCallback(
    (key: string) => {
      setMaterialPrices((prev) => {
        const next = prev.map((l) =>
          l.key === key ? { ...l, is_incl_btw: !l.is_incl_btw } : l
        );
        emitChange(breakdown, next);
        return next;
      });
    },
    [breakdown, emitChange]
  );

  const removeMaterialLine = useCallback(
    (key: string) => {
      setMaterialPrices((prev) => {
        const next = prev.filter((l) => l.key !== key);
        emitChange(breakdown, next);
        return next;
      });
    },
    [breakdown, emitChange]
  );

  const addMaterialLine = useCallback(() => {
    const key = `nieuw__${Date.now()}`;
    setMaterialPrices((prev) => {
      const next = [
        ...prev,
        {
          key,
          description: '',
          qty: 1,
          unit: 'stuks',
          unit_price: 0,
          is_incl_btw: true,
          source_items: [],
        },
      ];
      emitChange(breakdown, next);
      return next;
    });
  }, [breakdown, emitChange]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Samenvattingsbanner */}
      {breakdown.project_summary && (
        <div className="flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-lg px-4 py-3 text-sm text-orange-800">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-orange-400" />
          <p>{breakdown.project_summary}</p>
        </div>
      )}

      {/* Voorbereidend werk */}
      <SectionCard
        section={breakdown.preparatory}
        isPrepatory
        onItemHoursChange={(i, h) => updatePrepItem(i, { hours_estimated: h })}
        onItemDescChange={(i, d) => updatePrepItem(i, { description: d })}
        onItemRemove={(i) => removePrepItem(i)}
        onAddItem={addPrepItem}
      />

      {/* Per gebied */}
      {breakdown.areas.map((area, areaIdx) => (
        <SectionCard
          key={areaIdx}
          section={area}
          onItemHoursChange={(i, h) => updateAreaItem(areaIdx, i, { hours_estimated: h })}
          onItemDescChange={(i, d) => updateAreaItem(areaIdx, i, { description: d })}
          onItemRemove={(i) => removeAreaItem(areaIdx, i)}
          onAddItem={() => addAreaItem(areaIdx)}
        />
      ))}

      {/* Materialen */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50">
          <Package size={14} className="text-green-500" />
          <span className="font-medium text-sm text-gray-800 flex-1">Materialen</span>
          <span className="text-xs text-gray-500">
            {materialPrices.length} {materialPrices.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="divide-y divide-gray-50">
          {materialPrices.length === 0 && (
            <p className="text-xs text-gray-400 px-4 py-3 italic">
              Geen materialen herkend — voeg handmatig toe als nodig.
            </p>
          )}

          {materialPrices.map((line) => (
            <MaterialRow
              key={line.key}
              line={line}
              btwPercentage={btwPercentage}
              onPriceChange={(p) => updateMaterialPrice(line.key, p)}
              onBtwToggle={() => toggleMaterialBtw(line.key)}
              onRemove={() => removeMaterialLine(line.key)}
            />
          ))}

          <div className="px-3 py-2">
            <button
              onClick={addMaterialLine}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 transition-colors"
            >
              <Plus size={13} />
              Materiaal toevoegen
            </button>
          </div>
        </div>
      </div>

      {/* Totaalbalk */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-5 py-4 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 flex items-center gap-1.5">
            <Clock size={13} className="text-orange-400" />
            {pricing.estimated_hours.toFixed(1)} uur geschat
            <span className="text-gray-400">→</span>
            <strong>{pricing.days} dag{pricing.days !== 1 ? 'en' : ''}</strong>
            <span className="text-gray-400">×</span>
            €{hourlyRate}/uur
          </span>
          <span className="font-semibold text-gray-800">{formatEuro(pricing.labor_cost)}</span>
        </div>

        {materialTotals.excl > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1.5">
              <Package size={13} className="text-green-500" />
              Materialen excl. BTW
            </span>
            <span className="font-semibold text-gray-800">{formatEuro(materialTotals.excl)}</span>
          </div>
        )}

        <div className="pt-1.5 mt-1.5 border-t border-gray-200 flex justify-between text-sm">
          <span className="font-medium text-gray-700">Subtotaal excl. BTW</span>
          <span className="font-bold text-gray-900 text-base">{formatEuro(subtotalExcl)}</span>
        </div>

        <div className="flex justify-between text-xs text-gray-400">
          <span>BTW {btwPercentage}%</span>
          <span>{formatEuro(subtotalExcl * (btwPercentage / 100))}</span>
        </div>

        <div className="flex justify-between text-sm font-semibold text-gray-700">
          <span>Totaal incl. BTW</span>
          <span className="text-orange-600">{formatEuro(subtotalExcl * (1 + btwPercentage / 100))}</span>
        </div>
      </div>
    </div>
  );
}
