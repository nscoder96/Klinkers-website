'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { shouldPromptNewPricingItem, normalizeItemName } from './new-pricing-item-prompt';
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Plus,
  GripVertical,
  Calculator,
  X,
  Save,
  FileText,
  BookmarkPlus,
  Loader2,
  Check,
  Pencil
} from 'lucide-react';

// Types
export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  line_type: 'arbeid' | 'materiaal';
  markup_percent: number | null;
  vat_rate: number;
  is_ai_calculated: boolean;
  calculation_breakdown?: {
    formula: string;
    explanation: string;
    source: string;
  } | null;
  pricing_id?: string | null;
}

export interface Section {
  id: string;
  title: string;
  category: string;
  items: LineItem[];
  subtotal: number;
  isExpanded: boolean;
}

interface PricingItem {
  id: string;
  category: string;
  item_name: string;
  unit: string;
  selling_price_default: number;
  item_type: 'arbeid' | 'materiaal';
}

interface QuoteEditorTableProps {
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
  pricing: PricingItem[];
  aiSummary?: string;
  onSave: () => void;
  onExportPDF: () => void;
  isSaving?: boolean;
  customerName?: string;
  projectName?: string;
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

// Type Badge Component
function TypeBadge({
  type,
  onChange
}: {
  type: 'arbeid' | 'materiaal';
  onChange: (type: 'arbeid' | 'materiaal') => void;
}) {
  return (
    <button
      onClick={() => onChange(type === 'arbeid' ? 'materiaal' : 'arbeid')}
      className={`w-8 h-6 rounded text-xs font-bold transition-colors ${
        type === 'arbeid'
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          : 'bg-green-100 text-green-700 hover:bg-green-200'
      }`}
      title={type === 'arbeid' ? 'Arbeid - Klik om te wisselen naar Materiaal' : 'Materiaal - Klik om te wisselen naar Arbeid'}
    >
      {type === 'arbeid' ? 'A' : 'M'}
    </button>
  );
}

// Editable Cell Component
function EditableCell({
  value,
  onChange,
  type = 'text',
  className = '',
  placeholder = '',
  suffix = '',
  min,
  step
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: 'text' | 'number' | 'currency' | 'percentage';
  className?: string;
  placeholder?: string;
  suffix?: string;
  min?: number;
  step?: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const formatDisplay = () => {
    if (type === 'currency') {
      return formatCurrency(Number(value));
    }
    if (type === 'percentage') {
      return value === 0 || value === null ? '-' : `${value}%`;
    }
    return `${value}${suffix}`;
  };

  const handleSave = () => {
    let finalValue: string | number = localValue;
    if (type === 'number' || type === 'currency' || type === 'percentage') {
      finalValue = parseFloat(localValue) || 0;
    }
    onChange(finalValue);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <span
        onClick={() => setIsEditing(true)}
        className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded block ${className}`}
      >
        {formatDisplay() || <span className="text-gray-400">{placeholder}</span>}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type === 'text' ? 'text' : 'number'}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
          setLocalValue(String(value));
          setIsEditing(false);
        }
      }}
      min={min}
      step={step}
      className={`w-full px-2 py-1 border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 ${className}`}
    />
  );
}

// Unit Select Component
function UnitSelect({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const units = ['m²', 'm³', 'm', 'stuks', 'uur', 'kg', 'ton'];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-1 py-1 border-0 bg-transparent hover:bg-gray-100 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
    >
      {units.map((unit) => (
        <option key={unit} value={unit}>{unit}</option>
      ))}
    </select>
  );
}

// VAT Select Component
function VatSelect({
  value,
  onChange
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full px-1 py-1 border-0 bg-transparent hover:bg-gray-100 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
    >
      <option value={0}>0%</option>
      <option value={9}>9%</option>
      <option value={21}>21%</option>
    </select>
  );
}

// Calculation Popover Component
function CalculationPopover({
  item,
  onClose,
  onAdjust
}: {
  item: LineItem;
  onClose: () => void;
  onAdjust: (quantity: number) => void;
}) {
  const [newQuantity, setNewQuantity] = useState(item.quantity);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-orange-500" />
            Berekening: {item.description}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {item.calculation_breakdown ? (
          <div className="bg-gray-50 rounded p-3 mb-4 text-sm">
            <p className="font-medium mb-2">Formule:</p>
            <p className="text-gray-600 mb-2">{item.calculation_breakdown.formula}</p>
            <p className="font-medium mb-2">Uitleg:</p>
            <p className="text-gray-600">{item.calculation_breakdown.explanation}</p>
            <p className="text-xs text-gray-400 mt-2">Bron: {item.calculation_breakdown.source}</p>
          </div>
        ) : (
          <p className="text-gray-500 text-sm mb-4">Geen berekeningsdetails beschikbaar.</p>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
          <p className="text-sm text-amber-800">
            Dit is een AI-berekening. Controleer of dit klopt voor uw situatie.
          </p>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-medium">Hoeveelheid aanpassen:</label>
          <Input
            type="number"
            value={newQuantity}
            onChange={(e) => setNewQuantity(parseFloat(e.target.value) || 0)}
            className="w-24"
            step="0.1"
          />
          <span className="text-sm text-gray-500">{item.unit}</span>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button
            onClick={() => {
              onAdjust(newQuantity);
              onClose();
            }}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Toepassen
          </Button>
        </div>
      </div>
    </div>
  );
}

// Save to Library Modal Component
function SaveToLibraryModal({
  item,
  onClose,
  onSaved
}: {
  item: LineItem;
  onClose: () => void;
  onSaved: (pricingId: string) => void;
}) {
  const [itemName, setItemName] = useState(item.description);
  const [category, setCategory] = useState('overig');
  const [unit, setUnit] = useState(item.unit);
  const [price, setPrice] = useState(item.unit_price);
  const [itemType, setItemType] = useState<'arbeid' | 'materiaal'>(item.line_type);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const categories = [
    'grondwerk',
    'bestrating',
    'erfafscheiding',
    'vlonders',
    'gazon',
    'beplanting',
    'overkappingen',
    'waterwerken',
    'verlichting',
    'overig'
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: itemName,
          category,
          unit,
          selling_price_default: price,
          item_type: itemType,
          is_active: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSaved(true);
        setTimeout(() => {
          onSaved(data.pricing.id);
          onClose();
        }, 1000);
      } else {
        alert('Opslaan mislukt');
      }
    } catch (error) {
      console.error('Error saving to library:', error);
      alert('Er ging iets mis');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5 text-green-500" />
            Opslaan naar prijsbibliotheek
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {saved ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="font-medium text-green-700">Opgeslagen!</p>
            <p className="text-sm text-gray-500">Item toegevoegd aan prijsbibliotheek</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Naam</label>
                <Input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Itemnaam..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as 'arbeid' | 'materiaal')}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="arbeid">Arbeid</option>
                    <option value="materiaal">Materiaal</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Categorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Eenheid</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="m²">m²</option>
                    <option value="m³">m³</option>
                    <option value="m">m</option>
                    <option value="stuks">stuks</option>
                    <option value="uur">uur</option>
                    <option value="kg">kg</option>
                    <option value="ton">ton</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Prijs (€)</label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={onClose}>Annuleren</Button>
              <Button
                onClick={handleSave}
                disabled={saving || !itemName.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-4 h-4 mr-2" />
                    Opslaan
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Add Item Modal Component
function AddItemModal({
  sectionId,
  pricing,
  onClose,
  onAdd
}: {
  sectionId: string;
  pricing: PricingItem[];
  onClose: () => void;
  onAdd: (sectionId: string, item: Partial<LineItem>) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'arbeid' | 'materiaal'>('all');

  const filteredPricing = pricing.filter((p) => {
    const matchesSearch = p.item_name.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'all' || p.item_type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleSelectItem = (pricingItem: PricingItem) => {
    onAdd(sectionId, {
      id: crypto.randomUUID(),
      description: pricingItem.item_name,
      quantity: 1,
      unit: pricingItem.unit,
      unit_price: pricingItem.selling_price_default,
      total_price: pricingItem.selling_price_default,
      line_type: pricingItem.item_type,
      markup_percent: pricingItem.item_type === 'materiaal' ? 10 : null,
      vat_rate: 21,
      is_ai_calculated: false,
      pricing_id: pricingItem.id
    });
    onClose();
  };

  const handleCreateNew = () => {
    onAdd(sectionId, {
      id: crypto.randomUUID(),
      description: search || 'Nieuw item',
      quantity: 1,
      unit: 'm²',
      unit_price: 0,
      total_price: 0,
      line_type: 'arbeid',
      markup_percent: null,
      vat_rate: 21,
      is_ai_calculated: false
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Item toevoegen</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek in prijsbibliotheek..."
            autoFocus
          />

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1 rounded text-sm ${selectedType === 'all' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100'}`}
            >
              Alle
            </button>
            <button
              onClick={() => setSelectedType('arbeid')}
              className={`px-3 py-1 rounded text-sm ${selectedType === 'arbeid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
            >
              Arbeid
            </button>
            <button
              onClick={() => setSelectedType('materiaal')}
              className={`px-3 py-1 rounded text-sm ${selectedType === 'materiaal' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}
            >
              Materiaal
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredPricing.length > 0 ? (
            <div className="space-y-1">
              {filteredPricing.slice(0, 20).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-5 rounded text-xs font-bold flex items-center justify-center ${
                      item.item_type === 'arbeid' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {item.item_type === 'arbeid' ? 'A' : 'M'}
                    </span>
                    <span>{item.item_name}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(item.selling_price_default)} / {item.unit}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">Geen items gevonden</p>
          )}
        </div>

        <div className="p-3 border-t">
          <Button
            variant="outline"
            onClick={handleCreateNew}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nieuw item aanmaken{search ? `: "${search}"` : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Sortable wrapper for a single item row
function SortableItemRow({
  id,
  sectionId,
  children,
}: {
  id: string;
  sectionId: string;
  children: (gripProps: React.HTMLAttributes<HTMLElement>) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { type: 'item', sectionId },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
    >
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

// Sortable wrapper for a section card
function SortableSectionCard({
  id,
  children,
}: {
  id: string;
  children: (gripProps: React.HTMLAttributes<HTMLElement>) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { type: 'section' },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
    >
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

// Main QuoteEditorTable Component
export default function QuoteEditorTable({
  sections,
  onSectionsChange,
  pricing,
  aiSummary,
  onSave,
  onExportPDF,
  isSaving = false,
  customerName = '',
  projectName = ''
}: QuoteEditorTableProps) {
  const [showAiSummary, setShowAiSummary] = useState(!!aiSummary);
  const [addItemModalSection, setAddItemModalSection] = useState<string | null>(null);
  const [calculationPopoverItem, setCalculationPopoverItem] = useState<LineItem | null>(null);
  const [saveToLibraryItem, setSaveToLibraryItem] = useState<{ sectionId: string; item: LineItem } | null>(null);
  // Per regel: voor welke omschrijving de "nieuw item?"-vraag al gesteld is
  const [askedNewItem, setAskedNewItem] = useState<Record<string, string>>({});
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');
  const sectionInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'section' && overData?.type === 'section') {
      const oldIdx = sections.findIndex(s => s.id === active.id);
      const newIdx = sections.findIndex(s => s.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) onSectionsChange(arrayMove(sections, oldIdx, newIdx));
    } else if (activeData?.type === 'item' && overData?.type === 'item' && activeData.sectionId === overData.sectionId) {
      const sectionId = activeData.sectionId as string;
      const section = sections.find(s => s.id === sectionId);
      if (!section) return;
      const oldIdx = section.items.findIndex(i => i.id === active.id);
      const newIdx = section.items.findIndex(i => i.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) {
        onSectionsChange(sections.map(s =>
          s.id === sectionId ? { ...s, items: arrayMove(s.items, oldIdx, newIdx) } : s
        ));
      }
    }
  }, [sections, onSectionsChange]);

  // Focus section rename input when editing
  useEffect(() => {
    if (editingSectionId && sectionInputRef.current) {
      sectionInputRef.current.focus();
      sectionInputRef.current.select();
    }
  }, [editingSectionId]);

  // Rename section
  const startRenamingSection = (sectionId: string, currentTitle: string) => {
    setEditingSectionId(sectionId);
    setEditingSectionTitle(currentTitle);
  };

  const saveRenameSection = () => {
    if (editingSectionId && editingSectionTitle.trim()) {
      onSectionsChange(
        sections.map((s) =>
          s.id === editingSectionId ? { ...s, title: editingSectionTitle.trim() } : s
        )
      );
    }
    setEditingSectionId(null);
  };

  // Toggle section expanded
  const toggleSection = (sectionId: string) => {
    onSectionsChange(
      sections.map((s) =>
        s.id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s
      )
    );
  };

  // Helper to calculate item total price (excl. BTW)
  const calculateItemTotal = (item: LineItem) => {
    const basePrice = item.quantity * item.unit_price;
    const markup = item.line_type === 'materiaal' && item.markup_percent
      ? basePrice * (item.markup_percent / 100)
      : 0;
    return basePrice + markup;
  };

  // Update item
  const updateItem = useCallback((sectionId: string, itemId: string, field: keyof LineItem, value: unknown) => {
    onSectionsChange(
      sections.map((section) => {
        if (section.id !== sectionId) return section;

        const updatedItems = section.items.map((item) => {
          if (item.id !== itemId) return item;

          const updatedItem = { ...item, [field]: value };

          // If changing type to arbeid, remove markup
          if (field === 'line_type' && value === 'arbeid') {
            updatedItem.markup_percent = null;
          }

          // If changing type to materiaal, add default markup if none
          if (field === 'line_type' && value === 'materiaal' && !updatedItem.markup_percent) {
            updatedItem.markup_percent = 10; // Default 10% markup
          }

          // Always recalculate total price
          updatedItem.total_price = calculateItemTotal(updatedItem);

          return updatedItem;
        });

        const subtotal = updatedItems.reduce((sum, item) => sum + item.total_price, 0);

        return { ...section, items: updatedItems, subtotal };
      })
    );

    // Na een omschrijving-wijziging: vraag of dit een nieuw bibliotheek-item is
    // (hernoemd t.o.v. gekoppeld item, of losse regel zonder koppeling)
    if (field === 'description') {
      const item = sections.find((s) => s.id === sectionId)?.items.find((i) => i.id === itemId);
      if (item) {
        const newDescription = String(value);
        const linked = item.pricing_id ? pricing.find((p) => p.id === item.pricing_id) : null;
        const normalized = normalizeItemName(newDescription);
        if (shouldPromptNewPricingItem({
          description: newDescription,
          pricingId: item.pricing_id ?? null,
          linkedItemName: linked?.item_name ?? null,
          alreadyAsked: askedNewItem[itemId] === normalized
        })) {
          setAskedNewItem((prev) => ({ ...prev, [itemId]: normalized }));
          setSaveToLibraryItem({ sectionId, item: { ...item, description: newDescription } });
        }
      }
    }
  }, [sections, onSectionsChange, pricing, askedNewItem]);

  // Delete item
  const deleteItem = (sectionId: string, itemId: string) => {
    onSectionsChange(
      sections.map((section) => {
        if (section.id !== sectionId) return section;

        const updatedItems = section.items.filter((item) => item.id !== itemId);
        const subtotal = updatedItems.reduce((sum, item) => sum + item.total_price, 0);

        return { ...section, items: updatedItems, subtotal };
      })
    );
  };

  // Add item
  const addItem = (sectionId: string, item: Partial<LineItem>) => {
    onSectionsChange(
      sections.map((section) => {
        if (section.id !== sectionId) return section;

        const newItem: LineItem = {
          id: item.id || crypto.randomUUID(),
          description: item.description || '',
          quantity: item.quantity || 1,
          unit: item.unit || 'm²',
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
          line_type: item.line_type || 'arbeid',
          markup_percent: item.markup_percent ?? null,
          vat_rate: item.vat_rate || 21,
          is_ai_calculated: item.is_ai_calculated || false,
          pricing_id: item.pricing_id
        };

        const updatedItems = [...section.items, newItem];
        const subtotal = updatedItems.reduce((sum, i) => sum + i.total_price, 0);

        return { ...section, items: updatedItems, subtotal };
      })
    );
  };

  // Calculate totals - BTW per item for correct calculation
  const allItems = sections.flatMap(s => s.items);

  const totals = {
    arbeid: allItems
      .filter(i => i.line_type === 'arbeid')
      .reduce((sum, i) => sum + i.total_price, 0),
    materiaal: allItems
      .filter(i => i.line_type === 'materiaal')
      .reduce((sum, i) => sum + i.total_price, 0),
    subtotal: allItems.reduce((sum, i) => sum + i.total_price, 0),
    // BTW berekend per item op basis van individueel BTW tarief
    btw: allItems.reduce((sum, i) => sum + (i.total_price * (i.vat_rate / 100)), 0),
    // Totaal = subtotaal + BTW
    total: allItems.reduce((sum, i) => sum + i.total_price + (i.total_price * (i.vat_rate / 100)), 0)
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div>
          <h2 className="text-lg font-semibold">
            {customerName ? `OFFERTE: ${customerName}` : 'NIEUWE OFFERTE'}
            {projectName && <span className="text-gray-500"> - {projectName}</span>}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExportPDF}>
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button onClick={onSave} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </div>

      {/* AI Summary */}
      {showAiSummary && aiSummary && (
        <div className="mx-4 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start justify-between">
          <p className="text-sm text-blue-800">
            <span className="font-medium">AI-samenvatting:</span> {aiSummary}
          </p>
          <button
            onClick={() => setShowAiSummary(false)}
            className="text-blue-400 hover:text-blue-600 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sections */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="p-4 space-y-4">
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
        {sections.map((section) => (
          <SortableSectionCard key={section.id} id={section.id}>
          {(sectionGripProps) => (
          <div id={`section-${section.id}`} className="border rounded-lg overflow-hidden group/section">
            {/* Section Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-100">
              <div className="flex items-center gap-2">
                <span
                  {...sectionGripProps}
                  className="shrink-0 cursor-grab text-gray-300 hover:text-gray-500 opacity-0 group-hover/section:opacity-100 transition-opacity"
                  onClick={e => e.stopPropagation()}
                  title="Sectie verslepen"
                >
                  <GripVertical className="w-4 h-4" />
                </span>
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleSection(section.id)}>
                {section.isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                {editingSectionId === section.id ? (
                  <input
                    ref={sectionInputRef}
                    value={editingSectionTitle}
                    onChange={(e) => setEditingSectionTitle(e.target.value)}
                    onBlur={saveRenameSection}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRenameSection();
                      if (e.key === 'Escape') setEditingSectionId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold uppercase bg-white border border-orange-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : (
                  <>
                    <span className="font-semibold uppercase">{section.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startRenamingSection(section.id, section.title);
                      }}
                      className="text-gray-400 hover:text-orange-500 opacity-0 group-hover/section:opacity-100 transition-opacity"
                      title="Sectie hernoemen"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Sectie "${section.title}" verwijderen?`)) {
                          onSectionsChange(sections.filter((s) => s.id !== section.id));
                        }
                      }}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover/section:opacity-100 transition-opacity"
                      title="Sectie verwijderen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <span className="text-sm text-gray-500">({section.items.length} items)</span>
                </div>{/* end click area */}
              </div>
              <span className="font-medium">Subtotaal: {formatCurrency(section.subtotal)}</span>
            </div>

            {/* Section Content */}
            {section.isExpanded && (
              <div className="overflow-x-auto">
                {/* Table Header */}
                <div className="grid grid-cols-[50px_1fr_80px_70px_90px_70px_60px_90px_40px] gap-2 px-4 py-2 bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase min-w-[820px]">
                  <div>Type</div>
                  <div>Omschrijving</div>
                  <div className="text-right">Hoev.</div>
                  <div>Eenh.</div>
                  <div className="text-right">Prijs</div>
                  <div className="text-right">Opslag</div>
                  <div>BTW</div>
                  <div className="text-right">Totaal</div>
                  <div></div>
                </div>

                {/* Table Rows */}
                <SortableContext items={section.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {section.items.map((item) => (
                  <SortableItemRow key={item.id} id={item.id} sectionId={section.id}>
                  {(itemGripProps) => (
                  <div
                    id={`item-${item.id}`}
                    className="grid grid-cols-[50px_1fr_80px_70px_90px_70px_60px_90px_40px] gap-2 px-4 py-2 border-b hover:bg-gray-50 items-center group transition-colors min-w-[820px]"
                  >
                    {/* Type */}
                    <div>
                      <TypeBadge
                        type={item.line_type}
                        onChange={(type) => updateItem(section.id, item.id, 'line_type', type)}
                      />
                    </div>

                    {/* Description */}
                    <div className="flex items-center gap-1">
                      <span {...itemGripProps} className="shrink-0 cursor-grab">
                        <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100" />
                      </span>
                      <EditableCell
                        value={item.description}
                        onChange={(v) => updateItem(section.id, item.id, 'description', v)}
                        className="flex-1"
                        placeholder="Omschrijving..."
                      />
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center justify-end gap-1">
                      <EditableCell
                        value={item.quantity}
                        onChange={(v) => updateItem(section.id, item.id, 'quantity', v)}
                        type="number"
                        className="text-right"
                      />
                      {item.is_ai_calculated && (
                        <button
                          onClick={() => setCalculationPopoverItem(item)}
                          className="text-orange-500 hover:text-orange-700"
                          title="Bekijk berekening"
                        >
                          <Calculator className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Unit */}
                    <div>
                      <UnitSelect
                        value={item.unit}
                        onChange={(v) => updateItem(section.id, item.id, 'unit', v)}
                      />
                    </div>

                    {/* Unit Price */}
                    <div>
                      <EditableCell
                        value={item.unit_price}
                        onChange={(v) => updateItem(section.id, item.id, 'unit_price', v)}
                        type="currency"
                        className="text-right"
                      />
                    </div>

                    {/* Markup */}
                    <div>
                      {item.line_type === 'materiaal' ? (
                        <EditableCell
                          value={item.markup_percent || 0}
                          onChange={(v) => updateItem(section.id, item.id, 'markup_percent', v)}
                          type="percentage"
                          className="text-right"
                        />
                      ) : (
                        <span className="text-gray-400 text-center block">-</span>
                      )}
                    </div>

                    {/* VAT */}
                    <div>
                      <VatSelect
                        value={item.vat_rate}
                        onChange={(v) => updateItem(section.id, item.id, 'vat_rate', v)}
                      />
                    </div>

                    {/* Total */}
                    <div className="text-right font-medium">
                      {formatCurrency(item.total_price)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100">
                      {/* Save to library button - only show if no pricing_id */}
                      {!item.pricing_id && (
                        <button
                          onClick={() => setSaveToLibraryItem({ sectionId: section.id, item })}
                          className="text-green-500 hover:text-green-700"
                          title="Opslaan naar prijsbibliotheek"
                        >
                          <BookmarkPlus className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteItem(section.id, item.id)}
                        className="text-red-400 hover:text-red-600"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  )}{/* end SortableItemRow render */}
                  </SortableItemRow>
                ))}
                </SortableContext>

                {/* Add Item Button */}
                <div className="px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddItemModalSection(section.id)}
                    className="border-dashed w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Item toevoegen
                  </Button>
                </div>
              </div>
            )}
          </div>
          )}{/* end SortableSectionCard render */}
          </SortableSectionCard>
        ))}
        </SortableContext>

        {/* Add Section Button */}
        {sections.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              const newSection: Section = {
                id: crypto.randomUUID(),
                title: 'Nieuwe Sectie',
                category: 'overig',
                items: [],
                subtotal: 0,
                isExpanded: true
              };
              onSectionsChange([...sections, newSection]);
            }}
            className="border-dashed w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe sectie toevoegen
          </Button>
        )}
      </div>
      </DndContext>

      {/* Totals Overview */}
      {sections.length > 0 && (
        <div className="border-t bg-gray-50 p-4">
          <div className="max-w-sm ml-auto space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Totaal arbeid:</span>
              <span>{formatCurrency(totals.arbeid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Totaal materiaal (incl. opslag):</span>
              <span>{formatCurrency(totals.materiaal)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-gray-600">Subtotaal excl. BTW:</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">BTW:</span>
              <span>{formatCurrency(totals.btw)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>TOTAAL INCL. BTW:</span>
              <span className="text-orange-600">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {addItemModalSection && (
        <AddItemModal
          sectionId={addItemModalSection}
          pricing={pricing}
          onClose={() => setAddItemModalSection(null)}
          onAdd={addItem}
        />
      )}

      {calculationPopoverItem && (
        <CalculationPopover
          item={calculationPopoverItem}
          onClose={() => setCalculationPopoverItem(null)}
          onAdjust={(quantity) => {
            const section = sections.find(s =>
              s.items.some(i => i.id === calculationPopoverItem.id)
            );
            if (section) {
              updateItem(section.id, calculationPopoverItem.id, 'quantity', quantity);
            }
          }}
        />
      )}

      {saveToLibraryItem && (
        <SaveToLibraryModal
          item={saveToLibraryItem.item}
          onClose={() => setSaveToLibraryItem(null)}
          onSaved={(pricingId) => {
            // Update the item with the new pricing_id
            updateItem(saveToLibraryItem.sectionId, saveToLibraryItem.item.id, 'pricing_id', pricingId);
          }}
        />
      )}
    </div>
  );
}
