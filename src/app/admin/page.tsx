'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import CBSPriceAlertBanner from '@/components/admin/CBSPriceAlertBanner';
import {
  Users,
  FileText,
  Calendar,
  Euro,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle,
  Leaf,
  MoreHorizontal,
  Plus
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

interface Appointment {
  id: string;
  title: string;
  date: string;
  time_start: string;
  lead_id: string;
  leads?: { name: string; city: string };
}

interface DashboardStats {
  leads: {
    total: number;
    new: number;
    won: number;
    thisMonth: number;
    lastMonth: number;
  };
  quotes: {
    total: number;
    sent: number;
    accepted: number;
    acceptedValue: number;
    pendingValue: number;
    avgValue: number;
    thisMonthValue: number;
    lastMonthValue: number;
  };
}

export default function AdminDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const [leadsRes, quotesRes, appointmentsRes] = await Promise.all([
        fetch('/api/admin/leads'),
        fetch('/api/admin/quotes'),
        fetch('/api/admin/appointments')
      ]);

      if (leadsRes.ok) setLeads((await leadsRes.json()).leads || []);
      if (quotesRes.ok) setQuotes((await quotesRes.json()).quotes || []);
      if (appointmentsRes.ok) setAppointments((await appointmentsRes.json()).appointments || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const isThisMonth = (dateString: string) => new Date(dateString) >= thisMonthStart;
  const isLastMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date >= lastMonthStart && date <= lastMonthEnd;
  };

  const pendingQuotes = quotes.filter(q => q.status === 'sent');
  const stats: DashboardStats = {
    leads: {
      total: leads.length,
      new: leads.filter(l => l.status === 'new').length,
      won: leads.filter(l => l.status === 'won').length,
      thisMonth: leads.filter(l => isThisMonth(l.created_at)).length,
      lastMonth: leads.filter(l => isLastMonth(l.created_at)).length,
    },
    quotes: {
      total: quotes.length,
      sent: quotes.filter(q => q.status === 'sent').length,
      accepted: quotes.filter(q => q.status === 'accepted').length,
      acceptedValue: quotes.filter(q => q.status === 'accepted').reduce((sum, q) => sum + (Number(q.total) || 0), 0),
      pendingValue: pendingQuotes.reduce((sum, q) => sum + (Number(q.total) || 0), 0),
      avgValue: quotes.length > 0 ? quotes.reduce((sum, q) => sum + (Number(q.total) || 0), 0) / quotes.length : 0,
      thisMonthValue: quotes.filter(q => isThisMonth(q.created_at) && q.status === 'accepted').reduce((sum, q) => sum + (Number(q.total) || 0), 0),
      lastMonthValue: quotes.filter(q => isLastMonth(q.created_at) && q.status === 'accepted').reduce((sum, q) => sum + (Number(q.total) || 0), 0),
    }
  };

  const leadsTrend = stats.leads.lastMonth > 0
    ? ((stats.leads.thisMonth - stats.leads.lastMonth) / stats.leads.lastMonth) * 100
    : stats.leads.thisMonth > 0 ? 100 : 0;

  const valueTrend = stats.quotes.lastMonthValue > 0
    ? ((stats.quotes.thisMonthValue - stats.quotes.lastMonthValue) / stats.quotes.lastMonthValue) * 100
    : stats.quotes.thisMonthValue > 0 ? 100 : 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <CBSPriceAlertBanner />
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="text-slate-500">Welkom terug, Niek. Hier zijn je cijfers van vandaag.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="bg-white">
              <Calendar className="mr-2 h-4 w-4" />
              {new Date().toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="mr-2 h-4 w-4" /> Nieuwe Lead
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Totale Omzet"
            value={`€${stats.quotes.acceptedValue.toLocaleString('nl-NL')}`}
            trend={valueTrend > 0 ? `+${valueTrend.toFixed(0)}%` : `${valueTrend.toFixed(0)}%`}
            trendPositive={valueTrend >= 0}
            icon={Euro}
            color="bg-green-500"
          />
          <StatCard
            title="Nieuwe Leads"
            value={stats.leads.thisMonth.toString()}
            trend={leadsTrend > 0 ? `+${leadsTrend.toFixed(0)}%` : `${leadsTrend.toFixed(0)}%`}
            trendPositive={leadsTrend >= 0}
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            title="Openstaande Offertes"
            value={stats.quotes.sent.toString()}
            subValue={`€${stats.quotes.pendingValue.toLocaleString('nl-NL')}`}
            icon={FileText}
            color="bg-orange-500"
          />
          <StatCard
            title="Conversie Ratio"
            value={`${stats.leads.total > 0 ? ((stats.leads.won / stats.leads.total) * 100).toFixed(0) : 0}%`}
            subValue="Leads naar Klant"
            icon={TrendingUp}
            color="bg-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Leads */}
          <Card className="lg:col-span-2 border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900">Recente Leads</CardTitle>
              <Link href="/admin/leads" className="text-sm text-orange-600 hover:text-orange-700 font-medium hover:underline">
                Bekijk alles
              </Link>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                      <th className="p-4">Naam</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Datum</th>
                      <th className="p-4 text-right">Actie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.slice(0, 5).map(lead => (
                      <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-slate-900">{lead.name}</div>
                          <div className="text-slate-500 text-xs">{lead.city}</div>
                        </td>
                        <td className="p-4">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="p-4 text-slate-500">{new Date(lead.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {leads.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500">Geen recente leads</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Actions / Quick Links */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm bg-slate-900 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Snelle Acties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-0 h-12 font-normal">
                  <Plus className="mr-2 h-4 w-4 text-orange-400" /> Nieuwe Offerte Maken
                </Button>
                <Button className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-0 h-12 font-normal">
                  <Calendar className="mr-2 h-4 w-4 text-blue-400" /> Afspraak Inplannen
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Aankomende Agenda</CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length > 0 ? (
                  <div className="space-y-4">
                    {appointments.slice(0, 3).map(apt => (
                      <div key={apt.id} className="flex gap-4 items-start">
                        <div className="w-12 h-12 rounded-lg bg-orange-50 flex flex-col items-center justify-center text-orange-600 border border-orange-100 flex-shrink-0">
                          <span className="text-xs font-bold uppercase">{new Date(apt.date).toLocaleDateString('nl', { weekday: 'short' })}</span>
                          <span className="text-lg font-bold leading-none">{new Date(apt.date).getDate()}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900 line-clamp-1">{apt.title}</h4>
                          <p className="text-sm text-slate-500">{apt.time_start} uur</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">Geen afspraken deze week</p>
                )}
                <Button variant="link" className="w-full mt-2 text-slate-500">Bekijk volledige agenda</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, trend, trendPositive, icon: Icon, color, subValue }: any) {
  return (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
          </div>
          {trend && (
            <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${trendPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {trendPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {trend}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
          {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: 'bg-blue-50 text-blue-700 border-blue-100',
    contacted: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    quote_sent: 'bg-orange-50 text-orange-700 border-orange-100',
    won: 'bg-green-50 text-green-700 border-green-100',
    lost: 'bg-red-50 text-red-700 border-red-100'
  };

  const labels: Record<string, string> = {
    new: 'Nieuw',
    contacted: 'Contact',
    quote_sent: 'Offerte',
    won: 'Gewonnen',
    lost: 'Verloren'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}
