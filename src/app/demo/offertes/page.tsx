'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDemoAuth } from '@/lib/useDemoAuth';
import DemoLayout from '@/components/demo/DemoLayout';
import { PlayCircle } from 'lucide-react';

interface Quote {
  id: string;
  quote_number: string;
  lead_id: string;
  project_description: string | null;
  total: number;
  status: string;
  created_at: string;
  valid_until: string | null;
  decline_reason: string | null;
  demo_leads?: {
    id: string;
    name: string;
    city: string;
  };
}

export default function DemoOffertesPage() {
  const { isAuthenticated, isLoading: authLoading } = useDemoAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuotes();
    }
  }, [isAuthenticated]);

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/demo/quotes');
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
      const response = await fetch(`/api/demo/quotes/${id}`, {
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

  const filteredQuotes = filter === 'all'
    ? quotes
    : quotes.filter(q => q.status === filter);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      sent: 'bg-blue-100 text-blue-800 border-blue-200',
      viewed: 'bg-purple-100 text-purple-800 border-purple-200',
      accepted: 'bg-green-100 text-green-800 border-green-200',
      declined: 'bg-red-100 text-red-800 border-red-200',
      expired: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Concept',
      sent: 'Verstuurd',
      viewed: 'Bekeken',
      accepted: 'Geaccepteerd',
      declined: 'Afgewezen',
      expired: 'Verlopen',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

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
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full animate-ping opacity-20" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <PlayCircle className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-slate-600 font-medium">Offertes laden...</p>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offertes</h1>
          <p className="text-gray-500">Beheer al je offertes</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold">{quotes.length}</p>
              <p className="text-sm text-gray-500">Totaal offertes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold">€{totalValue.toLocaleString('nl-NL')}</p>
              <p className="text-sm text-gray-500">Totale waarde</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold text-green-600">{statusCounts.accepted}</p>
              <p className="text-sm text-green-700">Geaccepteerd</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold text-green-600">€{acceptedValue.toLocaleString('nl-NL')}</p>
              <p className="text-sm text-green-700">Geaccepteerde waarde</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'Alles' },
                { value: 'draft', label: 'Concept' },
                { value: 'sent', label: 'Verstuurd' },
                { value: 'accepted', label: 'Geaccepteerd' },
                { value: 'declined', label: 'Afgewezen' },
              ].map(({ value, label }) => (
                <Button
                  key={value}
                  variant={filter === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(value)}
                  className={filter === value ? 'bg-orange-600 hover:bg-orange-700' : ''}
                >
                  {label} ({statusCounts[value as keyof typeof statusCounts] || 0})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quotes List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filter === 'all' ? 'Alle offertes' : getStatusLabel(filter)} ({filteredQuotes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredQuotes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Geen offertes gevonden</p>
            ) : (
              <div className="space-y-3">
                {filteredQuotes
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((quote) => (
                    <div
                      key={quote.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{quote.quote_number}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(quote.status)}`}>
                              {getStatusLabel(quote.status)}
                            </span>
                          </div>
                          {quote.demo_leads && (
                            <Link href={`/demo/leads/${quote.lead_id}`} className="text-sm text-orange-600 hover:underline">
                              {quote.demo_leads.name} - {quote.demo_leads.city}
                            </Link>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-orange-600">
                            €{Number(quote.total).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-gray-500">{formatDate(quote.created_at)}</p>
                        </div>
                      </div>

                      {quote.project_description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{quote.project_description}</p>
                      )}

                      {quote.decline_reason && (
                        <p className="text-red-600 text-sm mb-3">
                          Reden afwijzing: {quote.decline_reason}
                        </p>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <Link href={`/demo/offertes/${quote.id}`}>
                          <Button size="sm" variant="outline">
                            Bekijken
                          </Button>
                        </Link>

                        {quote.status === 'draft' && (
                          <Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600"
                            onClick={() => updateStatus(quote.id, 'sent')}
                          >
                            Markeer als verstuurd
                          </Button>
                        )}

                        {quote.status === 'sent' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => updateStatus(quote.id, 'accepted')}
                            >
                              Geaccepteerd
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => {
                                const reason = prompt('Reden van afwijzing:');
                                if (reason !== null) {
                                  updateStatus(quote.id, 'declined', reason);
                                }
                              }}
                            >
                              Afgewezen
                            </Button>
                          </>
                        )}

                        {quote.lead_id && (
                          <Link href={`/demo/offerte/${quote.lead_id}?quoteId=${quote.id}`}>
                            <Button size="sm" variant="outline">
                              Bewerken
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DemoLayout>
  );
}
