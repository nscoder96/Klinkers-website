'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDemoAuth } from '@/lib/useDemoAuth';
import DemoLayout from '@/components/demo/DemoLayout';
import { PlayCircle } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string;
  project_type: string[] | null;
  description: string | null;
  estimated_m2: number | null;
  status: string;
  source: string;
  created_at: string;
}

export default function DemoLeadsPage() {
  const { isAuthenticated, isLoading: authLoading } = useDemoAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchLeads();
    }
  }, [isAuthenticated]);

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/demo/leads');
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads
    .filter(lead => filter === 'all' || lead.status === filter)
    .filter(lead =>
      search === '' ||
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.city.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search)
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800 border-blue-200',
      contacted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      site_visit_scheduled: 'bg-purple-100 text-purple-800 border-purple-200',
      quote_sent: 'bg-orange-100 text-orange-800 border-orange-200',
      negotiating: 'bg-pink-100 text-pink-800 border-pink-200',
      won: 'bg-green-100 text-green-800 border-green-200',
      lost: 'bg-red-100 text-red-800 border-red-200',
      dormant: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusCounts = {
    all: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    site_visit_scheduled: leads.filter(l => l.status === 'site_visit_scheduled').length,
    quote_sent: leads.filter(l => l.status === 'quote_sent').length,
    won: leads.filter(l => l.status === 'won').length,
    lost: leads.filter(l => l.status === 'lost').length,
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-ping opacity-20" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <PlayCircle className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-slate-600 font-medium">Leads laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DemoLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-500">Beheer al je leads en klanten</p>
          </div>
        </div>

        {/* Search & Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Zoek op naam, plaats, email of telefoon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:w-80"
              />
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'Alles' },
                  { value: 'new', label: 'Nieuw' },
                  { value: 'contacted', label: 'Gecontacteerd' },
                  { value: 'quote_sent', label: 'Offerte' },
                  { value: 'won', label: 'Gewonnen' },
                  { value: 'lost', label: 'Verloren' },
                ].map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={filter === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(value)}
                    className={filter === value ? 'bg-purple-700 hover:bg-purple-800' : ''}
                  >
                    {label} ({statusCounts[value as keyof typeof statusCounts] || 0})
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filter === 'all' ? 'Alle leads' : getStatusLabel(filter)} ({filteredLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLeads.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Geen leads gevonden</p>
            ) : (
              <div className="space-y-3">
                {filteredLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/demo/leads/${lead.id}`}
                    className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors hover:border-purple-300"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{lead.name}</h3>
                        <p className="text-sm text-gray-500">{lead.city}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                    </div>

                    {lead.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{lead.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      {lead.phone && (
                        <span>Tel: {lead.phone}</span>
                      )}
                      {lead.email && (
                        <span>{lead.email}</span>
                      )}
                      {lead.estimated_m2 && (
                        <span>{lead.estimated_m2} m²</span>
                      )}
                      <span>Via: {lead.source}</span>
                      <span>{formatDate(lead.created_at)}</span>
                    </div>

                    {lead.project_type && lead.project_type.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {lead.project_type.map((type, i) => (
                          <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
                            {type}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DemoLayout>
  );
}
