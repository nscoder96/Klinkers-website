'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BookmarkPlus } from 'lucide-react';

export interface CreatedPricingItem {
  id: string;
  category: string;
  item_name: string;
  unit: string;
  selling_price_default: number;
  item_type: 'arbeid' | 'materiaal';
}

interface NewPricingItemDialogProps {
  description: string;
  lineType: 'arbeid' | 'materiaal';
  unit: string;
  unitPrice: number;
  categories: string[];
  defaultCategory?: string;
  onCreated: (item: CreatedPricingItem) => void;
  onClose: () => void;
}

/**
 * Banner die vraagt of een aangepaste offerteregel als nieuw item in de
 * prijsbibliotheek moet worden opgeslagen. Bij "ja" wordt het item aangemaakt
 * via de pricing-API en teruggegeven zodat de regel eraan gekoppeld kan worden.
 */
export function NewPricingItemDialog({
  description,
  lineType,
  unit,
  unitPrice,
  categories,
  defaultCategory,
  onCreated,
  onClose
}: NewPricingItemDialogProps) {
  const [itemName, setItemName] = useState(description);
  const [category, setCategory] = useState(defaultCategory || 'overig');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = categories.includes(category)
    ? categories
    : [...categories, category];

  const priceLabel = new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(unitPrice);

  const createItem = async () => {
    if (!itemName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          item_name: itemName.trim(),
          item_type: lineType,
          unit,
          selling_price_default: unitPrice,
          is_active: true
        })
      });
      if (!response.ok) {
        throw new Error('Kon item niet aanmaken');
      }
      const data = await response.json();
      onCreated(data.pricing as CreatedPricingItem);
    } catch (err) {
      console.error('Error creating pricing item:', err);
      setError('Opslaan mislukt — probeer het opnieuw.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
      <div className="bg-white border-2 border-orange-200 rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <BookmarkPlus className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm">
              Is dit een nieuw item voor je prijsbibliotheek?
            </p>
            <p className="text-xs text-slate-500 mt-0.5 mb-2">
              {lineType === 'arbeid' ? 'Arbeid' : 'Materiaal'} · {priceLabel} per {unit}
            </p>
            <div className="flex gap-2 mb-2">
              <Input
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                placeholder="Naam voor in de bibliotheek"
                className="text-sm h-8 flex-1"
              />
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                aria-label="Categorie"
                className="h-8 text-sm border rounded-md px-2 bg-white text-slate-700"
              >
                {categoryOptions.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={createItem}
                disabled={!itemName.trim() || saving}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-7"
              >
                {saving ? 'Opslaan...' : 'Ja, toevoegen aan bibliotheek'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="text-xs h-7 text-slate-400"
              >
                Nee, alleen deze offerte
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
