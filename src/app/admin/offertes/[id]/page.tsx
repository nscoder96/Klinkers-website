'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import PDFDownloadButton from '@/components/pdf/PDFDownloadButton';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  MapPin,
  Phone,
  Mail,
  Copy,
  ExternalLink
} from 'lucide-react';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

interface Lead {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string;
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
  decline_reason: string | null;
  accept_token: string | null;
  leads: Lead;
}

export default function QuoteDetailPage() {
  const params = useParams();
  const quoteId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isAuthenticated && quoteId) {
      fetchQuote();
    }
  }, [isAuthenticated, quoteId]);

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`);
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
    if (!quote) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          decline_reason: declineReason,
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

  const copyAcceptLink = () => {
    if (quote?.accept_token) {
      const link = `${window.location.origin}/offerte/${quote.accept_token}`;
      navigator.clipboard.writeText(link);
      alert('Link gekopieerd naar klembord!');
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
      draft: {
        label: 'Concept',
        color: 'text-gray-700',
        bg: 'bg-gray-100',
        icon: <FileText className="w-4 h-4" />
      },
      sent: {
        label: 'Verstuurd',
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        icon: <Send className="w-4 h-4" />
      },
      viewed: {
        label: 'Bekeken',
        color: 'text-purple-700',
        bg: 'bg-purple-100',
        icon: <Clock className="w-4 h-4" />
      },
      accepted: {
        label: 'Geaccepteerd',
        color: 'text-green-700',
        bg: 'bg-green-100',
        icon: <CheckCircle className="w-4 h-4" />
      },
      declined: {
        label: 'Afgewezen',
        color: 'text-red-700',
        bg: 'bg-red-100',
        icon: <XCircle className="w-4 h-4" />
      },
    };
    return statusMap[status] || statusMap.draft;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Laden...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!quote) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Offerte niet gevonden</p>
          <Link href="/admin/offertes">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Terug naar offertes
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const statusInfo = getStatusInfo(quote.status);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link
              href="/admin/offertes"
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Terug naar offertes
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{quote.quote_number}</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                {statusInfo.icon}
                {statusInfo.label}
              </span>
            </div>
            <p className="text-gray-500">Aangemaakt op {formatDate(quote.created_at)}</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* PDF Download */}
            <PDFDownloadButton quote={quote} />

            {/* Status Actions */}
            {quote.status === 'draft' && (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => updateStatus('sent')}
                disabled={updating}
              >
                <Send className="w-4 h-4 mr-2" />
                Markeer als verstuurd
              </Button>
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
          </div>
        </div>

        {/* Accept Link */}
        {quote.accept_token && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">Klant acceptatie link</p>
                  <p className="text-sm text-blue-700">
                    Deel deze link met de klant om de offerte te bekijken en te accepteren
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyAcceptLink}>
                    <Copy className="w-4 h-4 mr-2" /> Kopieer link
                  </Button>
                  <Link href={`/offerte/${quote.accept_token}`} target="_blank">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" /> Open
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Description */}
            {quote.project_description && (
              <Card>
                <CardHeader>
                  <CardTitle>Projectomschrijving</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{quote.project_description}</p>
                </CardContent>
              </Card>
            )}

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle>Offerte regels ({quote.line_items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-gray-500">
                        <th className="pb-3 font-medium">Omschrijving</th>
                        <th className="pb-3 font-medium text-center">Aantal</th>
                        <th className="pb-3 font-medium text-center">Eenheid</th>
                        <th className="pb-3 font-medium text-right">Prijs</th>
                        <th className="pb-3 font-medium text-right">Totaal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.line_items.map((item, index) => (
                        <tr key={item.id} className={`border-b last:border-b-0 ${index % 2 === 1 ? 'bg-gray-50' : ''}`}>
                          <td className="py-3">{item.description}</td>
                          <td className="py-3 text-center">{item.quantity}</td>
                          <td className="py-3 text-center text-gray-500">{item.unit}</td>
                          <td className="py-3 text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotaal</span>
                        <span>{formatCurrency(quote.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">BTW ({quote.btw_percentage}%)</span>
                        <span>{formatCurrency(quote.btw_amount)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Totaal incl. BTW</span>
                        <span className="text-orange-600">{formatCurrency(quote.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Notes */}
            {quote.customer_notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Opmerkingen</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{quote.customer_notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Decline Reason */}
            {quote.decline_reason && (
              <Card className="bg-red-50 border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-700">Reden afwijzing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-600">{quote.decline_reason}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Klantgegevens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-lg">{quote.leads.name}</p>
                </div>

                {quote.project_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-600">{quote.project_address}</span>
                  </div>
                )}

                {quote.leads.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${quote.leads.phone}`} className="text-blue-600 hover:underline">
                      {quote.leads.phone}
                    </a>
                  </div>
                )}

                {quote.leads.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${quote.leads.email}`} className="text-blue-600 hover:underline">
                      {quote.leads.email}
                    </a>
                  </div>
                )}

                <div className="pt-2">
                  <Link href={`/admin/leads/${quote.lead_id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Bekijk lead details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quote Details */}
            <Card>
              <CardHeader>
                <CardTitle>Offerte details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Offertenummer</span>
                  <span className="font-medium">{quote.quote_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Aangemaakt</span>
                  <span>{formatDate(quote.created_at)}</span>
                </div>
                {quote.valid_until && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Geldig tot</span>
                    <span>{formatDate(quote.valid_until)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/admin/offerte/${quote.lead_id}?quoteId=${quote.id}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Offerte bewerken
                  </Button>
                </Link>

                {quote.leads.phone && (
                  <a href={`https://wa.me/${quote.leads.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full justify-start text-green-600 hover:bg-green-50">
                      <Phone className="w-4 h-4 mr-2" />
                      WhatsApp versturen
                    </Button>
                  </a>
                )}

                {quote.leads.email && (
                  <a href={`mailto:${quote.leads.email}?subject=Offerte ${quote.quote_number}&body=Beste ${quote.leads.name},%0A%0AHierbij stuur ik u de offerte voor uw tuinproject.%0A%0AMet vriendelijke groet,%0ANiek Klinkers%0AKlinkers %26 Co`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="w-4 h-4 mr-2" />
                      Email versturen
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
