'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Users, FileText, Calendar, Euro, ChevronRight } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  city: string;
  status: string;
  created_at: string;
  source: string;
}

interface Quote {
  id: string;
  quote_number: string;
  total: number;
  status: string;
  created_at: string;
  lead_id: string;
}

interface DashboardStats {
  leads: {
    total: number;
    new: number;
    contacted: number;
    quote_sent: number;
    won: number;
    lost: number;
  };
  quotes: {
    total: number;
    draft: number;
    sent: number;
    accepted: number;
    declined: number;
    totalValue: number;
    acceptedValue: number;
  };
  conversion: {
    leadToQuote: number;
    quoteToWon: number;
  };
}

export default function AdminDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const [leadsRes, quotesRes] = await Promise.all([
        fetch('/api/admin/leads'),
        fetch('/api/admin/quotes')
      ]);

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.leads || []);
      }

      if (quotesRes.ok) {
        const data = await quotesRes.json();
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats: DashboardStats = {
    leads: {
      total: leads.length,
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      quote_sent: leads.filter(l => l.status === 'quote_sent').length,
      won: leads.filter(l => l.status === 'won').length,
      lost: leads.filter(l => l.status === 'lost').length,
    },
    quotes: {
      total: quotes.length,
      draft: quotes.filter(q => q.status === 'draft').length,
      sent: quotes.filter(q => q.status === 'sent').length,
      accepted: quotes.filter(q => q.status === 'accepted').length,
      declined: quotes.filter(q => q.status === 'declined').length,
      totalValue: quotes.reduce((sum, q) => sum + (Number(q.total) || 0), 0),
      acceptedValue: quotes.filter(q => q.status === 'accepted').reduce((sum, q) => sum + (Number(q.total) || 0), 0),
    },
    conversion: {
      leadToQuote: leads.length > 0 ? (quotes.length / leads.length) * 100 : 0,
      quoteToWon: quotes.length > 0 ? (quotes.filter(q => q.status === 'accepted').length / quotes.length) * 100 : 0,
    }
  };

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      site_visit_scheduled: 'bg-purple-100 text-purple-800',
      quote_sent: 'bg-orange-100 text-orange-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
      dormant: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'Nieuw',
      contacted: 'Gecontacteerd',
      site_visit_scheduled: 'Afspraak gepland',
      quote_sent: 'Offerte verstuurd',
      negotiating: 'In onderhandeling',
      won: 'Gewonnen',
      lost: 'Verloren',
      dormant: 'Slapend',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Laden...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Overzicht van je bedrijf</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-3xl font-bold text-blue-600">{stats.leads.new}</p>
              <p className="text-sm text-blue-700">Nieuwe leads</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-3xl font-bold text-yellow-600">{stats.leads.contacted}</p>
              <p className="text-sm text-yellow-700">Gecontacteerd</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-3xl font-bold text-orange-600">{stats.quotes.sent}</p>
              <p className="text-sm text-orange-700">Offertes open</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-3xl font-bold text-green-600">{stats.leads.won}</p>
              <p className="text-sm text-green-700">Gewonnen</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-3xl font-bold text-purple-600">{stats.conversion.leadToQuote.toFixed(0)}%</p>
              <p className="text-sm text-purple-700">Lead → Offerte</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-3xl font-bold text-emerald-600">{stats.conversion.quoteToWon.toFixed(0)}%</p>
              <p className="text-sm text-emerald-700">Offerte → Won</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Totale waarde offertes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">€{stats.quotes.totalValue.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Geaccepteerde offertes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">€{stats.quotes.acceptedValue.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Totaal leads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.leads.total}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recente Leads</CardTitle>
              <Link href="/admin/leads">
                <Button variant="outline" size="sm">Alle leads</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentLeads.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nog geen leads</p>
              ) : (
                <div className="space-y-3">
                  {recentLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/admin/leads/${lead.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-gray-500">{lead.city} • {formatDate(lead.created_at)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Snelle Acties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/leads" className="block">
                <Button className="w-full justify-start bg-blue-500 hover:bg-blue-600">
                  <Users className="w-4 h-4 mr-2" />
                  Bekijk alle leads ({stats.leads.total})
                </Button>
              </Link>
              <Link href="/admin/offertes" className="block">
                <Button className="w-full justify-start bg-orange-500 hover:bg-orange-600">
                  <FileText className="w-4 h-4 mr-2" />
                  Bekijk alle offertes ({stats.quotes.total})
                </Button>
              </Link>
              <Link href="/admin/planning" className="block">
                <Button className="w-full justify-start bg-purple-500 hover:bg-purple-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Planning bekijken
                </Button>
              </Link>
              <Link href="/admin/prijzen" className="block">
                <Button className="w-full justify-start bg-emerald-500 hover:bg-emerald-600">
                  <Euro className="w-4 h-4 mr-2" />
                  Prijzen beheren
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { status: 'new', label: 'Nieuw', color: 'bg-blue-500' },
                { status: 'contacted', label: 'Gecontacteerd', color: 'bg-yellow-500' },
                { status: 'site_visit_scheduled', label: 'Afspraak', color: 'bg-purple-500' },
                { status: 'quote_sent', label: 'Offerte', color: 'bg-orange-500' },
                { status: 'negotiating', label: 'Onderhandeling', color: 'bg-pink-500' },
                { status: 'won', label: 'Gewonnen', color: 'bg-green-500' },
                { status: 'lost', label: 'Verloren', color: 'bg-red-500' },
              ].map((stage, index) => {
                const count = leads.filter(l => l.status === stage.status).length;
                return (
                  <div key={stage.status} className="flex items-center">
                    <div className="flex flex-col items-center min-w-[100px]">
                      <div className={`w-12 h-12 rounded-full ${stage.color} flex items-center justify-center text-white font-bold text-lg`}>
                        {count}
                      </div>
                      <span className="text-xs text-gray-600 mt-1 text-center">{stage.label}</span>
                    </div>
                    {index < 6 && (
                      <ChevronRight className="w-6 h-6 text-gray-300 mx-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
