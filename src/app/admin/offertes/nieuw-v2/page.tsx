'use client';

/**
 * Offerte-generator V2 (F8) — 3-stappen flow, tablet-proof.
 *   Stap 1: Opdracht invoeren (vrije tekst + klantgegevens)
 *   Stap 2: Analyse reviewen (onderdelen + Gouda-vlaggen)
 *   Stap 3: Offerte finaliseren (regels + sticky sidebar met live totalen +
 *           sanity-check banner)
 *
 * Praat met /api/admin/quote/generate-v2 (analyze → pipeline). De zware logica
 * zit in de pure pipeline-services; deze pagina is presentatie + flow.
 */

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, Save } from 'lucide-react';

interface DisplayLine {
  description: string;
  line_type: string;
  quantity: number;
  unit: string;
  unit_price_cents: number | null;
  total_cents: number | null;
}
interface Breakdown {
  subtotal: number;
  vat_9_amount: number;
  vat_21_amount: number;
  grand_total: number;
}
interface Distribution {
  labor_pct: number;
  materials_pct: number;
  equipment_pct: number;
  within_norm: boolean;
  warnings: string[];
}
interface Section {
  title: string;
  assembly: string | null;
  unmatched: boolean;
  display_lines: DisplayLine[];
  breakdown: Breakdown | null;
  distribution: Distribution | null;
  flags: string[];
}
interface Activity {
  type: string;
  action: string;
  description: string;
  dimensions: { area?: number; length?: number; width?: number };
}
interface PipelineResponse {
  ai: { summary: string; confidence: number; activities: Activity[] };
  config: { method: string; layout: string };
  pipeline: {
    sections: Section[];
    combined: { breakdown: Breakdown; distribution: Distribution };
    flags: string[];
    hasBlockingFlags: boolean;
  };
}

const euro = (cents: number | null) =>
  cents == null
    ? '—'
    : `€ ${(cents / 100).toLocaleString('nl-NL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

export default function NieuwV2Page() {
  const { isLoading: authLoading } = useAdminAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [method, setMethod] = useState('uitgesplitst');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineResponse | null>(null);
  const [savedNumber, setSavedNumber] = useState<string | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/quote/generate-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, method, projectAddress: customerAddress }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analyse mislukt');
      setResult(data);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  const persist = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/quote/generate-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          method,
          persist: true,
          projectDescription: customerName ? `Offerte voor ${customerName}` : undefined,
          projectAddress: customerAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Opslaan mislukt');
      setSavedNumber(data.persistence?.quoteNumber ?? 'opgeslagen');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="py-20 text-center text-slate-500">Laden…</div>
      </AdminLayout>
    );
  }

  const combined = result?.pipeline.combined;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <Stepper step={step} />

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* STAP 1 */}
        {step === 1 && (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">Stap 1 · Opdracht invoeren</h2>
            <textarea
              className="min-h-[160px] w-full rounded-md border border-slate-300 p-3 text-sm"
              placeholder="Beschrijf de opdracht. Bijv: Oprit 5×14m, afgraven 20cm, zandbed 10cm, klinkers waalformaat antraciet, opsluitbanden rondom."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                className="rounded-md border border-slate-300 p-2 text-sm"
                placeholder="Klantnaam (optioneel)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <input
                className="rounded-md border border-slate-300 p-2 text-sm"
                placeholder="Adres (optioneel)"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600">Prijsmethode:</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="rounded-md border border-slate-300 p-2 text-sm"
              >
                <option value="uitgesplitst">Uitgesplitst</option>
                <option value="meterprijs">Meterprijs / aanneemsom</option>
                <option value="uren">Uren × uurtarief</option>
              </select>
            </div>
            <div className="flex justify-end">
              <Button onClick={analyze} disabled={loading || notes.trim().length === 0}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Analyseer <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STAP 2 */}
        {step === 2 && result && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Stap 2 · Analyse reviewen</h2>
            <p className="text-sm text-slate-500">{result.ai.summary}</p>

            {result.pipeline.flags.length > 0 && (
              <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-4">
                {result.pipeline.flags.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {result.ai.activities.map((a, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{a.description}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {a.action}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {a.type}
                    {a.dimensions.area ? ` · ${a.dimensions.area} m²` : ''}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Terug
              </Button>
              <Button onClick={() => setStep(3)}>
                Bereken offerte <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STAP 3 */}
        {step === 3 && result && combined && (
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex-1 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Stap 3 · Offerte finaliseren</h2>

              {!combined.distribution.within_norm && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4" /> Kostenverdeling wijkt af van de 55/35/10-norm
                  </p>
                  <ul className="mt-1 list-disc pl-6">
                    {combined.distribution.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.pipeline.sections.map((s, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 px-4 py-2 font-medium text-slate-900">
                    {s.title}
                    {s.unmatched && (
                      <span className="ml-2 text-xs text-amber-600">⚠️ handmatig opbouwen</span>
                    )}
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {s.display_lines.map((l, j) => (
                        <tr key={j} className="border-b border-slate-50">
                          <td className="px-4 py-1.5 text-slate-700">{l.description}</td>
                          <td className="px-2 py-1.5 text-right text-slate-500">
                            {l.quantity} {l.unit}
                          </td>
                          <td
                            className={`px-4 py-1.5 text-right ${
                              l.total_cents == null ? 'text-red-600' : 'text-slate-900'
                            }`}
                          >
                            {l.total_cents == null ? 'prijs ontbreekt' : euro(l.total_cents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Terug
                </Button>
              </div>
            </div>

            {/* Sticky sidebar */}
            <aside className="lg:w-72">
              <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 lg:sticky lg:top-4">
                <h3 className="font-semibold text-slate-900">Totalen</h3>
                <Row label="Subtotaal" value={euro(combined.breakdown.subtotal)} />
                <Row label="BTW 21%" value={euro(combined.breakdown.vat_21_amount)} />
                {combined.breakdown.vat_9_amount > 0 && (
                  <Row label="BTW 9%" value={euro(combined.breakdown.vat_9_amount)} />
                )}
                <div className="border-t border-slate-200 pt-2">
                  <Row label="Totaal" value={euro(combined.breakdown.grand_total)} bold />
                </div>
                <div className="pt-2 text-xs text-slate-500">
                  Arbeid {combined.distribution.labor_pct}% · Materiaal{' '}
                  {combined.distribution.materials_pct}% · Materieel{' '}
                  {combined.distribution.equipment_pct}%
                </div>

                {result.pipeline.hasBlockingFlags && (
                  <p className="rounded bg-amber-50 p-2 text-xs text-amber-800">
                    Niet verstuurbaar zolang er vlaggen openstaan.
                  </p>
                )}

                {savedNumber ? (
                  <p className="rounded bg-green-50 p-2 text-sm text-green-800">
                    Opgeslagen als concept {savedNumber}.
                  </p>
                ) : (
                  <Button className="w-full" onClick={persist} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Opslaan als concept
                  </Button>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ['Invoer', 'Analyse', 'Finaliseren'];
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                active
                  ? 'bg-orange-500 text-white'
                  : done
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-200 text-slate-500'
              }`}
            >
              {n}
            </span>
            <span className={`text-sm ${active ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
              {label}
            </span>
            {n < 3 && <span className="mx-1 h-px w-6 bg-slate-200" />}
          </div>
        );
      })}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={bold ? 'font-bold text-slate-900' : 'text-slate-700'}>{value}</span>
    </div>
  );
}
