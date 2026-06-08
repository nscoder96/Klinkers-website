'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Save,
  Send,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  FileText,
  User,
  MapPin,
  Phone,
  Mail,
  Euro,
  Calendar,
} from 'lucide-react';
import InvoicePDFDownloadButton from '@/components/pdf/InvoicePDFDownloadButton';
import type { CompanySettings } from '@/components/pdf/InvoicePDF';

const colors = {
  orange: '#FA5D29',
  orangeLight: '#FFF4F1',
  dark: '#222222',
  slate: '#64748b',
  stone: '#F8F8F8',
  mist: '#ededed',
  success: '#22c55e',
  successLight: '#f0fdf4',
};

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  line_type: 'arbeid' | 'materiaal';
  vat_rate: number;
}

interface Section {
  id: string;
  title: string;
  display_order: number;
  line_items: LineItem[];
}

interface Lead {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string;
}

interface Quote {
  quote_number: string;
  project_description: string | null;
  project_address: string | null;
  leads: Lead;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  vat_amount: number;
  total: number;
  status: string;
  sections: Section[];
  notes: string | null;
  internal_notes: string | null;
  quotes: Quote | null;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Concept', color: 'text-gray-600', bg: 'bg-gray-100' },
  sent: { label: 'Verstuurd', color: 'text-blue-700', bg: 'bg-blue-100' },
  paid: { label: 'Betaald', color: 'text-green-700', bg: 'bg-green-100' },
  overdue: { label: 'Verlopen', color: 'text-red-700', bg: 'bg-red-100' },
  cancelled: { label: 'Geannuleerd', color: 'text-gray-500', bg: 'bg-gray-100' },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function newLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unit: 'st',
    unit_price: 0,
    total_price: 0,
    line_type: 'arbeid',
    vat_rate: 21,
  };
}

export default function FactuurDetailPage() {
  const params = useParams();
  const router = useRouter();
  const factuurId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  const fetchInvoice = useCallback(async () => {
    try {
      const [invoiceRes, settingsRes] = await Promise.all([
        fetch(`/api/admin/facturen/${factuurId}`),
        fetch('/api/admin/quote-settings'),
      ]);
      if (invoiceRes.ok) {
        const data = await invoiceRes.json();
        setInvoice(data.invoice);
        setSections(data.invoice.sections || []);
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.settings) {
          setCompanySettings({
            company_name: data.settings.company_name,
            company_phone: data.settings.company_phone,
            company_email: data.settings.company_email,
            company_address: data.settings.company_address,
            company_iban: data.settings.company_iban,
            payment_terms: data.settings.payment_terms,
          });
        }
      }
    } catch (e) {
      console.error('Error fetching invoice:', e);
    } finally {
      setLoading(false);
    }
  }, [factuurId]);

  useEffect(() => {
    if (isAuthenticated) fetchInvoice();
  }, [isAuthenticated, fetchInvoice]);

  // Recalculate section subtotals + invoice totals
  const recalculate = useCallback((updatedSections: Section[]) => {
    return updatedSections.map(section => ({
      ...section,
      line_items: section.line_items.map(item => ({
        ...item,
        total_price: Math.round(item.quantity * item.unit_price * 100) / 100,
      })),
    }));
  }, []);

  const updateItem = (sectionId: string, itemId: string, field: keyof LineItem, value: string | number) => {
    setSections(prev => {
      const updated = prev.map(section => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          line_items: section.line_items.map(item => {
            if (item.id !== itemId) return item;
            const updatedItem = { ...item, [field]: value };
            updatedItem.total_price = Math.round(updatedItem.quantity * updatedItem.unit_price * 100) / 100;
            return updatedItem;
          }),
        };
      });
      setHasChanges(true);
      return updated;
    });
  };

  const addItem = (sectionId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return { ...section, line_items: [...section.line_items, newLineItem()] };
    }));
    setHasChanges(true);
  };

  const removeItem = (sectionId: string, itemId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return { ...section, line_items: section.line_items.filter(i => i.id !== itemId) };
    }));
    setHasChanges(true);
  };

  const addSection = () => {
    setSections(prev => [
      ...prev,
      { id: crypto.randomUUID(), title: 'Nieuwe sectie', display_order: prev.length + 1, line_items: [newLineItem()] },
    ]);
    setHasChanges(true);
  };

  const removeSection = (sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
    setHasChanges(true);
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, title } : s));
    setHasChanges(true);
  };

  const save = async () => {
    if (!invoice) return;
    setSaving(true);
    try {
      const recalculated = recalculate(sections);
      const res = await fetch(`/api/admin/facturen/${factuurId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: recalculated }),
      });
      if (res.ok) {
        const data = await res.json();
        setInvoice(data.invoice);
        setSections(data.invoice.sections || []);
        setHasChanges(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!invoice) return;
    const res = await fetch(`/api/admin/facturen/${factuurId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, ...(newStatus === 'paid' ? { paid_at: new Date().toISOString() } : {}) }),
    });
    if (res.ok) {
      const data = await res.json();
      setInvoice(data.invoice);
    }
  };

  // Computed totals from current sections
  const allItems = sections.flatMap(s => s.line_items);
  const subtotal = allItems.reduce((sum, item) => sum + Math.round(item.quantity * item.unit_price * 100) / 100, 0);
  const vatAmount = allItems.reduce((sum, item) => sum + (Math.round(item.quantity * item.unit_price * 100) / 100) * ((item.vat_rate || 21) / 100), 0);
  const total = subtotal + vatAmount;

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  if (!invoice) {
    return (
      <AdminLayout>
        <div className="p-6 text-center">
          <p className="text-gray-500">Factuur niet gevonden</p>
          <Link href="/admin/facturen"><Button className="mt-4">Terug naar facturen</Button></Link>
        </div>
      </AdminLayout>
    );
  }

  const lead = invoice.quotes?.leads;
  const quote = invoice.quotes;
  const status = statusConfig[invoice.status] || statusConfig.draft;

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/facturen">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold" style={{ color: colors.dark }}>{invoice.invoice_number}</h1>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color} ${status.bg}`}>
                  {status.label}
                </span>
              </div>
              {quote && (
                <p className="text-sm mt-0.5" style={{ color: colors.slate }}>
                  Vanuit offerte {quote.quote_number}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {hasChanges && (
              <Button
                onClick={save}
                disabled={saving}
                style={{ backgroundColor: colors.orange }}
                className="text-white hover:opacity-90"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Opslaan
              </Button>
            )}
            {!hasChanges && (
              <InvoicePDFDownloadButton
                invoice={{ ...invoice, sections }}
                settings={companySettings}
              />
            )}
            {invoice.status === 'draft' && !hasChanges && (
              <Button
                onClick={() => updateStatus('sent')}
                style={{ backgroundColor: '#3b82f6' }}
                className="text-white hover:opacity-90"
              >
                <Send className="w-4 h-4 mr-2" />
                Verstuur factuur
              </Button>
            )}
            {invoice.status === 'sent' && (
              <Button
                onClick={() => updateStatus('paid')}
                style={{ backgroundColor: colors.success }}
                className="text-white hover:opacity-90"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Markeer als betaald
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Line items editor */}
          <div className="lg:col-span-2 space-y-4">
            {sections.map(section => (
              <div key={section.id} className="bg-white rounded-xl border" style={{ borderColor: colors.mist }}>
                {/* Section header */}
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.mist }}>
                  <input
                    value={section.title}
                    onChange={e => updateSectionTitle(section.id, e.target.value)}
                    className="font-semibold text-sm bg-transparent border-none outline-none flex-1"
                    style={{ color: colors.dark }}
                  />
                  <button
                    onClick={() => removeSection(section.id)}
                    className="text-gray-400 hover:text-red-400 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium bg-gray-50" style={{ color: colors.slate }}>
                  <div className="col-span-4">Omschrijving</div>
                  <div className="col-span-1 text-center">Type</div>
                  <div className="col-span-2 text-right">Aantal</div>
                  <div className="col-span-1 text-center">Eenh.</div>
                  <div className="col-span-2 text-right">Prijs</div>
                  <div className="col-span-1 text-right">Totaal</div>
                  <div className="col-span-1" />
                </div>

                {/* Line items */}
                {section.line_items.map(item => {
                  const itemTotal = Math.round(item.quantity * item.unit_price * 100) / 100;
                  return (
                    <div key={item.id} className="grid grid-cols-12 gap-2 px-4 py-2 border-t items-center text-sm" style={{ borderColor: colors.mist }}>
                      <div className="col-span-4">
                        <input
                          value={item.description}
                          onChange={e => updateItem(section.id, item.id, 'description', e.target.value)}
                          className="w-full text-sm border rounded px-2 py-1 outline-none focus:ring-1"
                          style={{ borderColor: colors.mist }}
                          placeholder="Omschrijving..."
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => updateItem(section.id, item.id, 'line_type', item.line_type === 'arbeid' ? 'materiaal' : 'arbeid')}
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            item.line_type === 'arbeid'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {item.line_type === 'arbeid' ? 'A' : 'M'}
                        </button>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateItem(section.id, item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full text-sm border rounded px-2 py-1 outline-none focus:ring-1 text-right"
                          style={{ borderColor: colors.mist }}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-1">
                        <select
                          value={item.unit}
                          onChange={e => updateItem(section.id, item.id, 'unit', e.target.value)}
                          className="w-full text-xs border rounded px-1 py-1 outline-none"
                          style={{ borderColor: colors.mist }}
                        >
                          {['st', 'm²', 'm', 'm³', 'uur', 'dag', 'ls'].map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={e => updateItem(section.id, item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-full text-sm border rounded pl-5 pr-2 py-1 outline-none focus:ring-1 text-right"
                            style={{ borderColor: colors.mist }}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div className="col-span-1 text-right text-sm font-medium" style={{ color: colors.dark }}>
                        {formatCurrency(itemTotal)}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => removeItem(section.id, item.id)}
                          className="text-gray-300 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add item */}
                <div className="px-4 py-2 border-t" style={{ borderColor: colors.mist }}>
                  <button
                    onClick={() => addItem(section.id)}
                    className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity"
                    style={{ color: colors.orange }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Regel toevoegen
                  </button>
                </div>

                {/* Section subtotal */}
                <div className="flex items-center justify-between px-4 py-2 rounded-b-xl" style={{ backgroundColor: colors.stone }}>
                  <span className="text-xs text-gray-500">Subtotaal sectie</span>
                  <span className="text-sm font-semibold" style={{ color: colors.dark }}>
                    {formatCurrency(section.line_items.reduce((s, i) => s + Math.round(i.quantity * i.unit_price * 100) / 100, 0))}
                  </span>
                </div>
              </div>
            ))}

            {/* Add section */}
            <button
              onClick={addSection}
              className="w-full py-3 border-2 border-dashed rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-70 transition-opacity"
              style={{ borderColor: colors.mist, color: colors.slate }}
            >
              <Plus className="w-4 h-4" />
              Sectie toevoegen
            </button>
          </div>

          {/* Right: Info panel */}
          <div className="space-y-4">
            {/* Totals */}
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: colors.mist }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: colors.dark }}>Totalen</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: colors.slate }}>Subtotaal</span>
                  <span style={{ color: colors.dark }}>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.slate }}>BTW (21%)</span>
                  <span style={{ color: colors.dark }}>{formatCurrency(vatAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-bold text-base" style={{ borderColor: colors.mist }}>
                  <span style={{ color: colors.dark }}>Totaal incl. BTW</span>
                  <span style={{ color: colors.orange }}>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Arbeid / Materiaal split */}
              <div className="mt-3 pt-3 border-t space-y-1" style={{ borderColor: colors.mist }}>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                    <span style={{ color: colors.slate }}>Arbeid</span>
                  </span>
                  <span style={{ color: colors.slate }}>
                    {formatCurrency(allItems.filter(i => i.line_type === 'arbeid').reduce((s, i) => s + Math.round(i.quantity * i.unit_price * 100) / 100, 0))}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                    <span style={{ color: colors.slate }}>Materiaal</span>
                  </span>
                  <span style={{ color: colors.slate }}>
                    {formatCurrency(allItems.filter(i => i.line_type === 'materiaal').reduce((s, i) => s + Math.round(i.quantity * i.unit_price * 100) / 100, 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Invoice info */}
            <div className="bg-white rounded-xl border p-4 space-y-3" style={{ borderColor: colors.mist }}>
              <h3 className="text-sm font-semibold" style={{ color: colors.dark }}>Factuurgegevens</h3>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: colors.slate }} />
                <div>
                  <div className="text-xs" style={{ color: colors.slate }}>Factuurdatum</div>
                  <div style={{ color: colors.dark }}>{formatDate(invoice.invoice_date)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Euro className="w-4 h-4 flex-shrink-0" style={{ color: colors.slate }} />
                <div>
                  <div className="text-xs" style={{ color: colors.slate }}>Vervaldatum</div>
                  <div style={{ color: new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' ? '#ef4444' : colors.dark }}>
                    {formatDate(invoice.due_date)}
                  </div>
                </div>
              </div>
              {invoice.notes && (
                <div className="pt-2 border-t text-xs" style={{ borderColor: colors.mist, color: colors.slate }}>
                  <div className="font-medium mb-1">Notitie</div>
                  <div>{invoice.notes}</div>
                </div>
              )}
            </div>

            {/* Klantgegevens */}
            {lead && (
              <div className="bg-white rounded-xl border p-4 space-y-2" style={{ borderColor: colors.mist }}>
                <h3 className="text-sm font-semibold" style={{ color: colors.dark }}>Klant</h3>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.slate }} />
                  <span style={{ color: colors.dark }}>{lead.name}</span>
                </div>
                {lead.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.slate }} />
                    <span style={{ color: colors.slate }}>{lead.address}, {lead.city}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.slate }} />
                    <span style={{ color: colors.slate }}>{lead.phone}</span>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.slate }} />
                    <span style={{ color: colors.slate }}>{lead.email}</span>
                  </div>
                )}
              </div>
            )}

            {/* Projectinfo */}
            {quote?.project_description && (
              <div className="bg-white rounded-xl border p-4" style={{ borderColor: colors.mist }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: colors.dark }}>Project</h3>
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: colors.slate }} />
                  <span style={{ color: colors.slate }}>{quote.project_description}</span>
                </div>
                {quote.project_address && (
                  <div className="flex items-center gap-2 text-sm mt-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.slate }} />
                    <span style={{ color: colors.slate }}>{quote.project_address}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
