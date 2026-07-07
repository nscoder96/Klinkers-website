'use client';

/**
 * Instellingen (F7) — alles opgeslagen in de database (quote_settings), niet meer
 * in localStorage. Vier werkende tabs die direct effect hebben op de
 * offerte-generator (generate-v2 leest deze velden):
 *   - Offertelay-out: prijsmethode, arbeidweergave, BTW, geldigheidsduur
 *   - Arbeidstarieven: uurtarief (default €85), dagafronding, CROW-dagproductie
 *   - Materiaalmarges: standaard inkoopopslag
 *   - Bedrijfsgegevens: naam, adres, KvK, BTW-nummer, IBAN
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/lib/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Save, Check, FileText, Wrench, Euro, Building2, Timer } from 'lucide-react';
import LaborNormsTab from './LaborNormsTab';

type Settings = Record<string, unknown>;

type TabKey = 'layout' | 'arbeid' | 'marges' | 'bedrijf' | 'urennormen';

const TABS: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: 'layout', label: 'Offertelay-out', icon: FileText },
  { key: 'arbeid', label: 'Arbeidstarieven', icon: Wrench },
  { key: 'urennormen', label: 'Urennormen', icon: Timer },
  { key: 'marges', label: 'Materiaalmarges', icon: Euro },
  { key: 'bedrijf', label: 'Bedrijfsgegevens', icon: Building2 },
];

export default function SettingsPage() {
  const { isLoading: authLoading } = useAdminAuth();
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('layout');

  useEffect(() => {
    fetch('/api/admin/quote-settings')
      .then((r) => r.json())
      .then((data) => setSettings(data.settings ?? {}))
      .catch(() => setError('Kon instellingen niet laden'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/quote-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stripReadOnly(settings)),
      });
      if (!res.ok) throw new Error('save failed');
      const data = await res.json();
      setSettings(data.settings ?? settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Opslaan mislukt. Probeer het opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="py-20 text-center text-slate-500">Instellingen laden…</div>
      </AdminLayout>
    );
  }

  const str = (k: string) => (settings[k] as string) ?? '';
  const num = (k: string, fallback = 0) =>
    settings[k] != null ? Number(settings[k]) : fallback;
  const bool = (k: string) => Boolean(settings[k]);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Instellingen</h1>
            <p className="text-slate-500">
              Opgeslagen in de database — werkt direct door in de offerte-generator.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? 'Opslaan…' : saved ? 'Opgeslagen' : 'Opslaan'}
          </Button>
        </div>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition ${
                tab === key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'layout' && (
          <Card>
            <CardHeader>
              <CardTitle>Offertelay-out</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Prijsmethode (default)">
                <Select
                  value={str('default_pricing_method') || 'uitgesplitst'}
                  onChange={(v) => set('default_pricing_method', v)}
                  options={[
                    { value: 'meterprijs', label: 'Meterprijs / aanneemsom' },
                    { value: 'uitgesplitst', label: 'Uitgesplitst (arbeid + materiaal)' },
                    { value: 'uren', label: 'Uren × uurtarief' },
                  ]}
                />
              </Field>
              <Field label="Arbeid weergave">
                <Select
                  value={str('default_labor_display') || 'per_post'}
                  onChange={(v) => set('default_labor_display', v)}
                  options={[
                    { value: 'per_post', label: 'Per post' },
                    { value: 'totaalpost', label: 'Als totaalpost' },
                    { value: 'verborgen', label: 'Verborgen' },
                  ]}
                />
              </Field>
              <Field label="Standaard BTW-tarief (%)">
                <Input
                  type="number"
                  value={num('default_vat_pct', 21)}
                  onChange={(e) => set('default_vat_pct', Number(e.target.value))}
                />
              </Field>
              <Field label="Geldigheidsduur offerte (dagen)">
                <Input
                  type="number"
                  value={num('default_validity_days', 30)}
                  onChange={(e) => set('default_validity_days', Number(e.target.value))}
                />
              </Field>
              <Field label="Prijsgeldigheidsclausule">
                <textarea
                  className="min-h-[90px] w-full rounded-md border border-slate-300 p-2 text-sm"
                  value={str('price_validity_clause')}
                  onChange={(e) => set('price_validity_clause', e.target.value)}
                />
              </Field>
              <Toggle
                label="BTW-specificatie tonen op offerte"
                checked={bool('show_btw_specification')}
                onChange={(v) => set('show_btw_specification', v)}
              />
              <Toggle
                label="3-varianten modus (Goed / Beter / Best)"
                checked={bool('enable_good_better_best')}
                onChange={(v) => set('enable_good_better_best', v)}
              />
            </CardContent>
          </Card>
        )}

        {tab === 'arbeid' && (
          <Card>
            <CardHeader>
              <CardTitle>Arbeidstarieven</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Uurtarief excl. BTW (€) — koppelprijs">
                <Input
                  type="number"
                  value={num('default_hourly_rate', 85)}
                  onChange={(e) => set('default_hourly_rate', Number(e.target.value))}
                />
              </Field>
              <Field label="Uren per werkdag">
                <Input
                  type="number"
                  value={num('min_hours_per_day', 8)}
                  onChange={(e) => set('min_hours_per_day', Number(e.target.value))}
                />
              </Field>
              <Field label="Afrondingsregel (dagen)">
                <Select
                  value={str('day_rounding') || 'ceil'}
                  onChange={(v) => set('day_rounding', v)}
                  options={[
                    { value: 'ceil', label: 'Naar boven' },
                    { value: 'round', label: 'Exact (afronden)' },
                    { value: 'floor', label: 'Naar beneden' },
                  ]}
                />
              </Field>
              <Field label="CROW dagproductie (m² per dag)">
                <Input
                  type="number"
                  value={num('crow_m2_per_day', 40)}
                  onChange={(e) => set('crow_m2_per_day', Number(e.target.value))}
                />
              </Field>
            </CardContent>
          </Card>
        )}

        {tab === 'urennormen' && <LaborNormsTab />}

        {tab === 'marges' && (
          <Card>
            <CardHeader>
              <CardTitle>Materiaalmarges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Standaard inkoopopslag (%)">
                <Input
                  type="number"
                  value={num('material_markup_pct', 20)}
                  onChange={(e) => set('material_markup_pct', Number(e.target.value))}
                />
              </Field>
              <p className="text-sm text-slate-500">
                Opslag op inkoopprijzen. Per-categorie overrides volgen in een latere sprint.
              </p>
            </CardContent>
          </Card>
        )}

        {tab === 'bedrijf' && (
          <Card>
            <CardHeader>
              <CardTitle>Bedrijfsgegevens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Bedrijfsnaam">
                <Input value={str('company_name')} onChange={(e) => set('company_name', e.target.value)} />
              </Field>
              <Field label="Adres">
                <Input value={str('company_address')} onChange={(e) => set('company_address', e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Telefoon">
                  <Input value={str('company_phone')} onChange={(e) => set('company_phone', e.target.value)} />
                </Field>
                <Field label="E-mail">
                  <Input value={str('company_email')} onChange={(e) => set('company_email', e.target.value)} />
                </Field>
                <Field label="KvK-nummer">
                  <Input value={str('company_kvk')} onChange={(e) => set('company_kvk', e.target.value)} />
                </Field>
                <Field label="BTW-identificatienummer">
                  <Input value={str('company_btw')} onChange={(e) => set('company_btw', e.target.value)} />
                </Field>
                <Field label="IBAN">
                  <Input value={str('company_iban')} onChange={(e) => set('company_iban', e.target.value)} />
                </Field>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

/** Verwijdert read-only/afgeleide velden voor de PATCH-payload. */
function stripReadOnly(s: Settings): Settings {
  const copy = { ...s };
  delete copy.id;
  delete copy.created_at;
  delete copy.updated_at;
  return copy;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-orange-500"
      />
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
