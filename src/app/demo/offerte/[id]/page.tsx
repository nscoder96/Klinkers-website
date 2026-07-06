'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useDemoAuth } from '@/lib/useDemoAuth';
import { Lightbulb, Ruler, ArrowLeft, FileEdit, Sparkles, PlayCircle } from 'lucide-react';
import { ProductPicker } from '@/components/quote/ProductPicker';
import type { PricingHierarchy } from '@/app/api/admin/pricing/hierarchy/route';

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string;
  project_type: string[] | null;
  description: string | null;
  estimated_m2: number | null;
}

interface PricingItem {
  id: string;
  category: string;
  item_name: string;
  unit: string;
  selling_price_default: number;
}

interface LineItem {
  id: string;
  pricing_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  reasoning?: string;
  is_new?: boolean;
  line_type?: 'materiaal' | 'arbeid';
  category?: string;
}

interface OfferteSection {
  id: string;
  element_title: string;
  category: string;
  items: LineItem[];
}

interface ExistingQuote {
  id: string;
  quote_number: string;
  project_description: string | null;
  project_address: string | null;
  valid_until: string | null;
  line_items: LineItem[];
  subtotal: number;
  btw_percentage: number;
  btw_amount: number;
  total: number;
  customer_notes: string | null;
  status: string;
}

export default function DemoOfferteMaker() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = params.id as string;
  const quoteId = searchParams.get('quoteId');
  const { isAuthenticated, isLoading: authLoading } = useDemoAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [sections, setSections] = useState<OfferteSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Editing mode state
  const [existingQuote, setExistingQuote] = useState<ExistingQuote | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [pricingHierarchy, setPricingHierarchy] = useState<PricingHierarchy>({});
  const [projectDescription, setProjectDescription] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [validDays, setValidDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [kladNotities, setKladNotities] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [leadId, quoteId, isAuthenticated]);

  const fetchData = async () => {
    try {
      // Build fetch requests array
      const fetchPromises: Promise<Response>[] = [
        fetch('/api/demo/leads'),
        fetch('/api/demo/pricing'),
        fetch('/api/admin/pricing/hierarchy?type=materiaal')
      ];

      // If editing an existing quote, fetch it too
      if (quoteId) {
        fetchPromises.push(fetch(`/api/demo/quotes/${quoteId}`));
      }

      const responses = await Promise.all(fetchPromises);
      const [leadsRes, pricingRes, hierarchyRes, quoteRes] = responses;

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        const foundLead = leadsData.leads.find((l: Lead) => l.id === leadId);
        if (foundLead) {
          setLead(foundLead);
          // Only set defaults if NOT editing
          if (!quoteId) {
            setProjectAddress(foundLead.address || `${foundLead.city}`);
            setProjectDescription(foundLead.description || '');
            if (foundLead.description) {
              setKladNotities(foundLead.description + (foundLead.estimated_m2 ? `\n\nGeschat: ${foundLead.estimated_m2} m2` : ''));
            }
          }
        }
      }

      if (pricingRes.ok) {
        const pricingData = await pricingRes.json();
        setPricing(pricingData.pricing);
      }

      if (hierarchyRes && hierarchyRes.ok) {
        const hierarchyData = await hierarchyRes.json();
        setPricingHierarchy(hierarchyData.hierarchy || {});
      }

      // Load existing quote data if editing
      if (quoteRes && quoteRes.ok) {
        const quoteData = await quoteRes.json();
        const quote = quoteData.quote;
        if (quote) {
          setExistingQuote(quote);
          setIsEditing(true);
          // Populate form with existing quote data
          setProjectDescription(quote.project_description || '');
          setProjectAddress(quote.project_address || '');
          setNotes(quote.customer_notes || '');
          // Load line items
          if (quote.line_items && Array.isArray(quote.line_items)) {
            setLineItems(quote.line_items.map((item: LineItem) => ({
              ...item,
              id: item.id || crypto.randomUUID(),
              total: item.quantity * item.unit_price
            })));
          }
          // Calculate valid days from valid_until
          if (quote.valid_until) {
            const validUntil = new Date(quote.valid_until);
            const now = new Date();
            const daysRemaining = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            setValidDays(Math.max(daysRemaining, 1));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeNotes = async () => {
    if (!kladNotities.trim()) {
      alert('Voer eerst notities in om te analyseren');
      return;
    }

    setAnalyzing(true);
    setAiAnalysis('');
    setAiSuggestions([]);

    try {
      // Zelfde geconsolideerde pipeline als admin: generate-v2 (zonder persist).
      const response = await fetch('/api/admin/quote/generate-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: kladNotities })
      });

      if (response.ok) {
        const data = await response.json();
        setAiAnalysis(data.ai?.summary || '');
        // Vlaggen zijn objecten { code, severity, message } (A3) — toon de tekst.
        setAiSuggestions(
          (data.pipeline?.flags || []).map(
            (f: { severity: string; message: string }) =>
              f.severity === 'blocking' ? `⛔ ${f.message}` : f.message
          )
        );
        if (data.ai?.summary) {
          setProjectDescription(data.ai.summary);
        }

        // Pipeline-secties (generate-v2) → demosecties; centen → euro's.
        const pipelineSections = (data.pipeline?.sections || []) as Array<{
          title: string;
          display_lines: Array<{
            description: string;
            line_type: string;
            quantity: number;
            unit: string;
            unit_price_cents: number | null;
            total_cents: number | null;
            pricing_id: string | null;
          }>;
        }>;

        const newSections: OfferteSection[] = pipelineSections
          .filter((s) => s.display_lines.length > 0)
          .map((s) => ({
            id: crypto.randomUUID(),
            element_title: s.title,
            category: 'overig',
            items: s.display_lines.map((line) => ({
              id: crypto.randomUUID(),
              pricing_id: line.pricing_id || '',
              description: line.description,
              quantity: line.quantity,
              unit: line.unit,
              unit_price: (line.unit_price_cents ?? 0) / 100,
              total: (line.total_cents ?? 0) / 100,
              line_type: (line.line_type === 'arbeid' ? 'arbeid' : 'materiaal') as 'materiaal' | 'arbeid',
              category: 'overig',
            })),
          }));
        setSections(newSections);
        setLineItems(newSections.flatMap(s => s.items));
      } else {
        const error = await response.json();
        alert('Analyse mislukt: ' + (error.error || 'Onbekende fout'));
      }
    } catch (error) {
      console.error('Error analyzing notes:', error);
      alert('Er ging iets mis bij de analyse');
    } finally {
      setAnalyzing(false);
    }
  };

  const addLineItem = (pricingItem: PricingItem) => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      pricing_id: pricingItem.id,
      description: pricingItem.item_name,
      quantity: 1,
      unit: pricingItem.unit,
      unit_price: Number(pricingItem.selling_price_default),
      total: Number(pricingItem.selling_price_default)
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: number | string) => {
    const updater = (item: LineItem) => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updated.total = updated.quantity * updated.unit_price;
        }
        return updated;
      }
      return item;
    };
    setLineItems(lineItems.map(updater));
    setSections(sections.map(s => ({ ...s, items: s.items.map(updater) })));
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
    setSections(sections
      .map(s => ({ ...s, items: s.items.filter(item => item.id !== id) }))
      .filter(s => s.items.length > 0)
    );
  };

  const handleProductSelect = (itemId: string, selected: { pricing_id: string; description: string; unit: string; unit_price: number }) => {
    const updater = (item: LineItem) => {
      if (item.id === itemId) {
        return {
          ...item,
          pricing_id: selected.pricing_id,
          description: selected.description,
          unit: selected.unit,
          unit_price: selected.unit_price,
          total: item.quantity * selected.unit_price,
        };
      }
      return item;
    };
    setLineItems(lineItems.map(updater));
    setSections(sections.map(s => ({ ...s, items: s.items.map(updater) })));
  };

  const handleAddNewProduct = async (itemId: string, newProduct: { item_name: string; unit: string; selling_price_default: number; category: string; subcategory: string }) => {
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: newProduct.item_name,
          category: newProduct.category,
          subcategory: newProduct.subcategory,
          unit: newProduct.unit,
          selling_price_default: newProduct.selling_price_default,
          item_type: 'materiaal',
          is_active: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const savedItem = data.pricing;

        // Update the line item with the new product
        handleProductSelect(itemId, {
          pricing_id: savedItem.id,
          description: savedItem.item_name,
          unit: savedItem.unit,
          unit_price: Number(savedItem.selling_price_default),
        });

        // Refresh hierarchy
        const hierarchyRes = await fetch('/api/admin/pricing/hierarchy?type=materiaal');
        if (hierarchyRes.ok) {
          const hierarchyData = await hierarchyRes.json();
          setPricingHierarchy(hierarchyData.hierarchy || {});
        }
      }
    } catch (error) {
      console.error('Error adding new product:', error);
    }
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const btwAmount = subtotal * 0.21;
  const total = subtotal + btwAmount;

  const generateQuoteNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `OFF-${year}-${random}`;
  };

  const saveQuote = async () => {
    if (!lead || lineItems.length === 0) return;

    setSaving(true);
    try {
      const quoteData = {
        lead_id: lead.id,
        project_description: projectDescription,
        project_address: projectAddress,
        valid_until: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        line_items: lineItems,
        subtotal,
        btw_percentage: 21,
        btw_amount: btwAmount,
        total,
        customer_notes: notes,
      };

      let response: Response;

      if (isEditing && existingQuote) {
        // Update existing quote
        response = await fetch(`/api/demo/quotes/${existingQuote.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quoteData)
        });
      } else {
        // Create new quote
        response = await fetch('/api/demo/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...quoteData,
            quote_number: generateQuoteNumber(),
            status: 'draft'
          })
        });
      }

      if (response.ok) {
        const result = await response.json();
        alert(isEditing ? 'Offerte bijgewerkt!' : 'Offerte opgeslagen!');
        router.push(`/demo/offertes`);
      } else {
        alert('Er ging iets mis bij het opslaan');
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Er ging iets mis');
    } finally {
      setSaving(false);
    }
  };

  // Group pricing by category
  const pricingByCategory = pricing.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PricingItem[]>);

  const categoryLabels: Record<string, string> = {
    bestrating: 'Bestrating',
    beplanting: 'Beplanting',
    grondwerk: 'Grondwerk',
    afscheiding: 'Afscheiding',
    onderhoud: 'Onderhoud',
    overig: 'Overig'
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full animate-ping opacity-20" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-slate-600 font-medium">Offerte laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Lead niet gevonden</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <Link
              href={isEditing && existingQuote ? `/demo/offertes` : '/demo'}
              className="text-sm text-orange-300 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> {isEditing ? 'Terug naar offertes' : 'Terug naar overzicht'}
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {isEditing && <FileEdit className="w-6 h-6" />}
              {isEditing ? `Offerte ${existingQuote?.quote_number} bewerken` : `Offerte maken voor ${lead.name}`}
            </h1>
            {isEditing && (
              <p className="text-sm text-orange-300">Klant: {lead.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-orange-500/30 border border-orange-400/50 px-2 py-0.5 rounded-full font-medium animate-pulse">
              DEMO
            </span>
          </div>
        </div>
      </header>

      {/* Demo banner */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-white text-center py-2 text-sm font-medium">
        <span className="flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          Demo omgeving - AI analyse werkt echt!
          <Sparkles className="w-4 h-4" />
        </span>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Analyse */}
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-600" />
                  <span className="text-orange-600">AI Offerte Assistent</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Voer je klad notities in (gesprek, metingen, wensen) en laat AI automatisch de offerte regels genereren.
                </p>
                <Textarea
                  value={kladNotities}
                  onChange={(e) => setKladNotities(e.target.value)}
                  placeholder="Voorbeeld:
Klant wil nieuwe tuin van 6x8 meter
- Terras van 4x3 meter met keramische tegels
- Gazon voor de rest
- Nieuwe schutting aan linkerkant, 8 meter
- 2 fruitbomen planten
- Drainage nodig want veel wateroverlast"
                  rows={8}
                  className="bg-white mb-4"
                />
                <Button
                  onClick={analyzeNotes}
                  disabled={analyzing || !kladNotities.trim()}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {analyzing ? 'Analyseren...' : 'Analyseer & Genereer Offerte'}
                </Button>

                {aiAnalysis && (
                  <div className="mt-4 p-3 bg-white rounded-lg border">
                    <p className="text-sm font-medium text-gray-700">AI Analyse:</p>
                    <p className="text-sm text-gray-600">{aiAnalysis}</p>
                  </div>
                )}

                {aiSuggestions.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" /> Suggesties:
                    </p>
                    <ul className="space-y-1">
                      {aiSuggestions.map((suggestion, i) => (
                        <li key={i} className="text-sm text-blue-600 flex items-start gap-2">
                          <span>•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lead Info */}
            <Card>
              <CardHeader>
                <CardTitle>Klantgegevens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">{lead.name}</p>
                    <p className="text-sm text-gray-500">{lead.phone}</p>
                    <p className="text-sm text-gray-500">{lead.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Project adres</label>
                    <Input
                      value={projectAddress}
                      onChange={(e) => setProjectAddress(e.target.value)}
                      placeholder="Project adres"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium">Project omschrijving</label>
                  <Textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Project omschrijving"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle>Offerte regels ({lineItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {lineItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Gebruik de AI analyse hierboven of voeg handmatig items toe vanuit de prijslijst rechts
                  </p>
                ) : sections.length > 0 ? (
                  <div className="space-y-6">
                    {sections.map((section) => {
                      const sectionTotal = section.items.reduce((sum, item) => sum + item.total, 0);
                      return (
                        <div key={section.id} className="border rounded-lg overflow-hidden">
                          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 flex justify-between items-center">
                            <h3 className="text-white font-semibold text-sm">{section.element_title}</h3>
                            <span className="text-white text-sm font-medium">€{sectionTotal.toFixed(2)}</span>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {section.items.map((item) => (
                              <div key={item.id} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  {item.line_type === 'materiaal' && Object.keys(pricingHierarchy).length > 0 ? (
                                    <div className="flex-1 mr-2">
                                      <ProductPicker
                                        currentItem={{
                                          pricing_id: item.pricing_id,
                                          description: item.description,
                                          unit: item.unit,
                                          unit_price: item.unit_price,
                                          category: item.category || section.category || 'overig',
                                        }}
                                        hierarchy={pricingHierarchy}
                                        onSelect={(selected) => handleProductSelect(item.id, selected)}
                                        onAddNew={(newProduct) => handleAddNewProduct(item.id, newProduct)}
                                      />
                                    </div>
                                  ) : (
                                    <Input
                                      value={item.description}
                                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                      className="font-medium flex-1 mr-2"
                                    />
                                  )}
                                  <button
                                    onClick={() => removeLineItem(item.id)}
                                    className="text-red-500 hover:text-red-700 text-xl"
                                  >
                                    &times;
                                  </button>
                                </div>
                                <div className="grid grid-cols-4 gap-2 items-center">
                                  <div>
                                    <label className="text-xs text-gray-500">Aantal</label>
                                    <Input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                                      min={0}
                                      step={0.1}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500">Eenheid</label>
                                    <Input value={item.unit} disabled className="bg-gray-50" />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500">Prijs/eenheid</label>
                                    <Input
                                      type="number"
                                      value={item.unit_price}
                                      onChange={(e) => updateLineItem(item.id, 'unit_price', Number(e.target.value))}
                                      min={0}
                                      step={0.01}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500">Totaal</label>
                                    <p className="font-semibold text-lg text-orange-600">
                                      €{item.total.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                {item.reasoning && (
                                  <p className="mt-2 text-xs text-gray-500 italic bg-gray-50 p-2 rounded flex items-start gap-2">
                                    <Ruler className="w-3 h-3 mt-0.5 flex-shrink-0" /> {item.reasoning}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lineItems.map((item, index) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-gray-400 mr-2">{index + 1}.</span>
                          <Input
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                            className="font-medium flex-1 mr-2"
                          />
                          <button
                            onClick={() => removeLineItem(item.id)}
                            className="text-red-500 hover:text-red-700 text-xl"
                          >
                            &times;
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2 items-center">
                          <div>
                            <label className="text-xs text-gray-500">Aantal</label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                              min={0}
                              step={0.1}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Eenheid</label>
                            <Input value={item.unit} disabled className="bg-gray-50" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Prijs/eenheid</label>
                            <Input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateLineItem(item.id, 'unit_price', Number(e.target.value))}
                              min={0}
                              step={0.01}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Totaal</label>
                            <p className="font-semibold text-lg text-orange-600">
                              €{item.total.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {item.reasoning && (
                          <p className="mt-2 text-xs text-gray-500 italic bg-gray-50 p-2 rounded flex items-start gap-2">
                            <Ruler className="w-3 h-3 mt-0.5 flex-shrink-0" /> {item.reasoning}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals */}
                {lineItems.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <div className="flex justify-between text-lg">
                      <span>Subtotaal:</span>
                      <span>€{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>BTW (21%):</span>
                      <span>€{btwAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold mt-2 text-orange-600">
                      <span>Totaal incl. BTW:</span>
                      <span>€{total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes & Save */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium">Offerte geldig (dagen)</label>
                    <Input
                      type="number"
                      value={validDays}
                      onChange={(e) => setValidDays(Number(e.target.value))}
                      min={1}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-sm font-medium">Opmerkingen voor klant</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Bijvoorbeeld: inclusief afvoer materiaal, excl. planten, start mogelijk vanaf week 12"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={saveQuote}
                  disabled={lineItems.length === 0 || saving}
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                >
                  {saving ? 'Opslaan...' : `${isEditing ? 'Wijzigingen opslaan' : 'Offerte opslaan'} (€${total.toFixed(2)})`}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Pricing List */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Prijslijst (handmatig toevoegen)</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[70vh] overflow-y-auto">
                {Object.entries(pricingByCategory).map(([category, items]) => (
                  <div key={category} className="mb-4">
                    <h3 className="font-semibold text-sm text-gray-500 uppercase mb-2">
                      {categoryLabels[category] || category}
                    </h3>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => addLineItem(item)}
                          className="w-full text-left p-2 rounded hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-colors"
                        >
                          <div className="flex justify-between">
                            <span className="text-sm">{item.item_name}</span>
                            <span className="text-sm text-orange-600 font-medium">
                              €{Number(item.selling_price_default).toFixed(2)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">per {item.unit}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
