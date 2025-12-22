'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

interface Quote {
  id: string;
  quote_number: string;
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
  customer_name: string;
  customer_city: string;
}

export default function CustomerQuotePage() {
  const params = useParams();
  const token = params.token as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState(false);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [responseSuccess, setResponseSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      fetchQuote();
    }
  }, [token]);

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/quote/${token}`);
      if (response.ok) {
        const data = await response.json();
        setQuote(data.quote);
      } else {
        const data = await response.json();
        setError(data.error || 'Offerte niet gevonden');
      }
    } catch {
      setError('Er ging iets mis bij het ophalen van de offerte');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (action: 'accept' | 'decline') => {
    if (action === 'decline' && !showDeclineForm) {
      setShowDeclineForm(true);
      return;
    }

    setResponding(true);
    try {
      const response = await fetch(`/api/quote/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          decline_reason: declineReason || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResponseMessage(data.message);
        setResponseSuccess(action === 'accept');
        // Refresh quote to show updated status
        await fetchQuote();
      } else {
        setError(data.error);
      }
    } catch {
      setError('Er ging iets mis bij het versturen van uw reactie');
    } finally {
      setResponding(false);
    }
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

  const isExpired = quote?.valid_until && new Date(quote.valid_until) < new Date();
  const canRespond = quote && !['accepted', 'declined'].includes(quote.status) && !isExpired;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Offerte laden...</p>
        </div>
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Offerte niet gevonden</h2>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500 mt-4">
              Heeft u vragen? Neem contact op via{' '}
              <a href="tel:0653967819" className="text-orange-600 hover:underline">06 53 96 78 19</a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-slate-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-lg p-2">
                <Image
                  src="/logo.png"
                  alt="Klinkers & Co"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">Offerte</h1>
                <p className="text-slate-300 text-sm">{quote.quote_number}</p>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-sm text-slate-300">De Hovenier van Gouda</p>
              <p className="text-sm">06 53 96 78 19</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success/Response Message */}
        {responseMessage && (
          <Card className={`mb-6 ${responseSuccess ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {responseSuccess ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <FileCheck className="w-8 h-8 text-orange-500" />
                )}
                <div>
                  <h3 className={`font-bold ${responseSuccess ? 'text-green-700' : 'text-orange-700'}`}>
                    {responseSuccess ? 'Offerte geaccepteerd!' : 'Reactie ontvangen'}
                  </h3>
                  <p className={responseSuccess ? 'text-green-600' : 'text-orange-600'}>{responseMessage}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Banner */}
        {quote.status === 'accepted' && !responseMessage && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="font-bold text-green-700">Offerte geaccepteerd</h3>
                  <p className="text-green-600">U heeft deze offerte geaccepteerd. We nemen contact met u op.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {quote.status === 'declined' && !responseMessage && (
          <Card className="mb-6 bg-gray-50 border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-gray-400" />
                <div>
                  <h3 className="font-bold text-gray-700">Offerte afgewezen</h3>
                  <p className="text-gray-600">U heeft deze offerte afgewezen.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isExpired && canRespond && (
          <Card className="mb-6 bg-orange-50 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-500" />
                <div>
                  <h3 className="font-bold text-orange-700">Offerte verlopen</h3>
                  <p className="text-orange-600">
                    Deze offerte was geldig tot {formatDate(quote.valid_until!)}.
                    Neem contact op voor een actuele offerte.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:justify-between">
              <div>
                <p className="text-sm text-gray-500">Offerte voor</p>
                <p className="text-xl font-bold text-gray-900">{quote.customer_name}</p>
                {quote.project_address && (
                  <p className="flex items-center gap-1 text-gray-600 mt-1">
                    <MapPin className="w-4 h-4" /> {quote.project_address}
                  </p>
                )}
              </div>
              <div className="mt-4 md:mt-0 md:text-right">
                <p className="text-sm text-gray-500">Datum</p>
                <p className="font-medium">{formatDate(quote.created_at)}</p>
                {quote.valid_until && (
                  <p className={`text-sm ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
                    Geldig tot {formatDate(quote.valid_until)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Description */}
        {quote.project_description && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Projectomschrijving</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{quote.project_description}</p>
            </CardContent>
          </Card>
        )}

        {/* Line Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Werkzaamheden</CardTitle>
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
                      <td className="py-3 pr-4">{item.description}</td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-center text-gray-500">{item.unit}</td>
                      <td className="py-3 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotaal</span>
                    <span>{formatCurrency(quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">BTW ({quote.btw_percentage}%)</span>
                    <span>{formatCurrency(quote.btw_amount)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-3 border-t">
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Opmerkingen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{quote.customer_notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Response Section */}
        {canRespond && !responseMessage && (
          <Card className="mb-6 border-2 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-center">Wat vindt u van deze offerte?</CardTitle>
            </CardHeader>
            <CardContent>
              {showDeclineForm ? (
                <div className="space-y-4">
                  <p className="text-gray-600 text-center">
                    Jammer! Laat ons weten waarom deze offerte niet passend is:
                  </p>
                  <Textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Bijvoorbeeld: te duur, andere planning, ander bedrijf gekozen..."
                    rows={3}
                    className="bg-white"
                  />
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeclineForm(false)}
                      disabled={responding}
                    >
                      Annuleren
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleResponse('decline')}
                      disabled={responding}
                    >
                      {responding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Offerte afwijzen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-lg px-8"
                    onClick={() => handleResponse('accept')}
                    disabled={responding}
                  >
                    {responding ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                    Ik ga akkoord!
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-gray-600"
                    onClick={() => handleResponse('decline')}
                    disabled={responding}
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Niet akkoord
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Terms */}
        <Card className="mb-6 bg-slate-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-bold text-slate-700 mb-2">Betaling</h4>
                <p className="text-gray-600">
                  50% bij akkoord<br />
                  50% na oplevering
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-700 mb-2">Garantie</h4>
                <p className="text-gray-600">
                  2 jaar garantie op<br />
                  uitgevoerde werkzaamheden
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-700 mb-2">Algemene voorwaarden</h4>
                <p className="text-gray-600">
                  Op al onze offertes zijn de<br />
                  algemene voorwaarden van toepassing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-bold text-lg mb-4">Vragen over deze offerte?</h3>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <a
                  href="tel:0653967819"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Bel 06 53 96 78 19
                </a>
                <a
                  href="https://wa.me/31653967819"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  WhatsApp
                </a>
                <a
                  href="mailto:info@klinkersenco.nl"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  Email
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="bg-white rounded-lg p-1">
              <Image
                src="/logo.png"
                alt="Klinkers & Co"
                width={100}
                height={30}
                className="h-6 w-auto"
              />
            </div>
          </div>
          <p className="text-slate-400 text-sm">De Hovenier van Gouda en omstreken</p>
          <p className="text-slate-500 text-xs mt-2">
            Tel: 06 53 96 78 19 | info@klinkersenco.nl
          </p>
        </div>
      </footer>
    </div>
  );
}
