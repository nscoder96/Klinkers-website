'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  GripVertical,
  Pencil
} from 'lucide-react';
import { QuoteLineItemRow } from './QuoteLineItemRow';

export interface LineItem {
  id: string;
  section_id: string;
  pricing_id: string | null;
  description: string;
  quantity: number;
  unit: string;
  cost_price: number | null;
  markup_percent: number | null;
  unit_price: number;
  total_price: number;
  vat_rate: number;
  display_order: number;
  is_auto_calculated: boolean;
  formula_used: string | null;
  show_on_quote: boolean;
  internal_notes: string | null;
  reasoning?: string | null;
  line_type?: 'materiaal' | 'arbeid';
}

export interface Section {
  id: string;
  quote_id: string;
  title: string;
  description: string | null;
  display_order: number;
  subtotal: number;
  line_items: LineItem[];
}

interface QuoteSectionCardProps {
  section: Section;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onUpdateTitle: (title: string) => void;
  onAddItem: () => void;
  onUpdateItem: (itemId: string, field: keyof LineItem, value: number | string | boolean) => void;
  onDeleteItem: (itemId: string) => void;
  onMoveItemUp: (itemId: string) => void;
  onMoveItemDown: (itemId: string) => void;
  isDragging?: boolean;
}

export function QuoteSectionCard({
  section,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onUpdateTitle,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onMoveItemUp,
  onMoveItemDown,
  isDragging = false
}: QuoteSectionCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      onUpdateTitle(editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <Card className={`transition-all ${isDragging ? 'shadow-lg ring-2 ring-orange-300' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />

            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                  className="h-8"
                />
              </div>
            ) : (
              <CardTitle
                className="text-lg cursor-pointer hover:text-orange-600 flex items-center gap-2"
                onClick={() => {
                  setEditTitle(section.title);
                  setIsEditingTitle(true);
                }}
              >
                {section.title}
                <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-100" />
              </CardTitle>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-gray-500 mr-2">
              {formatCurrency(section.subtotal)}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveUp}
              disabled={isFirst}
              className="h-8 w-8 p-0"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveDown}
              disabled={isLast}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent>
          {section.line_items.length === 0 ? (
            <p className="text-gray-500 text-center py-4 text-sm">
              Nog geen items. Klik op + Item toevoegen.
            </p>
          ) : (
            <div className="space-y-2">
              {section.line_items.map((item, index) => (
                <QuoteLineItemRow
                  key={item.id}
                  item={item}
                  sectionId={section.id}
                  onUpdate={(field, value) => onUpdateItem(item.id, field, value)}
                  onDelete={() => onDeleteItem(item.id)}
                />
              ))}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onAddItem}
            className="w-full mt-3 border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Item toevoegen
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
