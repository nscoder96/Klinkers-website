'use client';

/**
 * Urennormen-beheer (C3) — tab op de instellingenpagina, patroon van de
 * prijzen-pagina. De normen voeden de AI-prompt per generatie: een wijziging
 * hier is direct zichtbaar in de eerstvolgende offerte, zonder deploy.
 * Eigen data-fetching en opslaan-per-actie (los van de instellingen-Save).
 */

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2 } from 'lucide-react';

interface NormRow {
  id: string;
  work_type_key: string;
  label: string;
  category: string;
  unit: string;
  hours_per_unit: number | null;
  basis_qty: number;
  display_text: string | null;
  sort_order: number;
  source: string;
  is_active: boolean;
}

const EMPTY_NEW = {
  label: '',
  category: '',
  unit: 'm²',
  hours_per_unit: '',
  basis_qty: '10',
};

export default function LaborNormsTab() {
  const [norms, setNorms] = useState<NormRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [nieuw, setNieuw] = useState(EMPTY_NEW);
  const [adding, setAdding] = useState(false);

  const fetchNorms = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/labor-norms');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNorms(data.norms);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kon urennormen niet laden');
    }
  }, []);

  useEffect(() => {
    fetchNorms();
  }, [fetchNorms]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/labor-norms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNorms((prev) =>
        (prev ?? []).map((n) => (n.id === id ? { ...n, ...data.norm } : n))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bijwerken mislukt');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (row: NormRow) => {
    if (!confirm(`Norm "${row.label}" verwijderen?`)) return;
    setBusyId(row.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/labor-norms/${row.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNorms((prev) => (prev ?? []).filter((n) => n.id !== row.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verwijderen mislukt');
    } finally {
      setBusyId(null);
    }
  };

  const add = async () => {
    const hours = parseFloat(nieuw.hours_per_unit);
    const basis = parseFloat(nieuw.basis_qty);
    if (!nieuw.label || !nieuw.category || !Number.isFinite(hours) || !Number.isFinite(basis)) {
      setError('Vul label, categorie, uren en basis in');
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const maxSort = Math.max(0, ...(norms ?? []).map((n) => n.sort_order));
      const res = await fetch('/api/admin/labor-norms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_type_key: nieuw.label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
          label: nieuw.label,
          category: nieuw.category,
          unit: nieuw.unit,
          hours_per_unit: hours,
          basis_qty: basis,
          sort_order: maxSort + 10,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNieuw(EMPTY_NEW);
      await fetchNorms();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Toevoegen mislukt');
    } finally {
      setAdding(false);
    }
  };

  if (!norms) {
    return <div className="py-10 text-center text-slate-500">Urennormen laden…</div>;
  }

  const categories = [...new Set(norms.map((n) => n.category))];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Urennormen</CardTitle>
        <p className="text-sm text-slate-500">
          Basis voor de AI-urenraming — een wijziging werkt direct door in de
          eerstvolgende generatie. Zonder actieve normen weigert de generator.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <p className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-800">
            {error}
          </p>
        )}

        {categories.map((cat) => (
          <div key={cat}>
            <h3 className="mb-1 text-sm font-semibold text-slate-700">{cat}</h3>
            <table className="w-full text-sm">
              <tbody>
                {norms
                  .filter((n) => n.category === cat)
                  .map((n) => (
                    <tr
                      key={n.id}
                      className={`border-b border-slate-100 ${n.is_active ? '' : 'opacity-45'}`}
                    >
                      <td className="py-1.5 pr-2 text-slate-800">{n.label}</td>
                      <td className="w-24 py-1.5 pr-1">
                        {n.display_text ? (
                          <span className="text-xs italic text-slate-500">{n.display_text}</span>
                        ) : (
                          <input
                            type="number"
                            step="any"
                            min={0}
                            defaultValue={n.hours_per_unit ?? ''}
                            disabled={busyId === n.id}
                            onBlur={(e) => {
                              const v = parseFloat(e.target.value);
                              if (Number.isFinite(v) && v > 0 && v !== n.hours_per_unit) {
                                patch(n.id, { hours_per_unit: v });
                              }
                            }}
                            className="w-full rounded border border-slate-300 p-1 text-right"
                          />
                        )}
                      </td>
                      <td className="w-28 whitespace-nowrap py-1.5 pr-2 text-xs text-slate-500">
                        uur per {n.basis_qty === 1 ? n.unit : `${n.basis_qty} ${n.unit}`}
                      </td>
                      <td className="w-16 py-1.5 pr-1 text-right">
                        <button
                          onClick={() => patch(n.id, { is_active: !n.is_active })}
                          disabled={busyId === n.id}
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            n.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {busyId === n.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : n.is_active ? (
                            'actief'
                          ) : (
                            'uit'
                          )}
                        </button>
                      </td>
                      <td className="w-8 py-1.5 text-right">
                        <button
                          onClick={() => remove(n)}
                          disabled={busyId === n.id}
                          className="text-slate-400 hover:text-red-600"
                          title="Verwijderen"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Nieuwe norm
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <input
              placeholder="Label (bv. Kasseien leggen)"
              value={nieuw.label}
              onChange={(e) => setNieuw({ ...nieuw, label: e.target.value })}
              className="col-span-2 rounded border border-slate-300 p-1.5 text-sm"
            />
            <input
              placeholder="Categorie"
              value={nieuw.category}
              onChange={(e) => setNieuw({ ...nieuw, category: e.target.value })}
              className="rounded border border-slate-300 p-1.5 text-sm"
              list="norm-categories"
            />
            <datalist id="norm-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <input
              placeholder="Uren"
              type="number"
              step="any"
              min={0}
              value={nieuw.hours_per_unit}
              onChange={(e) => setNieuw({ ...nieuw, hours_per_unit: e.target.value })}
              className="rounded border border-slate-300 p-1.5 text-sm"
            />
            <div className="flex gap-1">
              <input
                placeholder="Basis"
                type="number"
                step="any"
                min={0}
                value={nieuw.basis_qty}
                onChange={(e) => setNieuw({ ...nieuw, basis_qty: e.target.value })}
                className="w-14 rounded border border-slate-300 p-1.5 text-sm"
              />
              <select
                value={nieuw.unit}
                onChange={(e) => setNieuw({ ...nieuw, unit: e.target.value })}
                className="flex-1 rounded border border-slate-300 p-1.5 text-sm"
              >
                {['m²', 'meter', 'stuk', 'stuks', 'palen', 'punten'].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button size="sm" className="mt-2" onClick={add} disabled={adding}>
            {adding ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="mr-1 h-3.5 w-3.5" />
            )}
            Norm toevoegen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
