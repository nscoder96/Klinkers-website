'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Wrench,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronLeft,
  Sparkles,
  Link as LinkIcon
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

interface LinkedTask {
  name: string;
  enabled: boolean;
  unit?: string;
  formula?: string;
}

interface WorkRule {
  id: string;
  tenant_id: string | null;
  activity_name: string;
  activity_slug: string;
  category: string;
  unit_price: number | null;
  hourly_rate: number | null;
  hours_per_unit: number | null;
  default_unit: string;
  linked_tasks: LinkedTask[];
  is_active: boolean;
}

const categories = [
  { value: 'grondwerk', label: 'Grondwerk' },
  { value: 'bestrating', label: 'Bestrating' },
  { value: 'erfafscheiding', label: 'Erfafscheiding' },
  { value: 'gazon', label: 'Gazon' },
  { value: 'beplanting', label: 'Beplanting' },
  { value: 'overkapping', label: 'Overkapping' },
  { value: 'tuinhuis', label: 'Tuinhuis' },
  { value: 'onderhoud', label: 'Onderhoud' },
  { value: 'overig', label: 'Overig' },
];

const units = ['m²', 'm³', 'm', 'stuks', 'uur', 'dag'];

export default function ArbeidsregelsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [rules, setRules] = useState<WorkRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkRule | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState({
    activity_name: '',
    category: 'grondwerk',
    unit_price: '',
    hourly_rate: '',
    hours_per_unit: '',
    default_unit: 'm²',
    linked_tasks: [] as LinkedTask[],
  });
  const [newTaskName, setNewTaskName] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchRules();
    }
  }, [isAuthenticated]);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/admin/work-rules');
      if (response.ok) {
        const data = await response.json();
        setRules(data.rules);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRule = async () => {
    if (!newRule.activity_name.trim()) {
      alert('Vul een naam in');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/work-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });

      if (response.ok) {
        await fetchRules();
        setNewRule({
          activity_name: '',
          category: 'grondwerk',
          unit_price: '',
          hourly_rate: '',
          hours_per_unit: '',
          default_unit: 'm²',
          linked_tasks: [],
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateRule = async (id: string, updates: Partial<WorkRule>) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/work-rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchRules();
        setEditingRule(null);
      }
    } catch (error) {
      console.error('Error updating rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze regel wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/admin/work-rules/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const addLinkedTask = (toRule: 'new' | WorkRule) => {
    if (!newTaskName.trim()) return;

    const task: LinkedTask = { name: newTaskName, enabled: true };

    if (toRule === 'new') {
      setNewRule({
        ...newRule,
        linked_tasks: [...newRule.linked_tasks, task],
      });
    } else if (editingRule) {
      setEditingRule({
        ...editingRule,
        linked_tasks: [...(editingRule.linked_tasks || []), task],
      });
    }
    setNewTaskName('');
  };

  const toggleLinkedTask = (rule: WorkRule, taskIndex: number) => {
    const tasks = [...(rule.linked_tasks || [])];
    tasks[taskIndex].enabled = !tasks[taskIndex].enabled;

    if (editingRule?.id === rule.id) {
      setEditingRule({ ...editingRule, linked_tasks: tasks });
    }
  };

  const removeLinkedTask = (taskIndex: number, from: 'new' | 'edit') => {
    if (from === 'new') {
      setNewRule({
        ...newRule,
        linked_tasks: newRule.linked_tasks.filter((_, i) => i !== taskIndex),
      });
    } else if (editingRule) {
      setEditingRule({
        ...editingRule,
        linked_tasks: editingRule.linked_tasks.filter((_, i) => i !== taskIndex),
      });
    }
  };

  // Group rules by category
  const groupedRules = rules.reduce((acc, rule) => {
    if (!acc[rule.category]) acc[rule.category] = [];
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, WorkRule[]>);

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
                <Wrench className="w-6 h-6" style={{ color: colors.blue }} />
                Arbeidsregels
              </h1>
              <p style={{ color: colors.slate }}>
                Definieer werkzaamheden met gekoppelde taken voor automatische offerte-opbouw
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="gap-2"
            style={{ backgroundColor: colors.orange, color: colors.warmWhite }}
          >
            <Plus className="w-4 h-4" /> Nieuwe regel
          </Button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <Card className="border-2" style={{ borderColor: colors.orangeLight, backgroundColor: colors.orangeLight }}>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: colors.dark }}>Nieuwe arbeidsregel toevoegen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium" style={{ color: colors.dark }}>Naam *</label>
                  <Input
                    value={newRule.activity_name}
                    onChange={(e) => setNewRule({ ...newRule, activity_name: e.target.value })}
                    placeholder="Bijv: Schutting plaatsen"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: colors.dark }}>Categorie</label>
                  <select
                    value={newRule.category}
                    onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: colors.dark }}>Eenheid</label>
                  <select
                    value={newRule.default_unit}
                    onChange={(e) => setNewRule({ ...newRule, default_unit: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium" style={{ color: colors.dark }}>Prijs per eenheid</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newRule.unit_price}
                    onChange={(e) => setNewRule({ ...newRule, unit_price: e.target.value })}
                    placeholder="€"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: colors.dark }}>Uurtarief (optioneel)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newRule.hourly_rate}
                    onChange={(e) => setNewRule({ ...newRule, hourly_rate: e.target.value })}
                    placeholder="€"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: colors.dark }}>Uren per eenheid</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newRule.hours_per_unit}
                    onChange={(e) => setNewRule({ ...newRule, hours_per_unit: e.target.value })}
                    placeholder="bijv. 0.5"
                  />
                </div>
              </div>

              {/* Linked Tasks */}
              <div>
                <label className="text-sm font-medium flex items-center gap-1" style={{ color: colors.dark }}>
                  <LinkIcon className="w-4 h-4" /> Gekoppelde taken
                </label>
                <p className="text-xs mb-2" style={{ color: colors.slate }}>
                  Deze taken worden automatisch toegevoegd wanneer deze werkzaamheid wordt gedetecteerd
                </p>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Taak naam"
                    onKeyDown={(e) => e.key === 'Enter' && addLinkedTask('new')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addLinkedTask('new')}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {newRule.linked_tasks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newRule.linked_tasks.map((task, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm"
                        style={{ backgroundColor: colors.blueLight, color: colors.blue }}
                      >
                        {task.name}
                        <button
                          onClick={() => removeLinkedTask(idx, 'new')}
                          className="hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={addRule}
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

        {/* Rules List */}
        {Object.entries(groupedRules).map(([category, categoryRules]) => {
          const categoryInfo = categories.find((c) => c.value === category);
          return (
            <Card key={category}>
              <CardHeader className="border-b" style={{ backgroundColor: colors.stone }}>
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: colors.dark }}>
                  {categoryInfo?.label || category}
                  <span className="text-sm font-normal" style={{ color: colors.slate }}>
                    ({categoryRules.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {categoryRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-4"
                      style={!rule.is_active ? { opacity: 0.5, backgroundColor: colors.stone } : {}}
                    >
                      {editingRule?.id === rule.id ? (
                        // Edit mode
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                              value={editingRule.activity_name}
                              onChange={(e) =>
                                setEditingRule({ ...editingRule, activity_name: e.target.value })
                              }
                            />
                            <Input
                              type="number"
                              step="0.01"
                              value={editingRule.unit_price || ''}
                              onChange={(e) =>
                                setEditingRule({
                                  ...editingRule,
                                  unit_price: e.target.value ? parseFloat(e.target.value) : null,
                                })
                              }
                              placeholder="Prijs per eenheid"
                            />
                            <select
                              value={editingRule.default_unit}
                              onChange={(e) =>
                                setEditingRule({ ...editingRule, default_unit: e.target.value })
                              }
                              className="px-3 py-2 border rounded-md"
                            >
                              {units.map((unit) => (
                                <option key={unit} value={unit}>{unit}</option>
                              ))}
                            </select>
                          </div>

                          {/* Edit linked tasks */}
                          <div>
                            <label className="text-sm font-medium" style={{ color: colors.dark }}>Gekoppelde taken</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {(editingRule.linked_tasks || []).map((task, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm cursor-pointer"
                                  style={task.enabled
                                    ? { backgroundColor: colors.blueLight, color: colors.blue }
                                    : { backgroundColor: colors.mist, color: colors.slate, textDecoration: 'line-through' }
                                  }
                                  onClick={() => toggleLinkedTask(editingRule, idx)}
                                >
                                  {task.name}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeLinkedTask(idx, 'edit');
                                    }}
                                    className="hover:text-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Input
                                value={newTaskName}
                                onChange={(e) => setNewTaskName(e.target.value)}
                                placeholder="Nieuwe taak"
                                className="w-48"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addLinkedTask(editingRule)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateRule(rule.id, editingRule)}
                              disabled={saving}
                              style={{ backgroundColor: colors.orange, color: colors.warmWhite }}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              {saving ? 'Opslaan...' : 'Opslaan'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingRule(null)}
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
                              <h3 className="font-medium" style={{ color: colors.dark }}>{rule.activity_name}</h3>
                              {rule.tenant_id === null && (
                                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: colors.blueLight, color: colors.blue }}>
                                  Standaard
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm" style={{ color: colors.slate }}>
                              <span>
                                {rule.unit_price ? `€${rule.unit_price.toFixed(2)}` : '-'} / {rule.default_unit}
                              </span>
                              {rule.hourly_rate && (
                                <span style={{ color: colors.mist }}>
                                  (€{rule.hourly_rate.toFixed(2)}/uur)
                                </span>
                              )}
                            </div>
                            {rule.linked_tasks && rule.linked_tasks.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {rule.linked_tasks
                                  .filter((t) => t.enabled)
                                  .map((task, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-0.5 rounded"
                                      style={{ backgroundColor: colors.mist, color: colors.slate }}
                                    >
                                      {task.name}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingRule(rule)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteRule(rule.id)}
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

        {rules.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center" style={{ color: colors.slate }}>
              <Wrench className="w-12 h-12 mx-auto mb-4" style={{ color: colors.mist }} />
              <p>Nog geen arbeidsregels gedefinieerd</p>
              <Button
                className="mt-4"
                onClick={() => setShowAddForm(true)}
                style={{ backgroundColor: colors.orange, color: colors.warmWhite }}
              >
                Eerste regel toevoegen
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
