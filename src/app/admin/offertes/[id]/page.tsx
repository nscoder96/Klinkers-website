'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { computeScheduleAmounts } from '@/lib/payment-schedule';
import AdminLayout from '@/components/admin/AdminLayout';
import PDFDownloadButton from '@/components/pdf/PDFDownloadButton';
import QuoteEditorTable, { Section as EditorSection, LineItem as EditorLineItem } from '@/components/quotes/QuoteEditorTable';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  MapPin,
  Phone,
  Mail,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HardHat,
  Loader2,
  X,
  Pencil,
  Settings,
  Sparkles,
  List,
  FileCheck,
  Calendar,
  Image,
  Eye,
  Edit3,
  Euro,
} from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import {
  EditCustomerDetailsForm,
  EditProjectInfoForm,
  EditQuoteTextsForm,
  EditWorkDescriptionForm,
  EditConditionsForm,
  EditPaymentScheduleForm,
} from '@/components/forms';
import { SectionToggle } from '@/components/quote';
import QuoteCheckPanel, { CheckSuggestion } from '@/components/quotes/QuoteCheckPanel';
import QuoteFlagsPanel from '@/components/quotes/QuoteFlagsPanel';
import QuoteVersionHistory from '@/components/quotes/QuoteVersionHistory';

interface PaymentScheduleItem {
  termijn: number;
  omschrijving: string;
  percentage: number;
}

interface QuoteSettings {
  company_name: string;
  company_logo_url: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_address: string | null;
  company_website: string | null;
  company_kvk: string | null;
  company_btw: string | null;
  company_iban: string | null;
  payment_terms: string | null;
  payment_methods: string | null;
  deposit_percentage: number;
  deposit_text: string | null;
  intro_text: string | null;
  outro_text: string | null;
  terms_text: string | null;
  disclaimer_text: string | null;
  // Footer visibility
  show_footer_contact: boolean;
  show_footer_payment: boolean;
  show_footer_company: boolean;
  show_footer_guarantee: boolean;
  // Footer titles
  footer_contact_title: string | null;
  footer_payment_title: string | null;
  footer_company_title: string | null;
  footer_guarantee_title: string | null;
  // Footer content
  footer_contact_text: string | null;
  footer_payment_text: string | null;
  footer_company_text: string | null;
  footer_guarantee_text: string | null;
  // Styling
  primary_color: string;
  accent_color: string;
  // Section visibility (Deddo-style)
  show_section_werkomschrijving: boolean;
  show_section_specificatie: boolean;
  show_section_condities: boolean;
  show_section_termijnschema: boolean;
  // Specification column options
  spec_show_quantities: boolean;
  spec_show_unit_price: boolean;
  spec_show_btw_column: boolean;
  spec_show_line_totals: boolean;
  spec_show_group_subtotals: boolean;
  // Conditions default texts
  conditions_uitgangspunten: string | null;
  conditions_uitgesloten: string | null;
  // Payment schedule
  payment_schedule: PaymentScheduleItem[];
  // Cover page settings
  cover_betreft_prefix: string | null;
  cover_signature_name: string | null;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  total_price?: number;
  line_type?: 'arbeid' | 'materiaal';
}

interface Section {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
  subtotal: number;
  line_items: LineItem[];
}

interface OverheadItem {
  id: string;
  name: string;
  overhead_type: 'fixed' | 'percentage';
  value: number;
  calculated_amount: number;
}

interface Lead {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string;
}

interface Quote {
  id: string;
  quote_number: string;
  lead_id: string;
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
  created_at: string;
  decline_reason: string | null;
  accept_token: string | null;
  leads: Lead | null;
  // Deddo-style new fields
  version: number;
  work_description: string | null;
  work_description_image_url: string | null;
  show_section_werkomschrijving: boolean;
  show_section_specificatie: boolean;
  show_section_condities: boolean;
  show_section_termijnschema: boolean;
  override_conditions_uitgangspunten: string | null;
  override_conditions_uitgesloten: string | null;
  override_payment_schedule: PaymentScheduleItem[] | null;
  spec_show_quantities: boolean | null;
  spec_show_unit_price: boolean | null;
  spec_show_btw_column: boolean | null;
  spec_show_line_totals: boolean | null;
  spec_show_group_subtotals: boolean | null;
  spec_show_type_column: boolean | null;
}

interface PricingItem {
  id: string;
  category: string;
  item_name: string;
  unit: string;
  selling_price_default: number;
  item_type: 'arbeid' | 'materiaal';
}

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const { showModal, hideModal } = useModal();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [overhead, setOverhead] = useState<OverheadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [quoteSettings, setQuoteSettings] = useState<QuoteSettings | null>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editorSections, setEditorSections] = useState<EditorSection[]>([]);
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [convertingToInvoice, setConvertingToInvoice] = useState(false);

  // Quote number edit state
  const [editingQuoteNumber, setEditingQuoteNumber] = useState(false);
  const [quoteNumberDraft, setQuoteNumberDraft] = useState('');

  const fetchQuote = useCallback(async () => {
    try {
      const [quoteRes, sectionsRes, overheadRes, settingsRes, pricingRes] = await Promise.all([
        fetch(`/api/admin/quotes/${quoteId}`),
        fetch(`/api/admin/quotes/${quoteId}/sections`),
        fetch(`/api/admin/quotes/${quoteId}/overhead`),
        fetch(`/api/admin/quote-settings`),
        fetch(`/api/admin/pricing`)
      ]);

      if (quoteRes.ok) {
        const data = await quoteRes.json();
        setQuote(data.quote);
      }

      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json();
        setSections(sectionsData.sections || []);
      }

      if (overheadRes.ok) {
        const overheadData = await overheadRes.json();
        setOverhead(overheadData.overhead || []);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setQuoteSettings(settingsData.settings);
      }

      if (pricingRes.ok) {
        const pricingData = await pricingRes.json();
        setPricing(pricingData.pricing || []);
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  // Convert sections to editor format
  const convertToEditorSections = useCallback((apiSections: Section[]): EditorSection[] => {
    return apiSections.map(section => ({
      id: section.id,
      title: section.title,
      category: section.title.toLowerCase().replace(/\s+/g, '_'),
      items: section.line_items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total_price: item.total_price || item.total,
        line_type: (item.line_type === 'materiaal' ? 'materiaal' : 'arbeid') as 'arbeid' | 'materiaal',
        markup_percent: null,
        vat_rate: 21,
        is_ai_calculated: false,
        calculation_breakdown: null,
        pricing_id: null
      })),
      subtotal: section.subtotal,
      isExpanded: true
    }));
  }, []);

  // Enter edit mode
  const enterEditMode = useCallback(() => {
    const converted = convertToEditorSections(sections);
    setEditorSections(converted);
    setEditMode(true);
  }, [sections, convertToEditorSections]);

  // Convert quote to invoice
  const convertToInvoice = async () => {
    if (!quote) return;
    setConvertingToInvoice(true);
    try {
      const res = await fetch('/api/admin/facturen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_id: quote.id }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/facturen/${data.invoice.id}`);
      } else {
        alert('Er ging iets mis bij het aanmaken van de factuur');
      }
    } finally {
      setConvertingToInvoice(false);
    }
  };

  // Save edited sections
  const saveEditedSections = async () => {
    if (!quote) return;
    setSaving(true);

    try {
      // Convert editor sections to API format
      const quoteSections = editorSections.map((section, index) => ({
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

      // Calculate totals
      const allItems = editorSections.flatMap(s => s.items);
      const subtotal = allItems.reduce((sum, item) => sum + item.total_price, 0);
      const btwAmount = allItems.reduce((sum, item) => sum + (item.total_price * (item.vat_rate / 100)), 0);
      const total = subtotal + btwAmount;

      // Update quote with new sections
      const response = await fetch(`/api/admin/quotes/${quoteId}/sections`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: quoteSections,
          subtotal,
          btw_amount: btwAmount,
          total
        })
      });

      if (response.ok) {
        await fetchQuote();
        setEditMode(false);
      } else {
        const data = await response.json();
        alert('Opslaan mislukt: ' + (data.error || 'Onbekende fout'));
      }
    } catch (error) {
      console.error('Error saving sections:', error);
      alert('Er ging iets mis bij het opslaan');
    } finally {
      setSaving(false);
    }
  };

  // Save quote number
  const saveQuoteNumber = async () => {
    if (!quote || !quoteNumberDraft.trim() || quoteNumberDraft === quote.quote_number) {
      setEditingQuoteNumber(false);
      return;
    }
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_number: quoteNumberDraft.trim() }),
      });
      if (response.ok) {
        setQuote({ ...quote, quote_number: quoteNumberDraft.trim() });
      }
    } catch (error) {
      console.error('Error saving quote number:', error);
    } finally {
      setEditingQuoteNumber(false);
    }
  };

  // Apply a single suggestion from the check panel
  const applySuggestion = async (suggestion: CheckSuggestion) => {
    if (!suggestion.item_id && !suggestion.section_id) {
      throw new Error('Geen item of sectie gevonden voor deze suggestie');
    }

    // Parse value: numeric fields need a number, not a formatted string like "€45,00/m²"
    const numericFields = ['unit_price', 'cost_price', 'quantity', 'total_price'];
    let parsedValue: string | number = suggestion.suggested_value;
    if (numericFields.includes(suggestion.field)) {
      const cleaned = suggestion.suggested_value.replace(/[€$\s]/g, '').replace(',', '.').match(/[\d.]+/);
      parsedValue = cleaned ? parseFloat(cleaned[0]) : 0;
    }

    // Ensure we are in edit mode — convert sections if needed
    let currentEditorSections = editorSections;
    if (!editMode) {
      currentEditorSections = convertToEditorSections(sections);
      setEditorSections(currentEditorSections);
      setEditMode(true);
    }

    // Apply the suggestion directly to editorSections
    if (suggestion.item_id) {
      const itemFound = currentEditorSections.some(s => s.items.some(i => i.id === suggestion.item_id));
      if (!itemFound) throw new Error('Item niet gevonden in editor');

      setEditorSections(prev => prev.map(section => ({
        ...section,
        items: section.items.map(item => {
          if (item.id !== suggestion.item_id) return item;
          const updated = { ...item, [suggestion.field]: parsedValue };
          // Recalculate total_price when unit_price or quantity changes
          if (suggestion.field === 'unit_price') {
            updated.total_price = Number(parsedValue) * item.quantity;
          } else if (suggestion.field === 'quantity') {
            updated.total_price = item.unit_price * Number(parsedValue);
          }
          return updated;
        })
      })));

      // Scroll to the item after render
      setTimeout(() => {
        const el = document.getElementById(`item-${suggestion.item_id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-emerald-50');
          setTimeout(() => el.classList.remove('bg-emerald-50'), 2000);
        }
      }, 150);

    } else if (suggestion.section_id) {
      setEditorSections(prev => prev.map(section =>
        section.id === suggestion.section_id
          ? { ...section, [suggestion.field]: parsedValue }
          : section
      ));

      // Scroll to section
      setTimeout(() => {
        const el = document.getElementById(`section-${suggestion.section_id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  useEffect(() => {
    if (isAuthenticated && quoteId) {
      fetchQuote();
    }
  }, [isAuthenticated, quoteId, fetchQuote]);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const updateStatus = async (status: string, declineReason?: string) => {
    if (!quote) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          decline_reason: declineReason,
          responded_at: ['accepted', 'declined'].includes(status) ? new Date().toISOString() : undefined,
        })
      });

      if (response.ok) {
        await fetchQuote();
      }
    } catch (error) {
      console.error('Error updating quote:', error);
    } finally {
      setUpdating(false);
    }
  };

  const copyAcceptLink = () => {
    if (quote?.accept_token) {
      const link = `${window.location.origin}/offerte/${quote.accept_token}`;
      navigator.clipboard.writeText(link);
      alert('Link gekopieerd naar klembord!');
    }
  };

  const sendEmail = async () => {
    if (!quote) return;
    if (!quote.leads?.email) {
      alert('Deze klant heeft geen emailadres');
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customMessage: emailMessage })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Email verstuurd naar ${quote.leads?.email}`);
        setShowEmailModal(false);
        setEmailMessage('');
        await fetchQuote();
      } else if (response.status === 422 && Array.isArray(data.blockingFlags)) {
        // C2.1: blocking-gate — leesbaar tonen wat er blokkeert.
        const lijst = data.blockingFlags
          .map((f: { message: string }) => `• ${f.message}`)
          .join('\n');
        alert(
          `Deze offerte kan nog niet verstuurd worden.\n\nBlokkerende vlaggen:\n${lijst}\n\nLos het probleem op en markeer de vlag als opgelost in het vlaggen-paneel.`
        );
      } else {
        alert('Fout bij verzenden: ' + (data.error || 'Onbekende fout'));
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Er ging iets mis bij het verzenden');
    } finally {
      setSendingEmail(false);
    }
  };

  // Modal handlers for editing
  const openEditCustomerModal = () => {
    if (!quote) return;
    showModal(
      <EditCustomerDetailsForm
        customer={{
          name: quote.leads?.name ?? '',
          email: quote.leads?.email ?? null,
          phone: quote.leads?.phone ?? null,
          address: quote.leads?.address ?? null,
          city: quote.leads?.city ?? '',
        }}
        onSave={async (updatedCustomer) => {
          const response = await fetch(`/api/admin/leads/${quote.lead_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCustomer),
          });
          if (!response.ok) throw new Error('Opslaan mislukt');
          await fetchQuote();
          hideModal();
        }}
        onClose={hideModal}
      />,
      'Klantgegevens Bewerken'
    );
  };

  const openEditProjectInfoModal = () => {
    if (!quote) return;
    showModal(
      <EditProjectInfoForm
        projectInfo={{
          project_description: quote.project_description,
          project_address: quote.project_address,
          valid_until: quote.valid_until,
          customer_notes: quote.customer_notes,
        }}
        onSave={async (updatedInfo) => {
          const response = await fetch(`/api/admin/quotes/${quoteId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedInfo),
          });
          if (!response.ok) throw new Error('Opslaan mislukt');
          await fetchQuote();
          hideModal();
        }}
        onClose={hideModal}
      />,
      'Projectgegevens Bewerken',
      { size: 'lg' }
    );
  };

  const openEditNotesModal = () => {
    if (!quote) return;
    showModal(
      <EditQuoteTextsForm
        texts={{
          customer_notes: quote.customer_notes,
        }}
        onSave={async (updatedTexts) => {
          const response = await fetch(`/api/admin/quotes/${quoteId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedTexts),
          });
          if (!response.ok) throw new Error('Opslaan mislukt');
          await fetchQuote();
          hideModal();
        }}
        onClose={hideModal}
      />,
      'Opmerkingen Bewerken'
    );
  };

  const openEditWorkDescriptionModal = () => {
    if (!quote) return;
    showModal(
      <EditWorkDescriptionForm
        data={{
          work_description: quote.work_description,
          work_description_image_url: quote.work_description_image_url,
        }}
        projectDescription={quote.project_description}
        sections={sections.map(s => ({
          title: s.title,
          line_items: s.line_items.map(li => ({ description: li.description })),
        }))}
        onSave={async (updatedData) => {
          const response = await fetch(`/api/admin/quotes/${quoteId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
          });
          if (!response.ok) throw new Error('Opslaan mislukt');
          await fetchQuote();
          hideModal();
        }}
        onClose={hideModal}
      />,
      'Werkomschrijving Bewerken',
      { size: 'lg' }
    );
  };

  const openEditConditionsModal = () => {
    if (!quote) return;
    showModal(
      <EditConditionsForm
        data={{
          override_conditions_uitgangspunten: quote.override_conditions_uitgangspunten,
          override_conditions_uitgesloten: quote.override_conditions_uitgesloten,
        }}
        defaultUitgangspunten={quoteSettings?.conditions_uitgangspunten || null}
        defaultUitgesloten={quoteSettings?.conditions_uitgesloten || null}
        onSave={async (updatedData) => {
          const response = await fetch(`/api/admin/quotes/${quoteId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
          });
          if (!response.ok) throw new Error('Opslaan mislukt');
          await fetchQuote();
          hideModal();
        }}
        onClose={hideModal}
      />,
      'Condities Bewerken',
      { size: 'lg' }
    );
  };

  const openEditPaymentScheduleModal = () => {
    if (!quote) return;
    showModal(
      <EditPaymentScheduleForm
        data={{
          override_payment_schedule: quote.override_payment_schedule,
        }}
        defaultSchedule={quoteSettings?.payment_schedule || []}
        quoteTotal={quote.total}
        onSave={async (updatedData) => {
          const response = await fetch(`/api/admin/quotes/${quoteId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
          });
          if (!response.ok) throw new Error('Opslaan mislukt');
          await fetchQuote();
          hideModal();
        }}
        onClose={hideModal}
      />,
      'Termijnschema Bewerken',
      { size: 'lg' }
    );
  };

  // Update quote section visibility
  const updateQuoteSection = async (field: string, value: boolean | string | object) => {
    if (!quote) return;
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (response.ok) {
        await fetchQuote();
      }
    } catch (error) {
      console.error('Error updating quote section:', error);
    }
  };

  // Get effective conditions (quote override or settings default)
  const getEffectiveConditions = () => {
    return {
      uitgangspunten: quote?.override_conditions_uitgangspunten || quoteSettings?.conditions_uitgangspunten || '',
      uitgesloten: quote?.override_conditions_uitgesloten || quoteSettings?.conditions_uitgesloten || '',
    };
  };

  // Get effective payment schedule (quote override or settings default)
  const getEffectivePaymentSchedule = () => {
    return quote?.override_payment_schedule || quoteSettings?.payment_schedule || [];
  };

  // Get effective spec settings (quote override or settings default)
  const getEffectiveSpecSettings = () => {
    return {
      showQuantities: quote?.spec_show_quantities ?? quoteSettings?.spec_show_quantities ?? true,
      showUnitPrice: quote?.spec_show_unit_price ?? quoteSettings?.spec_show_unit_price ?? true,
      showBtwColumn: quote?.spec_show_btw_column ?? quoteSettings?.spec_show_btw_column ?? false,
      showLineTotals: quote?.spec_show_line_totals ?? quoteSettings?.spec_show_line_totals ?? true,
      showGroupSubtotals: quote?.spec_show_group_subtotals ?? quoteSettings?.spec_show_group_subtotals ?? true,
    };
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
      draft: {
        label: 'Concept',
        color: 'text-gray-700',
        bg: 'bg-gray-100',
        icon: <FileText className="w-4 h-4" />
      },
      sent: {
        label: 'Verstuurd',
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        icon: <Send className="w-4 h-4" />
      },
      viewed: {
        label: 'Bekeken',
        color: 'text-purple-700',
        bg: 'bg-purple-100',
        icon: <Clock className="w-4 h-4" />
      },
      accepted: {
        label: 'Geaccepteerd',
        color: 'text-green-700',
        bg: 'bg-green-100',
        icon: <CheckCircle className="w-4 h-4" />
      },
      declined: {
        label: 'Afgewezen',
        color: 'text-red-700',
        bg: 'bg-red-100',
        icon: <XCircle className="w-4 h-4" />
      },
    };
    return statusMap[status] || statusMap.draft;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Laden...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!quote) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Offerte niet gevonden</p>
          <Link href="/admin/offertes">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Terug naar offertes
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const statusInfo = getStatusInfo(quote.status);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link
              href="/admin/offertes"
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Terug naar offertes
            </Link>
            <div className="flex items-center gap-3">
              {editingQuoteNumber ? (
                <input
                  autoFocus
                  value={quoteNumberDraft}
                  onChange={(e) => setQuoteNumberDraft(e.target.value)}
                  onBlur={saveQuoteNumber}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveQuoteNumber();
                    if (e.key === 'Escape') setEditingQuoteNumber(false);
                  }}
                  className="text-2xl font-bold text-gray-900 border-b-2 border-orange-400 bg-transparent outline-none w-48"
                />
              ) : (
                <h1
                  className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-orange-600 transition-colors"
                  title="Klik om offertenummer te bewerken"
                  onClick={() => {
                    setQuoteNumberDraft(quote.quote_number);
                    setEditingQuoteNumber(true);
                  }}
                >
                  {quote.quote_number}
                </h1>
              )}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                {statusInfo.icon}
                {statusInfo.label}
              </span>
            </div>
            <p className="text-gray-500">Aangemaakt op {formatDate(quote.created_at)}</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Edit/Preview Toggle */}
            {!editMode ? (
              <Button
                onClick={enterEditMode}
                style={{ backgroundColor: colors.orange }}
                className="hover:opacity-90 text-white"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Bewerken
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  style={{ borderColor: colors.mist, color: colors.dark }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={saveEditedSections}
                  disabled={saving}
                  style={{ backgroundColor: colors.success }}
                  className="hover:opacity-90 text-white"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Opslaan
                </Button>
              </>
            )}

            {/* PDF Download */}
            {!editMode && (
              <PDFDownloadButton quote={quote} sections={sections} overhead={overhead} settings={quoteSettings} />
            )}

            {/* Email Send */}
            {!editMode && quote.leads?.email && (
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(true)}
                disabled={sendingEmail}
                style={{ borderColor: colors.mist, color: colors.dark }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Verstuur per email
              </Button>
            )}

            {/* Status Actions */}
            {!editMode && quote.status === 'draft' && (
              <Button
                style={{ backgroundColor: colors.blue }}
                className="hover:opacity-90 text-white"
                onClick={() => setShowEmailModal(true)}
                disabled={updating || !quote.leads?.email}
              >
                <Send className="w-4 h-4 mr-2" />
                Verstuur offerte
              </Button>
            )}

            {quote.status === 'sent' && (
              <>
                <Button
                  style={{ backgroundColor: colors.success }}
                  className="hover:opacity-90 text-white"
                  onClick={() => updateStatus('accepted')}
                  disabled={updating}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Geaccepteerd
                </Button>
                <Button
                  variant="outline"
                  style={{ borderColor: colors.mist, color: '#ef4444' }}
                  className="hover:bg-red-50"
                  onClick={() => {
                    const reason = prompt('Reden van afwijzing:');
                    if (reason !== null) {
                      updateStatus('declined', reason);
                    }
                  }}
                  disabled={updating}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Afgewezen
                </Button>
              </>
            )}

            {/* Omzetten naar factuur - toon bij geaccepteerde offertes */}
            {!editMode && (quote.status === 'accepted' || quote.status === 'sent') && (
              <Button
                variant="outline"
                onClick={convertToInvoice}
                disabled={convertingToInvoice}
                style={{ borderColor: colors.orange, color: colors.orange }}
                className="hover:opacity-80"
              >
                {convertingToInvoice ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Euro className="w-4 h-4 mr-2" />
                )}
                Factuur aanmaken
              </Button>
            )}
          </div>
        </div>

        {/* Accept Link */}
        {quote.accept_token && (
          <Card style={{ backgroundColor: colors.blueLight, borderColor: colors.blue }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium" style={{ color: colors.dark }}>Klant acceptatie link</p>
                  <p className="text-sm" style={{ color: colors.blue }}>
                    Deel deze link met de klant om de offerte te bekijken en te accepteren
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyAcceptLink}
                    style={{ borderColor: colors.mist, color: colors.dark }}
                  >
                    <Copy className="w-4 h-4 mr-2" /> Kopieer link
                  </Button>
                  <Link href={`/offerte/${quote.accept_token}`} target="_blank">
                    <Button
                      size="sm"
                      style={{ backgroundColor: colors.blue }}
                      className="hover:opacity-90 text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" /> Open
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Mode - Show QuoteEditorTable with sidebar */}
        {editMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <QuoteEditorTable
                sections={editorSections}
                onSectionsChange={setEditorSections}
                pricing={pricing}
                aiSummary={quote.project_description || ''}
                onSave={saveEditedSections}
                onExportPDF={() => {}}
                isSaving={saving}
                customerName={quote.leads?.name}
                projectName={quote.project_description || ''}
              />
            </div>
            <div className="space-y-4 sticky top-16 self-start">
              <QuoteFlagsPanel quoteId={quoteId} />
              <QuoteCheckPanel
                quoteId={quoteId}
                onApplySuggestion={applySuggestion}
              />
              <QuoteVersionHistory
                quoteId={quoteId}
                onRestored={fetchQuote}
              />
            </div>
          </div>
        ) : (
          /* Preview Mode - Existing content */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Decline Reason */}
              {quote.decline_reason && (
              <Card className="bg-red-50 border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-700">Reden afwijzing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-600">{quote.decline_reason}</p>
                </CardContent>
              </Card>
            )}

            {/* Deddo-style Section Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: colors.dark }}>
                  <FileText className="w-5 h-5" style={{ color: colors.orange }} />
                  Offerte Secties
                </h2>
                <Link href="/admin/instellingen/offertes">
                  <Button
                    variant="outline"
                    size="sm"
                    style={{ borderColor: colors.mist, color: colors.dark }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Standaard instellingen
                  </Button>
                </Link>
              </div>

              {/* VOORBLAD - Always visible, not toggleable */}
              <Card className="border-2" style={{ borderColor: colors.orangeLight }}>
                <CardHeader style={{ backgroundColor: colors.orangeLight }}>
                  <CardTitle className="flex items-center gap-2" style={{ color: colors.dark }}>
                    <FileText className="w-5 h-5" style={{ color: colors.orange }} />
                    Voorblad
                    <span className="text-xs font-normal ml-2" style={{ color: colors.orange }}>(altijd zichtbaar)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Logo */}
                  {quoteSettings?.company_logo_url && (
                    <div className="flex justify-center">
                      <img
                        src={quoteSettings.company_logo_url}
                        alt={quoteSettings.company_name}
                        className="h-16 object-contain"
                      />
                    </div>
                  )}

                  {/* Company & Client details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-white p-3 rounded-lg" style={{ backgroundColor: colors.dark }}>
                      <p className="font-bold">{quoteSettings?.company_name || 'Klinkers & Co'}</p>
                      <p className="text-xs text-gray-300 mt-1">
                        {quoteSettings?.company_address}<br/>
                        Tel: {quoteSettings?.company_phone}<br/>
                        {quoteSettings?.company_email}
                      </p>
                    </div>
                    <div
                      className="p-3 rounded-lg cursor-pointer hover:opacity-80 transition-colors"
                      style={{ backgroundColor: colors.stone }}
                      onClick={openEditCustomerModal}
                    >
                      <p className="font-semibold" style={{ color: colors.dark }}>{quote.leads?.name || 'Geen klant gekoppeld'}</p>
                      <p className="text-xs" style={{ color: colors.slate }}>
                        {quote.project_address || quote.leads?.address || quote.leads?.city}<br/>
                        {quote.leads?.phone && <>Tel: {quote.leads?.phone}<br/></>}
                        {quote.leads?.email}
                      </p>
                    </div>
                  </div>

                  {/* Quote info */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm" style={{ color: colors.slate }}>{quoteSettings?.cover_betreft_prefix || 'Betreft:'}</p>
                      <p
                        className="font-medium cursor-pointer"
                        style={{ color: colors.dark }}
                        onClick={openEditProjectInfoModal}
                      >
                        {quote.project_description || 'Klik om projectomschrijving toe te voegen'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: colors.orange }}>OFFERTE</p>
                      <p className="font-semibold" style={{ color: colors.dark }}>{quote.quote_number}</p>
                      <p className="text-xs" style={{ color: colors.slate }}>
                        Versie: {quote.version || 1}<br/>
                        Datum: {formatDate(quote.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Intro text */}
                  {quoteSettings?.intro_text && (
                    <p className="text-sm italic border-l-2 pl-3" style={{ color: colors.slate, borderColor: colors.orange }}>
                      {quoteSettings.intro_text}
                    </p>
                  )}

                  {/* Totals preview */}
                  <div className="p-3 rounded-lg" style={{ backgroundColor: colors.stone }}>
                    <div className="flex justify-between text-sm" style={{ color: colors.dark }}>
                      <span>Subtotaal excl. BTW</span>
                      <span>{formatCurrency(quote.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm" style={{ color: colors.dark }}>
                      <span>BTW ({quote.btw_percentage}%)</span>
                      <span>{formatCurrency(quote.btw_amount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t" style={{ borderColor: colors.mist }}>
                      <span style={{ color: colors.dark }}>Totaal incl. BTW</span>
                      <span style={{ color: colors.orange }}>{formatCurrency(quote.total)}</span>
                    </div>
                  </div>

                  {/* Outro & signature */}
                  {quoteSettings?.outro_text && (
                    <p className="text-sm italic" style={{ color: colors.slate }}>{quoteSettings.outro_text}</p>
                  )}
                  {quoteSettings?.cover_signature_name && (
                    <p className="text-sm font-medium mt-2" style={{ color: colors.dark }}>
                      Met vriendelijke groet,<br/>
                      {quoteSettings.cover_signature_name}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* WERKOMSCHRIJVING - Toggle */}
              <SectionToggle
                title="Werkomschrijving"
                enabled={quote.show_section_werkomschrijving ?? quoteSettings?.show_section_werkomschrijving ?? true}
                onToggle={(enabled) => updateQuoteSection('show_section_werkomschrijving', enabled)}
                onEdit={openEditWorkDescriptionModal}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>AI-gegenereerde werkomschrijving</span>
                  </div>
                  {quote.work_description ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{quote.work_description}</p>
                  ) : (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                      <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-purple-700 font-medium">Geen werkomschrijving</p>
                      <p className="text-sm text-purple-600">
                        Klik om een AI-gegenereerde beschrijving toe te voegen
                      </p>
                    </div>
                  )}
                  {quote.work_description_image_url && (
                    <div className="mt-3">
                      <img
                        src={quote.work_description_image_url}
                        alt="Project afbeelding"
                        className="rounded-lg max-h-48 object-cover"
                      />
                    </div>
                  )}
                </div>
              </SectionToggle>

              {/* SPECIFICATIE - Toggle */}
              <SectionToggle
                title="Specificatie"
                enabled={quote.show_section_specificatie ?? quoteSettings?.show_section_specificatie ?? true}
                onToggle={(enabled) => updateQuoteSection('show_section_specificatie', enabled)}
                collapsible={false}
              >
                <div className="space-y-4">
                  {/* Column visibility toggles - Clickable */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuoteSection('spec_show_quantities', !getEffectiveSpecSettings().showQuantities);
                      }}
                      className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                        getEffectiveSpecSettings().showQuantities
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      Hoeveelheden {getEffectiveSpecSettings().showQuantities ? '✓' : '✗'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuoteSection('spec_show_unit_price', !getEffectiveSpecSettings().showUnitPrice);
                      }}
                      className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                        getEffectiveSpecSettings().showUnitPrice
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      Prijs/eenheid {getEffectiveSpecSettings().showUnitPrice ? '✓' : '✗'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuoteSection('spec_show_btw_column', !getEffectiveSpecSettings().showBtwColumn);
                      }}
                      className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                        getEffectiveSpecSettings().showBtwColumn
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      BTW kolom {getEffectiveSpecSettings().showBtwColumn ? '✓' : '✗'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuoteSection('spec_show_line_totals', !getEffectiveSpecSettings().showLineTotals);
                      }}
                      className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                        getEffectiveSpecSettings().showLineTotals
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      Regeltotalen {getEffectiveSpecSettings().showLineTotals ? '✓' : '✗'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuoteSection('spec_show_group_subtotals', !getEffectiveSpecSettings().showGroupSubtotals);
                      }}
                      className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                        getEffectiveSpecSettings().showGroupSubtotals
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      Groep subtotalen {getEffectiveSpecSettings().showGroupSubtotals ? '✓' : '✗'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuoteSection('spec_show_type_column', !quote.spec_show_type_column);
                      }}
                      className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                        quote.spec_show_type_column
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      A/M type {quote.spec_show_type_column ? '✓' : '✗'}
                    </button>
                  </div>

                  {/* A/M Legend */}
                  {quote.spec_show_type_column && (
                    <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded">
                      <span className="font-medium">Legenda:</span>
                      <span className="flex items-center gap-1">
                        <span className="w-5 h-4 bg-blue-100 text-blue-700 rounded text-[10px] font-bold flex items-center justify-center">A</span>
                        = Arbeid
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-5 h-4 bg-green-100 text-green-700 rounded text-[10px] font-bold flex items-center justify-center">M</span>
                        = Materiaal
                      </span>
                    </div>
                  )}

                  {/* Sections with items - Expanded by default */}
                  {sections.length > 0 ? (
                    sections.map((section) => (
                      <div key={section.id} className="border rounded-lg overflow-hidden" style={{ borderColor: colors.mist }}>
                        <div className="flex justify-between items-center p-3" style={{ backgroundColor: colors.stone }}>
                          <p className="font-semibold" style={{ color: colors.dark }}>{section.title}</p>
                          <p className="font-medium" style={{ color: colors.orange }}>{formatCurrency(section.subtotal)}</p>
                        </div>
                        {section.line_items && section.line_items.length > 0 && (
                          <div className="p-3">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b text-left text-gray-500 text-xs">
                                  {quote.spec_show_type_column && (
                                    <th className="pb-2 font-medium w-10">Type</th>
                                  )}
                                  <th className="pb-2 font-medium">Omschrijving</th>
                                  {getEffectiveSpecSettings().showQuantities && (
                                    <>
                                      <th className="pb-2 font-medium text-center">Aantal</th>
                                      <th className="pb-2 font-medium text-center">Eenheid</th>
                                    </>
                                  )}
                                  {getEffectiveSpecSettings().showUnitPrice && (
                                    <th className="pb-2 font-medium text-right">Prijs</th>
                                  )}
                                  {getEffectiveSpecSettings().showLineTotals && (
                                    <th className="pb-2 font-medium text-right">Totaal</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {section.line_items.map((item, index) => (
                                  <tr key={item.id} className={`border-b last:border-0 ${index % 2 === 1 ? 'bg-gray-50' : ''}`}>
                                    {quote.spec_show_type_column && (
                                      <td className="py-2">
                                        <span className={`w-6 h-5 rounded text-[10px] font-bold flex items-center justify-center ${
                                          item.line_type === 'materiaal'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          {item.line_type === 'materiaal' ? 'M' : 'A'}
                                        </span>
                                      </td>
                                    )}
                                    <td className="py-2">{item.description}</td>
                                    {getEffectiveSpecSettings().showQuantities && (
                                      <>
                                        <td className="py-2 text-center">{item.quantity}</td>
                                        <td className="py-2 text-center text-gray-500">{item.unit}</td>
                                      </>
                                    )}
                                    {getEffectiveSpecSettings().showUnitPrice && (
                                      <td className="py-2 text-right">{formatCurrency(item.unit_price)}</td>
                                    )}
                                    {getEffectiveSpecSettings().showLineTotals && (
                                      <td className="py-2 text-right font-medium">{formatCurrency(item.total_price || item.total)}</td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {getEffectiveSpecSettings().showGroupSubtotals && (
                              <div className="flex justify-end mt-2 pt-2 border-t" style={{ borderColor: colors.mist }}>
                                <span className="text-sm mr-4" style={{ color: colors.slate }}>Subtotaal:</span>
                                <span className="font-semibold" style={{ color: colors.orange }}>{formatCurrency(section.subtotal)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 italic text-center py-4">Geen specificatie items</p>
                  )}

                  {/* Overhead / Staartkosten */}
                  {overhead.length > 0 && (
                    <div className="border border-amber-200 rounded-lg overflow-hidden">
                      <div className="flex justify-between items-center p-3 bg-amber-100">
                        <p className="font-semibold text-amber-800 flex items-center gap-2">
                          <HardHat className="w-4 h-4" /> Staartkosten
                        </p>
                        <p className="text-amber-700 font-medium">
                          {formatCurrency(overhead.reduce((sum, item) => sum + item.calculated_amount, 0))}
                        </p>
                      </div>
                      <div className="p-3">
                        {overhead.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm py-1">
                            <span className="text-amber-800">
                              {item.name} {item.overhead_type === 'percentage' && `(${item.value}%)`}
                            </span>
                            <span className="font-medium text-amber-700">{formatCurrency(item.calculated_amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="text-white rounded-lg p-4" style={{ backgroundColor: colors.dark }}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Subtotaal excl. BTW</span>
                      <span>{formatCurrency(quote.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>BTW ({quote.btw_percentage}%)</span>
                      <span>{formatCurrency(quote.btw_amount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ borderColor: colors.darkLight }}>
                      <span>Totaal incl. BTW</span>
                      <span style={{ color: colors.orange }}>{formatCurrency(quote.total)}</span>
                    </div>
                  </div>
                </div>
              </SectionToggle>

              {/* CONDITIES - Toggle */}
              <SectionToggle
                title="Condities"
                enabled={quote.show_section_condities ?? quoteSettings?.show_section_condities ?? true}
                onToggle={(enabled) => updateQuoteSection('show_section_condities', enabled)}
                onEdit={openEditConditionsModal}
              >
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-green-600" />
                      Uitgangspunten
                    </p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      {getEffectiveConditions().uitgangspunten ? (
                        <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                          {getEffectiveConditions().uitgangspunten.split('\n').filter(Boolean).map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-gray-400 italic text-sm">Geen uitgangspunten gedefinieerd</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      Uitgesloten werkzaamheden
                    </p>
                    <div className="bg-red-50 rounded-lg p-3">
                      {getEffectiveConditions().uitgesloten ? (
                        <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                          {getEffectiveConditions().uitgesloten.split('\n').filter(Boolean).map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-gray-400 italic text-sm">Geen uitgesloten werkzaamheden gedefinieerd</p>
                      )}
                    </div>
                  </div>
                </div>
              </SectionToggle>

              {/* TERMIJNSCHEMA - Toggle */}
              <SectionToggle
                title="Termijnschema"
                enabled={quote.show_section_termijnschema ?? quoteSettings?.show_section_termijnschema ?? true}
                onToggle={(enabled) => updateQuoteSection('show_section_termijnschema', enabled)}
                onEdit={openEditPaymentScheduleModal}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>Betalingstermijnen</span>
                  </div>

                  {getEffectivePaymentSchedule().length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="pb-2">Termijn</th>
                          <th className="pb-2">Omschrijving</th>
                          <th className="pb-2 text-right">%</th>
                          <th className="pb-2 text-right">Bedrag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                        const scheduleAmounts = computeScheduleAmounts(
                          quote.total,
                          getEffectivePaymentSchedule().map((item) => item.percentage)
                        );
                        return getEffectivePaymentSchedule().map((item, index) => {
                          const amount = scheduleAmounts[index];
                          return (
                            <tr key={index} className="border-b">
                              <td className="py-2">{item.termijn}</td>
                              <td className="py-2">{item.omschrijving}</td>
                              <td className="py-2 text-right">{item.percentage}%</td>
                              <td className="py-2 text-right font-medium">{formatCurrency(amount)}</td>
                            </tr>
                          );
                        });
                        })()}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold" style={{ color: colors.dark }}>
                          <td colSpan={2} className="pt-2">Totaal</td>
                          <td className="pt-2 text-right">
                            {getEffectivePaymentSchedule().reduce((sum, item) => sum + item.percentage, 0)}%
                          </td>
                          <td className="pt-2 text-right" style={{ color: colors.orange }}>{formatCurrency(quote.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  ) : (
                    <p className="text-gray-400 italic text-center py-4">Geen termijnschema gedefinieerd</p>
                  )}
                </div>
              </SectionToggle>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 sticky top-16 self-start">
            {/* Customer Info - Clickable */}
            <Card className="group">
              <CardHeader
                className="cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg"
                onClick={openEditCustomerModal}
              >
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Klantgegevens
                  </span>
                  <Pencil className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded transition-colors"
                  onClick={openEditCustomerModal}
                >
                  <p className="font-semibold text-lg">{quote.leads?.name || 'Geen klant gekoppeld'}</p>
                  {quote.leads?.city && (
                    <p className="text-sm text-gray-500">{quote.leads?.city}</p>
                  )}
                </div>

                {quote.leads?.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-600">{quote.leads?.address}</span>
                  </div>
                )}

                {quote.leads?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a
                      href={`tel:${quote.leads?.phone}`}
                      className="text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {quote.leads?.phone}
                    </a>
                  </div>
                )}

                {quote.leads?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a
                      href={`mailto:${quote.leads?.email}`}
                      className="text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {quote.leads?.email}
                    </a>
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 hover:opacity-90 text-white"
                    style={{ backgroundColor: colors.orange }}
                    onClick={openEditCustomerModal}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Bewerken
                  </Button>
                  <Link href={`/admin/leads/${quote.lead_id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      style={{ borderColor: colors.mist, color: colors.dark }}
                    >
                      Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quote Details */}
            <Card>
              <CardHeader>
                <CardTitle>Offerte details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Offertenummer</span>
                  <span className="font-medium">{quote.quote_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Aangemaakt</span>
                  <span>{formatDate(quote.created_at)}</span>
                </div>
                {quote.valid_until && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Geldig tot</span>
                    <span>{formatDate(quote.valid_until)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  style={{ backgroundColor: colors.orange }}
                  className="w-full justify-start hover:opacity-90 text-white"
                  onClick={enterEditMode}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Offerte bewerken
                </Button>

                {quote.leads?.phone && (
                  <a href={`https://wa.me/${quote.leads?.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="outline"
                      className="w-full justify-start hover:opacity-90"
                      style={{ color: colors.success, borderColor: colors.mist }}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      WhatsApp versturen
                    </Button>
                  </a>
                )}

                {quote.leads?.email && (
                  <a href={`mailto:${quote.leads?.email}?subject=Offerte ${quote.quote_number}&body=Beste ${quote.leads?.name},%0A%0AHierbij stuur ik u de offerte voor uw tuinproject.%0A%0AMet vriendelijke groet,%0ANiek Klinkers%0AKlinkers %26 Co`}>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      style={{ borderColor: colors.mist, color: colors.dark }}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email versturen
                    </Button>
                  </a>
                )}

                <div className="border-t pt-2 mt-2" style={{ borderColor: colors.mist }}>
                  <Link href="/admin/instellingen/offertes">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      style={{ borderColor: colors.mist, color: colors.slate }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      PDF Instellingen
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Pipeline-vlaggen (C2.1): zichtbaar op het verzendmoment */}
            <QuoteFlagsPanel quoteId={quoteId} />

            {/* Offerte check */}
            <QuoteCheckPanel
              quoteId={quoteId}
              onApplySuggestion={applySuggestion}
            />

            {/* Versiegeschiedenis */}
            <QuoteVersionHistory
              quoteId={quoteId}
              onRestored={fetchQuote}
            />
          </div>
        </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Offerte versturen per email</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailMessage('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Verzenden naar:</p>
                <p className="font-medium">{quote.leads?.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Persoonlijk bericht (optioneel)
                </label>
                <Textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Voeg een persoonlijk bericht toe aan de email..."
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dit bericht wordt boven de offerte details getoond.
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  De email bevat:
                </p>
                <ul className="text-sm text-gray-500 mt-1 space-y-1">
                  <li>• Offerte {quote.quote_number}</li>
                  <li>• Alle secties met items</li>
                  <li>• Staartkosten en totalen</li>
                  <li>• Link om online te bekijken</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t" style={{ backgroundColor: colors.stone, borderColor: colors.mist }}>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailMessage('');
                }}
                style={{ borderColor: colors.mist, color: colors.dark }}
              >
                Annuleren
              </Button>
              <Button
                style={{ backgroundColor: colors.orange }}
                className="hover:opacity-90 text-white"
                onClick={sendEmail}
                disabled={sendingEmail}
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verzenden...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Verstuur email
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
