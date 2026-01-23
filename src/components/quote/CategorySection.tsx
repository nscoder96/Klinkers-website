'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCategoryColor, getCategoryLabel, QUOTE_CATEGORIES } from '@/lib/quote-categories';
import { SubItemsDisplay } from './OptionalQuestions';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  GripVertical,
  Edit2,
  Calculator,
  FileText,
  Shovel,
  Grid3X3,
  Fence,
  LayoutGrid,
  Leaf,
  TreeDeciduous,
  Home,
  Droplets,
  Lightbulb,
  MoreHorizontal
} from 'lucide-react';

// Map icon names to components
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Shovel,
  Grid3X3,
  Fence,
  LayoutGrid,
  Leaf,
  TreeDeciduous,
  Home,
  Droplets,
  Lightbulb,
  MoreHorizontal,
};

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  reasoning?: string;
  is_main_item?: boolean;
  sub_items?: Array<{
    description: string;
    quantity: number;
    unit: string;
    reasoning?: string;
  }>;
}

interface CategorySectionProps {
  category: string;
  elementTitle?: string;
  items: LineItem[];
  onAddItem?: () => void;
  onRemoveItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  isEditable?: boolean;
  showSubItems?: boolean;
}

export default function CategorySection({
  category,
  elementTitle,
  items,
  onAddItem,
  onRemoveItem,
  onEditItem,
  isEditable = true,
  showSubItems = false,
}: CategorySectionProps) {
  const [expanded, setExpanded] = useState(true);

  const categoryInfo = QUOTE_CATEGORIES.find(c => c.id === category);
  const IconComponent = categoryInfo ? ICONS[categoryInfo.icon] : MoreHorizontal;
  const gradientColor = getCategoryColor(category);
  const label = elementTitle || getCategoryLabel(category);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  if (items.length === 0 && !isEditable) return null;

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader
        className={`bg-gradient-to-r ${gradientColor} text-white cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {IconComponent && <IconComponent className="w-5 h-5" />}
            {label}
            <span className="text-sm font-normal opacity-80">
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">
              €{subtotal.toLocaleString('nl-NL', { minimumFractionDigits: 0 })}
            </span>
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nog geen items in deze categorie</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    {isEditable && (
                      <div className="pt-1 cursor-grab opacity-0 group-hover:opacity-50 transition-opacity">
                        <GripVertical className="w-4 h-4 text-slate-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{item.description}</p>
                          {item.reasoning && (
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                              <Calculator className="w-3 h-3" />
                              {item.reasoning}
                            </p>
                          )}
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-sm text-slate-500">
                            {item.quantity} {item.unit} × €{item.unit_price.toLocaleString('nl-NL')}
                          </p>
                          <p className="font-bold text-slate-800">
                            €{item.total.toLocaleString('nl-NL', { minimumFractionDigits: 0 })}
                          </p>
                        </div>
                      </div>

                      {/* Sub-items for workbon */}
                      {showSubItems && item.sub_items && (
                        <SubItemsDisplay subItems={item.sub_items} />
                      )}
                    </div>

                    {isEditable && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditItem?.(item.id)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemoveItem?.(item.id)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isEditable && (
            <div className="p-3 bg-slate-50 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={onAddItem}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                Item toevoegen aan {label}
              </Button>
            </div>
          )}

          {/* Subtotal footer */}
          {items.length > 0 && (
            <div className={`p-3 bg-gradient-to-r ${gradientColor} bg-opacity-10`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">
                  Subtotaal {label}
                </span>
                <span className="font-bold text-slate-800">
                  €{subtotal.toLocaleString('nl-NL', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Quick add buttons for common items in a category
export function QuickAddButtons({
  category,
  onAdd,
}: {
  category: string;
  onAdd: (item: { name: string; unit: string; defaultPrice: number }) => void;
}) {
  // Get common items from the category
  const { COMMON_ACTIVITIES } = require('@/lib/quote-categories');
  const commonItems: Array<{ name: string; unit: string; defaultPrice: number }> =
    COMMON_ACTIVITIES[category as keyof typeof COMMON_ACTIVITIES] || [];

  if (commonItems.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border-t">
      {commonItems.slice(0, 5).map((item, i) => (
        <Button
          key={i}
          size="sm"
          variant="outline"
          onClick={() => onAdd(item)}
          className="text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          {item.name}
        </Button>
      ))}
    </div>
  );
}
