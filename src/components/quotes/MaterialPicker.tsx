'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, X, Plus, Filter, AlertTriangle, Save, Package, Wrench } from 'lucide-react';

interface PricingItem {
  id: string;
  category: string;
  item_name: string;
  unit: string;
  selling_price_default: number;
  item_type?: 'materiaal' | 'arbeid';
}

interface MaterialPickerProps {
  pricing: PricingItem[];
  onSelect: (item: PricingItem) => void;
  onClose: () => void;
}

interface NewItemForm {
  item_name: string;
  category: string;
  unit: string;
  selling_price_default: string;
  item_type: 'materiaal' | 'arbeid';
  save_to_pricing: boolean;
}

interface DuplicateWarning {
  found: boolean;
  suggestions: Array<{ id: string; item_name: string; category: string; selling_price_default: number }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  bestrating: 'Bestrating',
  beplanting: 'Beplanting',
  grondwerk: 'Grondwerk',
  afscheiding: 'Afscheiding',
  onderhoud: 'Onderhoud',
  materiaal: 'Materiaal',
  arbeid: 'Arbeid',
};

const CATEGORY_COLORS: Record<string, string> = {
  bestrating: 'bg-slate-100 text-slate-700 border-slate-200',
  beplanting: 'bg-green-100 text-green-700 border-green-200',
  grondwerk: 'bg-amber-100 text-amber-700 border-amber-200',
  afscheiding: 'bg-blue-100 text-blue-700 border-blue-200',
  onderhoud: 'bg-purple-100 text-purple-700 border-purple-200',
  materiaal: 'bg-gray-100 text-gray-700 border-gray-200',
  arbeid: 'bg-orange-100 text-orange-700 border-orange-200',
};

const UNITS = ['m²', 'm¹', 'stuks', 'ton', 'm³', 'uur', 'meter', 'kg', 'zak', 'doos', 'rol'];

const ALL_CATEGORIES = [
  'grondwerk',
  'bestrating',
  'erfafscheiding',
  'vlonders',
  'gazon',
  'beplanting',
  'overkappingen',
  'waterwerken',
  'verlichting',
  'onderhoud',
  'materiaal',
  'overig'
];

export function MaterialPicker({ pricing, onSelect, onClose }: MaterialPickerProps) {
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // New item form state
  const [newItem, setNewItem] = useState<NewItemForm>({
    item_name: '',
    category: 'overig',
    unit: 'm²',
    selling_price_default: '',
    item_type: 'materiaal',
    save_to_pricing: true
  });
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning>({ found: false, suggestions: [] });
  const [savingNewItem, setSavingNewItem] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(pricing.map(p => p.category))];
    return cats.sort();
  }, [pricing]);

  // Filter items
  const filteredItems = useMemo(() => {
    return pricing.filter(item => {
      const matchesSearch = searchQuery === '' ||
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === null || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [pricing, searchQuery, selectedCategory]);

  // Group by category
  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, PricingItem[]>);
  }, [filteredItems]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Check for duplicates when item name changes
  const checkForDuplicates = (name: string) => {
    if (name.length < 3) {
      setDuplicateWarning({ found: false, suggestions: [] });
      return;
    }

    const searchTerms = name.toLowerCase().split(' ');
    const matches = pricing.filter(item => {
      const itemNameLower = item.item_name.toLowerCase();
      return searchTerms.some(term => itemNameLower.includes(term));
    }).slice(0, 3);

    setDuplicateWarning({
      found: matches.length > 0,
      suggestions: matches.map(m => ({
        id: m.id,
        item_name: m.item_name,
        category: m.category,
        selling_price_default: m.selling_price_default
      }))
    });
  };

  // Handle new item submission
  const handleAddNewItem = async () => {
    if (!newItem.item_name || !newItem.selling_price_default) return;

    setSavingNewItem(true);

    const price = parseFloat(newItem.selling_price_default);
    if (isNaN(price)) {
      setSavingNewItem(false);
      return;
    }

    try {
      let savedItem: PricingItem | null = null;

      if (newItem.save_to_pricing) {
        // Save to database
        const response = await fetch('/api/admin/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_name: newItem.item_name,
            category: newItem.category,
            unit: newItem.unit,
            selling_price_default: price,
            item_type: newItem.item_type,
            is_active: true
          })
        });

        if (response.ok) {
          const data = await response.json();
          savedItem = data.pricing; // API returns { pricing: ... }
        }
      }

      // Create item to pass to onSelect
      const itemToAdd: PricingItem = savedItem || {
        id: crypto.randomUUID(),
        item_name: newItem.item_name,
        category: newItem.category,
        unit: newItem.unit,
        selling_price_default: price,
        item_type: newItem.item_type
      };

      onSelect(itemToAdd);
      onClose();
    } catch (error) {
      console.error('Error saving new item:', error);
    } finally {
      setSavingNewItem(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Item toevoegen
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('existing')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'existing'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Bestaande items
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'new'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              + Nieuw item
            </button>
          </div>

          {activeTab === 'existing' && (
            <>
              {/* Search */}
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Zoek op naam of categorie..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              {/* Category filters */}
              <div className="flex gap-2 flex-wrap mt-3">
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs"
                >
                  Alles ({pricing.length})
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs ${selectedCategory !== cat ? CATEGORY_COLORS[cat] || '' : ''}`}
                  >
                    {CATEGORY_LABELS[cat] || cat} ({pricing.filter(p => p.category === cat).length})
                  </Button>
                ))}
              </div>
            </>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4">
          {activeTab === 'existing' ? (
            // Existing items tab
            filteredItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Geen items gevonden voor "{searchQuery}"
              </p>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[category]?.split(' ')[0] || 'bg-gray-400'}`} />
                      {CATEGORY_LABELS[category] || category}
                    </h3>
                    <div className="grid gap-2">
                      {items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelect(item);
                            onClose();
                          }}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-orange-50 hover:border-orange-200 transition-colors text-left group"
                        >
                          <div className="flex items-center gap-2">
                            {item.item_type === 'arbeid' ? (
                              <Wrench className="w-4 h-4 text-orange-500" />
                            ) : (
                              <Package className="w-4 h-4 text-blue-500" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900 group-hover:text-orange-700">
                                {item.item_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                per {item.unit} • {item.item_type === 'arbeid' ? 'Arbeid' : 'Materiaal'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-orange-600">
                              {formatCurrency(Number(item.selling_price_default))}
                            </span>
                            <Plus className="w-4 h-4 text-gray-400 group-hover:text-orange-600" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // New item tab
            <div className="space-y-4">
              {/* Item name */}
              <div>
                <label className="text-sm font-medium text-gray-700">Naam *</label>
                <Input
                  value={newItem.item_name}
                  onChange={(e) => {
                    setNewItem({ ...newItem, item_name: e.target.value });
                    checkForDuplicates(e.target.value);
                  }}
                  placeholder="Bijv. Opsluitbanden leggen"
                  autoFocus
                />
              </div>

              {/* Duplicate warning */}
              {duplicateWarning.found && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Mogelijk duplicaat gevonden</p>
                      <p className="text-xs text-amber-600 mt-1">Vergelijkbare items in je prijslijst:</p>
                      <ul className="mt-2 space-y-1">
                        {duplicateWarning.suggestions.map(s => (
                          <li key={s.id}>
                            <button
                              onClick={() => {
                                const item = pricing.find(p => p.id === s.id);
                                if (item) {
                                  onSelect(item);
                                  onClose();
                                }
                              }}
                              className="text-sm text-amber-700 hover:text-amber-900 underline"
                            >
                              {s.item_name} ({formatCurrency(s.selling_price_default)})
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Type selection */}
              <div>
                <label className="text-sm font-medium text-gray-700">Type *</label>
                <div className="flex gap-3 mt-2">
                  <label className={`flex-1 flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    newItem.item_type === 'materiaal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="item_type"
                      checked={newItem.item_type === 'materiaal'}
                      onChange={() => setNewItem({ ...newItem, item_type: 'materiaal' })}
                      className="sr-only"
                    />
                    <Package className={`w-5 h-5 ${newItem.item_type === 'materiaal' ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div>
                      <p className="font-medium text-sm">Materiaal</p>
                      <p className="text-xs text-gray-500">Fysiek product</p>
                    </div>
                  </label>
                  <label className={`flex-1 flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    newItem.item_type === 'arbeid' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="item_type"
                      checked={newItem.item_type === 'arbeid'}
                      onChange={() => setNewItem({ ...newItem, item_type: 'arbeid' })}
                      className="sr-only"
                    />
                    <Wrench className={`w-5 h-5 ${newItem.item_type === 'arbeid' ? 'text-orange-500' : 'text-gray-400'}`} />
                    <div>
                      <p className="font-medium text-sm">Arbeid</p>
                      <p className="text-xs text-gray-500">Werkzaamheid</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium text-gray-700">Categorie</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                >
                  {ALL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                  ))}
                </select>
              </div>

              {/* Unit and Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Eenheid</label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  >
                    {UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Prijs per eenheid *</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newItem.selling_price_default}
                      onChange={(e) => setNewItem({ ...newItem, selling_price_default: e.target.value })}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Save checkbox */}
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={newItem.save_to_pricing}
                  onChange={(e) => setNewItem({ ...newItem, save_to_pricing: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded"
                />
                <div>
                  <p className="text-sm font-medium">Opslaan voor toekomstig gebruik</p>
                  <p className="text-xs text-gray-500">Item wordt toegevoegd aan je prijslijst</p>
                </div>
              </label>

              {/* Submit button */}
              <Button
                onClick={handleAddNewItem}
                disabled={!newItem.item_name || !newItem.selling_price_default || savingNewItem}
                className="w-full"
              >
                {savingNewItem ? (
                  'Opslaan...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Item toevoegen
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
