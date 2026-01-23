'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCategoryLabel, QUOTE_CATEGORIES } from '@/lib/quote-categories';
import {
  ClipboardList,
  Printer,
  Download,
  CheckSquare,
  Square,
  User,
  Calendar,
  MapPin,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SubItem {
  description: string;
  quantity: number;
  unit: string;
  reasoning?: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  category: string;
  sub_items?: SubItem[];
}

interface WorkOrderPreviewProps {
  quoteNumber: string;
  customerName: string;
  projectAddress?: string;
  scheduledDate?: string;
  items: LineItem[];
  onPrint?: () => void;
  onDownload?: () => void;
}

export default function WorkOrderPreview({
  quoteNumber,
  customerName,
  projectAddress,
  scheduledDate,
  items,
  onPrint,
  onDownload,
}: WorkOrderPreviewProps) {
  const [expanded, setExpanded] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'overig';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, LineItem[]>);

  // Sort categories by predefined order
  const sortedCategories = QUOTE_CATEGORIES
    .map(c => c.id)
    .filter(cat => groupedItems[cat]?.length > 0);

  const toggleCheck = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  // Count total tasks
  const totalTasks = items.reduce((count, item) => {
    return count + 1 + (item.sub_items?.length || 0);
  }, 0);

  const completedTasks = checkedItems.size;

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader
        className="bg-gradient-to-r from-slate-700 to-slate-800 text-white cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Werkbon Preview
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm opacity-80">
              {completedTasks}/{totalTasks} taken
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
          {/* Header info */}
          <div className="p-4 bg-slate-50 border-b grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Offerte</p>
                <p className="font-medium text-slate-800">{quoteNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Klant</p>
                <p className="font-medium text-slate-800">{customerName}</p>
              </div>
            </div>
            {projectAddress && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Locatie</p>
                  <p className="font-medium text-slate-800">{projectAddress}</p>
                </div>
              </div>
            )}
            {scheduledDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Gepland</p>
                  <p className="font-medium text-slate-800">{scheduledDate}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tasks by category */}
          <div className="divide-y divide-slate-100">
            {sortedCategories.map(category => (
              <div key={category} className="p-4">
                <h3 className="font-semibold text-slate-700 mb-3 uppercase text-sm tracking-wide">
                  {getCategoryLabel(category)}
                </h3>

                <div className="space-y-2">
                  {groupedItems[category].map(item => (
                    <div key={item.id}>
                      {/* Main item */}
                      <div
                        className="flex items-start gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer"
                        onClick={() => toggleCheck(item.id)}
                      >
                        {checkedItems.has(item.id) ? (
                          <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${checkedItems.has(item.id) ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {item.description}
                          </p>
                          <p className="text-sm text-slate-500">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                      </div>

                      {/* Sub-items */}
                      {item.sub_items && item.sub_items.length > 0 && (
                        <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-200 pl-3">
                          {item.sub_items.map((subItem, idx) => {
                            const subItemId = `${item.id}-sub-${idx}`;
                            return (
                              <div
                                key={subItemId}
                                className="flex items-start gap-3 p-1.5 rounded hover:bg-slate-50 cursor-pointer"
                                onClick={() => toggleCheck(subItemId)}
                              >
                                {checkedItems.has(subItemId) ? (
                                  <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className={`text-sm ${checkedItems.has(subItemId) ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                    {subItem.description}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {subItem.quantity} {subItem.unit}
                                    {subItem.reasoning && ` • ${subItem.reasoning}`}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Notes section */}
          <div className="p-4 bg-slate-50 border-t">
            <p className="text-sm font-medium text-slate-600 mb-2">Notities uitvoering:</p>
            <div className="h-20 border-2 border-dashed border-slate-300 rounded-lg bg-white" />
          </div>

          {/* Actions */}
          <div className="p-4 bg-white border-t flex justify-end gap-2">
            <Button variant="outline" onClick={onPrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Printen
            </Button>
            <Button onClick={onDownload} className="gap-2 bg-slate-700 hover:bg-slate-800">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Compact version for sidebar
export function WorkOrderMini({
  items,
  completedCount,
  totalCount,
}: {
  items: LineItem[];
  completedCount: number;
  totalCount: number;
}) {
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="p-3 bg-slate-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">Werkbon</span>
        <span className="text-xs text-slate-500">
          {completedCount}/{totalCount}
        </span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
