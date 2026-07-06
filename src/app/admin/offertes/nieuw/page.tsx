'use client';

/**
 * Offerte-generator V2 (F8 + C2.4) — 3-stappen flow, tablet-proof.
 *   Stap 1: Opdracht invoeren
 *   Stap 2: Bevestigen (C2.4) — de AI-extractie corrigeren/bevestigen;
 *           er wordt pas geëxpandeerd en geprijsd ná expliciete bevestiging.
 *   Stap 3: Offerte finaliseren — bewerkbare regels, drag & drop, BTW-toggle
 *
 * API-fasen: 'extract' (Laag 1 + run-log) → 'price' (pipeline over de
 * bevestigde activiteiten; persist stuurt dezelfde bevestigde set mee zodat
 * wat je zag ook is wat er opgeslagen wordt).
 */

import { useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, Save } from 'lucide-react';
import { SectionDndList } from './SectionDndList';
import type { EditableLine, EditableSection } from './types';
import type { QuoteFlag } from '@/lib/quote-flags';

// --- API response types ---

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
  flags: QuoteFlag[];
}
interface AIActivity {
  type: string;
  action: string;
  description: string;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    count?: number;
    area?: number;
    afgraafdiepte_cm?: number;
    zanddikte_cm?: number;
    opsluiting_lengte_m?: number;
  };
  source_text: string;
  materials_mentioned: string[];
  missing_dimensions?: boolean;
  estimated_hours?: number;
}
/** Bevestigde activiteit: het origineel + de index in de AI-output (voor de correctie-diff). */
type ConfirmedActivity = AIActivity & { original_index: number };

interface ExtractResponse {
  generationRunId: string | null;
  ai: { summary: string; confidence: number; activities: AIActivity[] };
}
interface PriceResponse {
  generationRunId: string | null;
  config: { method: string; layout: string };
  pipeline: {
    sections: Section[];
    combined: { breakdown: Breakdown; distribution: Distribution };
    flags: QuoteFlag[];
    hasBlockingFlags: boolean;
  };
  persistence?: { quoteId: string; quoteNumber: string } | null;
}

/** Bruikbare afmeting: oppervlak, of lengte × breedte. Anders rood (C2.4). */
function hasDimensions(a: AIActivity): boolean {
  const d = a.dimensions;
  return (d.area ?? 0) > 0 || ((d.length ?? 0) > 0 && (d.width ?? 0) > 0);
}

// --- Helpers ---

const euro = (cents: number | null) =>
  cents == null
    ? '—'
    : `€ ${(cents / 100).toLocaleString('nl-NL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

function lineTotal(l: EditableLine): number | null {
  if (l.unit_price_cents == null) return null;
  return Math.round(l.unit_price_cents * l.quantity);
}

// Simple incrementing ID — deterministic, SSR-safe
let _idCounter = 0;
const nextId = () => `eid-${++_idCounter}`;

const EMPTY_LINE = (): EditableLine => ({
  id: nextId(),
  description: '',
  line_type: 'arbeid',
  quantity: 1,
  unit: 'st',
  unit_price_cents: null,
});

const PLACEHOLDER_LINE = (): EditableLine => ({
  id: nextId(),
  description: 'Vul aan',
  line_type: 'arbeid',
  quantity: 1,
  unit: 'st',
  unit_price_cents: null,
});

function toEditableSections(sections: Section[]): EditableSection[] {
  return sections.map((s) => ({
    id: nextId(),
    title: s.title,
    flags: s.flags,
    unmatched: s.unmatched,
    lines:
      s.display_lines.length > 0
        ? s.display_lines.map((l) => ({
            id: nextId(),
            description: l.description,
            line_type: l.line_type,
            quantity: l.quantity,
            unit: l.unit,
            unit_price_cents: l.unit_price_cents,
          }))
        : s.unmatched
          ? [PLACEHOLDER_LINE()]
          : [],
  }));
}

// --- Page ---

export default function NieuwV2Page() {
  const { isLoading: authLoading } = useAdminAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [method, setMethod] = useState('uitgesplitst');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<ExtractResponse | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedActivity[]>([]);
  const [result, setResult] = useState<PriceResponse | null>(null);
  const [editableSections, setEditableSections] = useState<EditableSection[]>([]);
  const [savedNumber, setSavedNumber] = useState<string | null>(null);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [showIncl, setShowIncl] = useState(false);

  // C2.4 fase 1: alleen AI-extractie — er wordt nog niets berekend.
  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/quote/generate-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'extract', notes, method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analyse mislukt');
      setExtraction(data);
      setConfirmed(
        data.ai.activities.map((a: AIActivity, i: number) => ({
          ...a,
          original_index: i,
        }))
      );
      setResult(null);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  // C2.4 fase 2: pipeline over de bevestigde activiteiten ("Klopt, bereken").
  const calculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/quote/generate-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: 'price',
          generationRunId: extraction?.generationRunId ?? null,
          activities: confirmed,
          method,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Berekenen mislukt');
      setResult(data);
      setEditableSections(toEditableSections(data.pipeline.sections));
      setStep(3);
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
          phase: 'price',
          generationRunId: extraction?.generationRunId ?? null,
          activities: confirmed,
          method,
          persist: true,
          projectDescription: customerName
            ? `Offerte voor ${customerName}`
            : extraction?.ai.summary,
          projectAddress: customerAddress,
          customerName,
          customerPhone,
          customerEmail,
          customerAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Opslaan mislukt');
      setSavedNumber(data.persistence?.quoteNumber ?? 'opgeslagen');
      setSavedQuoteId(data.persistence?.quoteId ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  // Bevestigingsstap: afmeting corrigeren of activiteit verwijderen (immutable).
  const updateDimension = (
    index: number,
    field: keyof AIActivity['dimensions'],
    raw: string
  ) => {
    const value = raw === '' ? undefined : parseFloat(raw);
    setConfirmed((prev) =>
      prev.map((a, i) =>
        i !== index
          ? a
          : {
              ...a,
              dimensions: {
                ...a.dimensions,
                [field]: value != null && Number.isFinite(value) ? value : undefined,
              },
            }
      )
    );
  };

  const removeActivity = (index: number) => {
    setConfirmed((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = useCallback(
    (si: number, li: number, patch: Partial<EditableLine>) => {
      setEditableSections((prev) =>
        prev.map((section, s) =>
          s !== si
            ? section
            : {
                ...section,
                lines: section.lines.map((line, l) =>
                  l !== li ? line : { ...line, ...patch }
                ),
              }
        )
      );
    },
    []
  );

  const addLine = useCallback((si: number) => {
    setEditableSections((prev) =>
      prev.map((section, s) =>
        s !== si
          ? section
          : { ...section, lines: [...section.lines, EMPTY_LINE()] }
      )
    );
  }, []);

  const reorderLines = useCallback((si: number, newLines: EditableLine[]) => {
    setEditableSections((prev) =>
      prev.map((section, s) => (s !== si ? section : { ...section, lines: newLines }))
    );
  }, []);

  const deleteLine = useCallback((si: number, li: number) => {
    setEditableSections((prev) =>
      prev.map((section, s) =>
        s !== si
          ? section
          : { ...section, lines: section.lines.filter((_, l) => l !== li) }
      )
    );
  }, []);

  const deleteSection = useCallback((si: number) => {
    setEditableSections((prev) => prev.filter((_, s) => s !== si));
  }, []);

  const reorderSections = useCallback((newSections: EditableSection[]) => {
    setEditableSections(newSections);
  }, []);

  // Live totals — always computed excl. BTW
  const liveTotals = (() => {
    let subtotal = 0;
    let labor = 0;
    let material = 0;
    for (const s of editableSections) {
      for (const l of s.lines) {
        const tot = lineTotal(l) ?? 0;
        subtotal += tot;
        if (l.line_type === 'arbeid') labor += tot;
        else if (l.line_type === 'materiaal') material += tot;
      }
    }
    const vat21 = Math.round(subtotal * 0.21);
    const grand = subtotal + vat21;
    const laborPct = subtotal > 0 ? Math.round((labor / subtotal) * 100) : 0;
    const materialPct = subtotal > 0 ? Math.round((material / subtotal) * 100) : 0;
    return { subtotal, vat21, grand, laborPct, materialPct };
  })();

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
              <input
                className="rounded-md border border-slate-300 p-2 text-sm"
                placeholder="Telefoon (optioneel)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              <input
                className="rounded-md border border-slate-300 p-2 text-sm"
                placeholder="E-mail (optioneel)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600">Prijsmethode:</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="rounded-md border border-slate-300 p-2 text-sm"
              >
                <option value="uitgesplitst">Uitgesplitst — elke post apart</option>
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

        {/* STAP 2 — Bevestigingsstap (C2.4): niets wordt berekend vóór "Klopt, bereken" */}
        {step === 2 && extraction && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Stap 2 · Controleer wat de AI heeft gelezen
            </h2>
            <p className="text-sm text-slate-500">{extraction.ai.summary}</p>
            <p className="text-xs text-slate-400">
              Corrigeer afmetingen of verwijder activiteiten die niet kloppen.
              Er wordt pas gerekend nadat je bevestigt.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {confirmed.map((a, i) => {
                const incompleet = !hasDimensions(a);
                return (
                  <div
                    key={`${a.original_index}`}
                    className={`rounded-lg border bg-white p-4 ${
                      incompleet ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{a.description}</span>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {a.action}
                        </span>
                        <button
                          onClick={() => removeActivity(i)}
                          className="text-xs text-red-600 underline underline-offset-2"
                          title="Activiteit verwijderen"
                        >
                          Verwijderen
                        </button>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{a.type}</div>

                    {incompleet && (
                      <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-red-700">
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                        Afmetingen verplicht — vul oppervlak of lengte × breedte in
                      </p>
                    )}

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <DimField
                        label="Lengte (m)"
                        value={a.dimensions.length}
                        invalid={incompleet}
                        onChange={(v) => updateDimension(i, 'length', v)}
                      />
                      <DimField
                        label="Breedte (m)"
                        value={a.dimensions.width}
                        invalid={incompleet}
                        onChange={(v) => updateDimension(i, 'width', v)}
                      />
                      <DimField
                        label="Oppervlak (m²)"
                        value={a.dimensions.area}
                        invalid={incompleet}
                        onChange={(v) => updateDimension(i, 'area', v)}
                      />
                      <DimField
                        label="Afgraafdiepte (cm)"
                        value={a.dimensions.afgraafdiepte_cm}
                        onChange={(v) => updateDimension(i, 'afgraafdiepte_cm', v)}
                      />
                      <DimField
                        label="Zanddikte (cm)"
                        value={a.dimensions.zanddikte_cm}
                        onChange={(v) => updateDimension(i, 'zanddikte_cm', v)}
                      />
                      <DimField
                        label="Opsluiting (m¹)"
                        value={a.dimensions.opsluiting_lengte_m}
                        onChange={(v) => updateDimension(i, 'opsluiting_lengte_m', v)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {confirmed.length === 0 && (
              <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                Alle activiteiten zijn verwijderd — ga terug en pas de notitie aan.
              </p>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Terug
              </Button>
              <Button onClick={calculate} disabled={loading || confirmed.length === 0}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Klopt, bereken <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STAP 3 */}
        {step === 3 && result && combined && (
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Main content */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Stap 3 · Offerte finaliseren</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Sleep secties en regels om te herschikken. Klik op een veld om het aan te passen.
                </p>
              </div>

              {result.pipeline.flags.length > 0 && (
                <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Let op bij de offerte
                  </p>
                  {result.pipeline.flags.map((f, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 text-sm ${
                        f.severity === 'blocking' ? 'text-red-800' : 'text-amber-900'
                      }`}
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>
                        {f.message}
                        {f.severity === 'blocking' && (
                          <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                            blokkeert verzenden
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}

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

              <SectionDndList
                sections={editableSections}
                showIncl={showIncl}
                onUpdateLine={updateLine}
                onAddLine={addLine}
                onDeleteLine={deleteLine}
                onDeleteSection={deleteSection}
                onReorderLines={reorderLines}
                onReorderSections={reorderSections}
              />

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

                {/* BTW toggle */}
                <div className="flex overflow-hidden rounded border border-slate-200 text-xs font-medium">
                  <button
                    onClick={() => setShowIncl(false)}
                    className={`flex-1 py-1.5 transition-colors ${
                      !showIncl
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Excl. BTW
                  </button>
                  <button
                    onClick={() => setShowIncl(true)}
                    className={`flex-1 py-1.5 transition-colors ${
                      showIncl
                        ? 'bg-orange-500 text-white'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Incl. BTW
                  </button>
                </div>

                {/* Totalen display */}
                {showIncl ? (
                  <>
                    <div className="rounded-md bg-orange-50 p-3 text-center">
                      <div className="text-xl font-bold text-slate-900">
                        {euro(liveTotals.grand)}
                      </div>
                      <div className="text-xs text-slate-500">Totaal incl. BTW</div>
                    </div>
                    <div className="space-y-1.5 border-t border-slate-100 pt-2">
                      <Row label="Subtotaal excl. BTW" value={euro(liveTotals.subtotal)} />
                      <Row label="BTW 21%" value={euro(liveTotals.vat21)} />
                    </div>
                  </>
                ) : (
                  <>
                    <Row label="Subtotaal excl. BTW" value={euro(liveTotals.subtotal)} />
                    <Row label="BTW 21%" value={euro(liveTotals.vat21)} />
                    <div className="border-t border-slate-200 pt-2">
                      <Row label="Totaal incl. BTW" value={euro(liveTotals.grand)} bold />
                    </div>
                  </>
                )}

                <div className="pt-1 text-xs text-slate-400">
                  Arbeid {liveTotals.laborPct}% · Materiaal {liveTotals.materialPct}%
                </div>

                {result.pipeline.hasBlockingFlags && (
                  <p className="rounded bg-amber-50 p-2 text-xs text-amber-800">
                    Controleer de vlaggen in stap 2 vóór verzenden.
                  </p>
                )}

                {savedNumber ? (
                  <div className="space-y-2">
                    <p className="rounded bg-green-50 p-2 text-sm text-green-800">
                      Opgeslagen als concept {savedNumber}.
                    </p>
                    {savedQuoteId && (
                      <Button asChild className="w-full">
                        <a href={`/admin/offertes/${savedQuoteId}`}>
                          Offerte openen en versturen
                        </a>
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <Button className="w-full" onClick={persist} disabled={saving}>
                      {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Opslaan als concept
                    </Button>
                    <p className="text-center text-xs text-slate-400">
                      Na opslaan kun je de offerte versturen.
                    </p>
                  </>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// --- Stepper ---

function Stepper({ step }: { step: number }) {
  const labels = ['Invoer', 'Bevestigen', 'Finaliseren'];
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
            <span
              className={`text-sm ${active ? 'font-medium text-slate-900' : 'text-slate-500'}`}
            >
              {label}
            </span>
            {n < 3 && <span className="mx-1 h-px w-6 bg-slate-200" />}
          </div>
        );
      })}
    </div>
  );
}

// --- Afmetingsveld in de bevestigingsstap (C2.4) ---

function DimField({
  label,
  value,
  invalid,
  onChange,
}: {
  label: string;
  value: number | undefined;
  invalid?: boolean;
  onChange: (raw: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-slate-500">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-0.5 w-full rounded border p-1.5 text-sm ${
          invalid ? 'border-red-300 bg-red-50' : 'border-slate-300'
        }`}
      />
    </label>
  );
}

// --- Row (sidebar) ---

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={bold ? 'font-bold text-slate-900' : 'text-slate-700'}>{value}</span>
    </div>
  );
}
