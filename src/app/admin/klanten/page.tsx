'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Plus, Building2, User, Mail, Phone, MapPin, Tag, Leaf } from 'lucide-react';

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
}

export default function KlantenPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
    }
  }, [isAuthenticated, typeFilter, search]);

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter !== 'all') params.set('type', typeFilter);

      const response = await fetch(`/api/admin/customers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customer: Customer) => {
    if (customer.company_name) {
      return customer.company_name;
    }
    return `${customer.first_name} ${customer.last_name || ''}`.trim();
  };

  const getCustomerSubtitle = (customer: Customer) => {
    if (customer.company_name) {
      return `${customer.first_name} ${customer.last_name || ''}`.trim();
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const typeCounts = {
    all: customers.length,
    particulier: customers.filter(c => c.customer_type === 'particulier').length,
    zakelijk: customers.filter(c => c.customer_type === 'zakelijk').length,
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
            <h1 className="text-2xl font-semibold" style={{ color: colors.dark }}>Klanten</h1>
            <p style={{ color: colors.slate }}>Beheer je klanten en hun gegevens</p>
          </div>
          <Button
            onClick={() => setShowNewForm(true)}
            style={{ backgroundColor: colors.orange, color: 'white' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe klant
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0" style={{ backgroundColor: colors.warmWhite, boxShadow: '0 2px 8px rgba(26, 31, 46, 0.06)' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: colors.orange }}>
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.slate }}>Totaal klanten</p>
                  <p className="text-2xl font-bold" style={{ color: colors.dark }}>{total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0" style={{ backgroundColor: colors.warmWhite, boxShadow: '0 2px 8px rgba(26, 31, 46, 0.06)' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: colors.blue }}>
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.slate }}>Particulier</p>
                  <p className="text-2xl font-bold" style={{ color: colors.dark }}>{typeCounts.particulier}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0" style={{ backgroundColor: colors.warmWhite, boxShadow: '0 2px 8px rgba(26, 31, 46, 0.06)' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: colors.dark }}>
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.slate }}>Zakelijk</p>
                  <p className="text-2xl font-bold" style={{ color: colors.dark }}>{typeCounts.zakelijk}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <Card className="border-0" style={{ backgroundColor: colors.warmWhite, boxShadow: '0 2px 8px rgba(26, 31, 46, 0.06)' }}>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Zoek op naam, bedrijf, email of telefoon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:w-80"
                style={{ borderColor: colors.mist, backgroundColor: 'white' }}
              />
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'Alle klanten', icon: User },
                  { value: 'particulier', label: 'Particulier', icon: User },
                  { value: 'zakelijk', label: 'Zakelijk', icon: Building2 },
                ].map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={typeFilter === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTypeFilter(value)}
                    style={typeFilter === value
                      ? { backgroundColor: colors.dark, color: 'white' }
                      : { borderColor: colors.mist, color: colors.dark, backgroundColor: 'white' }
                    }
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers List */}
        <Card className="border-0" style={{ backgroundColor: colors.warmWhite, boxShadow: '0 2px 8px rgba(26, 31, 46, 0.06)' }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.mist}` }}>
            <CardTitle style={{ color: colors.dark }}>
              {typeFilter === 'all' ? 'Alle klanten' : typeFilter === 'particulier' ? 'Particuliere klanten' : 'Zakelijke klanten'} ({customers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {customers.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 mx-auto mb-4" style={{ color: colors.mist }} />
                <p className="mb-4" style={{ color: colors.slate }}>Geen klanten gevonden</p>
                <Button
                  onClick={() => setShowNewForm(true)}
                  variant="outline"
                  style={{ borderColor: colors.mist, color: colors.dark }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Voeg eerste klant toe
                </Button>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: colors.mist }}>
                {customers.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/admin/klanten/${customer.id}`}
                    className="block p-4 transition-colors"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.stone}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: customer.customer_type === 'zakelijk' ? colors.darkLight : 'rgba(45, 90, 71, 0.1)' }}
                        >
                          {customer.customer_type === 'zakelijk' ? (
                            <Building2 className="w-5 h-5 text-white" />
                          ) : (
                            <User className="w-5 h-5" style={{ color: colors.orange }} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg" style={{ color: colors.dark }}>
                            {getCustomerName(customer)}
                          </h3>
                          {getCustomerSubtitle(customer) && (
                            <p className="text-sm" style={{ color: colors.slate }}>{getCustomerSubtitle(customer)}</p>
                          )}
                        </div>
                      </div>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: customer.customer_type === 'zakelijk' ? colors.darkLight : 'rgba(45, 90, 71, 0.1)',
                          color: customer.customer_type === 'zakelijk' ? 'white' : colors.orange,
                          border: `1px solid ${customer.customer_type === 'zakelijk' ? colors.darkLight : colors.orange}`
                        }}
                      >
                        {customer.customer_type === 'zakelijk' ? 'Zakelijk' : 'Particulier'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm ml-12" style={{ color: colors.slate }}>
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {customer.phone}
                        </span>
                      )}
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {customer.email}
                        </span>
                      )}
                      {customer.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {customer.city}
                        </span>
                      )}
                      <span style={{ color: colors.mist }}>
                        Klant sinds {formatDate(customer.created_at)}
                      </span>
                    </div>

                    {customer.tags && customer.tags.length > 0 && (
                      <div className="flex gap-2 mt-3 ml-12">
                        {customer.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-xs flex items-center gap-1"
                            style={{ backgroundColor: 'rgba(45, 90, 71, 0.1)', color: colors.orange }}
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {customer.converted_from_lead_id && (
                      <div className="mt-2 ml-12">
                        <span
                          className="text-xs px-2 py-1 rounded"
                          style={{ backgroundColor: 'rgba(45, 90, 71, 0.1)', color: colors.orange }}
                        >
                          Geconverteerd van lead
                        </span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Customer Form Modal */}
        {showNewForm && (
          <NewCustomerModal
            onClose={() => setShowNewForm(false)}
            onCreated={() => {
              setShowNewForm(false);
              fetchCustomers();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// New Customer Modal Component
function NewCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    email: '',
    phone: '',
    street: '',
    house_number: '',
    postal_code: '',
    city: 'Gouda',
    customer_type: 'particulier',
    notes: '',
    tags: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onCreated();
      } else {
        const data = await response.json();
        setError(data.error || 'Kon klant niet aanmaken');
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
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="h-1" style={{ backgroundColor: colors.orange }} />
        <div className="p-6" style={{ borderBottom: `1px solid ${colors.mist}` }}>
          <h2 className="text-xl font-semibold" style={{ color: colors.dark }}>Nieuwe klant toevoegen</h2>
          <p className="text-sm" style={{ color: colors.slate }}>Vul de gegevens van de klant in</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ backgroundColor: 'rgba(185, 28, 28, 0.1)', color: '#b91c1c' }}
            >
              {error}
            </div>
          )}

          {/* Customer Type */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>Type klant</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, customer_type: 'particulier' }))}
                className="flex-1 p-3 rounded-lg transition-all"
                style={{
                  border: `2px solid ${formData.customer_type === 'particulier' ? colors.orange : colors.mist}`,
                  backgroundColor: formData.customer_type === 'particulier' ? 'rgba(45, 90, 71, 0.1)' : 'white'
                }}
              >
                <User
                  className="w-5 h-5 mx-auto mb-1"
                  style={{ color: formData.customer_type === 'particulier' ? colors.orange : colors.slate }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: formData.customer_type === 'particulier' ? colors.orange : colors.slate }}
                >
                  Particulier
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, customer_type: 'zakelijk' }))}
                className="flex-1 p-3 rounded-lg transition-all"
                style={{
                  border: `2px solid ${formData.customer_type === 'zakelijk' ? colors.dark : colors.mist}`,
                  backgroundColor: formData.customer_type === 'zakelijk' ? colors.darkLight : 'white'
                }}
              >
                <Building2
                  className="w-5 h-5 mx-auto mb-1"
                  style={{ color: formData.customer_type === 'zakelijk' ? 'white' : colors.slate }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: formData.customer_type === 'zakelijk' ? 'white' : colors.slate }}
                >
                  Zakelijk
                </span>
              </button>
            </div>
          </div>

          {/* Company Name (for business) */}
          {formData.customer_type === 'zakelijk' && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>Bedrijfsnaam</label>
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Bedrijfsnaam"
                style={{ borderColor: colors.mist }}
              />
            </div>
          )}

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>Voornaam *</label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Voornaam"
                required
                style={{ borderColor: colors.mist }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>Achternaam</label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Achternaam"
                style={{ borderColor: colors.mist }}
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@voorbeeld.nl"
                style={{ borderColor: colors.mist }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>Telefoon</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="06-12345678"
                style={{ borderColor: colors.mist }}
              />
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>Straat</label>
              <Input
                value={formData.street}
                onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                placeholder="Straatnaam"
                style={{ borderColor: colors.mist }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>Huisnr.</label>
              <Input
                value={formData.house_number}
                onChange={(e) => setFormData(prev => ({ ...prev, house_number: e.target.value }))}
                placeholder="12a"
                style={{ borderColor: colors.mist }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>Postcode</label>
              <Input
                value={formData.postal_code}
                onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                placeholder="1234 AB"
                style={{ borderColor: colors.mist }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>Plaats</label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Gouda"
              style={{ borderColor: colors.mist }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>Tags</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded text-sm flex items-center gap-1"
                  style={{ backgroundColor: 'rgba(45, 90, 71, 0.1)', color: colors.orange }}
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
                style={{ borderColor: colors.mist }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                style={{ borderColor: colors.mist, color: colors.dark }}
              >
                Toevoegen
              </Button>
            </div>
            <p className="text-xs mt-1" style={{ color: colors.slate }}>Bijv: VIP, Onderhoud, Tuin aanleg</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>Notities</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg resize-none"
              style={{ border: `1px solid ${colors.mist}` }}
              rows={3}
              placeholder="Eventuele opmerkingen..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4" style={{ borderTop: `1px solid ${colors.mist}` }}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              style={{ borderColor: colors.mist, color: colors.dark }}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={saving}
              style={{ backgroundColor: colors.orange, color: 'white' }}
            >
              {saving ? 'Opslaan...' : 'Klant aanmaken'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
