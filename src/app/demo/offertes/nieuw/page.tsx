'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDemoAuth } from '@/lib/useDemoAuth';
import DemoLayout from '@/components/demo/DemoLayout';
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Loader2,
  FileText, User, ClipboardList, Calculator, Send,
  Hammer, LayoutGrid, Fence, TreePine, Shovel, HelpCircle,
  Plus, Trash2, Edit2
} from 'lucide-react';
import { calculateQuote, calculateTotals, QuoteSection } from '@/lib/quote-calculator';

interface Lead {
  id: string;
  name: string;
  address: string;
  city: string;
}

interface AnalysisResult {
  werkzaamheden: {
    type: string;
    beschrijving: string;
    variabelen: Record<string, number | string | boolean>;
  }[];
  ontbrekende_info: {
    vraag: string;
    type: 'boolean' | 'number' | 'select';
    variabele: string;
    opties?: string[];
    default?: string | number | boolean;
  }[];
  samenvatting: string;
}

type Step = 'klant' | 'notities' | 'vragen' | 'offerte';

const WERK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sloopwerk: Hammer,
  bestrating: LayoutGrid,
  schutting: Fence,
  beplanting: TreePine,
  grondwerk: Shovel,
  overig: HelpCircle,
};

export default function NieuweOffertePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useDemoAuth();

  // State
  const [step, setStep] = useState<Step>('klant');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [quoteSections, setQuoteSections] = useState<QuoteSection[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch leads
  useEffect(() => {
    if (isAuthenticated) {
      fetchLeads();
    }
  }, [isAuthenticated]);

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/demo/leads');
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  // Analyze notes
  const analyzeNotes = async () => {
    if (!notes.trim()) return;

    setAnalyzing(true);
    try {
      const response = await fetch('/api/demo/analyze-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);

        // Set default answers
        const defaultAnswers: Record<string, any> = {};
        data.analysis.ontbrekende_info?.forEach((q: any) => {
          if (q.default !== undefined) {
            defaultAnswers[q.variabele] = q.default;
          }
        });
        setAnswers(defaultAnswers);

        setStep('vragen');
      } else {
        alert('Er ging iets mis bij het analyseren');
      }
    } catch (error) {
      console.error('Error analyzing:', error);
      alert('Er ging iets mis bij het analyseren');
    } finally {
      setAnalyzing(false);
    }
  };

  // Generate quote
  const generateQuote = () => {
    if (!analysis) return;

    const sections = calculateQuote({
      werkzaamheden: analysis.werkzaamheden.map((w) => ({
        type: w.type as any,
        description: w.beschrijving,
        variables: w.variabelen,
      })),
      answers,
    });

    setQuoteSections(sections);
    setStep('offerte');
  };

  // Update item
  const updateItem = (sectionIndex: number, itemIndex: number, field: string, value: number) => {
    const newSections = [...quoteSections];
    const item = newSections[sectionIndex].items[itemIndex];

    if (field === 'quantity') {
      item.quantity = value;
      item.total = value * item.unitPrice;
      item.isAutoCalculated = false;
    } else if (field === 'unitPrice') {
      item.unitPrice = value;
      item.total = item.quantity * value;
      item.isAutoCalculated = false;
    }

    // Recalculate section subtotal
    newSections[sectionIndex].subtotal = newSections[sectionIndex].items.reduce(
      (sum, i) => sum + i.total,
      0
    );

    setQuoteSections(newSections);
  };

  // Delete item
  const deleteItem = (sectionIndex: number, itemIndex: number) => {
    const newSections = [...quoteSections];
    newSections[sectionIndex].items.splice(itemIndex, 1);
    newSections[sectionIndex].subtotal = newSections[sectionIndex].items.reduce(
      (sum, i) => sum + i.total,
      0
    );
    setQuoteSections(newSections);
  };

  // Save quote
  const saveQuote = async () => {
    if (!selectedLead) return;

    setSaving(true);
    try {
      const totals = calculateTotals(quoteSections);

      const lineItems = quoteSections.flatMap((section) =>
        section.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          total: item.total,
          category: section.name,
        }))
      );

      const response = await fetch('/api/demo/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          project_description: analysis?.samenvatting || notes.substring(0, 200),
          project_address: `${selectedLead.address}, ${selectedLead.city}`,
          line_items: lineItems,
          subtotal: totals.subtotal,
          btw_percentage: totals.btwPercentage,
          btw_amount: totals.btwAmount,
          total: totals.total,
          status: 'draft',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/demo/offertes/${data.quote.id}`);
      } else {
        alert('Er ging iets mis bij het opslaan');
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Er ging iets mis bij het opslaan');
    } finally {
      setSaving(false);
    }
  };

  // Filter leads
  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totals = quoteSections.length > 0 ? calculateTotals(quoteSections) : null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DemoLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-orange-500" />
            Slimme Offerte Maken
          </h1>
          <p className="text-gray-500">AI helpt je bij het opstellen van een complete offerte</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {[
            { id: 'klant', label: 'Klant', icon: User },
            { id: 'notities', label: 'Notities', icon: ClipboardList },
            { id: 'vragen', label: 'Details', icon: HelpCircle },
            { id: 'offerte', label: 'Offerte', icon: FileText },
          ].map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isPast =
              (step === 'notities' && s.id === 'klant') ||
              (step === 'vragen' && ['klant', 'notities'].includes(s.id)) ||
              (step === 'offerte' && ['klant', 'notities', 'vragen'].includes(s.id));

            return (
              <div key={s.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-orange-100 text-orange-700'
                      : isPast
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isPast ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                </div>
                {i < 3 && <ArrowRight className="w-4 h-4 text-gray-300 mx-1" />}
              </div>
            );
          })}
        </div>

        {/* Step: Klant selecteren */}
        {step === 'klant' && (
          <Card>
            <CardHeader>
              <CardTitle>Selecteer klant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Zoek op naam of adres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div className="max-h-80 overflow-y-auto space-y-2">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedLead?.id === lead.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                    }`}
                  >
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-gray-500">
                      {lead.address}, {lead.city}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep('notities')}
                  disabled={!selectedLead}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Volgende <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Notities */}
        {step === 'notities' && (
          <Card>
            <CardHeader>
              <CardTitle>Notities van de schouw</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-700">
                  <strong>Tip:</strong> Beschrijf wat je hebt gezien en afgesproken. Vermeld
                  afmetingen (bijv. &quot;tuin 8x6m&quot;), materialen, en bijzonderheden.
                </p>
              </div>

              <textarea
                className="w-full h-48 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Bijv: Achtertuin 8x6m, oude tegels eruit, nieuwe antraciet waaltjes. Schutting achter vervangen, 12 meter, met looppoort. Boom links moet weg..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('klant')}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Terug
                </Button>
                <Button
                  onClick={analyzeNotes}
                  disabled={!notes.trim() || analyzing}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyseren...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" /> Analyseer & Maak Offerte
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Vragen beantwoorden */}
        {step === 'vragen' && analysis && (
          <div className="space-y-6">
            {/* Samenvatting */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <Check className="w-5 h-5" /> Herkende werkzaamheden
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.werkzaamheden.map((werk, i) => {
                    const Icon = WERK_ICONS[werk.type] || HelpCircle;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg">
                          <Icon className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{werk.type}</p>
                          <p className="text-sm text-gray-600">{werk.beschrijving}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Object.entries(werk.variabelen).map(([key, val]) => (
                              <span
                                key={key}
                                className="text-xs bg-white px-2 py-1 rounded border"
                              >
                                {key.replace(/_/g, ' ')}: <strong>{String(val)}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Vragen */}
            {analysis.ontbrekende_info && analysis.ontbrekende_info.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-orange-500" />
                    Nog een paar vragen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.ontbrekende_info.map((vraag, i) => (
                    <div key={i} className="space-y-2">
                      <label className="font-medium">{vraag.vraag}</label>

                      {vraag.type === 'boolean' && (
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={vraag.variabele}
                              checked={answers[vraag.variabele] === true}
                              onChange={() =>
                                setAnswers({ ...answers, [vraag.variabele]: true })
                              }
                              className="text-orange-600"
                            />
                            Ja
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={vraag.variabele}
                              checked={answers[vraag.variabele] === false}
                              onChange={() =>
                                setAnswers({ ...answers, [vraag.variabele]: false })
                              }
                              className="text-orange-600"
                            />
                            Nee
                          </label>
                        </div>
                      )}

                      {vraag.type === 'number' && (
                        <Input
                          type="number"
                          value={answers[vraag.variabele] || ''}
                          onChange={(e) =>
                            setAnswers({
                              ...answers,
                              [vraag.variabele]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-32"
                        />
                      )}

                      {vraag.type === 'select' && vraag.opties && (
                        <select
                          value={answers[vraag.variabele] || ''}
                          onChange={(e) =>
                            setAnswers({ ...answers, [vraag.variabele]: e.target.value })
                          }
                          className="w-full p-2 border rounded-lg"
                        >
                          {vraag.opties.map((optie) => (
                            <option key={optie} value={optie}>
                              {optie}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('notities')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Terug
              </Button>
              <Button onClick={generateQuote} className="bg-orange-600 hover:bg-orange-700">
                <Calculator className="w-4 h-4 mr-2" /> Genereer Offerte
              </Button>
            </div>
          </div>
        )}

        {/* Step: Offerte bekijken */}
        {step === 'offerte' && quoteSections.length > 0 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Offerte voor {selectedLead?.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {quoteSections.map((section, sIndex) => (
                  <div key={sIndex}>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      {(() => {
                        const Icon = WERK_ICONS[section.name.toLowerCase()] || HelpCircle;
                        return <Icon className="w-5 h-5 text-orange-600" />;
                      })()}
                      {section.name}
                      <span className="text-sm font-normal text-gray-500 ml-auto">
                        €{section.subtotal.toFixed(2)}
                      </span>
                    </h3>

                    <div className="space-y-2">
                      {section.items.map((item, iIndex) => (
                        <div
                          key={iIndex}
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg group"
                        >
                          <div className="flex-1">
                            <span className="font-medium">{item.description}</span>
                          </div>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(sIndex, iIndex, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            className="w-16 p-1 border rounded text-right"
                          />
                          <span className="text-gray-500 w-8">{item.unit}</span>
                          <span className="text-gray-400">×</span>
                          <div className="flex items-center">
                            <span className="text-gray-400">€</span>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateItem(sIndex, iIndex, 'unitPrice', parseFloat(e.target.value) || 0)
                              }
                              className="w-20 p-1 border rounded text-right"
                            />
                          </div>
                          <span className="text-gray-400">=</span>
                          <span className="font-medium w-24 text-right">
                            €{item.total.toFixed(2)}
                          </span>
                          <button
                            onClick={() => deleteItem(sIndex, iIndex)}
                            className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Totalen */}
                {totals && (
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotaal</span>
                      <span>€{totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>BTW {totals.btwPercentage}%</span>
                      <span>€{totals.btwAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold">
                      <span>Totaal</span>
                      <span>€{totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('vragen')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Terug
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={saveQuote}
                  disabled={saving}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opslaan...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" /> Opslaan als concept
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DemoLayout>
  );
}
