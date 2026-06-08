'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDemoAuth } from '@/lib/useDemoAuth';
import DemoLayout from '@/components/demo/DemoLayout';
import {
  ArrowLeft,
  FileText,
  User,
  MapPin,
  Calendar,
  Euro,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Edit,
  Printer,
  Sparkles,
  PlayCircle,
  AlertCircle
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  postcode: string | null;
  city: string;
}

interface LineItem {
  id: string;
  pricing_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  reasoning?: string;
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
  sent_at: string | null;
  responded_at: string | null;
  decline_reason: string | null;
  demo_leads?: Lead;
}

export default function DemoOfferteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useDemoAuth();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuote();
    }
  }, [quoteId, isAuthenticated]);

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/demo/quotes/${quoteId}`);
      if (response.ok) {
        const data = await response.json();
        setQuote(data.quote);
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string, declineReason?: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/demo/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          decline_reason: declineReason,
          sent_at: status === 'sent' ? new Date().toISOString() : undefined,
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 border-gray-300',
      sent: 'bg-blue-100 text-blue-800 border-blue-300',
      viewed: 'bg-purple-100 text-purple-800 border-purple-300',
      accepted: 'bg-green-100 text-green-800 border-green-300',
      declined: 'bg-red-100 text-red-800 border-red-300',
      expired: 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'viewed': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'declined': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = quote?.valid_until && new Date(quote.valid_until) < new Date() && quote.status === 'sent';

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
          <p className="text-slate-600 font-medium">Offerte laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!quote) {
    return (
      <DemoLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Offerte niet gevonden</p>
          <Link href="/demo/offertes">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar offertes
            </Button>
          </Link>
        </div>
      </DemoLayout>
    );
  }

  const lead = quote.demo_leads;

  return (
    <DemoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              href="/demo/offertes"
              className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Terug naar offertes
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{quote.quote_number}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1.5 ${getStatusColor(quote.status)}`}>
                {getStatusIcon(quote.status)}
                {getStatusLabel(quote.status)}
              </span>
              {isExpired && (
                <span className="px-3 py-1 rounded-full text-sm font-medium border bg-orange-100 text-orange-800 border-orange-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Verlopen
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {quote.status === 'draft' && (
              <>
                <Link href={`/demo/offerte/${quote.lead_id}?quoteId=${quote.id}`}>
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Bewerken
                  </Button>
                </Link>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => updateStatus('sent')}
                  disabled={updating}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {updating ? 'Versturen...' : 'Markeer als verstuurd'}
                </Button>
              </>
            )}
            {quote.status === 'sent' && (
              <>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => updateStatus('accepted')}
                  disabled={updating}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Geaccepteerd
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
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
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Afdrukken
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info */}
            {quote.project_description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    Projectomschrijving
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{quote.project_description}</p>
                </CardContent>
              </Card>
            )}

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Offerte regels</CardTitle>
              </CardHeader>
              <CardContent>
                {!quote.line_items || quote.line_items.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Geen regels in deze offerte</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-sm text-gray-500">
                          <th className="pb-3 font-medium">Omschrijving</th>
                          <th className="pb-3 font-medium text-right">Aantal</th>
                          <th className="pb-3 font-medium">Eenheid</th>
                          <th className="pb-3 font-medium text-right">Prijs</th>
                          <th className="pb-3 font-medium text-right">Totaal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {quote.line_items.map((item, index) => (
                          <tr key={item.id || index} className="text-gray-700">
                            <td className="py-3">
                              <span className="font-medium">{item.description}</span>
                              {item.reasoning && (
                                <p className="text-xs text-gray-500 mt-1">{item.reasoning}</p>
                              )}
                            </td>
                            <td className="py-3 text-right">{item.quantity}</td>
                            <td className="py-3">{item.unit}</td>
                            <td className="py-3 text-right">
                              {Number(item.unit_price).toLocaleString('nl-NL', {
                                style: 'currency',
                                currency: 'EUR'
                              })}
                            </td>
                            <td className="py-3 text-right font-medium">
                              {Number(item.total).toLocaleString('nl-NL', {
                                style: 'currency',
                                currency: 'EUR'
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Totals */}
                <div className="mt-6 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotaal</span>
                    <span>
                      {Number(quote.subtotal).toLocaleString('nl-NL', {
                        style: 'currency',
                        currency: 'EUR'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>BTW ({quote.btw_percentage}%)</span>
                    <span>
                      {Number(quote.btw_amount).toLocaleString('nl-NL', {
                        style: 'currency',
                        currency: 'EUR'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-orange-600 pt-2 border-t">
                    <span>Totaal incl. BTW</span>
                    <span>
                      {Number(quote.total).toLocaleString('nl-NL', {
                        style: 'currency',
                        currency: 'EUR'
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Notes */}
            {quote.customer_notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Opmerkingen</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{quote.customer_notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Decline Reason */}
            {quote.decline_reason && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Reden van afwijzing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700">{quote.decline_reason}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            {lead && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-600" />
                    Klantgegevens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900">{lead.name}</p>
                  </div>
                  {(lead.address || lead.city) && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        {lead.address && <p>{lead.address}</p>}
                        <p>{lead.postcode} {lead.city}</p>
                      </div>
                    </div>
                  )}
                  {lead.phone && (
                    <p className="text-gray-600">{lead.phone}</p>
                  )}
                  {lead.email && (
                    <p className="text-gray-600">{lead.email}</p>
                  )}
                  <Link href={`/demo/leads/${lead.id}`}>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Bekijk lead profiel
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Project Address */}
            {quote.project_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    Project locatie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{quote.project_address}</p>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  Tijdlijn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Aangemaakt</span>
                  <span className="text-gray-700">{formatDateTime(quote.created_at)}</span>
                </div>
                {quote.sent_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Verstuurd</span>
                    <span className="text-gray-700">{formatDateTime(quote.sent_at)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Geldig tot</span>
                  <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-700'}`}>
                    {formatDate(quote.valid_until)}
                    {isExpired && ' (verlopen)'}
                  </span>
                </div>
                {quote.responded_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {quote.status === 'accepted' ? 'Geaccepteerd' : 'Afgewezen'}
                    </span>
                    <span className="text-gray-700">{formatDateTime(quote.responded_at)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Euro className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-orange-600">
                    {Number(quote.total).toLocaleString('nl-NL', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
                  </p>
                  <p className="text-sm text-orange-700">Totaalbedrag incl. BTW</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DemoLayout>
  );
}
