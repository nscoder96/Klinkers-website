'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Save,
  Check,
  RefreshCw,
  Settings,
  Sparkles,
  FileEdit,
  ChevronRight,
  Wrench,
  Calculator,
  Link2,
  Euro
} from 'lucide-react';
import Link from 'next/link';

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

interface CompanySettings {
  company_name: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  postal_code: string;
  city: string;
  kvk_number: string;
  btw_number: string;
  iban: string;
}

const SETTINGS_KEY = 'klinkers_company_settings';
const ONBOARDING_KEY = 'klinkers_onboarding_complete';

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: '',
    owner_name: '',
    phone: '',
    email: '',
    address: '',
    postal_code: '',
    city: '',
    kvk_number: '',
    btw_number: '',
    iban: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    window.location.reload();
  };

  const updateSetting = (key: keyof CompanySettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, ${colors.stone}, ${colors.warmWhite})` }}>
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: colors.orange }} />
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.orange }}>
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="font-medium" style={{ color: colors.slate }}>Laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: colors.dark }}>
            <Settings className="w-8 h-8" style={{ color: colors.slate }} />
            Instellingen
          </h1>
          <p className="mt-1" style={{ color: colors.slate }}>Beheer je bedrijfsgegevens en voorkeuren</p>
        </div>

        {/* Company Info */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b" style={{ background: `linear-gradient(to right, ${colors.stone}, ${colors.warmWhite})` }}>
            <CardTitle className="text-lg font-semibold flex items-center gap-2" style={{ color: colors.dark }}>
              <Building2 className="w-5 h-5" style={{ color: colors.blue }} />
              Bedrijfsgegevens
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>
                  Bedrijfsnaam
                </label>
                <Input
                  value={settings.company_name}
                  onChange={(e) => updateSetting('company_name', e.target.value)}
                  placeholder="Jouw Hoveniersbedrijf"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>
                  Naam eigenaar
                </label>
                <Input
                  value={settings.owner_name}
                  onChange={(e) => updateSetting('owner_name', e.target.value)}
                  placeholder="Jan Jansen"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>
                <MapPin className="w-4 h-4 inline mr-1" />
                Adres
              </label>
              <Input
                value={settings.address}
                onChange={(e) => updateSetting('address', e.target.value)}
                placeholder="Tuinstraat 123"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>
                  Postcode
                </label>
                <Input
                  value={settings.postal_code}
                  onChange={(e) => updateSetting('postal_code', e.target.value)}
                  placeholder="1234 AB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>
                  Plaats
                </label>
                <Input
                  value={settings.city}
                  onChange={(e) => updateSetting('city', e.target.value)}
                  placeholder="Amsterdam"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b" style={{ background: `linear-gradient(to right, ${colors.stone}, ${colors.warmWhite})` }}>
            <CardTitle className="text-lg font-semibold flex items-center gap-2" style={{ color: colors.dark }}>
              <Phone className="w-5 h-5" style={{ color: colors.success }} />
              Contactgegevens
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefoonnummer
                </label>
                <Input
                  value={settings.phone}
                  onChange={(e) => updateSetting('phone', e.target.value)}
                  placeholder="06 12345678"
                  type="tel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>
                  <Mail className="w-4 h-4 inline mr-1" />
                  E-mailadres
                </label>
                <Input
                  value={settings.email}
                  onChange={(e) => updateSetting('email', e.target.value)}
                  placeholder="info@jouwbedrijf.nl"
                  type="email"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b" style={{ background: `linear-gradient(to right, ${colors.stone}, ${colors.warmWhite})` }}>
            <CardTitle className="text-lg font-semibold flex items-center gap-2" style={{ color: colors.dark }}>
              <FileText className="w-5 h-5" style={{ color: colors.blue }} />
              Zakelijke gegevens
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>
                  KvK-nummer
                </label>
                <Input
                  value={settings.kvk_number}
                  onChange={(e) => updateSetting('kvk_number', e.target.value)}
                  placeholder="12345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>
                  BTW-nummer
                </label>
                <Input
                  value={settings.btw_number}
                  onChange={(e) => updateSetting('btw_number', e.target.value)}
                  placeholder="NL123456789B01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>
                <CreditCard className="w-4 h-4 inline mr-1" />
                IBAN
              </label>
              <Input
                value={settings.iban}
                onChange={(e) => updateSetting('iban', e.target.value)}
                placeholder="NL00 BANK 0123 4567 89"
              />
            </div>
          </CardContent>
        </Card>

        {/* Module Instellingen */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b" style={{ background: `linear-gradient(to right, ${colors.stone}, ${colors.warmWhite})` }}>
            <CardTitle className="text-lg font-semibold flex items-center gap-2" style={{ color: colors.dark }}>
              <Settings className="w-5 h-5" style={{ color: colors.orange }} />
              Module Instellingen
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Link
              href="/admin/instellingen/offertes"
              className="flex items-center justify-between p-4 transition-colors border-b"
              style={{ ['--hover-bg' as string]: colors.stone }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.stone}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: colors.orangeLight }}>
                  <FileEdit className="w-5 h-5" style={{ color: colors.orange }} />
                </div>
                <div>
                  <p className="font-medium" style={{ color: colors.dark }}>Offerte Instellingen</p>
                  <p className="text-sm" style={{ color: colors.slate }}>Logo, teksten, betalingsgegevens en weergave opties</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: colors.slate }} />
            </Link>
            <Link
              href="/admin/instellingen/arbeidsregels"
              className="flex items-center justify-between p-4 transition-colors border-b"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.stone}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: colors.blueLight }}>
                  <Wrench className="w-5 h-5" style={{ color: colors.blue }} />
                </div>
                <div>
                  <p className="font-medium" style={{ color: colors.dark }}>Arbeidsregels</p>
                  <p className="text-sm" style={{ color: colors.slate }}>Werkzaamheden met gekoppelde taken voor AI-analyse</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: colors.slate }} />
            </Link>
            <Link
              href="/admin/instellingen/formules"
              className="flex items-center justify-between p-4 transition-colors border-b"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.stone}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: colors.blueLight }}>
                  <Calculator className="w-5 h-5" style={{ color: colors.blue }} />
                </div>
                <div>
                  <p className="font-medium" style={{ color: colors.dark }}>Berekeningsformules</p>
                  <p className="text-sm" style={{ color: colors.slate }}>Formules voor automatische materiaalberekeningen</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: colors.slate }} />
            </Link>
            <Link
              href="/admin/instellingen/koppelingen"
              className="flex items-center justify-between p-4 transition-colors border-b"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.stone}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: colors.successLight }}>
                  <Link2 className="w-5 h-5" style={{ color: colors.success }} />
                </div>
                <div>
                  <p className="font-medium" style={{ color: colors.dark }}>Materiaal Koppelingen</p>
                  <p className="text-sm" style={{ color: colors.slate }}>Koppel materialen aan werkzaamheden</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: colors.slate }} />
            </Link>
            <Link
              href="/admin/prijzen"
              className="flex items-center justify-between p-4 transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.stone}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: colors.orangeLight }}>
                  <Euro className="w-5 h-5" style={{ color: colors.orange }} />
                </div>
                <div>
                  <p className="font-medium" style={{ color: colors.dark }}>Prijsbibliotheek</p>
                  <p className="text-sm" style={{ color: colors.slate }}>Beheer materiaal- en arbeidsprijzen</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: colors.slate }} />
            </Link>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button
            variant="outline"
            onClick={handleResetOnboarding}
            className="gap-2"
            style={{ borderColor: colors.mist, color: colors.dark }}
          >
            <RefreshCw className="w-4 h-4" />
            Onboarding opnieuw starten
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 text-white"
            style={{ backgroundColor: colors.orange }}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Opslaan...
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                Opgeslagen!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Opslaan
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
