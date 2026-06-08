'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Trash2,
  Percent,
  Euro,
  Truck,
  Recycle,
  HardHat
} from 'lucide-react';

export interface OverheadItem {
  id: string;
  quote_id: string;
  name: string;
  description: string | null;
  overhead_type: 'fixed' | 'percentage';
  value: number;
  calculated_amount: number;
  vat_rate: number;
  display_order: number;
}

interface QuoteOverheadCardProps {
  overhead: OverheadItem[];
  subtotal: number;
  onAdd: (item: Partial<OverheadItem>) => void;
  onUpdate: (id: string, field: keyof OverheadItem, value: string | number) => void;
  onDelete: (id: string) => void;
}

const COMMON_OVERHEAD = [
  { name: 'Voorrijkosten', icon: Truck, defaultValue: 75, type: 'fixed' as const },
  { name: 'Afvalafvoer', icon: Recycle, defaultValue: 150, type: 'fixed' as const },
  { name: 'Algemene kosten', icon: HardHat, defaultValue: 10, type: 'percentage' as const },
];

export function QuoteOverheadCard({
  overhead,
  subtotal,
  onAdd,
  onUpdate,
  onDelete
}: QuoteOverheadCardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    overhead_type: 'fixed' as 'fixed' | 'percentage',
    value: 0
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const totalOverhead = overhead.reduce((sum, item) => sum + (Number(item.calculated_amount) || 0), 0);

  const handleAddCommon = (item: typeof COMMON_OVERHEAD[0]) => {
    onAdd({
      name: item.name,
      overhead_type: item.type,
      value: item.defaultValue
    });
  };

  const handleAddCustom = () => {
    if (!newItem.name.trim() || newItem.value <= 0) return;
    onAdd(newItem);
    setNewItem({ name: '', overhead_type: 'fixed', value: 0 });
    setShowAddForm(false);
  };

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
            <HardHat className="w-5 h-5" />
            Staartkosten
          </CardTitle>
          <span className="font-semibold text-amber-700">
            {formatCurrency(totalOverhead)}
          </span>
        </div>
        <p className="text-sm text-amber-700">
          Extra kosten zoals voorrijden, afvalafvoer, etc.
        </p>
      </CardHeader>
      <CardContent>
        {/* Existing overhead items */}
        {overhead.length > 0 && (
          <div className="space-y-2 mb-4">
            {overhead.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 bg-white rounded-lg border"
              >
                <div className="flex-1">
                  <Input
                    value={item.name}
                    onChange={(e) => onUpdate(item.id, 'name', e.target.value)}
                    className="h-8 text-sm font-medium border-0 bg-transparent p-0"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant={item.overhead_type === 'fixed' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onUpdate(item.id, 'overhead_type', 'fixed')}
                  >
                    <Euro className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={item.overhead_type === 'percentage' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onUpdate(item.id, 'overhead_type', 'percentage')}
                  >
                    <Percent className="w-3 h-3" />
                  </Button>
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    value={item.value}
                    onChange={(e) => onUpdate(item.id, 'value', Number(e.target.value))}
                    className="h-8 text-sm text-right"
                    min={0}
                    step={item.overhead_type === 'percentage' ? 0.5 : 1}
                  />
                </div>
                <span className="text-xs text-gray-500 w-6">
                  {item.overhead_type === 'percentage' ? '%' : '€'}
                </span>
                <div className="w-20 text-right">
                  <span className="text-sm font-medium text-amber-700">
                    {formatCurrency(item.calculated_amount)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Quick add buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          {COMMON_OVERHEAD.map((item) => {
            const Icon = item.icon;
            const alreadyAdded = overhead.some(o => o.name === item.name);
            return (
              <Button
                key={item.name}
                variant="outline"
                size="sm"
                onClick={() => handleAddCommon(item)}
                disabled={alreadyAdded}
                className="text-xs"
              >
                <Icon className="w-3 h-3 mr-1" />
                {item.name}
                {!alreadyAdded && (
                  <span className="ml-1 text-gray-400">
                    ({item.type === 'percentage' ? `${item.defaultValue}%` : `€${item.defaultValue}`})
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Add custom form */}
        {showAddForm ? (
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg border">
            <Input
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="Naam"
              className="h-8 text-sm flex-1"
              autoFocus
            />
            <div className="flex items-center gap-1">
              <Button
                variant={newItem.overhead_type === 'fixed' ? 'default' : 'outline'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setNewItem({ ...newItem, overhead_type: 'fixed' })}
              >
                <Euro className="w-3 h-3" />
              </Button>
              <Button
                variant={newItem.overhead_type === 'percentage' ? 'default' : 'outline'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setNewItem({ ...newItem, overhead_type: 'percentage' })}
              >
                <Percent className="w-3 h-3" />
              </Button>
            </div>
            <Input
              type="number"
              value={newItem.value || ''}
              onChange={(e) => setNewItem({ ...newItem, value: Number(e.target.value) })}
              placeholder="Waarde"
              className="h-8 text-sm w-20 text-right"
              min={0}
            />
            <Button size="sm" onClick={handleAddCustom} className="h-8">
              Toevoegen
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAddForm(false);
                setNewItem({ name: '', overhead_type: 'fixed', value: 0 });
              }}
              className="h-8"
            >
              Annuleren
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Andere kosten toevoegen
          </Button>
        )}

        {/* Info about calculation */}
        {overhead.some(o => o.overhead_type === 'percentage') && (
          <p className="text-xs text-amber-600 mt-3">
            * Percentages worden berekend over subtotaal van {formatCurrency(subtotal)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
