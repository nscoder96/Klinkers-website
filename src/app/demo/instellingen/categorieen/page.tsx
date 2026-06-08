'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDemoAuth } from '@/lib/useDemoAuth';
import DemoLayout from '@/components/demo/DemoLayout';
import {
  Folder, Plus, ChevronRight, ChevronDown,
  HelpCircle, Package, Calculator, Pencil, Trash2,
  GripVertical, Save, X, Settings, PlayCircle,
  Hammer, Mountain, LayoutGrid, Fence, Home, TreePine, MoreHorizontal
} from 'lucide-react';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Hammer, Mountain, LayoutGrid, Fence, Home, TreePine, MoreHorizontal, Folder
};

interface WorkCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  display_order: number;
  is_active: boolean;
}

interface CategoryQuestion {
  id: string;
  category_id: string;
  question_text: string;
  question_type: 'boolean' | 'number' | 'select' | 'text';
  options: string[] | null;
  default_value: string | null;
  variable_name: string;
  display_order: number;
  is_required: boolean;
  help_text: string | null;
}

interface CategoryMaterial {
  id: string;
  category_id: string;
  material_type: 'base' | 'extra';
  is_required: boolean;
  quantity_formula: string | null;
  display_order: number;
  notes: string | null;
  material_name: string | null;
  material_unit: string | null;
  material_price: number | null;
}

interface CategoryRule {
  id: string;
  category_id: string;
  rule_name: string;
  description: string | null;
  quantity_formula: string;
  condition_formula: string | null;
  display_order: number;
  is_active: boolean;
  material_name: string | null;
}

type TabType = 'questions' | 'materials' | 'rules';

export default function CategorieenPage() {
  const { isAuthenticated, isLoading: authLoading } = useDemoAuth();
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('questions');

  // Category detail data
  const [questions, setQuestions] = useState<CategoryQuestion[]>([]);
  const [materials, setMaterials] = useState<CategoryMaterial[]>([]);
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/demo/work-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryDetails = async (categoryId: string) => {
    setLoadingDetails(true);
    try {
      const [questionsRes, materialsRes, rulesRes] = await Promise.all([
        fetch(`/api/demo/work-categories/${categoryId}/questions`),
        fetch(`/api/demo/work-categories/${categoryId}/materials`),
        fetch(`/api/demo/work-categories/${categoryId}/rules`)
      ]);

      if (questionsRes.ok) {
        const data = await questionsRes.json();
        setQuestions(data.questions || []);
      }
      if (materialsRes.ok) {
        const data = await materialsRes.json();
        setMaterials(data.materials || []);
      }
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error('Error fetching category details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
      fetchCategoryDetails(categoryId);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Folder;
    return IconComponent;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full animate-ping opacity-20" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center">
              <PlayCircle className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-slate-600 font-medium">Categorieën laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DemoLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Werk Categorieën</h1>
            <p className="text-gray-500">Beheer categorieën, vragen, materialen en rekenregels voor offertes</p>
          </div>
          <Button className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" /> Nieuwe categorie
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-900">Slim Offerte Systeem</h3>
                <p className="text-sm text-orange-700 mt-1">
                  Configureer hier de categorieën voor je offertes. Elke categorie heeft vragen om te stellen,
                  standaard materialen, en rekenregels voor automatische berekeningen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories List */}
        <div className="space-y-4">
          {categories.map((category) => {
            const isExpanded = expandedCategory === category.id;
            const IconComponent = getCategoryIcon(category.icon);

            return (
              <Card key={category.id} className={isExpanded ? 'ring-2 ring-orange-500' : ''}>
                <CardHeader
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isExpanded ? 'bg-orange-100' : 'bg-gray-100'}`}>
                        <IconComponent className={`w-5 h-5 ${isExpanded ? 'text-orange-600' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2 text-sm text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {questions.filter(q => q.category_id === category.id).length || '?'} vragen
                        </span>
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {materials.filter(m => m.category_id === category.id).length || '?'} materialen
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t bg-gray-50">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-4 pt-4">
                      <Button
                        variant={activeTab === 'questions' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveTab('questions')}
                        className={activeTab === 'questions' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                      >
                        <HelpCircle className="w-4 h-4 mr-1" /> Vragen ({questions.length})
                      </Button>
                      <Button
                        variant={activeTab === 'materials' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveTab('materials')}
                        className={activeTab === 'materials' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                      >
                        <Package className="w-4 h-4 mr-1" /> Materialen ({materials.length})
                      </Button>
                      <Button
                        variant={activeTab === 'rules' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveTab('rules')}
                        className={activeTab === 'rules' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                      >
                        <Calculator className="w-4 h-4 mr-1" /> Regels ({rules.length})
                      </Button>
                    </div>

                    {loadingDetails ? (
                      <div className="py-8 text-center text-gray-500">
                        <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2" />
                        Laden...
                      </div>
                    ) : (
                      <>
                        {/* Questions Tab */}
                        {activeTab === 'questions' && (
                          <div className="space-y-3">
                            {questions.length === 0 ? (
                              <p className="text-gray-500 py-4 text-center">Geen vragen geconfigureerd</p>
                            ) : (
                              questions.map((question) => (
                                <div key={question.id} className="bg-white p-4 rounded-lg border flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 text-xs rounded ${
                                        question.question_type === 'boolean' ? 'bg-blue-100 text-blue-700' :
                                        question.question_type === 'number' ? 'bg-green-100 text-green-700' :
                                        question.question_type === 'select' ? 'bg-purple-100 text-purple-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {question.question_type}
                                      </span>
                                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                        {'{' + question.variable_name + '}'}
                                      </code>
                                    </div>
                                    <p className="font-medium mt-1">{question.question_text}</p>
                                    {question.help_text && (
                                      <p className="text-sm text-gray-500 mt-1">{question.help_text}</p>
                                    )}
                                    {question.options && (
                                      <div className="flex gap-1 mt-2 flex-wrap">
                                        {(typeof question.options === 'string'
                                          ? JSON.parse(question.options)
                                          : question.options
                                        ).map((opt: string, i: number) => (
                                          <span key={i} className="bg-gray-100 text-xs px-2 py-1 rounded">
                                            {opt}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="sm">
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                            <Button variant="outline" size="sm" className="w-full mt-2">
                              <Plus className="w-4 h-4 mr-1" /> Vraag toevoegen
                            </Button>
                          </div>
                        )}

                        {/* Materials Tab */}
                        {activeTab === 'materials' && (
                          <div className="space-y-3">
                            {materials.length === 0 ? (
                              <p className="text-gray-500 py-4 text-center">Geen materialen geconfigureerd</p>
                            ) : (
                              materials.map((material) => (
                                <div key={material.id} className="bg-white p-4 rounded-lg border flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 text-xs rounded ${
                                        material.material_type === 'base' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {material.material_type === 'base' ? 'Standaard' : 'Extra'}
                                      </span>
                                      {material.is_required && (
                                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">Verplicht</span>
                                      )}
                                    </div>
                                    <p className="font-medium mt-1">
                                      {material.material_name || 'Onbekend materiaal'}
                                    </p>
                                    {material.quantity_formula && (
                                      <p className="text-sm text-gray-500 mt-1">
                                        Formule: <code className="bg-gray-100 px-2 py-0.5 rounded">{material.quantity_formula}</code>
                                      </p>
                                    )}
                                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                      {material.material_unit && <span>Eenheid: {material.material_unit}</span>}
                                      {material.material_price && <span>Prijs: €{Number(material.material_price).toFixed(2)}</span>}
                                    </div>
                                    {material.notes && (
                                      <p className="text-sm text-gray-400 mt-1 italic">{material.notes}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="sm">
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                            <Button variant="outline" size="sm" className="w-full mt-2">
                              <Plus className="w-4 h-4 mr-1" /> Materiaal toevoegen
                            </Button>
                          </div>
                        )}

                        {/* Rules Tab */}
                        {activeTab === 'rules' && (
                          <div className="space-y-3">
                            {rules.length === 0 ? (
                              <p className="text-gray-500 py-4 text-center">Geen rekenregels geconfigureerd</p>
                            ) : (
                              rules.map((rule) => (
                                <div key={rule.id} className="bg-white p-4 rounded-lg border flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 text-xs rounded ${
                                        rule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                      }`}>
                                        {rule.is_active ? 'Actief' : 'Inactief'}
                                      </span>
                                    </div>
                                    <p className="font-medium mt-1">{rule.rule_name}</p>
                                    {rule.description && (
                                      <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                                    )}
                                    <div className="mt-2 space-y-1">
                                      {rule.condition_formula && (
                                        <p className="text-sm">
                                          <span className="text-gray-500">Als:</span>{' '}
                                          <code className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{rule.condition_formula}</code>
                                        </p>
                                      )}
                                      <p className="text-sm">
                                        <span className="text-gray-500">Dan:</span>{' '}
                                        <code className="bg-green-50 text-green-700 px-2 py-0.5 rounded">{rule.quantity_formula}</code>
                                        {rule.material_name && (
                                          <span className="text-gray-500"> × {rule.material_name}</span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="sm">
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                            <Button variant="outline" size="sm" className="w-full mt-2">
                              <Plus className="w-4 h-4 mr-1" /> Regel toevoegen
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {categories.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Geen categorieën gevonden</p>
              <Button className="mt-4 bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" /> Eerste categorie aanmaken
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DemoLayout>
  );
}
