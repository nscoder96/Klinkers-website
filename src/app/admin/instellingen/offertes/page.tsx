'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Building2,
  FileText,
  CreditCard,
  Eye,
  Save,
  Upload,
  Palette,
  Check,
  ArrowLeft,
  LayoutGrid,
  List,
  FileCheck,
  Calendar,
  Plus,
  Trash2,
  Loader2,
  X,
  Image as ImageIcon,
  Wrench
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

// Payment schedule item type
interface PaymentScheduleItem {
  termijn: number;
  omschrijving: string;
  percentage: number;
}

interface QuoteSettings {
  id: string;
  company_name: string;
  company_logo_url: string | null;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_website: string | null;
  company_kvk: string | null;
  company_btw: string | null;
  company_iban: string | null;
  intro_text: string | null;
  outro_text: string | null;
  terms_text: string | null;
  disclaimer_text: string | null;
  payment_terms: string | null;
  payment_methods: string | null;
  deposit_percentage: number;
  deposit_text: string | null;
  show_company_logo: boolean;
  show_item_prices: boolean;
  show_item_quantities: boolean;
  show_section_subtotals: boolean;
  show_btw_specification: boolean;
  show_payment_terms: boolean;
  show_validity_date: boolean;
  default_validity_days: number;
  // Footer visibility
  show_footer_contact: boolean;
  show_footer_payment: boolean;
  show_footer_company: boolean;
  show_footer_guarantee: boolean;
  // Footer titles
  footer_contact_title: string | null;
  footer_payment_title: string | null;
  footer_company_title: string | null;
  footer_guarantee_title: string | null;
  // Footer content
  footer_contact_text: string | null;
  footer_payment_text: string | null;
  footer_company_text: string | null;
  footer_guarantee_text: string | null;
  // Styling
  primary_color: string;
  accent_color: string;
  // Deddo-style section visibility
  show_section_werkomschrijving: boolean;
  show_section_specificatie: boolean;
  show_section_condities: boolean;
  show_section_termijnschema: boolean;
  // Specification column options
  spec_show_quantities: boolean;
  spec_show_unit_price: boolean;
  spec_show_btw_column: boolean;
  spec_show_line_totals: boolean;
  spec_show_group_subtotals: boolean;
  spec_show_type_column: boolean;
  // Conditions default texts
  conditions_uitgangspunten: string | null;
  conditions_uitgesloten: string | null;
  // Payment schedule
  payment_schedule: PaymentScheduleItem[];
  // Cover page settings
  cover_betreft_prefix: string | null;
  cover_signature_name: string | null;
  // Arbeid instellingen
  labor_pricing_mode: 'hourly_rate' | 'unit_price';
  default_hourly_rate: number;
}

type TabType = 'bedrijf' | 'teksten' | 'betaling' | 'weergave' | 'footer' | 'specificatie' | 'condities' | 'termijnschema' | 'arbeid';

export default function QuoteSettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('bedrijf');
  const [settings, setSettings] = useState<QuoteSettings | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'company-logos');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload mislukt');
      }

      // Update the settings with the new logo URL
      if (settings) {
        setSettings({ ...settings, company_logo_url: data.url });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload mislukt');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeLogo = () => {
    if (settings) {
      setSettings({ ...settings, company_logo_url: null });
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/quote-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    setSaved(false);
    try {
      const response = await fetch('/api/admin/quote-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('Er ging iets mis bij het opslaan');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Er ging iets mis');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof QuoteSettings>(key: K, value: QuoteSettings[K]) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  const tabs = [
    { id: 'bedrijf' as TabType, label: 'Bedrijfsgegevens', icon: Building2 },
    { id: 'teksten' as TabType, label: 'Offerte Teksten', icon: FileText },
    { id: 'specificatie' as TabType, label: 'Specificatie', icon: List },
    { id: 'condities' as TabType, label: 'Condities', icon: FileCheck },
    { id: 'termijnschema' as TabType, label: 'Termijnschema', icon: Calendar },
    { id: 'betaling' as TabType, label: 'Betalingsgegevens', icon: CreditCard },
    { id: 'weergave' as TabType, label: 'Weergave Opties', icon: Eye },
    { id: 'footer' as TabType, label: 'Footer Secties', icon: LayoutGrid },
    { id: 'arbeid' as TabType, label: 'Arbeid', icon: Wrench },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.stone }}>
        <div className="text-center">
          <div
            className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-2"
            style={{ borderColor: colors.orange, borderTopColor: 'transparent' }}
          />
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
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <Link
              href="/admin/instellingen"
              className="text-sm flex items-center gap-1 mb-2"
              style={{ color: colors.slate }}
              onMouseOver={(e) => e.currentTarget.style.color = colors.dark}
              onMouseOut={(e) => e.currentTarget.style.color = colors.slate}
            >
              <ArrowLeft className="w-4 h-4" /> Terug naar instellingen
            </Link>
            <h1 className="text-2xl font-bold" style={{ color: colors.dark }}>Offerte Instellingen</h1>
            <p style={{ color: colors.slate }}>Pas de weergave en inhoud van je offertes aan</p>
          </div>
          <Button
            onClick={saveSettings}
            disabled={saving}
            style={saved
              ? { backgroundColor: colors.success, color: colors.warmWhite }
              : { backgroundColor: colors.orange, color: colors.warmWhite }
            }
          >
            {saved ? (
              <><Check className="w-4 h-4 mr-2" /> Opgeslagen</>
            ) : saving ? (
              'Opslaan...'
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Opslaan</>
            )}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-3 border-b-2 transition-colors"
              style={activeTab === tab.id
                ? { borderColor: colors.orange, color: colors.orange }
                : { borderColor: 'transparent', color: colors.slate }
              }
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {settings && (
          <>
            {/* Bedrijfsgegevens Tab */}
            {activeTab === 'bedrijf' && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bedrijfsinformatie</CardTitle>
                    <CardDescription>Deze gegevens verschijnen op je offertes</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>Bedrijfsnaam</label>
                      <Input
                        value={settings.company_name}
                        onChange={(e) => updateSetting('company_name', e.target.value)}
                        placeholder="Uw bedrijfsnaam"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>Bedrijfslogo</label>

                      {/* Current logo preview */}
                      {settings.company_logo_url && (
                        <div className="mt-2 mb-3 relative inline-block">
                          <div className="border rounded-lg p-4" style={{ backgroundColor: colors.stone }}>
                            <img
                              src={settings.company_logo_url}
                              alt="Bedrijfslogo"
                              className="max-h-24 max-w-xs object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            title="Logo verwijderen"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Upload area */}
                      <div className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input
                            value={settings.company_logo_url || ''}
                            onChange={(e) => updateSetting('company_logo_url', e.target.value)}
                            placeholder="https://voorbeeld.nl/logo.png"
                          />
                        </div>
                        <div className="relative">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                            onChange={handleLogoUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploading}
                          />
                          <Button variant="outline" disabled={uploading} className="pointer-events-none">
                            {uploading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploaden...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Upload error */}
                      {uploadError && (
                        <p className="text-sm text-red-600 mt-1">{uploadError}</p>
                      )}

                      <p className="text-xs mt-1" style={{ color: colors.slate }}>
                        Upload een afbeelding (JPG, PNG, GIF, WebP, SVG) of vul een URL in. Max 5MB.
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>Adres</label>
                      <Textarea
                        value={settings.company_address || ''}
                        onChange={(e) => updateSetting('company_address', e.target.value)}
                        placeholder="Straat 123&#10;1234 AB Plaats"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>Telefoon</label>
                      <Input
                        value={settings.company_phone || ''}
                        onChange={(e) => updateSetting('company_phone', e.target.value)}
                        placeholder="06-12345678"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>Email</label>
                      <Input
                        type="email"
                        value={settings.company_email || ''}
                        onChange={(e) => updateSetting('company_email', e.target.value)}
                        placeholder="info@uwbedrijf.nl"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>Website</label>
                      <Input
                        value={settings.company_website || ''}
                        onChange={(e) => updateSetting('company_website', e.target.value)}
                        placeholder="www.uwbedrijf.nl"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>KvK nummer</label>
                      <Input
                        value={settings.company_kvk || ''}
                        onChange={(e) => updateSetting('company_kvk', e.target.value)}
                        placeholder="12345678"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>BTW nummer</label>
                      <Input
                        value={settings.company_btw || ''}
                        onChange={(e) => updateSetting('company_btw', e.target.value)}
                        placeholder="NL123456789B01"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>IBAN</label>
                      <Input
                        value={settings.company_iban || ''}
                        onChange={(e) => updateSetting('company_iban', e.target.value)}
                        placeholder="NL00 BANK 0000 0000 00"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" /> Kleuren
                    </CardTitle>
                    <CardDescription>Pas de kleuren van je offerte aan</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>Primaire kleur</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={settings.primary_color}
                          onChange={(e) => updateSetting('primary_color', e.target.value)}
                          className="w-12 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={settings.primary_color}
                          onChange={(e) => updateSetting('primary_color', e.target.value)}
                          placeholder="#f97316"
                          className="font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>Accent kleur</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={settings.accent_color}
                          onChange={(e) => updateSetting('accent_color', e.target.value)}
                          className="w-12 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={settings.accent_color}
                          onChange={(e) => updateSetting('accent_color', e.target.value)}
                          placeholder="#1e293b"
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Teksten Tab */}
            {activeTab === 'teksten' && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Begeleidende Teksten</CardTitle>
                    <CardDescription>Standaard teksten die op je offertes verschijnen</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>Inleiding</label>
                      <Textarea
                        value={settings.intro_text || ''}
                        onChange={(e) => updateSetting('intro_text', e.target.value)}
                        placeholder="Tekst die bovenaan de offerte komt..."
                        rows={3}
                      />
                      <p className="text-xs mt-1" style={{ color: colors.slate }}>Deze tekst verschijnt bovenaan de offerte, na de klantgegevens.</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>Afsluiting</label>
                      <Textarea
                        value={settings.outro_text || ''}
                        onChange={(e) => updateSetting('outro_text', e.target.value)}
                        placeholder="Tekst die onderaan de offerte komt..."
                        rows={3}
                      />
                      <p className="text-xs mt-1" style={{ color: colors.slate }}>Deze tekst verschijnt na de totalen en betalingsgegevens.</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>Algemene Voorwaarden</label>
                      <Textarea
                        value={settings.terms_text || ''}
                        onChange={(e) => updateSetting('terms_text', e.target.value)}
                        placeholder="Verwijzing naar algemene voorwaarden..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Disclaimer / Akkoordverklaring</CardTitle>
                    <CardDescription>De tekst die verschijnt bij &quot;Door ondertekening van deze offerte...&quot;</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>Disclaimer tekst</label>
                      <Textarea
                        value={settings.disclaimer_text || ''}
                        onChange={(e) => updateSetting('disclaimer_text', e.target.value)}
                        placeholder="Door ondertekening van deze offerte gaat u akkoord met de werkzaamheden..."
                        rows={4}
                      />
                      <p className="text-xs mt-1" style={{ color: colors.slate }}>
                        Deze tekst verschijnt onder de totalen, voor de geldigheidsmelding.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Betaling Tab */}
            {activeTab === 'betaling' && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Betalingsinformatie</CardTitle>
                    <CardDescription>Standaard betalingstermijnen en -methodes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>Betalingstermijn</label>
                      <Textarea
                        value={settings.payment_terms || ''}
                        onChange={(e) => updateSetting('payment_terms', e.target.value)}
                        placeholder="Betaling binnen 14 dagen na factuurdatum."
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>Betaalwijze</label>
                      <Textarea
                        value={settings.payment_methods || ''}
                        onChange={(e) => updateSetting('payment_methods', e.target.value)}
                        placeholder="Overschrijving naar bovenstaand rekeningnummer."
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium" style={{ color: colors.dark }}>Aanbetaling percentage</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={settings.deposit_percentage}
                            onChange={(e) => updateSetting('deposit_percentage', parseInt(e.target.value) || 0)}
                            className="w-24"
                          />
                          <span style={{ color: colors.slate }}>%</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium" style={{ color: colors.dark }}>Geldigheid offerte (dagen)</label>
                        <Input
                          type="number"
                          min="1"
                          value={settings.default_validity_days}
                          onChange={(e) => updateSetting('default_validity_days', parseInt(e.target.value) || 30)}
                          className="w-24"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>Aanbetalingstekst</label>
                      <Textarea
                        value={settings.deposit_text || ''}
                        onChange={(e) => updateSetting('deposit_text', e.target.value)}
                        placeholder="Bij opdracht verzoeken wij u om 30% aanbetaling."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Weergave Tab */}
            {activeTab === 'weergave' && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Weergave Opties</CardTitle>
                    <CardDescription>Bepaal wat er zichtbaar is op de offerte voor de klant</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer" style={{ backgroundColor: colors.warmWhite }}>
                        <input
                          type="checkbox"
                          checked={settings.show_company_logo}
                          onChange={(e) => updateSetting('show_company_logo', e.target.checked)}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: colors.orange }}
                        />
                        <div>
                          <p className="font-medium" style={{ color: colors.dark }}>Bedrijfslogo tonen</p>
                          <p className="text-sm" style={{ color: colors.slate }}>Toont je logo bovenaan de offerte</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer" style={{ backgroundColor: colors.warmWhite }}>
                        <input
                          type="checkbox"
                          checked={settings.show_item_prices}
                          onChange={(e) => updateSetting('show_item_prices', e.target.checked)}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: colors.orange }}
                        />
                        <div>
                          <p className="font-medium" style={{ color: colors.dark }}>Prijzen per item tonen</p>
                          <p className="text-sm" style={{ color: colors.slate }}>Toont eenheidsprijs en totaal per regel</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer" style={{ backgroundColor: colors.warmWhite }}>
                        <input
                          type="checkbox"
                          checked={settings.show_item_quantities}
                          onChange={(e) => updateSetting('show_item_quantities', e.target.checked)}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: colors.orange }}
                        />
                        <div>
                          <p className="font-medium" style={{ color: colors.dark }}>Hoeveelheden tonen</p>
                          <p className="text-sm" style={{ color: colors.slate }}>Toont aantal en eenheid per item</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer" style={{ backgroundColor: colors.warmWhite }}>
                        <input
                          type="checkbox"
                          checked={settings.show_section_subtotals}
                          onChange={(e) => updateSetting('show_section_subtotals', e.target.checked)}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: colors.orange }}
                        />
                        <div>
                          <p className="font-medium" style={{ color: colors.dark }}>Subtotalen per sectie</p>
                          <p className="text-sm" style={{ color: colors.slate }}>Toont een subtotaal onder elke sectie</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer" style={{ backgroundColor: colors.warmWhite }}>
                        <input
                          type="checkbox"
                          checked={settings.show_btw_specification}
                          onChange={(e) => updateSetting('show_btw_specification', e.target.checked)}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: colors.orange }}
                        />
                        <div>
                          <p className="font-medium" style={{ color: colors.dark }}>BTW specificatie</p>
                          <p className="text-sm" style={{ color: colors.slate }}>Toont subtotaal, BTW en totaal apart</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer" style={{ backgroundColor: colors.warmWhite }}>
                        <input
                          type="checkbox"
                          checked={settings.show_payment_terms}
                          onChange={(e) => updateSetting('show_payment_terms', e.target.checked)}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: colors.orange }}
                        />
                        <div>
                          <p className="font-medium" style={{ color: colors.dark }}>Betalingsvoorwaarden</p>
                          <p className="text-sm" style={{ color: colors.slate }}>Toont betalingstermijn en -wijze</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer" style={{ backgroundColor: colors.warmWhite }}>
                        <input
                          type="checkbox"
                          checked={settings.show_validity_date}
                          onChange={(e) => updateSetting('show_validity_date', e.target.checked)}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: colors.orange }}
                        />
                        <div>
                          <p className="font-medium" style={{ color: colors.dark }}>Geldigheid tonen</p>
                          <p className="text-sm" style={{ color: colors.slate }}>Toont tot wanneer de offerte geldig is</p>
                        </div>
                      </label>
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: colors.blueLight, borderColor: colors.blue }}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Eye className="w-5 h-5 mt-0.5" style={{ color: colors.blue }} />
                      <div>
                        <p className="font-medium" style={{ color: colors.dark }}>Item-niveau zichtbaarheid</p>
                        <p className="text-sm mt-1" style={{ color: colors.dark }}>
                          Je kunt ook per offerte-item instellen of deze zichtbaar is voor de klant.
                          Dit doe je bij het bewerken van een offerte door het oogje naast elk item te klikken.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Specificatie Tab */}
            {activeTab === 'specificatie' && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Specificatie Kolommen</CardTitle>
                    <CardDescription>
                      Bepaal welke kolommen standaard zichtbaar zijn in de specificatie sectie van de offerte
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer" style={{ backgroundColor: colors.warmWhite }}>
                        <input
                          type="checkbox"
                          checked={settings.spec_show_quantities}
                          onChange={(e) => updateSetting('spec_show_quantities', e.target.checked)}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: colors.orange }}
                        />
                        <div>
                          <p className="font-medium" style={{ color: colors.dark }}>Hoeveelheden</p>
                          <p className="text-sm" style={{ color: colors.slate }}>Toont aantal en eenheid per item</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer" style={{ backgroundColor: colors.warmWhite }}>
                        <input
                          type="checkbox"
                          checked={settings.spec_show_unit_price}
                          onChange={(e) => updateSetting('spec_show_unit_price', e.target.checked)}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: colors.orange }}
                        />
                        <div>
                          <p className="font-medium" style={{ color: colors.dark }}>Prijs per eenheid</p>
                          <p className="text-sm" style={{ color: colors.slate }}>Toont de prijs per stuk/m2/etc.</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer" style={{ backgroundColor: colors.warmWhite }}>
                        <input
                          type="checkbox"
                          checked={settings.spec_show_btw_column}
                          onChange={(e) => updateSetting('spec_show_btw_column', e.target.checked)}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: colors.orange }}
                        />
                        <div>
                          <p className="font-medium" style={{ color: colors.dark }}>BTW percentage kolom</p>
                          <p className="text-sm" style={{ color: colors.slate }}>Toont BTW% per regel (21%, 9%, etc.)</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer" style={{ backgroundColor: colors.warmWhite }}>
                        <input
                          type="checkbox"
                          checked={settings.spec_show_line_totals}
                          onChange={(e) => updateSetting('spec_show_line_totals', e.target.checked)}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: colors.orange }}
                        />
                        <div>
                          <p className="font-medium" style={{ color: colors.dark }}>Regeltotalen</p>
                          <p className="text-sm" style={{ color: colors.slate }}>Toont totaal per item (hoeveelheid x prijs)</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer" style={{ backgroundColor: colors.warmWhite }}>
                        <input
                          type="checkbox"
                          checked={settings.spec_show_group_subtotals}
                          onChange={(e) => updateSetting('spec_show_group_subtotals', e.target.checked)}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: colors.orange }}
                        />
                        <div>
                          <p className="font-medium" style={{ color: colors.dark }}>Groep subtotalen</p>
                          <p className="text-sm" style={{ color: colors.slate }}>Toont subtotaal onder elke sectie/groep</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer" style={{ backgroundColor: colors.successLight, borderColor: colors.success }}>
                        <input
                          type="checkbox"
                          checked={settings.spec_show_type_column}
                          onChange={(e) => updateSetting('spec_show_type_column', e.target.checked)}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: colors.success }}
                        />
                        <div>
                          <p className="font-medium" style={{ color: colors.dark }}>Arbeid/Materiaal kolom</p>
                          <p className="text-sm" style={{ color: colors.slate }}>Toont Type kolom (A = Arbeid, M = Materiaal) en subtotalen per type</p>
                        </div>
                      </label>
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: colors.blueLight, borderColor: colors.blue }}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <List className="w-5 h-5 mt-0.5" style={{ color: colors.blue }} />
                      <div>
                        <p className="font-medium" style={{ color: colors.dark }}>Per-offerte aanpassing</p>
                        <p className="text-sm mt-1" style={{ color: colors.dark }}>
                          Bij elke offerte kun je deze instellingen ook per offerte aanpassen
                          via de Specificatie sectie toggle.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Condities Tab */}
            {activeTab === 'condities' && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Standaard Condities</CardTitle>
                    <CardDescription>
                      Deze teksten worden als standaard gebruikt voor nieuwe offertes.
                      Je kunt ze per offerte aanpassen.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>Uitgangspunten</label>
                      <p className="text-xs mb-2" style={{ color: colors.slate }}>
                        Voorwaarden waaronder de offerte geldt. Elke regel wordt als apart punt getoond.
                      </p>
                      <Textarea
                        value={settings.conditions_uitgangspunten || ''}
                        onChange={(e) => updateSetting('conditions_uitgangspunten', e.target.value)}
                        placeholder="Locatie van werkzaamheden is opgeruimd...&#10;Werkzaamheden buiten deze overeenkomst..."
                        rows={8}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium" style={{ color: colors.dark }}>Uitgesloten werkzaamheden</label>
                      <p className="text-xs mb-2" style={{ color: colors.slate }}>
                        Werkzaamheden die niet in de offerte zijn opgenomen. Elke regel wordt als apart punt getoond.
                      </p>
                      <Textarea
                        value={settings.conditions_uitgesloten || ''}
                        onChange={(e) => updateSetting('conditions_uitgesloten', e.target.value)}
                        placeholder="Alle andere werkzaamheden dan genoemd...&#10;Sloopwerkzaamheden..."
                        rows={6}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: colors.orangeLight, borderColor: colors.orange }}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <FileCheck className="w-5 h-5 mt-0.5" style={{ color: colors.orange }} />
                      <div>
                        <p className="font-medium" style={{ color: colors.dark }}>Tip</p>
                        <p className="text-sm mt-1" style={{ color: colors.dark }}>
                          Zet elke conditie op een aparte regel. Bij het genereren van de PDF
                          worden deze automatisch genummerd weergegeven.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Termijnschema Tab */}
            {activeTab === 'termijnschema' && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Standaard Termijnschema</CardTitle>
                    <CardDescription>
                      Bepaal de standaard betalingstermijnen voor nieuwe offertes.
                      De bedragen worden automatisch berekend op basis van het offertetotaal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {(settings.payment_schedule || []).map((item, index) => (
                        <div key={index} className="flex gap-3 items-center p-3 border rounded-lg">
                          <div className="w-16">
                            <label className="text-xs text-gray-500">Termijn</label>
                            <Input
                              type="number"
                              min="1"
                              value={item.termijn}
                              onChange={(e) => {
                                const newSchedule = [...settings.payment_schedule];
                                newSchedule[index] = { ...item, termijn: parseInt(e.target.value) || 1 };
                                updateSetting('payment_schedule', newSchedule);
                              }}
                              className="text-center"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-gray-500">Omschrijving</label>
                            <Input
                              value={item.omschrijving}
                              onChange={(e) => {
                                const newSchedule = [...settings.payment_schedule];
                                newSchedule[index] = { ...item, omschrijving: e.target.value };
                                updateSetting('payment_schedule', newSchedule);
                              }}
                              placeholder="Bijv. Bij opdracht"
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-xs text-gray-500">Percentage</label>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={item.percentage}
                                onChange={(e) => {
                                  const newSchedule = [...settings.payment_schedule];
                                  newSchedule[index] = { ...item, percentage: parseInt(e.target.value) || 0 };
                                  updateSetting('payment_schedule', newSchedule);
                                }}
                              />
                              <span className="text-gray-500">%</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newSchedule = settings.payment_schedule.filter((_, i) => i !== index);
                              updateSetting('payment_schedule', newSchedule);
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        const newTermijn = (settings.payment_schedule?.length || 0) + 1;
                        const newSchedule = [
                          ...(settings.payment_schedule || []),
                          { termijn: newTermijn, omschrijving: '', percentage: 0 }
                        ];
                        updateSetting('payment_schedule', newSchedule);
                      }}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Termijn toevoegen
                    </Button>

                    {/* Percentage total indicator */}
                    {settings.payment_schedule && (
                      <div
                        className="p-3 rounded-lg border"
                        style={settings.payment_schedule.reduce((sum, item) => sum + item.percentage, 0) === 100
                          ? { backgroundColor: colors.successLight, borderColor: colors.success }
                          : { backgroundColor: colors.orangeLight, borderColor: colors.orange }
                        }
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium" style={{ color: colors.dark }}>Totaal percentage:</span>
                          <span
                            className="font-bold"
                            style={settings.payment_schedule.reduce((sum, item) => sum + item.percentage, 0) === 100
                              ? { color: colors.success }
                              : { color: colors.orange }
                            }
                          >
                            {settings.payment_schedule.reduce((sum, item) => sum + item.percentage, 0)}%
                          </span>
                        </div>
                        {settings.payment_schedule.reduce((sum, item) => sum + item.percentage, 0) !== 100 && (
                          <p className="text-xs mt-1" style={{ color: colors.orange }}>
                            Het totaal moet 100% zijn voor een correct termijnschema
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: colors.blueLight, borderColor: colors.blue }}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 mt-0.5" style={{ color: colors.blue }} />
                      <div>
                        <p className="font-medium" style={{ color: colors.dark }}>Automatische berekening</p>
                        <p className="text-sm mt-1" style={{ color: colors.dark }}>
                          Bij het genereren van de PDF worden de bedragen automatisch berekend
                          op basis van het offertetotaal en de percentages.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Footer Tab */}
            {activeTab === 'footer' && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Footer Secties</CardTitle>
                    <CardDescription>
                      Bepaal welke secties onderaan de offerte worden getoond en pas de inhoud aan.
                      Zet secties uit die je niet wilt tonen.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Contact Section */}
                    <div
                      className="p-4 border rounded-lg"
                      style={settings.show_footer_contact
                        ? { backgroundColor: colors.warmWhite }
                        : { backgroundColor: colors.stone, opacity: 0.6 }
                      }
                    >
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.show_footer_contact}
                            onChange={(e) => updateSetting('show_footer_contact', e.target.checked)}
                            className="w-5 h-5 rounded"
                            style={{ accentColor: colors.orange }}
                          />
                          <span className="font-medium" style={{ color: colors.dark }}>Contact sectie tonen</span>
                        </label>
                      </div>
                      {settings.show_footer_contact && (
                        <div className="space-y-3 pl-8">
                          <div>
                            <label className="text-sm font-medium" style={{ color: colors.dark }}>Titel</label>
                            <Input
                              value={settings.footer_contact_title || 'Contact'}
                              onChange={(e) => updateSetting('footer_contact_title', e.target.value)}
                              placeholder="Contact"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium" style={{ color: colors.dark }}>Inhoud (optioneel)</label>
                            <Textarea
                              value={settings.footer_contact_text || ''}
                              onChange={(e) => updateSetting('footer_contact_text', e.target.value)}
                              placeholder="Laat leeg om automatisch telefoon en email te gebruiken"
                              rows={2}
                            />
                            <p className="text-xs mt-1" style={{ color: colors.slate }}>Leeg = automatisch uit bedrijfsgegevens</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payment Section */}
                    <div
                      className="p-4 border rounded-lg"
                      style={settings.show_footer_payment
                        ? { backgroundColor: colors.warmWhite }
                        : { backgroundColor: colors.stone, opacity: 0.6 }
                      }
                    >
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.show_footer_payment}
                            onChange={(e) => updateSetting('show_footer_payment', e.target.checked)}
                            className="w-5 h-5 rounded"
                            style={{ accentColor: colors.orange }}
                          />
                          <span className="font-medium" style={{ color: colors.dark }}>Betaling sectie tonen</span>
                        </label>
                      </div>
                      {settings.show_footer_payment && (
                        <div className="space-y-3 pl-8">
                          <div>
                            <label className="text-sm font-medium" style={{ color: colors.dark }}>Titel</label>
                            <Input
                              value={settings.footer_payment_title || 'Betaling'}
                              onChange={(e) => updateSetting('footer_payment_title', e.target.value)}
                              placeholder="Betaling"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium" style={{ color: colors.dark }}>Inhoud (optioneel)</label>
                            <Textarea
                              value={settings.footer_payment_text || ''}
                              onChange={(e) => updateSetting('footer_payment_text', e.target.value)}
                              placeholder="Laat leeg om automatisch IBAN te gebruiken"
                              rows={2}
                            />
                            <p className="text-xs mt-1" style={{ color: colors.slate }}>Leeg = automatisch uit bedrijfsgegevens</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Company Section */}
                    <div
                      className="p-4 border rounded-lg"
                      style={settings.show_footer_company
                        ? { backgroundColor: colors.warmWhite }
                        : { backgroundColor: colors.stone, opacity: 0.6 }
                      }
                    >
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.show_footer_company}
                            onChange={(e) => updateSetting('show_footer_company', e.target.checked)}
                            className="w-5 h-5 rounded"
                            style={{ accentColor: colors.orange }}
                          />
                          <span className="font-medium" style={{ color: colors.dark }}>Bedrijfsgegevens sectie tonen</span>
                        </label>
                      </div>
                      {settings.show_footer_company && (
                        <div className="space-y-3 pl-8">
                          <div>
                            <label className="text-sm font-medium" style={{ color: colors.dark }}>Titel</label>
                            <Input
                              value={settings.footer_company_title || 'Bedrijfsgegevens'}
                              onChange={(e) => updateSetting('footer_company_title', e.target.value)}
                              placeholder="Bedrijfsgegevens"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium" style={{ color: colors.dark }}>Inhoud (optioneel)</label>
                            <Textarea
                              value={settings.footer_company_text || ''}
                              onChange={(e) => updateSetting('footer_company_text', e.target.value)}
                              placeholder="Laat leeg om automatisch KvK en BTW te gebruiken"
                              rows={2}
                            />
                            <p className="text-xs mt-1" style={{ color: colors.slate }}>Leeg = automatisch KvK en BTW nummer</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Guarantee Section */}
                    <div
                      className="p-4 border rounded-lg"
                      style={settings.show_footer_guarantee
                        ? { backgroundColor: colors.warmWhite }
                        : { backgroundColor: colors.stone, opacity: 0.6 }
                      }
                    >
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.show_footer_guarantee}
                            onChange={(e) => updateSetting('show_footer_guarantee', e.target.checked)}
                            className="w-5 h-5 rounded"
                            style={{ accentColor: colors.orange }}
                          />
                          <span className="font-medium" style={{ color: colors.dark }}>Garantie sectie tonen</span>
                        </label>
                      </div>
                      {settings.show_footer_guarantee && (
                        <div className="space-y-3 pl-8">
                          <div>
                            <label className="text-sm font-medium" style={{ color: colors.dark }}>Titel</label>
                            <Input
                              value={settings.footer_guarantee_title || 'Garantie'}
                              onChange={(e) => updateSetting('footer_guarantee_title', e.target.value)}
                              placeholder="Garantie"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium" style={{ color: colors.dark }}>Inhoud</label>
                            <Textarea
                              value={settings.footer_guarantee_text || ''}
                              onChange={(e) => updateSetting('footer_guarantee_text', e.target.value)}
                              placeholder="2 jaar garantie op alle werkzaamheden"
                              rows={2}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: colors.orangeLight, borderColor: colors.orange }}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <LayoutGrid className="w-5 h-5 mt-0.5" style={{ color: colors.orange }} />
                      <div>
                        <p className="font-medium" style={{ color: colors.dark }}>Tip</p>
                        <p className="text-sm mt-1" style={{ color: colors.dark }}>
                          Zet secties uit die je niet nodig hebt. De footer past zich automatisch aan
                          op basis van het aantal actieve secties.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Arbeid Tab */}
            {activeTab === 'arbeid' && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Arbeid Instellingen</CardTitle>
                    <CardDescription>
                      Kies hoe arbeid wordt berekend in je offertes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Pricing mode selection */}
                    <div>
                      <label className="text-sm font-medium mb-3 block" style={{ color: colors.dark }}>
                        Arbeid berekeningswijze
                      </label>
                      <div className="space-y-3">
                        <label
                          className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors"
                          style={settings?.labor_pricing_mode === 'unit_price'
                            ? { borderColor: colors.orange, backgroundColor: colors.orangeLight }
                            : { borderColor: colors.mist, backgroundColor: colors.warmWhite }
                          }
                        >
                          <input
                            type="radio"
                            name="labor_mode"
                            checked={settings?.labor_pricing_mode === 'unit_price'}
                            onChange={() => updateSetting('labor_pricing_mode', 'unit_price')}
                            className="mt-1"
                            style={{ accentColor: colors.orange }}
                          />
                          <div>
                            <p className="font-medium" style={{ color: colors.dark }}>Eenheidsprijs (aanbevolen)</p>
                            <p className="text-sm mt-1" style={{ color: colors.slate }}>
                              Vaste prijs per m2, m1, of stuk. Geeft meer voorspelbaarheid en is makkelijker te automatiseren.
                            </p>
                            <p className="text-xs mt-2" style={{ color: colors.orange }}>
                              Voorbeeld: Opsluitbanden leggen = E15/m1
                            </p>
                          </div>
                        </label>

                        <label
                          className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors"
                          style={settings?.labor_pricing_mode === 'hourly_rate'
                            ? { borderColor: colors.orange, backgroundColor: colors.orangeLight }
                            : { borderColor: colors.mist, backgroundColor: colors.warmWhite }
                          }
                        >
                          <input
                            type="radio"
                            name="labor_mode"
                            checked={settings?.labor_pricing_mode === 'hourly_rate'}
                            onChange={() => updateSetting('labor_pricing_mode', 'hourly_rate')}
                            className="mt-1"
                            style={{ accentColor: colors.orange }}
                          />
                          <div>
                            <p className="font-medium" style={{ color: colors.dark }}>Uurtarief</p>
                            <p className="text-sm mt-1" style={{ color: colors.slate }}>
                              Prijs per uur. Je vult bij elke offerteregel het geschatte aantal uren in.
                            </p>
                            <p className="text-xs mt-2" style={{ color: colors.slate }}>
                              Voorbeeld: 4 uur x E45/uur = E180
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Hourly rate input - only show when hourly_rate is selected */}
                    {settings?.labor_pricing_mode === 'hourly_rate' && (
                      <div>
                        <label className="text-sm font-medium" style={{ color: colors.dark }}>
                          Standaard uurtarief
                        </label>
                        <div className="relative mt-2 max-w-xs">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.slate }}>E</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={settings?.default_hourly_rate || 45}
                            onChange={(e) => updateSetting('default_hourly_rate', parseFloat(e.target.value) || 45)}
                            className="pl-7"
                            placeholder="45.00"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: colors.slate }}>/uur</span>
                        </div>
                        <p className="text-xs mt-2" style={{ color: colors.slate }}>
                          Dit tarief wordt standaard gebruikt bij nieuwe arbeidsregels
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: colors.blueLight, borderColor: colors.blue }}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Wrench className="w-5 h-5 mt-0.5" style={{ color: colors.blue }} />
                      <div>
                        <p className="font-medium" style={{ color: colors.dark }}>Hoe werkt dit?</p>
                        <p className="text-sm mt-1" style={{ color: colors.dark }}>
                          Bij het aanmaken van een offerte worden materiaal en arbeid gescheiden weergegeven.
                          Met eenheidsprijzen leer het systeem je prijzen en kan het deze automatisch voorstellen
                          bij volgende offertes. Hoe meer offertes je maakt, hoe sneller het systeem wordt.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
