'use client';

import { useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
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
import { Section, LineItem } from './QuoteSectionCard';

interface SortableSectionProps {
  section: Section;
  isDragging: boolean;
  onDelete: () => void;
  onUpdateTitle: (title: string) => void;
  onAddItem: () => void;
  onUpdateItem: (itemId: string, field: keyof LineItem, value: number | string | boolean) => void;
  onDeleteItem: (itemId: string) => void;
  onItemDescriptionBlur?: (itemId: string) => void;
}

export function SortableSection({
  section,
  isDragging,
  onDelete,
  onUpdateTitle,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onItemDescriptionBlur,
}: SortableSectionProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
  } = useSortable({
    id: section.id,
    data: {
      type: 'section',
      section,
    },
  });

  // Make the section content a droppable zone for items
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `section-drop-${section.id}`,
    data: {
      type: 'section-drop',
      sectionId: section.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
    <div ref={setSortableRef} style={style}>
      <Card className={`transition-all ${isDragging ? 'shadow-lg ring-2 ring-orange-300 opacity-90' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded touch-none"
              >
                <GripVertical className="w-5 h-5 text-gray-400" />
              </div>

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
                  className="text-lg cursor-pointer hover:text-orange-600 flex items-center gap-2 group"
                  onClick={() => {
                    setEditTitle(section.title);
                    setIsEditingTitle(true);
                  }}
                >
                  {section.title}
                  <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-50" />
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
            <div ref={setDroppableRef}>
              {section.line_items.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">
                  Nog geen items. Klik op + Item toevoegen of sleep een item hierheen.
                </p>
              ) : (
                <SortableContext
                  items={section.line_items.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {section.line_items.map((item) => (
                      <QuoteLineItemRow
                        key={item.id}
                        item={item}
                        sectionId={section.id}
                        onUpdate={(field, value) => onUpdateItem(item.id, field, value)}
                        onDelete={() => onDeleteItem(item.id)}
                        onDescriptionBlur={() => onItemDescriptionBlur?.(item.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>

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
    </div>
  );
}
