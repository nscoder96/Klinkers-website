'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Shovel, Grid3X3, Leaf, Fence, Scissors, Package, Plus, Sparkles } from 'lucide-react';

// Klinkers & Co Design System - Orange/Blue
const colors = {
  orange: '#FA5D29',
  orangeLight: '#FFF4F1',
  blue: '#49B3FC',
  blueLight: '#F0F9FF',
  dark: '#222222',
  darkLight: '#2d2d2d',
  slate: '#64748b',
  stone: '#F8F8F8',
  warmWhite: '#ffffff',
  mist: '#ededed',
  success: '#22c55e',
  successLight: '#f0fdf4',
};

interface PricingItem {
  id: string;
  category: string;
  item_name: string;
  item_description: string | null;
  unit: string;
  cost_price: number | null;
  selling_price_min: number | null;
  selling_price_max: number | null;
  selling_price_default: number;
  is_active: boolean;
  ai_generated?: boolean;
  notes?: string;
}

interface NewItem {
  category: string;
  item_name: string;
  item_description: string;
  unit: string;
  selling_price_default: string;
  selling_price_min: string;
  selling_price_max: string;
  cost_price: string;
}

const categories = [
  { value: 'grondwerk', label: 'Grondwerk', icon: Shovel },
  { value: 'bestrating', label: 'Bestrating', icon: Grid3X3 },
  { value: 'beplanting', label: 'Beplanting', icon: Leaf },
  { value: 'afscheiding', label: 'Afscheiding', icon: Fence },
  { value: 'onderhoud', label: 'Onderhoud', icon: Scissors },
  { value: 'overig', label: 'Overig', icon: Package },
];

const units = ['m²', 'm³', 'm', 'stuk', 'uur', 'dag', 'forfait'];

export default function PrijzenPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newItem, setNewItem] = useState<NewItem>({
    category: 'grondwerk',
    item_name: '',
    item_description: '',
    unit: 'm²',
    selling_price_default: '',
    selling_price_min: '',
    selling_price_max: '',
    cost_price: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchPricing();
    }
  }, [isAuthenticated]);

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/admin/pricing?all=true');
      if (response.ok) {
        const data = await response.json();
        setPricing(data.pricing);
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!newItem.item_name.trim() || !newItem.selling_price_default) {
      alert('Vul minimaal naam en standaardprijs in');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newItem.category,
          item_name: newItem.item_name,
          item_description: newItem.item_description || null,
          unit: newItem.unit,
          selling_price_default: parseFloat(newItem.selling_price_default),
          selling_price_min: newItem.selling_price_min ? parseFloat(newItem.selling_price_min) : null,
          selling_price_max: newItem.selling_price_max ? parseFloat(newItem.selling_price_max) : null,
          cost_price: newItem.cost_price ? parseFloat(newItem.cost_price) : null,
          is_active: true,
        })
      });

      if (response.ok) {
        await fetchPricing();
        setNewItem({
          category: 'grondwerk',
          item_name: '',
          item_description: '',
          unit: 'm²',
          selling_price_default: '',
          selling_price_min: '',
          selling_price_max: '',
          cost_price: '',
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateItem = async (id: string, updates: Partial<PricingItem>) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/pricing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await fetchPricing();
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/admin/pricing/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchPricing();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const filteredPricing = activeCategory === 'all'
    ? pricing
    : pricing.filter(p => p.category === activeCategory);

  const groupedPricing = filteredPricing.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PricingItem[]>);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.stone }}>
        <p style={{ color: colors.slate }}>Laden...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.dark }}>Prijzen Beheren</h1>
            <p style={{ color: colors.slate }}>Beheer je prijslijst voor offertes</p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            style={{ backgroundColor: colors.orange }}
            className="hover:opacity-90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Nieuw item
          </Button>
        </div>

        {/* Category Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory('all')}
              >
                Alles ({pricing.length})
              </Button>
              {categories.map((cat) => {
                const count = pricing.filter(p => p.category === cat.value).length;
                const CategoryIcon = cat.icon;
                return (
                  <Button
                    key={cat.value}
                    variant={activeCategory === cat.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory(cat.value)}
                    className="flex items-center gap-1"
                  >
                    <CategoryIcon className="w-4 h-4" /> {cat.label} ({count})
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Add New Item Form */}
        {showAddForm && (
          <Card style={{ borderColor: colors.orange, borderWidth: '2px', backgroundColor: colors.orangeLight }}>
            <CardHeader>
              <CardTitle style={{ color: colors.dark }}>Nieuw prijsitem toevoegen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Categorie</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Naam *</label>
                  <Input
                    value={newItem.item_name}
                    onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                    placeholder="Bijv: Zandbed aanbrengen"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Eenheid</label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Standaardprijs *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.selling_price_default}
                    onChange={(e) => setNewItem({ ...newItem, selling_price_default: e.target.value })}
                    placeholder="€"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Min prijs</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.selling_price_min}
                    onChange={(e) => setNewItem({ ...newItem, selling_price_min: e.target.value })}
                    placeholder="€"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max prijs</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.selling_price_max}
                    onChange={(e) => setNewItem({ ...newItem, selling_price_max: e.target.value })}
                    placeholder="€"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Inkoopprijs</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.cost_price}
                    onChange={(e) => setNewItem({ ...newItem, cost_price: e.target.value })}
                    placeholder="€"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-1">
                  <label className="text-sm font-medium">Beschrijving</label>
                  <Input
                    value={newItem.item_description}
                    onChange={(e) => setNewItem({ ...newItem, item_description: e.target.value })}
                    placeholder="Optioneel"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={addItem}
                  disabled={saving}
                  style={{ backgroundColor: colors.orange }}
                  className="hover:opacity-90 text-white"
                >
                  {saving ? 'Opslaan...' : 'Item toevoegen'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Annuleren
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing List */}
        {Object.entries(groupedPricing).map(([category, items]) => {
          const categoryInfo = categories.find(c => c.value === category);
          const CategoryIcon = categoryInfo?.icon;
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {CategoryIcon && <CategoryIcon className="w-5 h-5" />}
                  <span>{categoryInfo?.label || category}</span>
                  <span className="text-sm font-normal text-gray-500">({items.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm border-b" style={{ color: colors.slate, borderColor: colors.mist }}>
                        <th className="pb-2 font-medium">Naam</th>
                        <th className="pb-2 font-medium">Eenheid</th>
                        <th className="pb-2 font-medium text-right">Prijs</th>
                        <th className="pb-2 font-medium text-right">Min</th>
                        <th className="pb-2 font-medium text-right">Max</th>
                        <th className="pb-2 font-medium text-right">Inkoop</th>
                        <th className="pb-2 font-medium text-center">Actief</th>
                        <th className="pb-2 font-medium text-right">Acties</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b last:border-b-0" style={{ borderColor: colors.mist, backgroundColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.stone} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td className="py-3">
                            {editingId === item.id ? (
                              <Input
                                defaultValue={item.item_name}
                                onBlur={(e) => updateItem(item.id, { item_name: e.target.value })}
                                className="w-48"
                              />
                            ) : (
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium" style={{ color: colors.dark }}>{item.item_name}</p>
                                  {item.ai_generated && (
                                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.blueLight, color: colors.blue }}>
                                      <Sparkles className="w-3 h-3" /> AI
                                    </span>
                                  )}
                                </div>
                                {item.item_description && (
                                  <p className="text-xs" style={{ color: colors.slate }}>{item.item_description}</p>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3">{item.unit}</td>
                          <td className="py-3 text-right font-medium" style={{ color: colors.dark }}>
                            {editingId === item.id ? (
                              <Input
                                type="number"
                                step="0.01"
                                defaultValue={item.selling_price_default}
                                onBlur={(e) => updateItem(item.id, { selling_price_default: parseFloat(e.target.value) })}
                                className="w-24 text-right"
                              />
                            ) : (
                              `€${Number(item.selling_price_default).toFixed(2)}`
                            )}
                          </td>
                          <td className="py-3 text-right" style={{ color: colors.slate }}>
                            {item.selling_price_min ? `€${Number(item.selling_price_min).toFixed(2)}` : '-'}
                          </td>
                          <td className="py-3 text-right" style={{ color: colors.slate }}>
                            {item.selling_price_max ? `€${Number(item.selling_price_max).toFixed(2)}` : '-'}
                          </td>
                          <td className="py-3 text-right" style={{ color: colors.slate }}>
                            {item.cost_price ? `€${Number(item.cost_price).toFixed(2)}` : '-'}
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => updateItem(item.id, { is_active: !item.is_active })}
                              style={{
                                backgroundColor: item.is_active ? colors.success : colors.mist,
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%'
                              }}
                            >
                              {item.is_active && <span className="text-white text-xs">✓</span>}
                            </button>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                                style={{ color: colors.dark, borderColor: colors.mist }}
                              >
                                {editingId === item.id ? 'Klaar' : 'Bewerk'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                style={{ color: colors.orange, borderColor: colors.mist }}
                                onClick={() => deleteItem(item.id)}
                              >
                                ×
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredPricing.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center" style={{ color: colors.slate }}>
              Geen prijsitems gevonden in deze categorie
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
