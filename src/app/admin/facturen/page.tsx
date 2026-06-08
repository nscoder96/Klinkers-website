'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { FileText, Euro, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

const colors = {
  orange: '#FA5D29',
  dark: '#222222',
  slate: '#64748b',
  mist: '#ededed',
  stone: '#F8F8F8',
};

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  vat_amount: number;
  total: number;
  status: string;
  lead_name?: string;
  lead_city?: string;
  created_at: string;
  paid_at?: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft: { label: 'Concept', color: 'text-gray-600', bg: 'bg-gray-100', icon: <FileText className="w-3.5 h-3.5" /> },
  sent: { label: 'Verstuurd', color: 'text-blue-700', bg: 'bg-blue-100', icon: <Clock className="w-3.5 h-3.5" /> },
  paid: { label: 'Betaald', color: 'text-green-700', bg: 'bg-green-100', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  overdue: { label: 'Verlopen', color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: 'Geannuleerd', color: 'text-gray-500', bg: 'bg-gray-100', icon: <XCircle className="w-3.5 h-3.5" /> },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
}

export default function FacturenPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [facturen, setFacturen] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/admin/facturen')
      .then(r => r.json())
      .then(data => setFacturen(data.facturen || []))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Laden...</div>
        </div>
      </AdminLayout>
    );
  }

  const filtered = filter === 'all' ? facturen : facturen.filter(f => f.status === filter);

  const totalOpen = facturen
    .filter(f => f.status === 'sent' || f.status === 'overdue')
    .reduce((sum, f) => sum + f.total, 0);
  const totalPaid = facturen
    .filter(f => f.status === 'paid')
    .reduce((sum, f) => sum + f.total, 0);

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.dark }}>Facturen</h1>
            <p className="text-sm mt-0.5" style={{ color: colors.slate }}>Overzicht van alle facturen</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: colors.mist }}>
            <div className="text-xs font-medium mb-1" style={{ color: colors.slate }}>Openstaand</div>
            <div className="text-xl font-bold" style={{ color: '#ef4444' }}>{formatCurrency(totalOpen)}</div>
            <div className="text-xs mt-0.5" style={{ color: colors.slate }}>
              {facturen.filter(f => f.status === 'sent' || f.status === 'overdue').length} facturen
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: colors.mist }}>
            <div className="text-xs font-medium mb-1" style={{ color: colors.slate }}>Betaald</div>
            <div className="text-xl font-bold" style={{ color: '#22c55e' }}>{formatCurrency(totalPaid)}</div>
            <div className="text-xs mt-0.5" style={{ color: colors.slate }}>
              {facturen.filter(f => f.status === 'paid').length} facturen
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: colors.mist }}>
            <div className="text-xs font-medium mb-1" style={{ color: colors.slate }}>Totaal facturen</div>
            <div className="text-xl font-bold" style={{ color: colors.dark }}>{facturen.length}</div>
            <div className="text-xs mt-0.5" style={{ color: colors.slate }}>Alle statussen</div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { key: 'all', label: 'Alle' },
            { key: 'draft', label: 'Concept' },
            { key: 'sent', label: 'Verstuurd' },
            { key: 'overdue', label: 'Verlopen' },
            { key: 'paid', label: 'Betaald' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border'
              }`}
              style={filter === tab.key ? { backgroundColor: colors.orange } : { borderColor: colors.mist }}
            >
              {tab.label}
              {tab.key !== 'all' && (
                <span className="ml-1.5 text-xs opacity-75">
                  ({facturen.filter(f => f.status === tab.key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: colors.mist }}>
            <Euro className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Geen facturen gevonden</p>
            <p className="text-sm text-gray-400 mt-1">
              Maak een factuur aan vanuit een geaccepteerde offerte
            </p>
            <Link href="/admin/offertes" className="mt-4 inline-block">
              <Button style={{ backgroundColor: colors.orange }} className="text-white hover:opacity-90 mt-4">
                Naar offertes
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: colors.mist }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: colors.mist, backgroundColor: colors.stone }}>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Nummer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Klant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Datum</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Vervaldatum</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Bedrag</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((invoice, i) => {
                  const status = statusConfig[invoice.status] || statusConfig.draft;
                  const isOverdue = invoice.status === 'sent' && new Date(invoice.due_date) < new Date();
                  const effectiveStatus = isOverdue ? statusConfig.overdue : status;

                  return (
                    <tr
                      key={invoice.id}
                      className={`border-b hover:bg-gray-50 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}
                      style={{ borderColor: colors.mist }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: colors.dark }}>
                        {invoice.invoice_number}
                      </td>
                      <td className="px-4 py-3" style={{ color: colors.dark }}>
                        <div className="font-medium">{invoice.lead_name || '—'}</div>
                        {invoice.lead_city && (
                          <div className="text-xs" style={{ color: colors.slate }}>{invoice.lead_city}</div>
                        )}
                      </td>
                      <td className="px-4 py-3" style={{ color: colors.slate }}>
                        {formatDate(invoice.invoice_date)}
                      </td>
                      <td className="px-4 py-3" style={{ color: isOverdue ? '#ef4444' : colors.slate }}>
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold" style={{ color: colors.dark }}>
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${effectiveStatus.color} ${effectiveStatus.bg}`}>
                          {effectiveStatus.icon}
                          {effectiveStatus.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/facturen/${invoice.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
