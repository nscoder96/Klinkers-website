'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Trash2, Leaf } from 'lucide-react';

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
  city: string;
  project_type: string[] | null;
  description: string | null;
  estimated_m2: number | null;
  status: string;
  source: string;
  created_at: string;
}

export default function LeadsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const router = useRouter();
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

  const deleteLead = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Weet je zeker dat je lead "${name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchLeads();
      } else {
        const data = await response.json();
        alert(data.error || 'Kon lead niet verwijderen');
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Er ging iets mis bij het verwijderen');
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

  const getStatusStyle = (status: string) => {
    const styles: Record<string, { bg: string; text: string; border: string }> = {
      new: { bg: colors.orangeLight, text: colors.orange, border: 'rgba(250, 93, 41, 0.3)' },
      contacted: { bg: colors.blueLight, text: colors.blue, border: 'rgba(73, 179, 252, 0.3)' },
      site_visit_scheduled: { bg: colors.blueLight, text: colors.blue, border: 'rgba(73, 179, 252, 0.4)' },
      quote_sent: { bg: colors.orangeLight, text: colors.orange, border: 'rgba(250, 93, 41, 0.4)' },
      negotiating: { bg: 'rgba(100, 116, 139, 0.15)', text: colors.slate, border: 'rgba(100, 116, 139, 0.3)' },
      won: { bg: colors.successLight, text: colors.success, border: colors.success },
      lost: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
      dormant: { bg: colors.mist, text: colors.slate, border: colors.mist },
    };
    return styles[status] || styles.dormant;
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.stone }}>
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-3">
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ backgroundColor: colors.orange }}
            />
            <div
              className="relative w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: colors.orange }}
            >
              <Leaf className="w-6 h-6 text-white animate-pulse" />
            </div>
          </div>
          <p style={{ color: colors.slate }}>Laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: colors.dark }}>Leads</h1>
            <p style={{ color: colors.slate }}>Beheer al je leads en klanten</p>
          </div>
        </div>

        {/* Search & Filter */}
        <Card className="border-0" style={{ backgroundColor: colors.warmWhite, boxShadow: '0 2px 8px rgba(26, 31, 46, 0.06)' }}>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Zoek op naam, plaats, email of telefoon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:w-80"
                style={{ borderColor: colors.mist, backgroundColor: 'white' }}
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
                    style={filter === value
                      ? { backgroundColor: colors.dark, color: 'white' }
                      : { borderColor: colors.mist, color: colors.dark, backgroundColor: 'white' }
                    }
                  >
                    {label} ({statusCounts[value as keyof typeof statusCounts] || 0})
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads List */}
        <Card className="border-0" style={{ backgroundColor: colors.warmWhite, boxShadow: '0 2px 8px rgba(26, 31, 46, 0.06)' }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.mist}` }}>
            <CardTitle style={{ color: colors.dark }}>
              {filter === 'all' ? 'Alle leads' : getStatusLabel(filter)} ({filteredLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredLeads.length === 0 ? (
              <p className="text-center py-8" style={{ color: colors.slate }}>Geen leads gevonden</p>
            ) : (
              <div className="divide-y" style={{ borderColor: colors.mist }}>
                {filteredLeads.map((lead) => {
                  const statusStyle = getStatusStyle(lead.status);
                  return (
                    <div
                      key={lead.id}
                      className="p-4 transition-colors"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.stone}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Link href={`/admin/leads/${lead.id}`} className="flex-1">
                          <h3
                            className="font-semibold text-lg transition-colors hover:opacity-70"
                            style={{ color: colors.dark }}
                          >
                            {lead.name}
                          </h3>
                          <p className="text-sm" style={{ color: colors.slate }}>{lead.city}</p>
                        </Link>
                        <div className="flex items-center gap-2">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.text,
                              border: `1px solid ${statusStyle.border}`
                            }}
                          >
                            {getStatusLabel(lead.status)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="hover:bg-red-50"
                            style={{ borderColor: colors.mist, color: '#b91c1c' }}
                            onClick={(e) => deleteLead(e, lead.id, lead.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <Link href={`/admin/leads/${lead.id}`}>
                        {lead.description && (
                          <p className="text-sm mb-3 line-clamp-2" style={{ color: colors.slate }}>
                            {lead.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm" style={{ color: colors.slate }}>
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
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded text-xs"
                                style={{ backgroundColor: colors.mist, color: colors.dark }}
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
