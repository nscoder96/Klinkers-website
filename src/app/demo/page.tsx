'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDemoAuth } from '@/lib/useDemoAuth';
import DemoLayout from '@/components/demo/DemoLayout';
import {
  Users,
  FileText,
  Euro,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle
} from 'lucide-react';

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

export default function DemoDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useDemoAuth();
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
        fetch('/api/demo/leads'),
        fetch('/api/demo/quotes')
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
      new: 'bg-blue-100 text-blue-700 border-blue-200',
      contacted: 'bg-amber-100 text-amber-700 border-amber-200',
      site_visit_scheduled: 'bg-purple-100 text-purple-700 border-purple-200',
      quote_sent: 'bg-orange-100 text-orange-700 border-orange-200',
      won: 'bg-green-100 text-green-700 border-green-200',
      lost: 'bg-red-100 text-red-700 border-red-200',
      dormant: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return colors[status] || 'bg-slate-100 text-slate-700 border-slate-200';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full animate-ping opacity-20" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-slate-600 font-medium">Demo laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DemoLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Welkom terug! Hier is een overzicht van je bedrijf.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            Laatste update: {new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* New Lead Alert */}
        {stats.leads.new > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">Je hebt {stats.leads.new} nieuwe lead{stats.leads.new > 1 ? 's' : ''}!</p>
                  <p className="text-sm text-blue-700">Bekijk en behandel nieuwe aanvragen</p>
                </div>
              </div>
              <Link href="/demo/leads?filter=new">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  Bekijken
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { value: stats.leads.new, label: 'Nieuwe leads', gradient: 'from-blue-500 to-cyan-500', icon: AlertCircle },
            { value: stats.leads.contacted, label: 'Gecontacteerd', gradient: 'from-amber-500 to-yellow-500', icon: Clock },
            { value: stats.quotes.sent, label: 'Offertes open', gradient: 'from-purple-500 to-pink-500', icon: FileText },
            { value: stats.leads.won, label: 'Gewonnen', gradient: 'from-green-500 to-emerald-500', icon: CheckCircle },
            { value: `${stats.conversion.leadToQuote.toFixed(0)}%`, label: 'Lead → Offerte', gradient: 'from-pink-500 to-rose-500', icon: TrendingUp },
            { value: `${stats.conversion.quoteToWon.toFixed(0)}%`, label: 'Offerte → Won', gradient: 'from-teal-500 to-cyan-500', icon: TrendingUp },
          ].map((stat, i) => (
            <Card key={i} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-10 group-hover:opacity-15 transition-opacity`} />
              <CardContent className="pt-5 pb-4 relative">
                <div className="flex items-start justify-between mb-2">
                  <p className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                    {stat.value}
                  </p>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center opacity-80`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden border-0 shadow-lg group hover:shadow-xl transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-slate-600" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Euro className="w-4 h-4" />
                Totale waarde offertes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-800">
                €{stats.quotes.totalValue.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-slate-500 mt-1">{stats.quotes.total} offertes</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg group hover:shadow-xl transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-600" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Geaccepteerde offertes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                €{stats.quotes.acceptedValue.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-slate-500 mt-1">{stats.quotes.accepted} geaccepteerd</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg group hover:shadow-xl transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-600" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Totaal leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-800">{stats.leads.total}</p>
              <p className="text-sm text-slate-500 mt-1">
                {stats.leads.won} gewonnen ({stats.leads.total > 0 ? ((stats.leads.won / stats.leads.total) * 100).toFixed(0) : 0}%)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-white border-b">
              <CardTitle className="text-lg font-semibold text-slate-800">Recente Leads</CardTitle>
              <Link href="/demo/leads">
                <Button variant="outline" size="sm" className="group">
                  Alle leads
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentLeads.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Nog geen leads</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/demo/leads/${lead.id}`}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-semibold">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 group-hover:text-orange-600 transition-colors">{lead.name}</p>
                          <p className="text-sm text-slate-500">{lead.city} • {formatDate(lead.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                          {getStatusLabel(lead.status)}
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
              <CardTitle className="text-lg font-semibold text-slate-800">Snelle Acties</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {[
                { href: '/demo/leads', icon: Users, label: 'Bekijk alle leads', count: stats.leads.total, gradient: 'from-blue-500 to-cyan-600' },
                { href: '/demo/offertes', icon: FileText, label: 'Bekijk alle offertes', count: stats.quotes.total, gradient: 'from-purple-500 to-pink-600' },
                { href: '/demo/prijzen', icon: Euro, label: 'Prijzen beheren', gradient: 'from-green-500 to-emerald-600' },
              ].map((action, i) => (
                <Link key={i} href={action.href} className="block group">
                  <Button
                    className={`w-full justify-between bg-gradient-to-r ${action.gradient} hover:opacity-90 text-white shadow-lg group-hover:shadow-xl transition-all group-hover:-translate-y-0.5`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <action.icon className="w-4 h-4" />
                      </span>
                      {action.label}
                    </span>
                    <span className="flex items-center gap-2">
                      {action.count !== undefined && (
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                          {action.count}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Overview */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
            <CardTitle className="text-lg font-semibold text-slate-800">Lead Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
              {[
                { status: 'new', label: 'Nieuw', gradient: 'from-blue-500 to-cyan-500' },
                { status: 'contacted', label: 'Gecontacteerd', gradient: 'from-amber-500 to-yellow-500' },
                { status: 'site_visit_scheduled', label: 'Afspraak', gradient: 'from-purple-500 to-pink-500' },
                { status: 'quote_sent', label: 'Offerte', gradient: 'from-orange-500 to-red-500' },
                { status: 'negotiating', label: 'Onderhandeling', gradient: 'from-pink-500 to-rose-500' },
                { status: 'won', label: 'Gewonnen', gradient: 'from-green-500 to-emerald-500' },
                { status: 'lost', label: 'Verloren', gradient: 'from-red-500 to-red-600' },
              ].map((stage, index) => {
                const count = leads.filter(l => l.status === stage.status).length;
                return (
                  <div key={stage.status} className="flex items-center">
                    <div className="flex flex-col items-center min-w-[90px] group">
                      <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${stage.gradient} flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform cursor-pointer`}>
                        {count}
                        <div className={`absolute inset-0 bg-gradient-to-br ${stage.gradient} rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity -z-10`} />
                      </div>
                      <span className="text-xs text-slate-600 mt-2 text-center font-medium">{stage.label}</span>
                    </div>
                    {index < 6 && (
                      <div className="flex items-center mx-1">
                        <div className="w-4 h-0.5 bg-slate-200" />
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <div className="w-4 h-0.5 bg-slate-200" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DemoLayout>
  );
}
