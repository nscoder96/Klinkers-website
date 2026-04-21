'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout'; // Wrapped in Layout
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Loader2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Check,
  Plus
} from 'lucide-react';
import MultiFormatInput from '@/components/quote/MultiFormatInput';
import AnalysisProgress from '@/components/quote/AnalysisProgress';
import QuoteEditorTable, { Section, LineItem } from '@/components/quotes/QuoteEditorTable';

interface PricingItem {
  id: string;
  category: string;
  item_name: string;
  unit: string;
  selling_price_default: number;
  item_type: 'arbeid' | 'materiaal';
}

export default function NieuweOfferte() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

  // Customer info state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Duplicate detection state
  interface DuplicateLead {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    city: string | null;
    status: string;
    match_type: 'name' | 'phone' | 'email';
  }
  const [duplicates, setDuplicates] = useState<DuplicateLead[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Quote state
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // AI state
  const [kladNotities, setKladNotities] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysisProgress, setShowAnalysisProgress] = useState(false);
  const [patroon, setPatroon] = useState<'recht' | 'halfsteens' | 'visgraat' | 'rond'>('recht');
  const [grondtype, setGrondtype] = useState<'zand' | 'klei' | 'veen'>('zand');
  const [bereikbaarheid, setBereikbaarheid] = useState<'goed' | 'matig' | 'slecht'>('goed');

  // Steps: 'input' | 'analyzing' | 'editor'
  const [step, setStep] = useState<'input' | 'analyzing' | 'editor'>('input');

  const fetchData = useCallback(async () => {
    try {
      const pricingRes = await fetch('/api/admin/pricing');
      if (pricingRes.ok) {
        const pricingData = await pricingRes.json();
        setPricing(pricingData.pricing || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // Check for duplicates when customer info changes
  useEffect(() => {
    const checkDuplicates = async () => {
      // Only check if we have at least some input
      if (!customerName && !customerPhone && !customerEmail) {
        setDuplicates([]);
        return;
      }

      // Debounce - wait a bit before checking
      setCheckingDuplicates(true);
      try {
        const response = await fetch('/api/admin/leads/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: customerName,
            phone: customerPhone,
            email: customerEmail
          })
        });

        if (response.ok) {
          const data = await response.json();
          setDuplicates(data.duplicates || []);
        }
      } catch (error) {
        console.error('Error checking duplicates:', error);
      } finally {
        setCheckingDuplicates(false);
      }
    };

    // Debounce the check
    const timeoutId = setTimeout(checkDuplicates, 500);
    return () => clearTimeout(timeoutId);
  }, [customerName, customerPhone, customerEmail]);

  // Use existing lead
  const useExistingLead = (lead: DuplicateLead) => {
    setSelectedLeadId(lead.id);
    setCustomerName(lead.name);
    if (lead.phone) setCustomerPhone(lead.phone);
    if (lead.email) setCustomerEmail(lead.email);
    if (lead.city) setCustomerAddress(lead.city);
    setDuplicates([]); // Clear duplicates after selection
  };

  // Save quote
  const saveQuote = async () => {
    setSaving(true);
    try {
      // Convert sections to database format
      const quoteSections = sections.map((section, index) => ({
        title: section.title,
        category: section.category,
        display_order: index + 1,
        line_items: section.items.map((item, itemIndex) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.total_price,
          line_type: item.line_type,
          markup_percent: item.markup_percent,
          vat_rate: item.vat_rate,
          display_order: itemIndex + 1,
          pricing_id: item.pricing_id,
          is_ai_calculated: item.is_ai_calculated,
          calculation_breakdown: item.calculation_breakdown
        }))
      }));

      const response = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          customer_address: customerAddress,
          project_description: aiSummary,
          sections: quoteSections,
          status: 'draft',
          existing_lead_id: selectedLeadId // Use existing lead if selected
        })
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/admin/offertes/${data.quote.id}`);
      } else {
        alert('Opslaan mislukt');
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Er ging iets mis bij het opslaan');
    } finally {
      setSaving(false);
    }
  };

  // Handle analysis complete
  const handleAnalysisComplete = (result: {
    analysis: string;
    sections: Array<{
      category: string;
      title: string;
      items: Array<{
        id: string;
        description: string;
        quantity: number;
        unit: string;
        unit_price: number;
        total_price: number;
        line_type: 'arbeid' | 'materiaal';
        pricing_id?: string | null;
        is_ai_calculated: boolean;
        calculation_breakdown?: {
          formula: string;
          explanation: string;
          source: string;
        } | null;
      }>;
      subtotal: number;
    }>;
  }) => {
    setAiSummary(result.analysis);

    // Convert to our Section format
    const newSections: Section[] = result.sections.map((section) => ({
      id: crypto.randomUUID(),
      title: section.title,
      category: section.category,
      items: section.items.map((item) => ({
        id: item.id || crypto.randomUUID(),
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total_price: item.total_price,
        line_type: item.line_type,
        markup_percent: item.line_type === 'materiaal' ? 10 : null,
        vat_rate: 21,
        is_ai_calculated: item.is_ai_calculated,
        calculation_breakdown: item.calculation_breakdown,
        pricing_id: item.pricing_id
      })),
      subtotal: section.subtotal,
      isExpanded: true
    }));

    setSections(newSections);
    setShowAnalysisProgress(false);
    setAnalyzing(false);
    setStep('editor');
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) return null;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Wizard Progress Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/offertes">
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Annuleren
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Nieuwe Offerte</h1>
              <p className="text-sm text-slate-500">Volg de stappen om een slimme offerte te maken.</p>
            </div>
          </div>

          {/* Steps */}
          <div className="flex items-center bg-white rounded-full border border-slate-200 p-1 shadow-sm">
            {[
              { id: 'input', label: '1. Gegevens & Notities' },
              { id: 'analyzing', label: '2. AI Analyse' },
              { id: 'editor', label: '3. Bewerken & Versturen' }
            ].map((s, i) => (
              <div key={s.id} className="flex items-center">
                {i > 0 && <div className="w-8 h-px bg-slate-200 mx-2" />}
                <div className={`
                           px-4 py-1.5 rounded-full text-sm font-medium transition-all
                           ${step === s.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : (step === 'editor' && s.id !== 'editor') || (step === 'analyzing' && s.id === 'input')
                      ? 'text-green-600 bg-green-50'
                      : 'text-slate-400'
                  }
                       `}>
                  {((step === 'editor' && s.id !== 'editor') || (step === 'analyzing' && s.id === 'input')) ? (
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3" />
                      <span>{s.label.split('. ')[1]}</span>
                    </div>
                  ) : s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Input */}
        {step === 'input' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">

            {/* Left Column: Customer Info */}
            <Card className="lg:col-span-1 border-slate-200 shadow-sm h-fit">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-base font-semibold text-slate-900">Klantgegevens</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase">Naam</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input
                      className="pl-9"
                      placeholder="vb. Jan Jansen"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input
                      className="pl-9"
                      placeholder="jan@example.com"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase">Telefoon</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input
                      className="pl-9"
                      placeholder="06 12345678"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase">Adres</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input
                      className="pl-9"
                      placeholder="Straat 123, Plaats"
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                    />
                  </div>
                </div>

                {/* Duplicate Warning */}
                {duplicates.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                    <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{duplicates.length} Bekende klant(en)</span>
                    </div>
                    <div className="space-y-2">
                      {duplicates.map(dup => (
                        <div key={dup.id} className="bg-white p-2 rounded border border-amber-100 flex justify-between items-center">
                          <div>
                            <div className="font-medium text-slate-900">{dup.name}</div>
                            <div className="text-xs text-slate-500">{dup.city}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                            onClick={() => useExistingLead(dup)}
                          >
                            Gebruik
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedLeadId && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-green-700 font-medium">Gekoppeld aan {customerName}</span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedLeadId(null)} className="h-6 w-6 p-0 text-green-700">
                      &times;
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right Column: AI Input */}
            <Card className="lg:col-span-2 border-slate-200 shadow-sm flex flex-col">
              <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900">Project Notities</CardTitle>
                <span className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-700 rounded-full border border-purple-200">
                  AI Powered
                </span>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex-1">
                  <MultiFormatInput
                    onTextReady={(text) => setKladNotities(text)}
                    onAnalyze={(text) => {
                      setKladNotities(text);
                      if (text.trim()) {
                        setAnalyzing(true);
                        setShowAnalysisProgress(true);
                        setStep('analyzing');
                      }
                    }}
                    isAnalyzing={analyzing}
                  />
                </div>
                {/* Schouwcontext */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-3">Schouwcontext</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">Patroon</label>
                      <select
                        className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                        value={patroon}
                        onChange={e => setPatroon(e.target.value as typeof patroon)}
                      >
                        <option value="recht">Recht</option>
                        <option value="halfsteens">Halfsteens</option>
                        <option value="visgraat">Visgraat (+12%)</option>
                        <option value="rond">Ronde vormen (+20%)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">Grondtype</label>
                      <select
                        className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                        value={grondtype}
                        onChange={e => setGrondtype(e.target.value as typeof grondtype)}
                      >
                        <option value="zand">Zandgrond (15cm)</option>
                        <option value="klei">Kleigrond (35cm)</option>
                        <option value="veen">Veengrond (40cm)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">Bereikbaarheid</label>
                      <select
                        className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                        value={bereikbaarheid}
                        onChange={e => setBereikbaarheid(e.target.value as typeof bereikbaarheid)}
                      >
                        <option value="goed">Goed</option>
                        <option value="matig">Matig (+20%)</option>
                        <option value="slecht">Slecht (+35%)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                  <Button
                    variant="ghost"
                    onClick={() => setStep('editor')}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    Sla over, ik vul zelf in
                  </Button>
                  <Button
                    onClick={() => {
                      if (kladNotities.trim()) {
                        setAnalyzing(true);
                        setShowAnalysisProgress(true);
                        setStep('analyzing');
                      }
                    }}
                    disabled={!kladNotities.trim()}
                    className="bg-slate-900 text-white hover:bg-slate-800 px-6"
                  >
                    Genereer Offerte
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Analysis */}
        {step === 'analyzing' && showAnalysisProgress && (
          <div className="max-w-2xl mx-auto py-12">
            <Card className="border-0 shadow-2xl">
              <CardContent className="p-0">
                <AnalysisProgress
                  notes={kladNotities}
                  patroon={patroon}
                  grondtype={grondtype}
                  bereikbaarheid={bereikbaarheid}
                  onComplete={handleAnalysisComplete}
                  onCancel={() => {
                    setShowAnalysisProgress(false);
                    setAnalyzing(false);
                    setStep('input');
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Editor */}
        {step === 'editor' && (
          <div className="animate-fade-in space-y-4">
            <QuoteEditorTable
              sections={sections}
              onSectionsChange={setSections}
              pricing={pricing}
              aiSummary={aiSummary}
              onSave={saveQuote}
              onExportPDF={() => alert('PDF export komt binnenkort!')}
              isSaving={saving}
              customerName={customerName}
              projectName=""
            />

            {sections.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Nog geen items</h3>
                <p className="text-slate-500 mb-6">Begin met het toevoegen van een sectie om je offerte op te bouwen.</p>
                <Button
                  onClick={() => {
                    const newSection: Section = {
                      id: crypto.randomUUID(),
                      title: 'Werkzaamheden',
                      category: 'overig',
                      items: [],
                      subtotal: 0,
                      isExpanded: true
                    };
                    setSections([newSection]);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Sectie Toevoegen
                </Button>
              </div>
            )}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
