'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { Section, LineItem } from '@/components/quotes/QuoteSectionCard';
import { SortableSectionList } from '@/components/quotes/SortableSectionList';
import { QuoteOverheadCard, OverheadItem } from '@/components/quotes/QuoteOverheadCard';
import { MaterialPicker } from '@/components/quotes/MaterialPicker';
import { Lightbulb, ArrowLeft, FileEdit, Plus, Save, Sparkles, ClipboardList, ChevronDown, ChevronUp, MessageSquare, Send } from 'lucide-react';
// OptionalQuestions verwijderd - hovenier is de specialist
import WorkOrderPreview from '@/components/quote/WorkOrderPreview';
import { QUOTE_CATEGORIES, getCategoryLabel } from '@/lib/quote-categories';

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
  item_type?: 'materiaal' | 'arbeid';
}

interface ExistingQuote {
  id: string;
  quote_number: string;
  project_description: string | null;
  project_address: string | null;
  valid_until: string | null;
  subtotal: number;
  btw_percentage: number;
  btw_amount: number;
  total: number;
  customer_notes: string | null;
  status: string;
}

export default function OfferteMaker() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = params.id as string;
  const quoteId = searchParams.get('quoteId');
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [overhead, setOverhead] = useState<OverheadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [existingQuote, setExistingQuote] = useState<ExistingQuote | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Editable lead fields
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadAddress, setLeadAddress] = useState('');
  const [leadCity, setLeadCity] = useState('');

  const [projectDescription, setProjectDescription] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [validDays, setValidDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [kladNotities, setKladNotities] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Optional questions state verwijderd - hovenier is de specialist

  // Tab state (offerte vs werkbon)
  const [activeTab, setActiveTab] = useState<'offerte' | 'werkbon'>('offerte');

  // Material picker state
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [pickerTargetSection, setPickerTargetSection] = useState<string | null>(null);

  // AI leermoment state
  const [learningPrompt, setLearningPrompt] = useState<{
    itemDescription: string;
    itemUnit: string;
    sectionTitle: string;
    sectionCategory: string;
  } | null>(null);
  const [learningActivity, setLearningActivity] = useState('');
  const [savingLearning, setSavingLearning] = useState(false);

  // Chat editing state
  const [chatInstruction, setChatInstruction] = useState('');
  const [applyingEdit, setApplyingEdit] = useState(false);

  // Calculate totals from sections and overhead
  const sectionsSubtotal = sections.reduce((sum, s) => sum + (Number(s.subtotal) || 0), 0);
  const overheadTotal = overhead.reduce((sum, o) => sum + (Number(o.calculated_amount) || 0), 0);
  const subtotal = sectionsSubtotal + overheadTotal;
  const btwAmount = subtotal * 0.21;
  const total = subtotal + btwAmount;

  const fetchData = useCallback(async () => {
    try {
      const fetchPromises: Promise<Response>[] = [
        fetch('/api/admin/leads'),
        fetch('/api/admin/pricing')
      ];

      if (quoteId) {
        fetchPromises.push(fetch(`/api/admin/quotes/${quoteId}`));
        fetchPromises.push(fetch(`/api/admin/quotes/${quoteId}/sections`));
        fetchPromises.push(fetch(`/api/admin/quotes/${quoteId}/overhead`));
      }

      const responses = await Promise.all(fetchPromises);
      const [leadsRes, pricingRes, quoteRes, sectionsRes, overheadRes] = responses;

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        const foundLead = leadsData.leads.find((l: Lead) => l.id === leadId);
        if (foundLead) {
          setLead(foundLead);
          // Initialize editable lead fields
          setLeadName(foundLead.name || '');
          setLeadPhone(foundLead.phone || '');
          setLeadEmail(foundLead.email || '');
          setLeadAddress(foundLead.address || '');
          setLeadCity(foundLead.city || '');
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

      if (quoteRes && quoteRes.ok) {
        const quoteData = await quoteRes.json();
        const quote = quoteData.quote;
        if (quote) {
          setExistingQuote(quote);
          setIsEditing(true);
          setProjectDescription(quote.project_description || '');
          setProjectAddress(quote.project_address || '');
          setNotes(quote.customer_notes || '');
          if (quote.valid_until) {
            const validUntil = new Date(quote.valid_until);
            const now = new Date();
            const daysRemaining = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            setValidDays(Math.max(daysRemaining, 1));
          }
        }
      }

      if (sectionsRes && sectionsRes.ok) {
        const sectionsData = await sectionsRes.json();
        setSections(sectionsData.sections || []);
      }

      if (overheadRes && overheadRes.ok) {
        const overheadData = await overheadRes.json();
        setOverhead(overheadData.overhead || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId, quoteId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // Section management
  const addSection = async (title: string = 'Nieuwe sectie') => {
    if (!quoteId) {
      // For new quotes, add locally
      const newSection: Section = {
        id: crypto.randomUUID(),
        quote_id: '',
        title,
        description: null,
        display_order: sections.length + 1,
        subtotal: 0,
        line_items: []
      };
      setSections([...sections, newSection]);
      return;
    }

    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });

      if (response.ok) {
        const { section } = await response.json();
        setSections([...sections, { ...section, line_items: [] }]);
      }
    } catch (error) {
      console.error('Error adding section:', error);
    }
  };

  const updateSectionTitle = async (sectionId: string, title: string) => {
    setSections(sections.map(s =>
      s.id === sectionId ? { ...s, title } : s
    ));

    if (quoteId) {
      try {
        await fetch(`/api/admin/quotes/${quoteId}/sections/${sectionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title })
        });
      } catch (error) {
        console.error('Error updating section:', error);
      }
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!confirm('Weet je zeker dat je deze sectie wilt verwijderen? Alle items worden ook verwijderd.')) {
      return;
    }

    setSections(sections.filter(s => s.id !== sectionId));

    if (quoteId) {
      try {
        await fetch(`/api/admin/quotes/${quoteId}/sections/${sectionId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Error deleting section:', error);
      }
    }
  };

  const handleSectionsReorder = (newSections: Section[]) => {
    setSections(newSections);
    if (quoteId) {
      reorderSections(newSections);
    }
  };

  const reorderSections = async (newSections: Section[]) => {
    try {
      await fetch(`/api/admin/quotes/${quoteId}/sections/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_ids: newSections.map(s => s.id) })
      });
    } catch (error) {
      console.error('Error reordering sections:', error);
    }
  };

  // Line item management
  const addItemToSection = async (sectionId: string, pricingItem?: PricingItem) => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      section_id: sectionId,
      pricing_id: pricingItem?.id || null,
      description: pricingItem?.item_name || 'Nieuw item',
      quantity: 1,
      unit: pricingItem?.unit || 'stuk',
      cost_price: null,
      markup_percent: null,
      unit_price: Number(pricingItem?.selling_price_default) || 0,
      total_price: Number(pricingItem?.selling_price_default) || 0,
      vat_rate: 21,
      display_order: 0,
      is_auto_calculated: false,
      formula_used: null,
      show_on_quote: true,
      internal_notes: null,
      line_type: pricingItem?.item_type || 'materiaal'
    };

    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const items = [...s.line_items, newItem];
        const sectionSubtotal = items.reduce((sum, item) => sum + item.total_price, 0);
        return { ...s, line_items: items, subtotal: sectionSubtotal };
      }
      return s;
    }));

    if (quoteId) {
      try {
        const response = await fetch(`/api/admin/quotes/${quoteId}/sections/${sectionId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pricing_id: pricingItem?.id,
            description: pricingItem?.item_name || 'Nieuw item',
            quantity: 1,
            unit: pricingItem?.unit || 'stuk',
            unit_price: Number(pricingItem?.selling_price_default) || 0,
            line_type: pricingItem?.item_type || 'materiaal'
          })
        });

        if (response.ok) {
          const { item: serverItem } = await response.json();
          // Only update the ID — preserve any edits the user made while POST was in-flight
          setSections(prev => prev.map(s => {
            if (s.id === sectionId) {
              return {
                ...s,
                line_items: s.line_items.map(i =>
                  i.id === newItem.id ? { ...i, id: serverItem.id, section_id: serverItem.section_id } : i
                )
              };
            }
            return s;
          }));

          // Toon leermoment prompt bij handmatig toegevoegd item (niet vanuit prijsbibliotheek)
          if (!pricingItem) {
            const section = sections.find(s => s.id === sectionId);
            if (section) {
              setLearningPrompt({
                itemDescription: newItem.description,
                itemUnit: newItem.unit,
                sectionTitle: section.title,
                sectionCategory: (section as Section & { category?: string }).category || 'overig'
              });
              setLearningActivity(section.title);
            }
          }
        } else {
          const err = await response.json().catch(() => ({}));
          console.error('Error saving new item:', err);
        }
      } catch (error) {
        console.error('Error adding item:', error);
      }
    }
  };

  const updateItem = async (sectionId: string, itemId: string, field: keyof LineItem, value: number | string | boolean) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const items = s.line_items.map(item => {
          if (item.id === itemId) {
            const updated = { ...item, [field]: value };
            if (field === 'quantity' || field === 'unit_price') {
              updated.total_price = Number(updated.quantity) * Number(updated.unit_price);
            }
            return updated;
          }
          return item;
        });
        const sectionSubtotal = items.reduce((sum, item) => sum + item.total_price, 0);
        return { ...s, line_items: items, subtotal: sectionSubtotal };
      }
      return s;
    }));

    if (quoteId) {
      try {
        await fetch(`/api/admin/quotes/${quoteId}/sections/${sectionId}/items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value })
        });
      } catch (error) {
        console.error('Error updating item:', error);
      }
    }
  };

  const deleteItem = async (sectionId: string, itemId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const items = s.line_items.filter(item => item.id !== itemId);
        const sectionSubtotal = items.reduce((sum, item) => sum + item.total_price, 0);
        return { ...s, line_items: items, subtotal: sectionSubtotal };
      }
      return s;
    }));

    if (quoteId) {
      try {
        await fetch(`/api/admin/quotes/${quoteId}/sections/${sectionId}/items/${itemId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const moveItemUp = (sectionId: string, itemId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const items = [...s.line_items];
        const index = items.findIndex(i => i.id === itemId);
        if (index > 0) {
          [items[index - 1], items[index]] = [items[index], items[index - 1]];
        }
        return { ...s, line_items: items };
      }
      return s;
    }));
  };

  const moveItemDown = (sectionId: string, itemId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const items = [...s.line_items];
        const index = items.findIndex(i => i.id === itemId);
        if (index < items.length - 1) {
          [items[index], items[index + 1]] = [items[index + 1], items[index]];
        }
        return { ...s, line_items: items };
      }
      return s;
    }));
  };

  const reorderItems = (sectionId: string, newItems: LineItem[]) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, line_items: newItems };
      }
      return s;
    }));
  };

  const moveItemToSection = (fromSectionId: string, toSectionId: string, itemId: string, newIndex: number) => {
    setSections(prev => {
      const fromSection = prev.find(s => s.id === fromSectionId);
      if (!fromSection) return prev;
      const item = fromSection.line_items.find(i => i.id === itemId);
      if (!item) return prev;

      return prev.map(s => {
        if (s.id === fromSectionId) {
          const newItems = s.line_items.filter(i => i.id !== itemId);
          return { ...s, line_items: newItems, subtotal: newItems.reduce((sum, i) => sum + i.total_price, 0) };
        }
        if (s.id === toSectionId) {
          const newItems = [...s.line_items];
          newItems.splice(newIndex, 0, { ...item, section_id: toSectionId });
          return { ...s, line_items: newItems, subtotal: newItems.reduce((sum, i) => sum + i.total_price, 0) };
        }
        return s;
      });
    });
  };

  // Open material picker for a specific section
  const openMaterialPicker = (sectionId: string) => {
    setPickerTargetSection(sectionId);
    setShowMaterialPicker(true);
  };

  // Handle material selection from picker
  const handleMaterialSelect = (item: PricingItem) => {
    if (pickerTargetSection) {
      addItemToSection(pickerTargetSection, item);
    }
    setShowMaterialPicker(false);
    setPickerTargetSection(null);
  };

  // Sla leermoment op als work rule
  const saveLearning = async () => {
    if (!learningPrompt || !learningActivity.trim()) return;
    setSavingLearning(true);
    try {
      await fetch('/api/admin/work-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_name: learningActivity.trim(),
          category: learningPrompt.sectionCategory,
          default_unit: learningPrompt.itemUnit,
          linked_tasks: [{
            name: learningPrompt.itemDescription,
            enabled: true,
            unit: learningPrompt.itemUnit
          }]
        })
      });
    } catch (err) {
      console.error('Error saving learning:', err);
    } finally {
      setSavingLearning(false);
      setLearningPrompt(null);
      setLearningActivity('');
    }
  };

  // Overhead management
  const addOverhead = async (item: Partial<OverheadItem>) => {
    const calculatedAmount = item.overhead_type === 'percentage'
      ? sectionsSubtotal * ((item.value || 0) / 100)
      : (item.value || 0);

    const newOverhead: OverheadItem = {
      id: crypto.randomUUID(),
      quote_id: quoteId || '',
      name: item.name || 'Nieuwe kosten',
      description: null,
      overhead_type: item.overhead_type || 'fixed',
      value: item.value || 0,
      calculated_amount: calculatedAmount,
      vat_rate: 21,
      display_order: overhead.length + 1
    };

    setOverhead([...overhead, newOverhead]);

    if (quoteId) {
      try {
        const response = await fetch(`/api/admin/quotes/${quoteId}/overhead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });

        if (response.ok) {
          const { overhead: savedOverhead } = await response.json();
          setOverhead(prev => prev.map(o =>
            o.id === newOverhead.id ? savedOverhead : o
          ));
        }
      } catch (error) {
        console.error('Error adding overhead:', error);
      }
    }
  };

  const updateOverhead = async (id: string, field: keyof OverheadItem, value: string | number) => {
    setOverhead(prev => prev.map(o => {
      if (o.id === id) {
        const updated = { ...o, [field]: value };
        // Recalculate amount if type or value changed
        if (field === 'overhead_type' || field === 'value') {
          const newValue = field === 'value' ? Number(value) : o.value;
          const newType = field === 'overhead_type' ? value as 'fixed' | 'percentage' : o.overhead_type;
          updated.calculated_amount = newType === 'percentage'
            ? sectionsSubtotal * (newValue / 100)
            : newValue;
          if (field === 'value') updated.value = newValue;
          if (field === 'overhead_type') updated.overhead_type = newType;
        }
        return updated;
      }
      return o;
    }));

    if (quoteId) {
      try {
        await fetch(`/api/admin/quotes/${quoteId}/overhead/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value })
        });
      } catch (error) {
        console.error('Error updating overhead:', error);
      }
    }
  };

  const deleteOverhead = async (id: string) => {
    setOverhead(prev => prev.filter(o => o.id !== id));

    if (quoteId) {
      try {
        await fetch(`/api/admin/quotes/${quoteId}/overhead/${id}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Error deleting overhead:', error);
      }
    }
  };

  const applyQuoteEdit = async () => {
    if (!chatInstruction.trim() || sections.length === 0) return;

    setApplyingEdit(true);
    try {
      const response = await fetch('/api/admin/edit-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: sections.map(s => ({
            id: s.id,
            title: s.title,
            category: (s as Section & { category?: string }).category,
            items: s.line_items.map(i => ({
              id: i.id,
              description: i.description,
              line_type: i.line_type,
              quantity: i.quantity,
              unit: i.unit,
              unit_price: i.unit_price
            }))
          })),
          instruction: chatInstruction
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.sections) {
          // Map returned sections back to our Section format, preserving existing section metadata
          const updatedSections: Section[] = data.sections.map((s: {
            id: string;
            title: string;
            category?: string;
            subtotal: number;
            items: Array<{
              id: string;
              description: string;
              line_type: 'materiaal' | 'arbeid';
              quantity: number;
              unit: string;
              unit_price: number;
              total_price: number;
              pricing_id: string | null;
              is_ai_calculated: boolean;
              calculation_breakdown: null;
              display_order: number;
              section_id: string;
              cost_price: null;
              markup_percent: null;
              vat_rate: number;
              show_on_quote: boolean;
              internal_notes: null;
              is_auto_calculated: boolean;
              formula_used: null;
              reasoning: null;
            }>;
            line_items: LineItem[];
            quote_id: string;
            description: null;
            display_order: number;
          }, idx: number) => {
            // Find original section to preserve quote_id etc.
            const orig = sections.find(os => os.id === s.id);
            return {
              id: s.id,
              quote_id: orig?.quote_id || quoteId || '',
              title: s.title,
              description: orig?.description || null,
              display_order: idx,
              subtotal: s.subtotal,
              line_items: s.items as unknown as LineItem[],
              category: s.category
            } as Section & { category?: string };
          });
          setSections(updatedSections);
          setChatInstruction('');
        }
      } else {
        const err = await response.json();
        alert('Aanpassing mislukt: ' + (err.error || 'Onbekende fout'));
      }
    } catch (error) {
      console.error('Error applying edit:', error);
      alert('Er ging iets mis bij het aanpassen');
    } finally {
      setApplyingEdit(false);
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

        // Pipeline-secties (generate-v2) → paginasecties; centen → euro's.
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

        const newSections: Section[] = pipelineSections
          .filter((s) => s.display_lines.length > 0)
          .map((s, index) => {
            const sectionItems: LineItem[] = s.display_lines.map((line) => ({
              id: crypto.randomUUID(),
              section_id: '',
              pricing_id: line.pricing_id || null,
              description: line.description,
              quantity: line.quantity,
              unit: line.unit,
              cost_price: null,
              markup_percent: null,
              unit_price: (line.unit_price_cents ?? 0) / 100,
              total_price: (line.total_cents ?? 0) / 100,
              vat_rate: 21,
              display_order: 0,
              is_auto_calculated: true,
              formula_used: null,
              show_on_quote: true,
              internal_notes: null,
              reasoning: null,
              line_type: line.line_type === 'arbeid' ? 'arbeid' : 'materiaal'
            } as LineItem));

            const sectionSubtotal = sectionItems.reduce((sum, item) => sum + item.total_price, 0);

            return {
              id: crypto.randomUUID(),
              quote_id: quoteId || '',
              title: s.title,
              description: null,
              display_order: sections.length + index + 1,
              subtotal: sectionSubtotal,
              line_items: sectionItems
            } as Section;
          });

        if (newSections.length > 0) {
          setSections([...sections, ...newSections]);
        }
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

  // Prepare items for WorkOrderPreview
  const getWorkOrderItems = () => {
    return sections.flatMap(section =>
      section.line_items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        category: (section as Section & { category?: string }).category || 'overig',
        sub_items: (item as LineItem & { sub_items?: Array<{ description: string; quantity: number; unit: string; reasoning?: string }> }).sub_items
      }))
    );
  };

  const generateQuoteNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `KC-${year}-${random}`;
  };

  const saveQuote = async () => {
    if (!lead || sections.length === 0) {
      alert('Voeg minimaal één sectie met items toe');
      return;
    }

    const totalItems = sections.reduce((sum, s) => sum + s.line_items.length, 0);
    if (totalItems === 0) {
      alert('Voeg minimaal één item toe aan een sectie');
      return;
    }

    setSaving(true);
    try {
      // Save lead information first
      const leadUpdateResponse = await fetch(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadName,
          phone: leadPhone || null,
          email: leadEmail || null,
          address: leadAddress || null,
          city: leadCity || 'Onbekend'
        })
      });

      if (!leadUpdateResponse.ok) {
        console.error('Failed to update lead info');
      }

      if (isEditing && existingQuote) {
        // Update existing quote
        const response = await fetch(`/api/admin/quotes/${existingQuote.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_description: projectDescription,
            project_address: projectAddress,
            valid_until: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            subtotal,
            btw_percentage: 21,
            btw_amount: btwAmount,
            total,
            customer_notes: notes
          })
        });

        if (response.ok) {
          alert('Offerte bijgewerkt!');
          router.push(`/admin/offertes/${existingQuote.id}`);
        } else {
          alert('Er ging iets mis bij het opslaan');
        }
      } else {
        // Create new quote with sections
        const response = await fetch('/api/admin/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quote_number: generateQuoteNumber(),
            lead_id: lead.id,
            project_description: projectDescription,
            project_address: projectAddress,
            valid_until: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            line_items: [], // Empty for now, sections handle items
            subtotal,
            btw_percentage: 21,
            btw_amount: btwAmount,
            total,
            customer_notes: notes,
            status: 'draft'
          })
        });

        if (response.ok) {
          const { quote } = await response.json();

          // Create sections and items
          for (const section of sections) {
            const sectionRes = await fetch(`/api/admin/quotes/${quote.id}/sections`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: section.title,
                description: section.description
              })
            });

            if (sectionRes.ok) {
              const { section: newSection } = await sectionRes.json();

              // Add items to section
              for (const item of section.line_items) {
                await fetch(`/api/admin/quotes/${quote.id}/sections/${newSection.id}/items`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    pricing_id: item.pricing_id,
                    description: item.description,
                    quantity: item.quantity,
                    unit: item.unit,
                    unit_price: item.unit_price
                  })
                });
              }
            }
          }

          // Create overhead items
          for (const item of overhead) {
            await fetch(`/api/admin/quotes/${quote.id}/overhead`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: item.name,
                description: item.description,
                overhead_type: item.overhead_type,
                value: item.value
              })
            });
          }

          alert('Offerte opgeslagen!');
          router.push(`/admin/offertes/${quote.id}`);
        } else {
          alert('Er ging iets mis bij het opslaan');
        }
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
    onderhoud: 'Onderhoud'
  };

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

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.stone }}>
        <p style={{ color: colors.slate }}>Lead niet gevonden</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.stone }}>
      {/* Header */}
      <header className="text-white py-4" style={{ backgroundColor: colors.dark }}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <Link
              href={isEditing && existingQuote ? `/admin/offertes/${existingQuote.id}` : '/admin'}
              className="text-sm hover:text-white flex items-center gap-1"
              style={{ color: colors.mist }}
            >
              <ArrowLeft className="w-4 h-4" /> {isEditing ? 'Terug naar offerte' : 'Terug naar overzicht'}
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {isEditing && <FileEdit className="w-6 h-6" />}
              {isEditing ? `Offerte ${existingQuote?.quote_number} bewerken` : `Offerte maken voor ${lead.name}`}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: colors.orange }}>€{total.toFixed(2)}</p>
            <p className="text-sm" style={{ color: colors.mist }}>incl. BTW</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Analyse */}
            <Card className="border-2" style={{ borderColor: colors.orange, backgroundColor: colors.orangeLight }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span style={{ color: colors.orange }}>AI Offerte Assistent</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4" style={{ color: colors.slate }}>
                  Voer je klad notities in en laat AI automatisch de offerte regels genereren.
                </p>
                <Textarea
                  value={kladNotities}
                  onChange={(e) => setKladNotities(e.target.value)}
                  placeholder="Voorbeeld:
Klant wil nieuwe tuin van 6x8 meter
- Terras van 4x3 meter met keramische tegels
- Gazon voor de rest
- Nieuwe schutting aan linkerkant, 8 meter
- 2 fruitbomen planten"
                  rows={6}
                  className="mb-4"
                  style={{ backgroundColor: colors.warmWhite }}
                />
                <Button
                  onClick={analyzeNotes}
                  disabled={analyzing || !kladNotities.trim()}
                  className="w-full"
                  style={{ backgroundColor: colors.orange, color: colors.warmWhite }}
                >
                  {analyzing ? 'Analyseren...' : 'Analyseer & Genereer Offerte'}
                </Button>

                {aiAnalysis && (
                  <div className="mt-4 p-3 rounded-lg border" style={{ backgroundColor: colors.warmWhite, borderColor: colors.mist }}>
                    <p className="text-sm font-medium" style={{ color: colors.dark }}>AI Analyse:</p>
                    <p className="text-sm" style={{ color: colors.slate }}>{aiAnalysis}</p>
                  </div>
                )}

                {aiSuggestions.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg border" style={{ backgroundColor: colors.blueLight, borderColor: colors.blue }}>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: colors.blue }}>
                      <Lightbulb className="w-4 h-4" /> Suggesties:
                    </p>
                    <ul className="space-y-1">
                      {aiSuggestions.map((suggestion, i) => (
                        <li key={i} className="text-sm flex items-start gap-2" style={{ color: colors.blue }}>
                          <span>•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat editing - visible when sections exist */}
            {sections.length > 0 && (
              <Card className="border-2" style={{ borderColor: colors.blue, backgroundColor: colors.blueLight }}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4" style={{ color: colors.blue }} />
                    <span className="text-sm font-medium" style={{ color: colors.blue }}>
                      Offerte aanpassen via chat
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={chatInstruction}
                      onChange={e => setChatInstruction(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); applyQuoteEdit(); } }}
                      placeholder='bijv. "verwijder het ophoogzand" of "verhoog de hoeveelheid bestrating naar 45m²"'
                      disabled={applyingEdit}
                      style={{ backgroundColor: colors.warmWhite }}
                    />
                    <Button
                      onClick={applyQuoteEdit}
                      disabled={!chatInstruction.trim() || applyingEdit}
                      style={{ backgroundColor: colors.blue, color: colors.warmWhite, minWidth: 44 }}
                    >
                      {applyingEdit ? (
                        <Sparkles className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {applyingEdit && (
                    <p className="text-xs mt-2" style={{ color: colors.blue }}>Offerte wordt aangepast...</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tab Switcher */}
            {sections.length > 0 && (
              <div className="flex gap-2 border-b" style={{ borderColor: colors.mist }}>
                <button
                  onClick={() => setActiveTab('offerte')}
                  className="px-4 py-2 font-medium text-sm border-b-2 transition-colors"
                  style={{
                    borderColor: activeTab === 'offerte' ? colors.orange : 'transparent',
                    color: activeTab === 'offerte' ? colors.orange : colors.slate
                  }}
                >
                  <FileEdit className="w-4 h-4 inline-block mr-2" />
                  Offerte
                </button>
                <button
                  onClick={() => setActiveTab('werkbon')}
                  className="px-4 py-2 font-medium text-sm border-b-2 transition-colors"
                  style={{
                    borderColor: activeTab === 'werkbon' ? colors.dark : 'transparent',
                    color: activeTab === 'werkbon' ? colors.dark : colors.slate
                  }}
                >
                  <ClipboardList className="w-4 h-4 inline-block mr-2" />
                  Werkbon Preview
                </button>
              </div>
            )}

            {/* Lead Info */}
            <Card className="border-2" style={{ borderColor: colors.blue, backgroundColor: colors.blueLight }}>
              <CardHeader>
                <CardTitle style={{ color: colors.blue }}>Klantgegevens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium" style={{ color: colors.dark }}>Naam *</label>
                    <Input
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="Klantnaam"
                      style={{ backgroundColor: colors.warmWhite }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: colors.dark }}>Telefoon</label>
                    <Input
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="06-12345678"
                      style={{ backgroundColor: colors.warmWhite }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: colors.dark }}>Email</label>
                    <Input
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="email@voorbeeld.nl"
                      type="email"
                      style={{ backgroundColor: colors.warmWhite }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: colors.dark }}>Stad</label>
                    <Input
                      value={leadCity}
                      onChange={(e) => setLeadCity(e.target.value)}
                      placeholder="Stad"
                      style={{ backgroundColor: colors.warmWhite }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium" style={{ color: colors.dark }}>Adres</label>
                    <Input
                      value={leadAddress}
                      onChange={(e) => setLeadAddress(e.target.value)}
                      placeholder="Straat en huisnummer"
                      style={{ backgroundColor: colors.warmWhite }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium" style={{ color: colors.dark }}>Project adres</label>
                    <Input
                      value={projectAddress}
                      onChange={(e) => setProjectAddress(e.target.value)}
                      placeholder="Project adres (indien anders dan adres)"
                      style={{ backgroundColor: colors.warmWhite }}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium" style={{ color: colors.dark }}>Project omschrijving</label>
                  <Textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Project omschrijving"
                    rows={3}
                    style={{ backgroundColor: colors.warmWhite }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sections / Werkbon - Based on active tab */}
            {activeTab === 'offerte' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Offerte Secties ({sections.length})</h2>
                  <Button onClick={() => addSection()} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Sectie toevoegen
                  </Button>
                </div>

                {sections.length === 0 ? (
                  <Card style={{ backgroundColor: colors.warmWhite }}>
                    <CardContent className="py-8 text-center">
                      <p className="mb-4" style={{ color: colors.slate }}>
                        Nog geen secties. Gebruik de AI analyse of voeg handmatig een sectie toe.
                      </p>
                      <Button
                        onClick={() => addSection('Werkzaamheden')}
                        style={{ backgroundColor: colors.orange, color: colors.warmWhite }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Eerste sectie toevoegen
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <SortableSectionList
                    sections={sections}
                    onSectionsReorder={handleSectionsReorder}
                    onDeleteSection={deleteSection}
                    onUpdateSectionTitle={updateSectionTitle}
                    onAddItem={openMaterialPicker}
                    onUpdateItem={updateItem}
                    onDeleteItem={deleteItem}
                    onMoveItemUp={moveItemUp}
                    onMoveItemDown={moveItemDown}
                    onReorderItems={reorderItems}
                    onMoveItemToSection={moveItemToSection}
                  />
                )}
              </div>
            ) : (
              /* Werkbon Preview Tab */
              <WorkOrderPreview
                quoteNumber={existingQuote?.quote_number || generateQuoteNumber()}
                customerName={lead?.name || 'Onbekend'}
                projectAddress={projectAddress || undefined}
                scheduledDate={undefined}
                items={getWorkOrderItems()}
                onPrint={() => window.print()}
                onDownload={() => {
                  // TODO: Implement PDF download for werkbon
                  alert('PDF download wordt binnenkort toegevoegd');
                }}
              />
            )}

            {/* Overhead / Staartkosten - Only show on offerte tab */}
            {sections.length > 0 && activeTab === 'offerte' && (
              <QuoteOverheadCard
                overhead={overhead}
                subtotal={sectionsSubtotal}
                onAdd={addOverhead}
                onUpdate={updateOverhead}
                onDelete={deleteOverhead}
              />
            )}

            {/* Totals - Only show on offerte tab */}
            {sections.length > 0 && activeTab === 'offerte' && (
              <Card style={{ backgroundColor: colors.warmWhite }}>
                <CardContent className="pt-6">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      {overheadTotal > 0 && (
                        <>
                          <div className="flex justify-between text-sm" style={{ color: colors.slate }}>
                            <span>Werkzaamheden</span>
                            <span>€{sectionsSubtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm" style={{ color: colors.slate }}>
                            <span>Staartkosten</span>
                            <span>€{overheadTotal.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between" style={{ color: colors.slate }}>
                        <span>Subtotaal</span>
                        <span>€{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between" style={{ color: colors.slate }}>
                        <span>BTW (21%)</span>
                        <span>€{btwAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold pt-2 border-t" style={{ color: colors.orange, borderColor: colors.mist }}>
                        <span>Totaal incl. BTW</span>
                        <span>€{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes & Save */}
            <Card style={{ backgroundColor: colors.warmWhite }}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium" style={{ color: colors.dark }}>Offerte geldig (dagen)</label>
                    <Input
                      type="number"
                      value={validDays}
                      onChange={(e) => setValidDays(Number(e.target.value))}
                      min={1}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-sm font-medium" style={{ color: colors.dark }}>Opmerkingen voor klant</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Bijvoorbeeld: inclusief afvoer materiaal, excl. planten"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={saveQuote}
                  disabled={sections.length === 0 || saving}
                  className="w-full text-lg py-6"
                  style={{ backgroundColor: colors.success, color: colors.warmWhite }}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {saving ? 'Opslaan...' : `${isEditing ? 'Wijzigingen opslaan' : 'Offerte opslaan'} (€${total.toFixed(2)})`}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Pricing List */}
          <div>
            <Card className="sticky top-4" style={{ backgroundColor: colors.warmWhite }}>
              <CardHeader>
                <CardTitle className="text-sm" style={{ color: colors.dark }}>Prijslijst - klik om toe te voegen</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[70vh] overflow-y-auto">
                {sections.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: colors.slate }}>
                    Voeg eerst een sectie toe
                  </p>
                ) : (
                  <>
                    <p className="text-xs mb-4" style={{ color: colors.slate }}>
                      Items worden toegevoegd aan de eerste sectie. Sleep ze daarna naar de juiste plek.
                    </p>
                    {Object.entries(pricingByCategory).map(([category, items]) => (
                      <div key={category} className="mb-4">
                        <h3 className="font-semibold text-xs uppercase mb-2" style={{ color: colors.slate }}>
                          {categoryLabels[category] || category}
                        </h3>
                        <div className="space-y-1">
                          {items.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => sections[0] && addItemToSection(sections[0].id, item)}
                              className="w-full text-left p-2 rounded border border-transparent transition-colors"
                              style={{ color: colors.dark }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.orangeLight;
                                e.currentTarget.style.borderColor = colors.orange;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.borderColor = 'transparent';
                              }}
                            >
                              <div className="flex justify-between">
                                <span className="text-sm">{item.item_name}</span>
                                <span className="text-sm font-medium" style={{ color: colors.orange }}>
                                  €{Number(item.selling_price_default).toFixed(2)}
                                </span>
                              </div>
                              <span className="text-xs" style={{ color: colors.slate }}>per {item.unit}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Material Picker Modal */}
      {showMaterialPicker && (
        <MaterialPicker
          pricing={pricing}
          onSelect={handleMaterialSelect}
          onClose={() => {
            setShowMaterialPicker(false);
            setPickerTargetSection(null);
          }}
        />
      )}

      {/* AI Leermoment banner */}
      {learningPrompt && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
          <div className="bg-white border-2 border-orange-200 rounded-xl shadow-2xl p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">
                  Leer de AI: <span className="text-orange-600">&quot;{learningPrompt.itemDescription}&quot;</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5 mb-2">
                  Wanneer moet dit item automatisch worden toegevoegd?
                </p>
                <Input
                  value={learningActivity}
                  onChange={e => setLearningActivity(e.target.value)}
                  placeholder={`bijv. "${learningPrompt.sectionTitle}"`}
                  className="text-sm h-8 mb-2"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={saveLearning}
                    disabled={!learningActivity.trim() || savingLearning}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-7"
                  >
                    {savingLearning ? 'Opslaan...' : 'Onthouden'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setLearningPrompt(null); setLearningActivity(''); }}
                    className="text-xs h-7 text-slate-400"
                  >
                    Overslaan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
