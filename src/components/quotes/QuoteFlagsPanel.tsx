'use client';

/**
 * Pipeline-flags van een offerte, zichtbaar op het verzendmoment (C2.1).
 *
 * Toont de vlaggen uit de jongste generation run: blocking flags blokkeren
 * het verzenden (server-side gate) en krijgen hier een expliciete
 * "Markeer opgelost"-actie die gelogd wordt; warnings zijn zichtbaar zonder
 * doorklikken. Los van het QuoteCheckPanel (AI-checks) — dit zijn de
 * deterministische pipeline-vlaggen.
 */

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, OctagonX } from 'lucide-react';

interface FlagRow {
  code: string;
  severity: 'blocking' | 'warning' | 'info';
  message: string;
  resolved: boolean;
}

export default function QuoteFlagsPanel({ quoteId }: { quoteId: string }) {
  const [flags, setFlags] = useState<FlagRow[] | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/flags`);
      if (!res.ok) return;
      const data = await res.json();
      setFlags(Array.isArray(data.flags) ? data.flags : []);
    } catch (error) {
      console.error('Vlaggen ophalen mislukt:', error);
    }
  }, [quoteId]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const resolveFlag = async (flag: FlagRow) => {
    const key = `${flag.code}|${flag.message}`;
    setResolving(key);
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: flag.code, message: flag.message }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert('Flag oplossen mislukt: ' + (data.error || 'onbekende fout'));
        return;
      }
      await fetchFlags();
    } catch (error) {
      console.error('Flag oplossen mislukt:', error);
      alert('Flag oplossen mislukt');
    } finally {
      setResolving(null);
    }
  };

  // Geen run of geen vlaggen: niets tonen — het paneel is er alleen als er
  // iets te zien valt.
  if (!flags || flags.length === 0) return null;

  const blocking = flags.filter((f) => f.severity === 'blocking' && !f.resolved);
  const resolved = flags.filter((f) => f.severity === 'blocking' && f.resolved);
  const warnings = flags.filter((f) => f.severity === 'warning');

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-800">
        Vlaggen uit de generatie
      </h3>

      {blocking.length > 0 && (
        <p className="text-xs text-red-700 bg-red-50 rounded p-2">
          Deze offerte kan niet verstuurd worden zolang er blokkerende vlaggen
          open staan. Los het onderliggende probleem op en markeer de vlag als
          opgelost.
        </p>
      )}

      <ul className="space-y-2">
        {blocking.map((f) => {
          const key = `${f.code}|${f.message}`;
          return (
            <li key={key} className="flex items-start gap-2 text-xs">
              <OctagonX className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-slate-700">{f.message}</p>
                <button
                  onClick={() => resolveFlag(f)}
                  disabled={resolving === key}
                  className="mt-1 text-red-700 underline underline-offset-2 disabled:opacity-50"
                >
                  {resolving === key ? (
                    <Loader2 className="w-3 h-3 animate-spin inline" />
                  ) : (
                    'Markeer opgelost'
                  )}
                </button>
              </div>
            </li>
          );
        })}

        {warnings.map((f) => (
          <li key={`${f.code}|${f.message}`} className="flex items-start gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-slate-700">{f.message}</p>
          </li>
        ))}

        {resolved.map((f) => (
          <li
            key={`${f.code}|${f.message}`}
            className="flex items-start gap-2 text-xs text-slate-400"
          >
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="line-through">{f.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
