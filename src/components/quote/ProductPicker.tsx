'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PricingHierarchy, PricingHierarchyItem } from '@/app/api/admin/pricing/hierarchy/route';

export interface ProductPickerProps {
  currentItem: {
    pricing_id: string;
    description: string;
    unit: string;
    unit_price: number;
    category: string;
  };
  hierarchy: PricingHierarchy;
  onSelect: (item: {
    pricing_id: string;
    description: string;
    unit: string;
    unit_price: number;
  }) => void;
  onAddNew: (item: {
    item_name: string;
    unit: string;
    selling_price_default: number;
    category: string;
    subcategory: string;
  }) => void;
}

const CROSS_REFERENCES: Record<string, string[]> = {
  'drainage': ['grondwerk', 'bestrating'],
  'grind': ['bestrating', 'grondwerk'],
  'randen': ['bestrating', 'erfafscheiding'],
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function ProductPicker({ currentItem, hierarchy, onSelect, onAddNew }: ProductPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('m²');
  const [newItemPrice, setNewItemPrice] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
        setShowAddForm(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Get items for the current category + cross-referenced categories
  const availableItems = useMemo(() => {
    const items: { subcategory: string; subcategoryLabel: string; item: PricingHierarchyItem }[] = [];
    const category = currentItem.category;

    // Items from the same category
    const categoryGroup = hierarchy[category];
    if (categoryGroup) {
      for (const [subKey, subGroup] of Object.entries(categoryGroup.subcategories)) {
        for (const item of subGroup.items) {
          items.push({
            subcategory: subKey,
            subcategoryLabel: subGroup.label,
            item,
          });
        }
      }
    }

    // Cross-referenced items from other categories
    for (const [subcat, relatedCategories] of Object.entries(CROSS_REFERENCES)) {
      if (relatedCategories.includes(category)) {
        // Find this subcategory in any category
        for (const [catKey, catGroup] of Object.entries(hierarchy)) {
          if (catKey === category) continue;
          const subGroup = catGroup.subcategories[subcat];
          if (subGroup) {
            for (const item of subGroup.items) {
              // Avoid duplicates
              if (!items.some(i => i.item.id === item.id)) {
                items.push({
                  subcategory: subcat,
                  subcategoryLabel: `${subGroup.label} (${catGroup.label})`,
                  item,
                });
              }
            }
          }
        }
      }
    }

    return items;
  }, [hierarchy, currentItem.category]);

  // Filter by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return availableItems;
    const terms = searchQuery.toLowerCase().split(' ');
    return availableItems.filter(({ item }) =>
      terms.every(term =>
        item.item_name.toLowerCase().includes(term) ||
        item.unit.toLowerCase().includes(term)
      )
    );
  }, [availableItems, searchQuery]);

  // Group filtered items by subcategory
  const groupedItems = useMemo(() => {
    const groups: Record<string, { label: string; items: PricingHierarchyItem[] }> = {};
    for (const { subcategory, subcategoryLabel, item } of filteredItems) {
      if (!groups[subcategory]) {
        groups[subcategory] = { label: subcategoryLabel, items: [] };
      }
      groups[subcategory].items.push(item);
    }
    return groups;
  }, [filteredItems]);

  const handleSelect = (item: PricingHierarchyItem) => {
    onSelect({
      pricing_id: item.id,
      description: item.item_name,
      unit: item.unit,
      unit_price: item.selling_price_default,
    });
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleAddNew = () => {
    const price = parseFloat(newItemPrice);
    if (!newItemName.trim() || isNaN(price)) return;

    onAddNew({
      item_name: newItemName.trim(),
      unit: newItemUnit,
      selling_price_default: price,
      category: currentItem.category,
      subcategory: 'overig',
    });

    setNewItemName('');
    setNewItemUnit('m²');
    setNewItemPrice('');
    setShowAddForm(false);
    setIsOpen(false);
  };

  const totalItems = availableItems.length;
  const showSearch = totalItems > 10;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-left bg-white border border-slate-200 rounded-md hover:border-orange-300 hover:bg-orange-50 transition-colors w-full min-w-0"
        title="Klik om alternatief product te kiezen"
      >
        <span className="truncate flex-1">{currentItem.description}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full left-0 mt-1 w-80 max-h-96 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden flex flex-col"
        >
          {/* Search filter */}
          {showSearch && (
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Zoek product..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-orange-300"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Items list */}
          <div className="overflow-y-auto flex-1">
            {Object.entries(groupedItems).length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Geen producten gevonden</p>
            ) : (
              Object.entries(groupedItems).map(([subKey, group]) => (
                <div key={subKey}>
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {group.label}
                    </span>
                  </div>
                  {group.items.map((item) => {
                    const isSelected = item.id === currentItem.pricing_id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-orange-50 transition-colors ${
                          isSelected ? 'bg-orange-50 text-orange-700' : 'text-slate-700'
                        }`}
                      >
                        <div className="w-4 flex-shrink-0">
                          {isSelected && <Check className="w-4 h-4 text-orange-600" />}
                        </div>
                        <span className="flex-1 truncate">{item.item_name}</span>
                        <span className="text-xs text-slate-400 flex-shrink-0">/{item.unit}</span>
                        <span className={`font-medium flex-shrink-0 ${isSelected ? 'text-orange-600' : 'text-slate-600'}`}>
                          {formatCurrency(item.selling_price_default)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Add new product */}
          <div className="border-t border-slate-200">
            {showAddForm ? (
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">Nieuw product</span>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Productnaam"
                  className="text-sm h-8"
                  autoFocus
                />
                <div className="flex gap-2">
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="text-sm border border-slate-200 rounded-md px-2 py-1 h-8"
                  >
                    <option value="m²">m²</option>
                    <option value="m">m</option>
                    <option value="m³">m³</option>
                    <option value="stuks">stuks</option>
                    <option value="ton">ton</option>
                    <option value="kg">kg</option>
                    <option value="zak">zak</option>
                    <option value="rol">rol</option>
                  </select>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      placeholder="0.00"
                      className="text-sm h-8 pl-5"
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddNew}
                  disabled={!newItemName.trim() || !newItemPrice}
                  className="w-full h-7 text-xs"
                >
                  Toevoegen
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full px-3 py-2.5 text-sm text-slate-500 hover:text-orange-600 hover:bg-orange-50 flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nieuw product toevoegen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
