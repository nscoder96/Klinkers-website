'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Calculator,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  Check,
  Info,
  Settings2
} from 'lucide-react';
import Link from 'next/link';

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

interface FormulaParameter {
  [key: string]: number | string;
}

interface Formula {
  id: string;
  user_id: string | null;
  formula_name: string;
  formula_slug: string;
  category: string;
  formula_expression: string;
  description: string | null;
  parameters: FormulaParameter;
  result_unit: string;
  is_active: boolean;
}

const categories = [
  { value: 'grondwerk', label: 'Grondwerk' },
  { value: 'bestrating', label: 'Bestrating' },
  { value: 'erfafscheiding', label: 'Erfafscheiding' },
  { value: 'gazon', label: 'Gazon' },
  { value: 'beplanting', label: 'Beplanting' },
  { value: 'drainage', label: 'Drainage' },
  { value: 'overig', label: 'Overig' },
];

const units = ['m²', 'm³', 'm', 'stuks', 'kg', '%'];

const parameterLabels: Record<string, string> = {
  depth: 'Diepte (m)',
  factor: 'Factor',
  width: 'Breedte (m)',
  spacing: 'Tussenafstand (m)',
  loss_percentage: 'Snijverlies (%)',
  coverage: 'Dekking (kg/m²)',
};

export default function FormulesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFormula, setNewFormula] = useState({
    formula_name: '',
    category: 'grondwerk',
    formula_expression: '',
    description: '',
    parameters: {} as FormulaParameter,
    result_unit: 'm³',
  });
  const [newParamKey, setNewParamKey] = useState('');
  const [newParamValue, setNewParamValue] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchFormulas();
    }
  }, [isAuthenticated]);

  const fetchFormulas = async () => {
    try {
      const response = await fetch('/api/admin/formulas');
      if (response.ok) {
        const data = await response.json();
        setFormulas(data.formulas);
      }
    } catch (error) {
      console.error('Error fetching formulas:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFormula = async () => {
    if (!newFormula.formula_name.trim() || !newFormula.formula_expression.trim()) {
      alert('Vul een naam en formule expressie in');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/formulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFormula),
      });

      if (response.ok) {
        await fetchFormulas();
        setNewFormula({
          formula_name: '',
          category: 'grondwerk',
          formula_expression: '',
          description: '',
          parameters: {},
          result_unit: 'm³',
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding formula:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateFormula = async (id: string, updates: Partial<Formula>) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/formulas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchFormulas();
        setEditingFormula(null);
      }
    } catch (error) {
      console.error('Error updating formula:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteFormula = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze formule wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/admin/formulas/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchFormulas();
      }
    } catch (error) {
      console.error('Error deleting formula:', error);
    }
  };

  const addParameter = (to: 'new' | 'edit') => {
    if (!newParamKey.trim()) return;
    const value = parseFloat(newParamValue) || 0;

    if (to === 'new') {
      setNewFormula({
        ...newFormula,
        parameters: { ...newFormula.parameters, [newParamKey]: value },
      });
    } else if (editingFormula) {
      setEditingFormula({
        ...editingFormula,
        parameters: { ...editingFormula.parameters, [newParamKey]: value },
      });
    }
    setNewParamKey('');
    setNewParamValue('');
  };

  const updateParameter = (formula: 'new' | Formula, key: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    if (formula === 'new') {
      setNewFormula({
        ...newFormula,
        parameters: { ...newFormula.parameters, [key]: numValue },
      });
    } else if (editingFormula) {
      setEditingFormula({
        ...editingFormula,
        parameters: { ...editingFormula.parameters, [key]: numValue },
      });
    }
  };

  const removeParameter = (key: string, from: 'new' | 'edit') => {
    if (from === 'new') {
      const params = { ...newFormula.parameters };
      delete params[key];
      setNewFormula({ ...newFormula, parameters: params });
    } else if (editingFormula) {
      const params = { ...editingFormula.parameters };
      delete params[key];
      setEditingFormula({ ...editingFormula, parameters: params });
    }
  };

  // Group formulas by category
  const groupedFormulas = formulas.reduce((acc, formula) => {
    if (!acc[formula.category]) acc[formula.category] = [];
    acc[formula.category].push(formula);
    return acc;
  }, {} as Record<string, Formula[]>);

  // Format formula expression for display
  const formatExpression = (expr: string) => {
    return expr
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/CEIL/g, 'afgerond naar boven');
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div
              className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-2"
              style={{ borderColor: colors.orange, borderTopColor: 'transparent' }}
            />
            <p style={{ color: colors.slate }}>Laden...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/instellingen"
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'transparent' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.stone}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: colors.slate }} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: colors.dark }}>
                <Calculator className="w-6 h-6" style={{ color: colors.blue }} />
                Berekeningsformules
              </h1>
              <p style={{ color: colors.slate }}>
                Configureer formules voor automatische materiaalberekeningen
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="gap-2"
            style={{ backgroundColor: colors.orange, color: colors.warmWhite }}
          >
            <Plus className="w-4 h-4" /> Nieuwe formule
          </Button>
        </div>

        {/* Info banner */}
        <div className="rounded-lg p-4 flex gap-3" style={{ backgroundColor: colors.blueLight, border: `1px solid ${colors.blue}` }}>
          <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: colors.blue }} />
          <div className="text-sm" style={{ color: colors.dark }}>
            <strong>Formules gebruiken variabelen:</strong> Gebruik <code className="px-1 rounded" style={{ backgroundColor: colors.stone }}>area</code> voor oppervlakte,
            <code className="px-1 rounded mx-1" style={{ backgroundColor: colors.stone }}>length</code> voor lengte,
            <code className="px-1 rounded mx-1" style={{ backgroundColor: colors.stone }}>volume</code> voor volume.
            Parameters zoals <code className="px-1 rounded" style={{ backgroundColor: colors.stone }}>depth</code> of <code className="px-1 rounded" style={{ backgroundColor: colors.stone }}>factor</code>
            kunnen per formule worden ingesteld.
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <Card className="border-2" style={{ borderColor: colors.orangeLight, backgroundColor: colors.orangeLight }}>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: colors.dark }}>Nieuwe formule toevoegen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium" style={{ color: colors.dark }}>Naam *</label>
                  <Input
                    value={newFormula.formula_name}
                    onChange={(e) => setNewFormula({ ...newFormula, formula_name: e.target.value })}
                    placeholder="Bijv: Zandbed onder bestrating"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: colors.dark }}>Categorie</label>
                  <select
                    value={newFormula.category}
                    onChange={(e) => setNewFormula({ ...newFormula, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium" style={{ color: colors.dark }}>Formule expressie *</label>
                  <Input
                    value={newFormula.formula_expression}
                    onChange={(e) => setNewFormula({ ...newFormula, formula_expression: e.target.value })}
                    placeholder="bijv: area * depth"
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: colors.dark }}>Resultaat eenheid</label>
                  <select
                    value={newFormula.result_unit}
                    onChange={(e) => setNewFormula({ ...newFormula, result_unit: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium" style={{ color: colors.dark }}>Beschrijving</label>
                <Input
                  value={newFormula.description}
                  onChange={(e) => setNewFormula({ ...newFormula, description: e.target.value })}
                  placeholder="Optionele toelichting"
                />
              </div>

              {/* Parameters */}
              <div>
                <label className="text-sm font-medium flex items-center gap-1" style={{ color: colors.dark }}>
                  <Settings2 className="w-4 h-4" /> Parameters
                </label>
                <p className="text-xs mb-2" style={{ color: colors.slate }}>
                  Voeg variabelen toe die in de formule worden gebruikt
                </p>
                {Object.entries(newFormula.parameters).length > 0 && (
                  <div className="space-y-2 mb-3">
                    {Object.entries(newFormula.parameters).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 p-2 rounded border" style={{ backgroundColor: colors.warmWhite }}>
                        <span className="text-sm font-medium w-32" style={{ color: colors.dark }}>
                          {parameterLabels[key] || key}
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          value={value}
                          onChange={(e) => updateParameter('new', key, e.target.value)}
                          className="w-24"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => removeParameter(key, 'new')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newParamKey}
                    onChange={(e) => setNewParamKey(e.target.value)}
                    placeholder="Parameter naam"
                    className="w-40"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={newParamValue}
                    onChange={(e) => setNewParamValue(e.target.value)}
                    placeholder="Waarde"
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addParameter('new')}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={addFormula}
                  disabled={saving}
                  style={{ backgroundColor: colors.orange, color: colors.warmWhite }}
                >
                  {saving ? 'Opslaan...' : 'Toevoegen'}
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Annuleren
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulas List */}
        {Object.entries(groupedFormulas).map(([category, categoryFormulas]) => {
          const categoryInfo = categories.find((c) => c.value === category);
          return (
            <Card key={category}>
              <CardHeader className="border-b" style={{ backgroundColor: colors.stone }}>
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: colors.dark }}>
                  {categoryInfo?.label || category}
                  <span className="text-sm font-normal" style={{ color: colors.slate }}>
                    ({categoryFormulas.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {categoryFormulas.map((formula) => (
                    <div
                      key={formula.id}
                      className="p-4"
                      style={!formula.is_active ? { opacity: 0.5, backgroundColor: colors.stone } : {}}
                    >
                      {editingFormula?.id === formula.id ? (
                        // Edit mode
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              value={editingFormula.formula_name}
                              onChange={(e) =>
                                setEditingFormula({ ...editingFormula, formula_name: e.target.value })
                              }
                              placeholder="Naam"
                            />
                            <Input
                              value={editingFormula.formula_expression}
                              onChange={(e) =>
                                setEditingFormula({ ...editingFormula, formula_expression: e.target.value })
                              }
                              placeholder="Formule"
                              className="font-mono"
                            />
                          </div>

                          <div>
                            <Input
                              value={editingFormula.description || ''}
                              onChange={(e) =>
                                setEditingFormula({ ...editingFormula, description: e.target.value })
                              }
                              placeholder="Beschrijving"
                            />
                          </div>

                          {/* Edit parameters */}
                          <div>
                            <label className="text-sm font-medium" style={{ color: colors.dark }}>Parameters</label>
                            <div className="space-y-2 mt-2">
                              {Object.entries(editingFormula.parameters || {}).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2 p-2 rounded border" style={{ backgroundColor: colors.stone }}>
                                  <span className="text-sm font-medium w-32" style={{ color: colors.dark }}>
                                    {parameterLabels[key] || key}
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={value}
                                    onChange={(e) => updateParameter(formula, key, e.target.value)}
                                    className="w-24"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600"
                                    onClick={() => removeParameter(key, 'edit')}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Input
                                value={newParamKey}
                                onChange={(e) => setNewParamKey(e.target.value)}
                                placeholder="Nieuwe parameter"
                                className="w-40"
                              />
                              <Input
                                type="number"
                                step="0.01"
                                value={newParamValue}
                                onChange={(e) => setNewParamValue(e.target.value)}
                                placeholder="Waarde"
                                className="w-24"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addParameter('edit')}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateFormula(formula.id, editingFormula)}
                              disabled={saving}
                              style={{ backgroundColor: colors.orange, color: colors.warmWhite }}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              {saving ? 'Opslaan...' : 'Opslaan'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingFormula(null)}
                            >
                              Annuleren
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium" style={{ color: colors.dark }}>{formula.formula_name}</h3>
                              {formula.user_id === null && (
                                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: colors.blueLight, color: colors.blue }}>
                                  Standaard
                                </span>
                              )}
                            </div>
                            {formula.description && (
                              <p className="text-sm mt-0.5" style={{ color: colors.slate }}>{formula.description}</p>
                            )}
                            <div className="mt-2 text-sm">
                              <code className="px-2 py-1 rounded font-mono" style={{ backgroundColor: colors.mist, color: colors.dark }}>
                                {formatExpression(formula.formula_expression)}
                              </code>
                              <span className="ml-2" style={{ color: colors.slate }}>→ {formula.result_unit}</span>
                            </div>
                            {formula.parameters && Object.keys(formula.parameters).length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {Object.entries(formula.parameters).map(([key, value]) => (
                                  <span
                                    key={key}
                                    className="text-xs px-2 py-1 rounded"
                                    style={{ backgroundColor: colors.blueLight, color: colors.blue }}
                                  >
                                    {parameterLabels[key] || key}: {value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingFormula(formula)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteFormula(formula.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {formulas.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center" style={{ color: colors.slate }}>
              <Calculator className="w-12 h-12 mx-auto mb-4" style={{ color: colors.mist }} />
              <p>Nog geen formules gedefinieerd</p>
              <Button
                className="mt-4"
                onClick={() => setShowAddForm(true)}
                style={{ backgroundColor: colors.orange, color: colors.warmWhite }}
              >
                Eerste formule toevoegen
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
