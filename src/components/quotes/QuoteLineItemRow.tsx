'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Trash2,
  GripVertical,
  Info,
  Package,
  Wrench
} from 'lucide-react';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  show_on_quote?: boolean;
  reasoning?: string | null;
  line_type?: 'materiaal' | 'arbeid';
}

interface QuoteLineItemRowProps {
  item: LineItem;
  sectionId: string;
  onUpdate: (field: keyof LineItem, value: number | string | boolean) => void;
  onDelete: () => void;
}

export function QuoteLineItemRow({
  item,
  sectionId,
  onUpdate,
  onDelete,
}: QuoteLineItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: 'item',
      sectionId,
      item,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const isArbeid = item.line_type === 'arbeid';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 border rounded-lg transition-colors group bg-gray-50 hover:bg-white ${
        isDragging ? 'shadow-lg ring-2 ring-orange-300 z-50' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded flex-shrink-0 touch-none"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Type indicator */}
      <div
        className={`min-w-[70px] h-8 flex items-center justify-center gap-1 rounded-md flex-shrink-0 border-2 px-2 ${
          isArbeid
            ? 'bg-orange-200 border-orange-500'
            : 'bg-blue-200 border-blue-500'
        }`}
        title={`Type: ${item.line_type || 'niet ingesteld'}`}
      >
        {isArbeid ? (
          <>
            <Wrench className="w-4 h-4 text-orange-700" />
            <span className="text-xs font-bold text-orange-700">WERK</span>
          </>
        ) : (
          <>
            <Package className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-bold text-blue-700">PROD</span>
          </>
        )}
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <Input
          value={item.description}
          onChange={(e) => onUpdate('description', e.target.value)}
          className="h-8 text-sm"
          placeholder="Omschrijving"
        />
      </div>

      {/* Quantity */}
      <div className="w-20">
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdate('quantity', Number(e.target.value))}
          className="h-8 text-sm text-center"
          min={0}
          step={0.1}
        />
      </div>

      {/* Unit */}
      <div className="w-16">
        <Input
          value={item.unit}
          onChange={(e) => onUpdate('unit', e.target.value)}
          className="h-8 text-sm text-center bg-gray-100"
          placeholder="eenheid"
        />
      </div>

      {/* Info icon for reasoning */}
      <div className="min-w-[40px] flex-shrink-0">
        {item.reasoning ? (
          <div className="relative group/info">
            <div className="w-10 h-8 flex items-center justify-center rounded-md bg-green-200 border-2 border-green-500 cursor-help">
              <Info className="w-4 h-4 text-green-700" />
            </div>
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50 w-80">
              <div className="font-medium mb-1 text-green-300">📊 Berekening:</div>
              <div className="text-gray-200 whitespace-pre-wrap">{item.reasoning}</div>
              <div className="absolute top-full right-2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        ) : (
          <div className="w-10 h-8 flex items-center justify-center rounded-md bg-gray-100 border-2 border-gray-300">
            <span className="text-gray-400 text-[10px]">geen</span>
          </div>
        )}
      </div>

      {/* Unit Price */}
      <div className="w-24">
        <Input
          type="number"
          value={item.unit_price}
          onChange={(e) => onUpdate('unit_price', Number(e.target.value))}
          className="h-8 text-sm text-right"
          min={0}
          step={0.01}
        />
      </div>

      {/* Total */}
      <div className="w-24 text-right">
        <span className="text-sm font-semibold text-orange-600">
          {formatCurrency(item.total_price)}
        </span>
      </div>

      {/* Delete action */}
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
