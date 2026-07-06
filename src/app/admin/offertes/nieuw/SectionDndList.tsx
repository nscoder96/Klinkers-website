'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditableLine, EditableSection } from './types';

// --- Helpers ---

const euro = (cents: number | null) =>
  cents == null
    ? '—'
    : `€ ${(cents / 100).toLocaleString('nl-NL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

function lineTotal(l: EditableLine): number | null {
  if (l.unit_price_cents == null) return null;
  return Math.round(l.unit_price_cents * l.quantity);
}

function sectionSubtotal(lines: EditableLine[]): number {
  return lines.reduce((sum, l) => sum + (lineTotal(l) ?? 0), 0);
}

const TYPE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  arbeid:    { label: 'A', bg: '#dbeafe', color: '#1d4ed8' },
  materiaal: { label: 'M', bg: '#dcfce7', color: '#15803d' },
  materieel: { label: 'E', bg: '#f1f5f9', color: '#64748b' },
};

// Column widths via inline style — guaranteed to render regardless of Tailwind JIT
// Trailing 24px-kolom is voor de verwijderknop per regel.
const COL_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '20px 1fr 26px 72px 48px 80px 92px 24px',
  gap: '4px',
  alignItems: 'center',
};

// --- Main list ---

interface SectionDndListProps {
  sections: EditableSection[];
  showIncl: boolean;
  onUpdateLine: (si: number, li: number, patch: Partial<EditableLine>) => void;
  onAddLine: (si: number) => void;
  onDeleteLine: (si: number, li: number) => void;
  onDeleteSection: (si: number) => void;
  onReorderLines: (si: number, newLines: EditableLine[]) => void;
  onReorderSections: (newSections: EditableSection[]) => void;
}

export function SectionDndList({
  sections,
  showIncl,
  onUpdateLine,
  onAddLine,
  onDeleteLine,
  onDeleteSection,
  onReorderLines,
  onReorderSections,
}: SectionDndListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex((s) => s.id === active.id);
    const newIdx = sections.findIndex((s) => s.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      onReorderSections(arrayMove(sections, oldIdx, newIdx));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {sections.map((section, si) => (
            <SortableSectionV2
              key={section.id}
              section={section}
              showIncl={showIncl}
              onUpdateLine={(li, patch) => onUpdateLine(si, li, patch)}
              onAddLine={() => onAddLine(si)}
              onDeleteLine={(li) => onDeleteLine(si, li)}
              onDeleteSection={() => onDeleteSection(si)}
              onReorderLines={(newLines) => onReorderLines(si, newLines)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// --- Sortable section ---

interface SortableSectionV2Props {
  section: EditableSection;
  showIncl: boolean;
  onUpdateLine: (li: number, patch: Partial<EditableLine>) => void;
  onAddLine: () => void;
  onDeleteLine: (li: number) => void;
  onDeleteSection: () => void;
  onReorderLines: (newLines: EditableLine[]) => void;
}

function SortableSectionV2({
  section,
  showIncl,
  onUpdateLine,
  onAddLine,
  onDeleteLine,
  onDeleteSection,
  onReorderLines,
}: SortableSectionV2Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, data: { type: 'section' } });

  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const subtotal = sectionSubtotal(section.lines);
  const displaySubtotal = showIncl ? Math.round(subtotal * 1.21) : subtotal;

  const lineSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleLineDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = section.lines.findIndex((l) => l.id === active.id);
    const newIdx = section.lines.findIndex((l) => l.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      onReorderLines(arrayMove(section.lines, oldIdx, newIdx));
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      {/* Section header */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}
      >
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab touch-none rounded p-0.5 text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          aria-label="Versleep sectie"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex-1 text-sm font-semibold text-slate-800">{section.title}</span>
        {section.unmatched && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
            handmatig opbouwen
          </span>
        )}
        <span className="text-sm font-bold text-slate-900">
          {euro(displaySubtotal)}
          {showIncl && (
            <span className="ml-1 text-xs font-normal text-slate-400">incl.</span>
          )}
        </span>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                `Sectie "${section.title}" verwijderen? Alle regels erin verdwijnen.`
              )
            ) {
              onDeleteSection();
            }
          }}
          className="flex-shrink-0 rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-600"
          aria-label="Sectie verwijderen"
          title="Sectie verwijderen"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Section flags */}
      {section.flags.length > 0 && (
        <div
          className="space-y-1 px-4 py-2"
          style={{ borderBottom: '1px solid #fef3c7', background: '#fffbeb' }}
        >
          {section.flags.map((f, i) => (
            <p
              key={i}
              className={`flex items-start gap-1.5 text-xs ${
                f.severity === 'blocking' ? 'text-red-700' : 'text-amber-800'
              }`}
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
              {f.message}
            </p>
          ))}
        </div>
      )}

      {/* Column headers */}
      <div
        style={{
          ...COL_STYLE,
          padding: '4px 12px',
          borderBottom: '1px solid #f1f5f9',
          background: '#f8fafc',
          fontSize: '11px',
          color: '#94a3b8',
          fontWeight: 500,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
        }}
      >
        <span />
        <span>Omschrijving</span>
        <span />
        <span style={{ textAlign: 'right' }}>Aantal</span>
        <span style={{ textAlign: 'right' }}>Eenh</span>
        <span style={{ textAlign: 'right' }}>€/eenh</span>
        <span style={{ textAlign: 'right' }}>
          {showIncl ? 'Totaal incl.' : 'Totaal'}
        </span>
        <span />
      </div>

      {/* Lines */}
      <DndContext
        sensors={lineSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleLineDragEnd}
      >
        <SortableContext
          items={section.lines.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {section.lines.length === 0 ? (
            <p className="px-4 py-3 text-center text-xs text-slate-400">
              Geen regels — gebruik de knop hieronder.
            </p>
          ) : (
            section.lines.map((line, li) => (
              <SortableLineRow
                key={line.id}
                line={line}
                showIncl={showIncl}
                onUpdate={(patch) => onUpdateLine(li, patch)}
                onDelete={() => onDeleteLine(li)}
              />
            ))
          )}
        </SortableContext>
      </DndContext>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddLine}
          className="h-7 gap-1 px-2 text-xs text-slate-400 hover:text-orange-600"
        >
          <Plus className="h-3 w-3" />
          Regel toevoegen
        </Button>
        <span className="text-xs text-slate-400">
          Subtotaal:{' '}
          <span className="font-semibold text-slate-600">{euro(displaySubtotal)}</span>
          {showIncl && <span className="ml-1 text-slate-400">incl. BTW</span>}
        </span>
      </div>
    </div>
  );
}

// --- Sortable line row ---

interface SortableLineRowProps {
  line: EditableLine;
  showIncl: boolean;
  onUpdate: (patch: Partial<EditableLine>) => void;
  onDelete: () => void;
}

function SortableLineRow({ line, showIncl, onUpdate, onDelete }: SortableLineRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: line.id, data: { type: 'line' } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    ...(isDragging ? { boxShadow: '0 4px 12px rgba(0,0,0,0.12)', zIndex: 50 } : {}),
  };

  const tot = lineTotal(line);
  const displayTot =
    tot == null ? null : showIncl ? Math.round(tot * 1.21) : tot;
  const badge =
    TYPE_BADGE[line.line_type] ?? { label: '?', bg: '#f1f5f9', color: '#64748b' };

  const inputBase: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    width: '100%',
    padding: '2px 4px',
    borderRadius: '3px',
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...COL_STYLE,
        padding: '5px 12px',
        borderBottom: '1px solid #f8fafc',
        background: isDragging ? '#fff' : undefined,
      }}
      className="group last:border-0 hover:bg-slate-50"
    >
      {/* Grip */}
      <button
        {...attributes}
        {...listeners}
        className="flex cursor-grab touch-none items-center text-slate-200 hover:text-slate-400 active:cursor-grabbing"
        aria-label="Versleep regel"
        style={{ background: 'none', border: 'none', padding: 0 }}
      >
        <GripVertical style={{ width: 14, height: 14 }} />
      </button>

      {/* Omschrijving */}
      <input
        style={{ ...inputBase, color: '#1e293b' }}
        value={line.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        onFocus={(e) =>
          (e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.3)')
        }
        onBlur={(e) => (e.target.style.boxShadow = 'none')}
      />

      {/* Type badge */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 20,
          height: 20,
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 700,
          background: badge.bg,
          color: badge.color,
        }}
      >
        {badge.label}
      </span>

      {/* Aantal */}
      <input
        type="number"
        min="0"
        step="0.01"
        style={{ ...inputBase, textAlign: 'right', color: '#475569' }}
        value={line.quantity}
        onChange={(e) => {
          const qty = parseFloat(e.target.value);
          onUpdate({ quantity: isNaN(qty) ? 0 : qty });
        }}
        onFocus={(e) =>
          (e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.3)')
        }
        onBlur={(e) => (e.target.style.boxShadow = 'none')}
      />

      {/* Eenheid */}
      <input
        style={{ ...inputBase, textAlign: 'right', color: '#94a3b8' }}
        value={line.unit}
        onChange={(e) => onUpdate({ unit: e.target.value })}
        onFocus={(e) =>
          (e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.3)')
        }
        onBlur={(e) => (e.target.style.boxShadow = 'none')}
      />

      {/* Prijs per eenheid */}
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="—"
        style={{
          ...inputBase,
          textAlign: 'right',
          color: line.unit_price_cents == null ? '#f87171' : '#475569',
        }}
        value={
          line.unit_price_cents != null
            ? (line.unit_price_cents / 100).toFixed(2)
            : ''
        }
        onChange={(e) => {
          const euros = parseFloat(e.target.value);
          onUpdate({
            unit_price_cents: isNaN(euros) ? null : Math.round(euros * 100),
          });
        }}
        onFocus={(e) =>
          (e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.3)')
        }
        onBlur={(e) => (e.target.style.boxShadow = 'none')}
      />

      {/* Totaal */}
      <span
        style={{
          textAlign: 'right',
          fontSize: 13,
          fontWeight: displayTot == null ? 400 : 600,
          color: displayTot == null ? '#f87171' : '#0f172a',
        }}
      >
        {displayTot == null ? 'invullen' : euro(displayTot)}
      </span>

      {/* Verwijderen */}
      <button
        type="button"
        onClick={onDelete}
        aria-label="Regel verwijderen"
        title="Regel verwijderen"
        className="flex items-center justify-center text-slate-200 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <Trash2 style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}
