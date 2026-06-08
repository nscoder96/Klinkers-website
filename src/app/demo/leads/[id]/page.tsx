'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useDemoAuth } from '@/lib/useDemoAuth';
import DemoLayout from '@/components/demo/DemoLayout';
import {
  FileText,
  Phone,
  MessageCircle,
  Mail,
  StickyNote,
  Home,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  CheckCheck,
  MapPin,
  Sparkles,
  ArrowLeft,
  PlayCircle,
  type LucideIcon
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  postcode: string | null;
  city: string;
  project_type: string[] | null;
  description: string | null;
  estimated_m2: number | null;
  budget_range: string | null;
  urgency: string | null;
  status: string;
  source: string;
  source_detail: string | null;
  ai_score: number | null;
  ai_notes: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
  conversation_history?: Array<{
    role: string;
    content: string;
    timestamp?: string;
  }>;
}

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  created_at: string;
  created_by: string;
}

interface Quote {
  id: string;
  quote_number: string;
  total: number;
  status: string;
  created_at: string;
}

export default function DemoLeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useDemoAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newNote, setNewNote] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [lostReason, setLostReason] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [leadId, isAuthenticated]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/demo/leads/${leadId}`);

      if (response.ok) {
        const data = await response.json();
        setLead(data.lead);
        setActivities(data.activities || []);
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string, reason?: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/demo/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          lost_reason: reason || null
        })
      });

      if (response.ok) {
        await fetchData();
        setShowStatusModal(false);
        setLostReason('');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/demo/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'note',
          title: 'Notitie toegevoegd',
          description: newNote
        })
      });

      if (response.ok) {
        setNewNote('');
        await fetchData();
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-500',
      contacted: 'bg-yellow-500',
      site_visit_scheduled: 'bg-purple-500',
      quote_sent: 'bg-orange-500',
      negotiating: 'bg-pink-500',
      won: 'bg-green-500',
      lost: 'bg-red-500',
      dormant: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
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

  const getActivityIcon = (type: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
      note: StickyNote,
      call: Phone,
      email: Mail,
      whatsapp: MessageCircle,
      site_visit: Home,
      quote_sent: FileText,
      quote_accepted: CheckCircle,
      quote_declined: XCircle,
      status_change: RefreshCw,
      follow_up_scheduled: Calendar,
      follow_up_completed: CheckCheck,
    };
    return icons[type] || MapPin;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const allStatuses = [
    { value: 'new', label: 'Nieuw' },
    { value: 'contacted', label: 'Gecontacteerd' },
    { value: 'site_visit_scheduled', label: 'Afspraak gepland' },
    { value: 'quote_sent', label: 'Offerte verstuurd' },
    { value: 'negotiating', label: 'In onderhandeling' },
    { value: 'won', label: 'Gewonnen' },
    { value: 'lost', label: 'Verloren' },
    { value: 'dormant', label: 'Slapend' },
  ];

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
          <p className="text-slate-600 font-medium">Lead laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!lead) {
    return (
      <DemoLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Lead niet gevonden</p>
          <Link href="/demo/leads">
            <Button className="mt-4">Terug naar leads</Button>
          </Link>
        </div>
      </DemoLayout>
    );
  }

  return (
    <DemoLayout>
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex justify-between items-start">
          <div>
            <Link href="/demo/leads" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Terug naar leads
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{lead.name}</h1>
            <p className="text-gray-500">{lead.city}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-white font-medium ${getStatusColor(lead.status)}`}>
              {getStatusLabel(lead.status)}
            </span>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedStatus(lead.status);
                setShowStatusModal(true);
              }}
            >
              Status wijzigen
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info & Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contactgegevens</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Telefoon</label>
                  <p className="font-medium">
                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                        {lead.phone}
                      </a>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                        {lead.email}
                      </a>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Adres</label>
                  <p className="font-medium">{lead.address || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Postcode</label>
                  <p className="font-medium">{lead.postcode || '-'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle>Projectinformatie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Beschrijving</label>
                  <p className="font-medium whitespace-pre-wrap">{lead.description || '-'}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Geschat oppervlak</label>
                    <p className="font-medium">{lead.estimated_m2 ? `${lead.estimated_m2} m²` : '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Budget</label>
                    <p className="font-medium">{lead.budget_range || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Urgentie</label>
                    <p className="font-medium">{lead.urgency || '-'}</p>
                  </div>
                </div>
                {lead.project_type && lead.project_type.length > 0 && (
                  <div>
                    <label className="text-sm text-gray-500">Type project</label>
                    <div className="flex gap-2 mt-1">
                      {lead.project_type.map((type, i) => (
                        <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-sm">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat History */}
            {lead.conversation_history && lead.conversation_history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-purple-500" />
                    Chatgesprek
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {lead.conversation_history.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.role === 'user'
                              ? 'bg-purple-500 text-white'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          {msg.timestamp && (
                            <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-purple-200' : 'text-slate-400'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acties</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Link href={`/demo/offerte/${lead.id}`}>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <FileText className="w-4 h-4 mr-2" /> Offerte maken
                  </Button>
                </Link>
                {lead.phone && (
                  <>
                    <a href={`tel:${lead.phone}`}>
                      <Button variant="outline"><Phone className="w-4 h-4 mr-2" /> Bellen</Button>
                    </a>
                    <a href={`https://wa.me/31${lead.phone.replace(/^0/, '').replace(/[^0-9]/g, '')}`} target="_blank">
                      <Button variant="outline"><MessageCircle className="w-4 h-4 mr-2" /> WhatsApp</Button>
                    </a>
                  </>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`}>
                    <Button variant="outline"><Mail className="w-4 h-4 mr-2" /> Email</Button>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Add Note */}
            <Card>
              <CardHeader>
                <CardTitle>Notitie toevoegen</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Schrijf een notitie..."
                  rows={3}
                />
                <Button
                  onClick={addNote}
                  disabled={saving || !newNote.trim()}
                  className="mt-3 bg-purple-700 hover:bg-purple-800"
                >
                  {saving ? 'Opslaan...' : 'Notitie opslaan'}
                </Button>
              </CardContent>
            </Card>

            {/* Quotes */}
            {quotes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Offertes ({quotes.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {quotes.map((quote) => (
                      <Link
                        key={quote.id}
                        href={`/demo/offertes/${quote.id}`}
                        className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">{quote.quote_number}</p>
                          <p className="text-sm text-gray-500">{formatDateTime(quote.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-purple-600">€{Number(quote.total).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
                          <span className="text-xs text-gray-500">{quote.status}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Timeline */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Tijdlijn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Lead created */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Lead aangemaakt</p>
                      <p className="text-sm text-gray-500">Via {lead.source}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(lead.created_at)}</p>
                    </div>
                  </div>

                  {/* Activities */}
                  {activities.map((activity) => {
                    const ActivityIcon = getActivityIcon(activity.activity_type);
                    return (
                      <div key={activity.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <ActivityIcon className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          {activity.description && (
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{activity.description}</p>
                          )}
                          <p className="text-xs text-gray-400">{formatDateTime(activity.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}

                  {activities.length === 0 && (
                    <p className="text-gray-500 text-sm">Nog geen activiteiten</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lead Meta */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Lead info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bron</span>
                  <span>{lead.source}</span>
                </div>
                {lead.source_detail && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bron detail</span>
                    <span>{lead.source_detail}</span>
                  </div>
                )}
                {lead.ai_score && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">AI Score</span>
                    <span className="font-medium">{lead.ai_score}/100</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Aangemaakt</span>
                  <span>{formatDateTime(lead.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Laatst bijgewerkt</span>
                  <span>{formatDateTime(lead.updated_at)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Status Change Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Status wijzigen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {allStatuses.map((status) => (
                    <Button
                      key={status.value}
                      variant={selectedStatus === status.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedStatus(status.value)}
                      className={selectedStatus === status.value ? getStatusColor(status.value) : ''}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>

                {selectedStatus === 'lost' && (
                  <div>
                    <label className="text-sm font-medium">Reden verloren</label>
                    <Input
                      value={lostReason}
                      onChange={(e) => setLostReason(e.target.value)}
                      placeholder="Bijv: te duur, andere partij gekozen..."
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowStatusModal(false)}
                    className="flex-1"
                  >
                    Annuleren
                  </Button>
                  <Button
                    onClick={() => updateStatus(selectedStatus, lostReason)}
                    disabled={saving}
                    className="flex-1 bg-purple-700 hover:bg-purple-800"
                  >
                    {saving ? 'Opslaan...' : 'Opslaan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DemoLayout>
  );
}
