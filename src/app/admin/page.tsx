'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/admin/leads');
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

  const filteredLeads = filter === 'all'
    ? leads
    : leads.filter(lead => lead.status === filter);

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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Laden...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-800 text-white py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">Klinkers & Co - Admin</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-blue-600">{leads.filter(l => l.status === 'new').length}</p>
              <p className="text-sm text-gray-500">Nieuwe leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-orange-600">{leads.filter(l => l.status === 'quote_sent').length}</p>
              <p className="text-sm text-gray-500">Offertes verstuurd</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-green-600">{leads.filter(l => l.status === 'won').length}</p>
              <p className="text-sm text-gray-500">Gewonnen</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-gray-600">{leads.length}</p>
              <p className="text-sm text-gray-500">Totaal leads</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Alles ({leads.length})
          </Button>
          <Button
            variant={filter === 'new' ? 'default' : 'outline'}
            onClick={() => setFilter('new')}
            size="sm"
          >
            Nieuw ({leads.filter(l => l.status === 'new').length})
          </Button>
          <Button
            variant={filter === 'quote_sent' ? 'default' : 'outline'}
            onClick={() => setFilter('quote_sent')}
            size="sm"
          >
            Offerte verstuurd ({leads.filter(l => l.status === 'quote_sent').length})
          </Button>
          <Button
            variant={filter === 'won' ? 'default' : 'outline'}
            onClick={() => setFilter('won')}
            size="sm"
          >
            Gewonnen ({leads.filter(l => l.status === 'won').length})
          </Button>
        </div>

        {/* Leads List */}
        <Card>
          <CardHeader>
            <CardTitle>Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLeads.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Geen leads gevonden</p>
            ) : (
              <div className="space-y-4">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{lead.name}</h3>
                        <p className="text-sm text-gray-500">{lead.city}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{lead.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="hover:text-orange-500">
                          Tel: {lead.phone}
                        </a>
                      )}
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="hover:text-orange-500">
                          {lead.email}
                        </a>
                      )}
                      {lead.estimated_m2 && (
                        <span>{lead.estimated_m2} m²</span>
                      )}
                      <span>Via: {lead.source}</span>
                      <span>{formatDate(lead.created_at)}</span>
                    </div>

                    {lead.project_type && lead.project_type.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {lead.project_type.map((type, i) => (
                          <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
                            {type}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link href={`/admin/offerte/${lead.id}`}>
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                          Offerte maken
                        </Button>
                      </Link>
                      <a href={`https://wa.me/31${lead.phone?.replace(/^0/, '').replace(/[^0-9]/g, '')}`} target="_blank">
                        <Button size="sm" variant="outline">
                          WhatsApp
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
