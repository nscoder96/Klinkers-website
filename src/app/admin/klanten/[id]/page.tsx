'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Hammer,
  Receipt,
  Calendar,
  Tag,
  Edit2,
  Trash2,
  Euro,
  TrendingUp,
  Clock,
  MessageCircle,
  ExternalLink,
  ChevronRight
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

interface Customer {
  id: string;
  first_name: string;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  customer_type: 'particulier' | 'zakelijk';
  tags: string[];
  notes: string | null;
  converted_from_lead_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Quote {
  id: string;
  quote_number: string;
  status: string;
  total: number;
  created_at: string;
  project_description: string | null;
}

interface Project {
  id: string;
  project_number: string;
  status: string;
  quoted_amount: number | null;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  invoice_date: string;
  due_date: string | null;
}

interface Contract {
  id: string;
  name: string;
  status: string;
  frequency: string;
  price_per_visit: number | null;
  annual_value: number | null;
}

interface CustomerStats {
  total_quotes: number;
  total_projects: number;
  total_invoices: number;
  total_revenue: number;
  open_invoices: number;
  active_contracts: number;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [originalLead, setOriginalLead] = useState<any>(null);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [customerId, isAuthenticated]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
        setQuotes(data.quotes || []);
        setProjects(data.projects || []);
        setInvoices(data.invoices || []);
        setContracts(data.contracts || []);
        setOriginalLead(data.original_lead);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/admin/klanten');
      } else {
        const data = await response.json();
        alert(data.error || 'Kon klant niet verwijderen');
      }
    } catch (error) {
      alert('Er ging iets mis');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getCustomerName = (customer: Customer) => {
    if (customer.company_name) {
      return customer.company_name;
    }
    return `${customer.first_name} ${customer.last_name || ''}`.trim();
  };

  const getContactPerson = (customer: Customer) => {
    if (customer.company_name) {
      return `${customer.first_name} ${customer.last_name || ''}`.trim();
    }
    return null;
  };

  const getFullAddress = (customer: Customer) => {
    const parts = [];
    if (customer.street) {
      parts.push(`${customer.street} ${customer.house_number || ''}`);
    }
    if (customer.postal_code || customer.city) {
      parts.push(`${customer.postal_code || ''} ${customer.city || ''}`);
    }
    return parts.join(', ').trim() || null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getQuoteStatusColor = (status: string): React.CSSProperties => {
    const statusColors: Record<string, React.CSSProperties> = {
      draft: { backgroundColor: colors.stone, color: colors.slate },
      sent: { backgroundColor: colors.blueLight, color: colors.blue },
      viewed: { backgroundColor: colors.orangeLight, color: colors.orange },
      accepted: { backgroundColor: colors.successLight, color: colors.success },
      declined: { backgroundColor: '#fee2e2', color: '#dc2626' },
      expired: { backgroundColor: colors.orangeLight, color: colors.orange },
    };
    return statusColors[status] || { backgroundColor: colors.stone, color: colors.slate };
  };

  const getInvoiceStatusColor = (status: string): React.CSSProperties => {
    const statusColors: Record<string, React.CSSProperties> = {
      draft: { backgroundColor: colors.stone, color: colors.slate },
      sent: { backgroundColor: colors.blueLight, color: colors.blue },
      paid: { backgroundColor: colors.successLight, color: colors.success },
      overdue: { backgroundColor: '#fee2e2', color: '#dc2626' },
      cancelled: { backgroundColor: colors.stone, color: colors.slate },
    };
    return statusColors[status] || { backgroundColor: colors.stone, color: colors.slate };
  };

  const getProjectStatusColor = (status: string): React.CSSProperties => {
    const statusColors: Record<string, React.CSSProperties> = {
      planned: { backgroundColor: colors.blueLight, color: colors.blue },
      in_progress: { backgroundColor: '#fef3c7', color: '#92400e' },
      completed: { backgroundColor: colors.successLight, color: colors.success },
      on_hold: { backgroundColor: colors.orangeLight, color: colors.orange },
    };
    return statusColors[status] || { backgroundColor: colors.stone, color: colors.slate };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.stone }}>
        <p style={{ color: colors.slate }}>Laden...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!customer) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p style={{ color: colors.slate }}>Klant niet gevonden</p>
          <Link href="/admin/klanten">
            <Button className="mt-4" style={{ backgroundColor: colors.orange }}>Terug naar klanten</Button>
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
            <Link href="/admin/klanten" className="text-sm flex items-center gap-1" style={{ color: colors.slate }}>
              <ArrowLeft className="w-4 h-4" /> Terug naar klanten
            </Link>
            <div className="flex items-center gap-3 mt-2">
              <div className="p-3 rounded-xl" style={{ backgroundColor: customer.customer_type === 'zakelijk' ? colors.orangeLight : colors.blueLight }}>
                {customer.customer_type === 'zakelijk' ? (
                  <Building2 className="w-6 h-6" style={{ color: colors.orange }} />
                ) : (
                  <User className="w-6 h-6" style={{ color: colors.blue }} />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: colors.dark }}>{getCustomerName(customer)}</h1>
                {getContactPerson(customer) && (
                  <p style={{ color: colors.slate }}>{getContactPerson(customer)}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-full text-sm font-medium" style={{
              backgroundColor: customer.customer_type === 'zakelijk' ? colors.orangeLight : colors.blueLight,
              color: customer.customer_type === 'zakelijk' ? colors.orange : colors.blue
            }}>
              {customer.customer_type === 'zakelijk' ? 'Zakelijk' : 'Particulier'}
            </span>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(true)}
            >
              <Edit2 className="w-4 h-4 mr-2" /> Bewerken
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card style={{ backgroundColor: colors.successLight, borderColor: colors.success }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: colors.success }}>
                    <Euro className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: colors.success }}>Totale omzet</p>
                    <p className="text-xl font-bold" style={{ color: colors.dark }}>{formatCurrency(stats.total_revenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: colors.orangeLight, borderColor: colors.orange }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: colors.orange }}>
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: colors.orange }}>Offertes</p>
                    <p className="text-xl font-bold" style={{ color: colors.dark }}>{stats.total_quotes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: colors.blueLight, borderColor: colors.blue }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: colors.blue }}>
                    <Hammer className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: colors.blue }}>Projecten</p>
                    <p className="text-xl font-bold" style={{ color: colors.dark }}>{stats.total_projects}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: colors.orangeLight, borderColor: colors.orange }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: colors.orange }}>
                    <Receipt className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: colors.orange }}>Facturen</p>
                    <p className="text-xl font-bold" style={{ color: colors.dark }}>{stats.total_invoices}</p>
                    {stats.open_invoices > 0 && (
                      <p className="text-xs" style={{ color: '#dc2626' }}>{stats.open_invoices} openstaand</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contactgegevens</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm flex items-center gap-1" style={{ color: colors.slate }}>
                    <Phone className="w-3.5 h-3.5" /> Telefoon
                  </label>
                  <p className="font-medium">
                    {customer.phone ? (
                      <a href={`tel:${customer.phone}`} style={{ color: colors.blue }} className="hover:underline">
                        {customer.phone}
                      </a>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm flex items-center gap-1" style={{ color: colors.slate }}>
                    <Mail className="w-3.5 h-3.5" /> Email
                  </label>
                  <p className="font-medium">
                    {customer.email ? (
                      <a href={`mailto:${customer.email}`} style={{ color: colors.blue }} className="hover:underline">
                        {customer.email}
                      </a>
                    ) : '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm flex items-center gap-1" style={{ color: colors.slate }}>
                    <MapPin className="w-3.5 h-3.5" /> Adres
                  </label>
                  <p className="font-medium">{getFullAddress(customer) || '-'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acties</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Link href={`/admin/offerte/nieuw?customer_id=${customer.id}`}>
                  <Button style={{ backgroundColor: colors.orange }}>
                    <FileText className="w-4 h-4 mr-2" /> Nieuwe offerte
                  </Button>
                </Link>
                {customer.phone && (
                  <>
                    <a href={`tel:${customer.phone}`}>
                      <Button variant="outline"><Phone className="w-4 h-4 mr-2" /> Bellen</Button>
                    </a>
                    <a href={`https://wa.me/31${customer.phone.replace(/^0/, '').replace(/[^0-9]/g, '')}`} target="_blank">
                      <Button variant="outline"><MessageCircle className="w-4 h-4 mr-2" /> WhatsApp</Button>
                    </a>
                  </>
                )}
                {customer.email && (
                  <a href={`mailto:${customer.email}`}>
                    <Button variant="outline"><Mail className="w-4 h-4 mr-2" /> Email</Button>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Quotes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" style={{ color: colors.orange }} />
                  Offertes ({quotes.length})
                </CardTitle>
                <Link href={`/admin/offerte/nieuw?customer_id=${customer.id}`}>
                  <Button size="sm" variant="outline">+ Nieuwe offerte</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {quotes.length === 0 ? (
                  <p className="text-center py-6" style={{ color: colors.slate }}>Nog geen offertes</p>
                ) : (
                  <div className="space-y-3">
                    {quotes.map((quote) => (
                      <Link
                        key={quote.id}
                        href={`/admin/offertes/${quote.id}`}
                        className="flex justify-between items-center p-3 border rounded-lg group"
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.stone)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div>
                          <p className="font-medium" style={{ color: colors.dark }}>{quote.quote_number}</p>
                          {quote.project_description && (
                            <p className="text-sm line-clamp-1" style={{ color: colors.slate }}>{quote.project_description}</p>
                          )}
                          <p className="text-xs" style={{ color: colors.mist }}>{formatDate(quote.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-medium" style={{ color: colors.orange }}>{formatCurrency(quote.total)}</p>
                            <span className="text-xs px-2 py-0.5 rounded" style={getQuoteStatusColor(quote.status)}>
                              {quote.status}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4" style={{ color: colors.mist }} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hammer className="w-5 h-5" style={{ color: colors.blue }} />
                  Projecten ({projects.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <p className="text-center py-6" style={{ color: colors.slate }}>Nog geen projecten</p>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/admin/projecten/${project.id}`}
                        className="flex justify-between items-center p-3 border rounded-lg group"
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.stone)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div>
                          <p className="font-medium" style={{ color: colors.dark }}>{project.project_number}</p>
                          <p className="text-xs" style={{ color: colors.mist }}>{formatDate(project.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            {project.quoted_amount && (
                              <p className="font-medium" style={{ color: colors.dark }}>{formatCurrency(project.quoted_amount)}</p>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded" style={getProjectStatusColor(project.status)}>
                              {project.status}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4" style={{ color: colors.mist }} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" style={{ color: colors.orange }} />
                  Facturen ({invoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-center py-6" style={{ color: colors.slate }}>Nog geen facturen</p>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex justify-between items-center p-3 border rounded-lg"
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.stone)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div>
                          <p className="font-medium" style={{ color: colors.dark }}>{invoice.invoice_number}</p>
                          <p className="text-xs" style={{ color: colors.mist }}>{formatDate(invoice.invoice_date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium" style={{ color: colors.dark }}>{formatCurrency(invoice.total)}</p>
                          <span className="text-xs px-2 py-0.5 rounded" style={getInvoiceStatusColor(invoice.status)}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Meta Info */}
          <div className="space-y-6">
            {/* Tags */}
            {customer.tags && customer.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {customer.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-sm"
                        style={{ backgroundColor: colors.orangeLight, color: colors.orange }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {customer.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notities</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap" style={{ color: colors.slate }}>{customer.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Original Lead */}
            {originalLead && (
              <Card style={{ borderColor: colors.success, backgroundColor: `${colors.successLight}80` }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: colors.success }}>
                    <TrendingUp className="w-4 h-4" /> Geconverteerd van lead
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: colors.slate }}>Originele lead</span>
                    <Link href={`/admin/leads/${originalLead.id}`} className="hover:underline flex items-center gap-1" style={{ color: colors.success }}>
                      {originalLead.name} <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.slate }}>Bron</span>
                    <span style={{ color: colors.dark }}>{originalLead.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.slate }}>Lead datum</span>
                    <span style={{ color: colors.dark }}>{formatDate(originalLead.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Maintenance Contracts */}
            {contracts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Onderhoudscontracten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contracts.map((contract) => (
                      <div key={contract.id} className="p-3 rounded-lg" style={{ backgroundColor: colors.stone }}>
                        <p className="font-medium" style={{ color: colors.dark }}>{contract.name}</p>
                        <div className="text-sm mt-1" style={{ color: colors.slate }}>
                          <p>Frequentie: {contract.frequency}</p>
                          {contract.annual_value && (
                            <p>Jaarwaarde: {formatCurrency(contract.annual_value)}</p>
                          )}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded mt-2 inline-block" style={{
                          backgroundColor: contract.status === 'active' ? colors.successLight : colors.stone,
                          color: contract.status === 'active' ? colors.success : colors.slate
                        }}>
                          {contract.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Meta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Klantinfo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: colors.slate }}>Klant sinds</span>
                  <span style={{ color: colors.dark }}>{formatDate(customer.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.slate }}>Laatst bijgewerkt</span>
                  <span style={{ color: colors.dark }}>{formatDate(customer.updated_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.slate }}>Klant ID</span>
                  <span className="font-mono text-xs" style={{ color: colors.dark }}>{customer.id.slice(0, 8)}...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <EditCustomerModal
            customer={customer}
            onClose={() => setShowEditModal(false)}
            onSaved={() => {
              setShowEditModal(false);
              fetchData();
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle style={{ color: '#dc2626' }}>Klant verwijderen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4" style={{ color: colors.dark }}>
                  Weet je zeker dat je <strong>{getCustomerName(customer)}</strong> wilt verwijderen?
                  Dit kan niet ongedaan worden gemaakt.
                </p>
                {(quotes.length > 0 || projects.length > 0 || invoices.length > 0) && (
                  <div className="p-3 rounded-lg text-sm mb-4" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                    Let op: Deze klant heeft nog gekoppelde offertes, projecten of facturen.
                    Verwijderen is mogelijk niet toegestaan.
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1"
                  >
                    Annuleren
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1"
                    style={{ backgroundColor: '#dc2626' }}
                  >
                    {deleting ? 'Verwijderen...' : 'Verwijderen'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Edit Customer Modal Component
function EditCustomerModal({
  customer,
  onClose,
  onSaved
}: {
  customer: Customer;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [formData, setFormData] = useState({
    first_name: customer.first_name,
    last_name: customer.last_name || '',
    company_name: customer.company_name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    street: customer.street || '',
    house_number: customer.house_number || '',
    postal_code: customer.postal_code || '',
    city: customer.city || 'Gouda',
    customer_type: customer.customer_type,
    notes: customer.notes || '',
    tags: customer.tags || [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSaved();
      } else {
        const data = await response.json();
        setError(data.error || 'Kon klant niet bijwerken');
      }
    } catch (err) {
      setError('Er ging iets mis');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Klant bewerken</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
              {error}
            </div>
          )}

          {/* Customer Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Type klant</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, customer_type: 'particulier' }))}
                className="flex-1 p-3 rounded-lg border-2 transition-all"
                style={{
                  borderColor: formData.customer_type === 'particulier' ? colors.blue : '#e5e7eb',
                  backgroundColor: formData.customer_type === 'particulier' ? colors.blueLight : 'transparent'
                }}
              >
                <User className="w-5 h-5 mx-auto mb-1" style={{ color: formData.customer_type === 'particulier' ? colors.blue : colors.slate }} />
                <span className="text-sm font-medium" style={{ color: formData.customer_type === 'particulier' ? colors.blue : colors.slate }}>
                  Particulier
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, customer_type: 'zakelijk' }))}
                className="flex-1 p-3 rounded-lg border-2 transition-all"
                style={{
                  borderColor: formData.customer_type === 'zakelijk' ? colors.orange : '#e5e7eb',
                  backgroundColor: formData.customer_type === 'zakelijk' ? colors.orangeLight : 'transparent'
                }}
              >
                <Building2 className="w-5 h-5 mx-auto mb-1" style={{ color: formData.customer_type === 'zakelijk' ? colors.orange : colors.slate }} />
                <span className="text-sm font-medium" style={{ color: formData.customer_type === 'zakelijk' ? colors.orange : colors.slate }}>
                  Zakelijk
                </span>
              </button>
            </div>
          </div>

          {/* Company Name */}
          {formData.customer_type === 'zakelijk' && (
            <div>
              <label className="block text-sm font-medium mb-1">Bedrijfsnaam</label>
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Bedrijfsnaam"
              />
            </div>
          )}

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Voornaam *</label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Achternaam</label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefoon</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Straat</label>
              <Input
                value={formData.street}
                onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Huisnr.</label>
              <Input
                value={formData.house_number}
                onChange={(e) => setFormData(prev => ({ ...prev, house_number: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Postcode</label>
              <Input
                value={formData.postal_code}
                onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Plaats</label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded text-sm flex items-center gap-1"
                  style={{ backgroundColor: colors.orangeLight, color: colors.orange }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:opacity-70"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Voeg tag toe..."
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Toevoegen
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notities</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={saving}
              style={{ backgroundColor: colors.orange }}
            >
              {saving ? 'Opslaan...' : 'Wijzigingen opslaan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
