'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Link2,
  Plus,
  Trash2,
  ChevronLeft,
  Package,
  Wrench,
  Calculator,
  Check,
  X
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

interface WorkRule {
  id: string;
  activity_name: string;
  category: string;
}

interface Pricing {
  id: string;
  item_name: string;
  unit: string;
  selling_price_default: number;
}

interface Formula {
  id: string;
  formula_name: string;
  formula_expression: string;
}

interface MaterialLink {
  id: string;
  work_rule_id: string;
  pricing_id: string | null;
  material_name: string;
  calculation_formula_id: string | null;
  custom_formula: string | null;
  default_unit: string | null;
  is_enabled: boolean;
  work_rules: WorkRule;
  pricing: Pricing | null;
  calculation_formulas: Formula | null;
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

export default function KoppelingenPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [links, setLinks] = useState<MaterialLink[]>([]);
  const [workRules, setWorkRules] = useState<WorkRule[]>([]);
  const [materials, setMaterials] = useState<Pricing[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({
    work_rule_id: '',
    pricing_id: '',
    formula_id: '',
    custom_formula: '',
    default_unit: '',
    is_enabled: true,
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const [linksRes, rulesRes, pricingRes, formulasRes] = await Promise.all([
        fetch('/api/admin/material-links'),
        fetch('/api/admin/work-rules'),
        fetch('/api/admin/pricing?type=materiaal'),
        fetch('/api/admin/formulas'),
      ]);

      if (linksRes.ok) {
        const data = await linksRes.json();
        setLinks(data.links || []);
      }
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setWorkRules(data.rules || []);
      }
      if (pricingRes.ok) {
        const data = await pricingRes.json();
        setMaterials(data.items || []);
      }
      if (formulasRes.ok) {
        const data = await formulasRes.json();
        setFormulas(data.formulas || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLink = async () => {
    if (!newLink.work_rule_id || !newLink.pricing_id) {
      alert('Selecteer een arbeidsregel en materiaal');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/material-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_rule_id: newLink.work_rule_id,
          pricing_id: newLink.pricing_id || null,
          formula_id: newLink.formula_id || null,
          custom_formula: newLink.custom_formula || null,
          default_unit: newLink.default_unit || null,
          is_enabled: newLink.is_enabled,
        }),
      });

      if (response.ok) {
        await fetchData();
        setNewLink({
          work_rule_id: '',
          pricing_id: '',
          formula_id: '',
          custom_formula: '',
          default_unit: '',
          is_enabled: true,
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding link:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteLink = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze koppeling wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/admin/material-links/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  const toggleEnabled = async (link: MaterialLink) => {
    try {
      const response = await fetch(`/api/admin/material-links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: !link.is_enabled }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating link:', error);
    }
  };

  // Group links by work rule
  const groupedLinks = links.reduce((acc, link) => {
    const ruleId = link.work_rule_id;
    if (!acc[ruleId]) {
      acc[ruleId] = {
        rule: link.work_rules,
        links: [],
      };
    }
    acc[ruleId].links.push(link);
    return acc;
  }, {} as Record<string, { rule: WorkRule; links: MaterialLink[] }>);

  // Get rules without links for empty state
  const rulesWithoutLinks = workRules.filter(
    (rule) => !links.some((link) => link.work_rule_id === rule.id)
  );

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
                <Link2 className="w-6 h-6" style={{ color: colors.orange }} />
                Materiaal Koppelingen
              </h1>
              <p style={{ color: colors.slate }}>
                Koppel materialen aan werkzaamheden voor automatische offerte-opbouw
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="gap-2"
            style={{ backgroundColor: colors.orange, color: colors.warmWhite }}
          >
            <Plus className="w-4 h-4" /> Nieuwe koppeling
          </Button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <Card className="border-2" style={{ borderColor: colors.orangeLight, backgroundColor: colors.orangeLight }}>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: colors.dark }}>Nieuwe koppeling toevoegen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-1" style={{ color: colors.dark }}>
                    <Wrench className="w-4 h-4" /> Arbeidsregel *
                  </label>
                  <select
                    value={newLink.work_rule_id}
                    onChange={(e) => setNewLink({ ...newLink, work_rule_id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option value="">Selecteer een arbeidsregel</option>
                    {workRules.map((rule) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.activity_name} ({categories.find(c => c.value === rule.category)?.label || rule.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1" style={{ color: colors.dark }}>
                    <Package className="w-4 h-4" /> Materiaal *
                  </label>
                  <select
                    value={newLink.pricing_id}
                    onChange={(e) => setNewLink({ ...newLink, pricing_id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option value="">Selecteer een materiaal</option>
                    {materials.map((mat) => (
                      <option key={mat.id} value={mat.id}>
                        {mat.item_name} (€{mat.selling_price_default?.toFixed(2)}/{mat.unit})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-1" style={{ color: colors.dark }}>
                    <Calculator className="w-4 h-4" /> Berekeningsformule
                  </label>
                  <select
                    value={newLink.formula_id}
                    onChange={(e) => setNewLink({ ...newLink, formula_id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option value="">Geen formule (handmatig)</option>
                    {formulas.map((formula) => (
                      <option key={formula.id} value={formula.id}>
                        {formula.formula_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: colors.dark }}>Standaard eenheid</label>
                  <Input
                    value={newLink.default_unit}
                    onChange={(e) => setNewLink({ ...newLink, default_unit: e.target.value })}
                    placeholder="bijv: m², stuks"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium" style={{ color: colors.dark }}>Custom formule (optioneel)</label>
                <Input
                  value={newLink.custom_formula}
                  onChange={(e) => setNewLink({ ...newLink, custom_formula: e.target.value })}
                  placeholder="bijv: area * 1.05 (voor 5% snijverlies)"
                  className="font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_enabled"
                  checked={newLink.is_enabled}
                  onChange={(e) => setNewLink({ ...newLink, is_enabled: e.target.checked })}
                  className="w-4 h-4 rounded"
                  style={{ borderColor: colors.mist }}
                />
                <label htmlFor="is_enabled" className="text-sm" style={{ color: colors.dark }}>
                  Koppeling actief (wordt gebruikt bij AI-analyse)
                </label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={addLink}
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

        {/* Links grouped by work rule */}
        {Object.entries(groupedLinks).map(([ruleId, { rule, links: ruleLinks }]) => {
          const categoryInfo = categories.find((c) => c.value === rule.category);
          return (
            <Card key={ruleId}>
              <CardHeader className="border-b" style={{ backgroundColor: colors.stone }}>
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: colors.dark }}>
                  <Wrench className="w-5 h-5" style={{ color: colors.blue }} />
                  {rule.activity_name}
                  <span className="text-sm font-normal" style={{ color: colors.slate }}>
                    {categoryInfo?.label || rule.category}
                  </span>
                  <span className="text-sm font-normal px-2 py-0.5 rounded ml-auto" style={{ backgroundColor: colors.successLight, color: colors.success }}>
                    {ruleLinks.length} materiaal{ruleLinks.length !== 1 && 'en'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {ruleLinks.map((link) => (
                    <div
                      key={link.id}
                      className="p-4 flex items-center justify-between"
                      style={!link.is_enabled ? { opacity: 0.5, backgroundColor: colors.stone } : {}}
                    >
                      <div className="flex items-center gap-4">
                        <Package className="w-5 h-5" style={{ color: colors.slate }} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium" style={{ color: colors.dark }}>
                              {link.material_name || link.pricing?.item_name || 'Onbekend materiaal'}
                            </span>
                            {link.is_enabled ? (
                              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: colors.successLight, color: colors.success }}>
                                Actief
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: colors.mist, color: colors.slate }}>
                                Inactief
                              </span>
                            )}
                          </div>
                          <div className="text-sm flex items-center gap-3" style={{ color: colors.slate }}>
                            {link.pricing && (
                              <span>
                                €{link.pricing.selling_price_default?.toFixed(2)} / {link.pricing.unit}
                              </span>
                            )}
                            {link.default_unit && (
                              <span style={{ color: colors.blue }}>
                                Eenheid: {link.default_unit}
                              </span>
                            )}
                            {link.calculation_formulas && (
                              <span className="flex items-center gap-1" style={{ color: colors.blue }}>
                                <Calculator className="w-3 h-3" />
                                {link.calculation_formulas.formula_name}
                              </span>
                            )}
                            {link.custom_formula && (
                              <code className="text-xs px-1 rounded" style={{ backgroundColor: colors.mist }}>
                                {link.custom_formula}
                              </code>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleEnabled(link)}
                          title={link.is_enabled ? 'Deactiveer' : 'Activeer'}
                        >
                          {link.is_enabled ? (
                            <Check className="w-4 h-4" style={{ color: colors.success }} />
                          ) : (
                            <X className="w-4 h-4" style={{ color: colors.slate }} />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteLink(link.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Empty rules */}
        {rulesWithoutLinks.length > 0 && (
          <Card className="border-dashed">
            <CardHeader className="border-b" style={{ backgroundColor: colors.stone }}>
              <CardTitle className="text-lg" style={{ color: colors.slate }}>
                Arbeidsregels zonder koppelingen
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {rulesWithoutLinks.map((rule) => (
                  <Button
                    key={rule.id}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      setNewLink({ ...newLink, work_rule_id: rule.id });
                      setShowAddForm(true);
                    }}
                  >
                    <Plus className="w-3 h-3" />
                    {rule.activity_name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {links.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center" style={{ color: colors.slate }}>
              <Link2 className="w-12 h-12 mx-auto mb-4" style={{ color: colors.mist }} />
              <p>Nog geen materiaal koppelingen gedefinieerd</p>
              <p className="text-sm mt-1" style={{ color: colors.slate }}>
                Koppel materialen aan werkzaamheden voor automatische offerte-opbouw
              </p>
              <Button
                className="mt-4"
                onClick={() => setShowAddForm(true)}
                style={{ backgroundColor: colors.orange, color: colors.warmWhite }}
              >
                Eerste koppeling toevoegen
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
