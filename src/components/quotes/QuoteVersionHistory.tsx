'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  History,
  Loader2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Plus,
  Clock
} from 'lucide-react';

interface QuoteVersion {
  id: string;
  version_number: number;
  label: string;
  created_at: string;
}

interface QuoteVersionHistoryProps {
  quoteId: string;
  onRestored: () => void;
}

export default function QuoteVersionHistory({ quoteId, onRestored }: QuoteVersionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<QuoteVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [migrationNeeded, setMigrationNeeded] = useState(false);

  const fetchVersions = async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, quoteId]);

  const saveVersion = async () => {
    setSaving(true);
    try {
      const label = prompt('Naam voor deze versie (optioneel):') ?? undefined;
      const res = await fetch(`/api/admin/quotes/${quoteId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label || undefined })
      });
      const data = await res.json();
      if (res.ok) {
        await fetchVersions();
      } else if (data.migration_needed) {
        setMigrationNeeded(true);
        alert('Versiebeheer moet eerst worden ingesteld in de database. Neem contact op met de beheerder.');
      } else {
        alert('Opslaan mislukt: ' + (data.error || 'Onbekende fout'));
      }
    } catch {
      alert('Er ging iets mis');
    } finally {
      setSaving(false);
    }
  };

  const restoreVersion = async (version: QuoteVersion) => {
    if (!confirm(`Wil je terugkeren naar "${version.label}"? De huidige staat wordt automatisch bewaard als backup.`)) {
      return;
    }
    setRestoring(version.id);
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/versions/${version.id}`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('Versie hersteld!');
        onRestored();
        await fetchVersions();
      } else {
        const data = await res.json();
        alert('Herstel mislukt: ' + (data.error || 'Onbekende fout'));
      }
    } catch {
      alert('Er ging iets mis bij het herstel');
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="border-2" style={{ borderColor: '#e2e8f0' }}>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(o => !o)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            <span className="text-base">Versiegeschiedenis</span>
            {versions.length > 0 && (
              <span className="text-xs font-normal bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                {versions.length} versie{versions.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </CardTitle>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-3 pt-0">
          <Button
            onClick={saveVersion}
            disabled={saving || migrationNeeded}
            variant="outline"
            className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Huidige staat opslaan als versie
          </Button>

          {migrationNeeded && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
              Versiebeheer vereist een database-update. Voer de migratie uit via Supabase.
            </p>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : versions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">
              Nog geen versies opgeslagen. Sla een versie op als backup voor je wijzigingen.
            </p>
          ) : (
            <div className="space-y-2">
              {versions.map((version, idx) => (
                <div
                  key={version.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    idx === 0 ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <Clock className={`w-4 h-4 flex-shrink-0 mt-0.5 ${idx === 0 ? 'text-indigo-500' : 'text-gray-400'}`} />
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${idx === 0 ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {version.label}
                        {idx === 0 && <span className="ml-2 text-xs font-normal text-indigo-500">(nieuwste)</span>}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(version.created_at)}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restoreVersion(version)}
                    disabled={restoring !== null}
                    className="ml-2 flex-shrink-0 h-7 text-xs border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                  >
                    {restoring === version.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <><RotateCcw className="w-3 h-3 mr-1" />Herstel</>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
