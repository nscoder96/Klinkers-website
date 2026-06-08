'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
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
  UserCheck,
  ExternalLink,
  Pencil,
  X,
  Save,
  type LucideIcon
} from 'lucide-react';

// Klinkers & Co Design System - Orange/Blue
const colors = {
  orange: '#FA5D29',
  orangeLight: '#FFF4F1',
  blue: '#49B3FC',
  blueLight: '#F0F9FF',
  dark: '#222222',
  darkLight: '#2d2d2d',
  slate: '#64748b',
  stone: '#F8F8F8',
  warmWhite: '#ffffff',
  mist: '#ededed',
  success: '#22c55e',
  successLight: '#f0fdf4',
};

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

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newNote, setNewNote] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertedCustomerId, setConvertedCustomerId] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPostcode, setEditPostcode] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEstimatedM2, setEditEstimatedM2] = useState('');
  const [editBudgetRange, setEditBudgetRange] = useState('');
  const [editUrgency, setEditUrgency] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [leadId, isAuthenticated]);

  const fetchData = async () => {
    try {
      const [leadRes, activitiesRes, quotesRes] = await Promise.all([
        fetch(`/api/admin/leads/${leadId}`),
        fetch(`/api/admin/leads/${leadId}/activities`),
        fetch(`/api/admin/leads/${leadId}/quotes`)
      ]);

      if (leadRes.ok) {
        const data = await leadRes.json();
        setLead(data.lead);
      }

      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        setActivities(data.activities || []);
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

  const updateStatus = async (newStatus: string, reason?: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
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
      const response = await fetch(`/api/admin/leads/${leadId}/activities`, {
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

  const startEditing = () => {
    if (lead) {
      setEditName(lead.name || '');
      setEditPhone(lead.phone || '');
      setEditEmail(lead.email || '');
      setEditAddress(lead.address || '');
      setEditPostcode(lead.postcode || '');
      setEditCity(lead.city || '');
      setEditDescription(lead.description || '');
      setEditEstimatedM2(lead.estimated_m2?.toString() || '');
      setEditBudgetRange(lead.budget_range || '');
      setEditUrgency(lead.urgency || '');
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveLeadChanges = async () => {
    if (!editName.trim()) {
      alert('Naam is verplicht');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone || null,
          email: editEmail || null,
          address: editAddress || null,
          postcode: editPostcode || null,
          city: editCity || 'Onbekend',
          description: editDescription || null,
          estimated_m2: editEstimatedM2 ? parseFloat(editEstimatedM2) : null,
          budget_range: editBudgetRange || null,
          urgency: editUrgency || null
        })
      });

      if (response.ok) {
        await fetchData();
        setIsEditing(false);
      } else {
        alert('Er ging iets mis bij het opslaan');
      }
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Er ging iets mis');
    } finally {
      setSaving(false);
    }
  };

  const convertToCustomer = async () => {
    setConverting(true);
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (response.ok) {
        setConvertedCustomerId(data.customer.id);
        await fetchData(); // Refresh lead data to show updated status
      } else {
        if (data.customer_id) {
          // Lead already converted
          setConvertedCustomerId(data.customer_id);
        } else {
          alert(data.error || 'Kon lead niet converteren');
        }
      }
    } catch (error) {
      console.error('Error converting lead:', error);
      alert('Er ging iets mis');
    } finally {
      setConverting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      new: `bg-[${colors.orangeLight}] text-[${colors.orange}]`,
      contacted: `bg-[${colors.blueLight}] text-[${colors.blue}]`,
      site_visit_scheduled: `bg-[${colors.blueLight}] text-[${colors.blue}]`,
      quote_sent: `bg-[${colors.orangeLight}] text-[${colors.orange}]`,
      negotiating: `bg-[${colors.blueLight}] text-[${colors.blue}]`,
      won: `bg-[${colors.successLight}] text-[${colors.success}]`,
      lost: 'bg-[rgba(239,68,68,0.1)] text-[#ef4444]',
      dormant: `bg-[${colors.mist}] text-[${colors.slate}]`,
    };
    return statusColors[status] || `bg-[${colors.mist}] text-[${colors.slate}]`;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Laden...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!lead) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Lead niet gevonden</p>
          <Link href="/admin/leads">
            <Button className="mt-4">Terug naar leads</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex justify-between items-start">
          <div>
            <Link href="/admin/leads" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Terug naar leads
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{lead.name}</h1>
            <p className="text-gray-500">{lead.city}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full font-medium ${getStatusColor(lead.status)}`}>
              {getStatusLabel(lead.status)}
            </span>
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-2" /> Annuleren
                </Button>
                <Button
                  onClick={saveLeadChanges}
                  disabled={saving}
                  style={{ backgroundColor: colors.success }}
                  className="hover:opacity-90 text-white"
                >
                  <Save className="w-4 h-4 mr-2" /> {saving ? 'Opslaan...' : 'Opslaan'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={startEditing}
                >
                  <Pencil className="w-4 h-4 mr-2" /> Bewerken
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedStatus(lead.status);
                    setShowStatusModal(true);
                  }}
                >
                  Status wijzigen
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info & Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <Card className={isEditing ? `border-2 border-[${colors.blue}]/30` : ''}>
              <CardHeader>
                <CardTitle>Contactgegevens</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {isEditing ? (
                  <>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700">Naam *</label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Volledige naam"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Telefoon</label>
                      <Input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="06-12345678"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <Input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="email@voorbeeld.nl"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Adres</label>
                      <Input
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="Straat en huisnummer"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Postcode</label>
                      <Input
                        value={editPostcode}
                        onChange={(e) => setEditPostcode(e.target.value)}
                        placeholder="1234 AB"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Plaats</label>
                      <Input
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        placeholder="Stad"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm text-gray-500">Telefoon</label>
                      <p className="font-medium">
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} className="hover:underline" style={{ color: colors.blue }}>
                            {lead.phone}
                          </a>
                        ) : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="font-medium">
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} className="hover:underline" style={{ color: colors.blue }}>
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
                  </>
                )}
              </CardContent>
            </Card>

            {/* Project Info */}
            <Card className={isEditing ? `border-2 border-[${colors.blue}]/30` : ''}>
              <CardHeader>
                <CardTitle>Projectinformatie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Beschrijving</label>
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Beschrijf het project..."
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Geschat oppervlak (m²)</label>
                        <Input
                          type="number"
                          value={editEstimatedM2}
                          onChange={(e) => setEditEstimatedM2(e.target.value)}
                          placeholder="bijv. 50"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Budget</label>
                        <Input
                          value={editBudgetRange}
                          onChange={(e) => setEditBudgetRange(e.target.value)}
                          placeholder="bijv. €5.000 - €10.000"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Urgentie</label>
                        <select
                          value={editUrgency}
                          onChange={(e) => setEditUrgency(e.target.value)}
                          className="w-full border rounded-md px-3 py-2 text-sm"
                        >
                          <option value="">Selecteer...</option>
                          <option value="laag">Laag - Geen haast</option>
                          <option value="normaal">Normaal</option>
                          <option value="hoog">Hoog - Zo snel mogelijk</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
                {!isEditing && lead.project_type && lead.project_type.length > 0 && (
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acties</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Link href={`/admin/offerte/${lead.id}`}>
                  <Button style={{ backgroundColor: colors.orange }} className="hover:opacity-90 text-white">
                    <FileText className="w-4 h-4 mr-2" /> Offerte maken
                  </Button>
                </Link>
                {lead.status !== 'won' && lead.status !== 'lost' && (
                  <Button
                    onClick={() => setShowConvertModal(true)}
                    style={{ backgroundColor: colors.blue }}
                    className="hover:opacity-90 text-white"
                  >
                    <UserCheck className="w-4 h-4 mr-2" /> Converteer naar klant
                  </Button>
                )}
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

            {/* Already Converted Notice */}
            {lead.status === 'won' && (
              <Card style={{ backgroundColor: colors.successLight, borderColor: colors.success }} className="border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: colors.success }}>
                      <UserCheck className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: colors.dark }}>Lead is geconverteerd naar klant</p>
                      <p className="text-sm" style={{ color: colors.success }}>Deze lead is succesvol omgezet naar een klant.</p>
                    </div>
                    <Link href="/admin/klanten">
                      <Button variant="outline" size="sm" style={{ borderColor: colors.success, color: colors.success }} className="hover:opacity-80">
                        Bekijk klanten <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

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
                  style={{ backgroundColor: colors.dark }}
                  className="mt-3 hover:opacity-90 text-white"
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
                        href={`/admin/offertes/${quote.id}`}
                        className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">{quote.quote_number}</p>
                          <p className="text-sm text-gray-500">{formatDateTime(quote.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium" style={{ color: colors.orange }}>€{Number(quote.total).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
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
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.orangeLight }}>
                      <Sparkles className="w-4 h-4" style={{ color: colors.orange }} />
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
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.blueLight }}>
                          <ActivityIcon className="w-4 h-4" style={{ color: colors.blue }} />
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
                    style={{ backgroundColor: colors.dark }}
                    className="flex-1 hover:opacity-90 text-white"
                  >
                    {saving ? 'Opslaan...' : 'Opslaan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Convert to Customer Modal */}
        {showConvertModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" style={{ color: colors.blue }} />
                  Lead converteren naar klant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {convertedCustomerId ? (
                  // Success state
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: colors.successLight }}>
                      <CheckCircle className="w-8 h-8" style={{ color: colors.success }} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: colors.success }}>
                      Lead succesvol geconverteerd!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      De lead is omgezet naar een klant. Je kunt nu het klantprofiel bekijken.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowConvertModal(false);
                          setConvertedCustomerId(null);
                        }}
                      >
                        Sluiten
                      </Button>
                      <Link href={`/admin/klanten/${convertedCustomerId}`}>
                        <Button style={{ backgroundColor: colors.blue }} className="hover:opacity-90 text-white">
                          Bekijk klant <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  // Confirmation state
                  <>
                    <div className="rounded-lg p-4 border" style={{ backgroundColor: colors.blueLight, borderColor: colors.blue }}>
                      <p className="font-medium mb-2" style={{ color: colors.dark }}>
                        De volgende gegevens worden overgenomen:
                      </p>
                      <ul className="text-sm space-y-1" style={{ color: colors.slate }}>
                        <li>• Naam: <strong>{lead.name}</strong></li>
                        {lead.email && <li>• Email: {lead.email}</li>}
                        {lead.phone && <li>• Telefoon: {lead.phone}</li>}
                        {lead.address && <li>• Adres: {lead.address}</li>}
                        {lead.city && <li>• Plaats: {lead.city}</li>}
                      </ul>
                    </div>

                    <div className="rounded-lg p-4 border" style={{ backgroundColor: colors.orangeLight, borderColor: colors.orange }}>
                      <p className="text-sm" style={{ color: colors.dark }}>
                        <strong>Let op:</strong> Na conversie wordt de lead status automatisch
                        op "Gewonnen" gezet. Eventuele offertes en projecten worden gekoppeld
                        aan de nieuwe klant.
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowConvertModal(false)}
                        className="flex-1"
                        disabled={converting}
                      >
                        Annuleren
                      </Button>
                      <Button
                        onClick={convertToCustomer}
                        disabled={converting}
                        style={{ backgroundColor: colors.blue }}
                        className="flex-1 hover:opacity-90 text-white"
                      >
                        {converting ? 'Converteren...' : 'Bevestig conversie'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
