'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Trash2,
  Leaf,
  Plus,
  Search,
  Filter,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Eye
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Quote {
  id: string;
  quote_number: string;
  lead_id: string;
  lead_name?: string;
  lead_city?: string;
  project_description: string | null;
  total: number;
  status: string;
  created_at: string;
  valid_until: string | null;
  decline_reason: string | null;
}

export default function OffertesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuotes();
    }
  }, [isAuthenticated]);

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/admin/quotes');
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, declineReason?: string) => {
    try {
      const response = await fetch(`/api/admin/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          decline_reason: declineReason,
          responded_at: ['accepted', 'declined'].includes(status) ? new Date().toISOString() : undefined,
        })
      });

      if (response.ok) {
        await fetchQuotes();
      }
    } catch (error) {
      console.error('Error updating quote:', error);
    }
  };

  const deleteQuote = async (id: string, quoteNumber: string) => {
    if (!confirm(`Weet je zeker dat je offerte ${quoteNumber} wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/quotes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchQuotes();
      } else {
        const data = await response.json();
        alert(data.error || 'Kon offerte niet verwijderen');
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Er ging iets mis bij het verwijderen');
    }
  };

  const filteredQuotes = quotes.filter(q => {
    const matchesFilter = filter === 'all' || q.status === filter;
    const matchesSearch =
      q.quote_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.lead_name && q.lead_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.lead_city && q.lead_city.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    sent: quotes.filter(q => q.status === 'sent').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
    declined: quotes.filter(q => q.status === 'declined').length,
  };

  const totalValue = quotes.reduce((sum, q) => sum + (Number(q.total) || 0), 0);
  const acceptedValue = quotes.filter(q => q.status === 'accepted')
    .reduce((sum, q) => sum + (Number(q.total) || 0), 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Offertes</h1>
            <p className="text-slate-500">Beheer je uitstaande offertes en maak nieuwe aan.</p>
          </div>
          <Link href="/admin/offertes/nieuw">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5">
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Offerte
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Totaal Offertes" value={quotes.length.toString()} icon={FileText} className="bg-white" />
          <StatCard title="Totale Waarde" value={`€${totalValue.toLocaleString('nl-NL')}`} icon={Filter} className="bg-white" />
          <StatCard
            title="Geaccepteerd"
            value={statusCounts.accepted.toString()}
            subValue={`${((statusCounts.accepted / quotes.length) * 100 || 0).toFixed(0)}% conversie`}
            icon={CheckCircle}
            className="bg-green-50 border-green-100 text-green-900"
            iconClass="text-green-600"
          />
          <StatCard
            title="Omzet"
            value={`€${acceptedValue.toLocaleString('nl-NL')}`}
            icon={Leaf}
            className="bg-orange-50 border-orange-100 text-orange-900"
            iconClass="text-orange-600"
          />
        </div>

        {/* Main Content Area */}
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">

          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
            {/* Segmented Control */}
            <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
              {[
                { id: 'all', label: 'Alles' },
                { id: 'draft', label: 'Concept' },
                { id: 'sent', label: 'Verstuurd' },
                { id: 'accepted', label: 'Geaccepteerd' },
                { id: 'declined', label: 'Afgewezen' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`
                                 px-4 py-1.5 text-sm font-medium rounded-md transition-all
                                 ${filter === tab.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                    }
                             `}
                >
                  {tab.label}
                  <span className="ml-2 text-xs opacity-60">
                    {statusCounts[tab.id as keyof typeof statusCounts]}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Zoek op nummer of klant..."
                className="pl-9 h-9 bg-slate-50 border-slate-200 focus:bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Offerte #</th>
                  <th className="px-6 py-4">Klant</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Datum</th>
                  <th className="px-6 py-4 text-right">Totaal</th>
                  <th className="px-6 py-4 text-right">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Geen offertes gevonden met deze filter.
                    </td>
                  </tr>
                ) : (
                  filteredQuotes
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((quote) => (
                      <tr key={quote.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {quote.quote_number}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{quote.lead_name || 'Onbekend'}</div>
                          <div className="text-slate-500 text-xs">{quote.lead_city}</div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={quote.status} />
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(quote.created_at).toLocaleDateString('nl-NL')}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                          €{Number(quote.total).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/admin/offertes/${quote.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-orange-600">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            {quote.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                onClick={() => updateStatus(quote.id, 'sent')}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-600"
                              onClick={() => deleteQuote(quote.id, quote.quote_number)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, subValue, icon: Icon, className, iconClass }: any) {
  return (
    <Card className={`border-slate-200 shadow-sm ${className}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm font-medium text-slate-500 opacity-80">{title}</p>
          <Icon className={`w-4 h-4 text-slate-400 ${iconClass}`} />
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {subValue && <div className="text-xs mt-1 opacity-70">{subValue}</div>}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; icon: any; style: string }> = {
    draft: { label: 'Concept', icon: FileText, style: 'bg-slate-100 text-slate-600 border-slate-200' },
    sent: { label: 'Verstuurd', icon: Send, style: 'bg-blue-50 text-blue-600 border-blue-100' },
    viewed: { label: 'Bekeken', icon: Eye, style: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    accepted: { label: 'Geaccepteerd', icon: CheckCircle, style: 'bg-green-50 text-green-600 border-green-100' },
    declined: { label: 'Afgewezen', icon: XCircle, style: 'bg-red-50 text-red-600 border-red-100' },
    expired: { label: 'Verlopen', icon: Clock, style: 'bg-orange-50 text-orange-600 border-orange-100' },
  };

  const conf = config[status] || config.draft;
  const Icon = conf.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${conf.style}`}>
      <Icon className="w-3 h-3" />
      {conf.label}
    </span>
  );
}
