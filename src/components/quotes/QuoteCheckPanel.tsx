'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Ban
} from 'lucide-react';

export type CheckType = 'all' | 'eenheden' | 'prijzen' | 'titels' | 'logica';
export type SuggestionType = 'eenheid' | 'prijs' | 'titel' | 'logica';
export type Severity = 'fout' | 'waarschuwing' | 'info';

export interface CheckSuggestion {
  id: string;
  type: SuggestionType;
  severity: Severity;
  section_id: string | null;
  item_id: string | null;
  section_title: string;
  item_description: string;
  field: string;
  current_value: string;
  suggested_value: string;
  reason: string;
}

export interface DismissalRule {
  key: string;              // `${normalized_description}__${field}`
  item_description: string;
  field: string;
  reason: string;
  dismissed_at: string;
}

const GLOBAL_KEY = 'kc_dismissal_rules';

function loadRules(): DismissalRule[] {
  try { return JSON.parse(localStorage.getItem(GLOBAL_KEY) || '[]'); } catch { return []; }
}

function saveRule(rule: DismissalRule) {
  const existing = loadRules().filter(r => r.key !== rule.key);
  localStorage.setItem(GLOBAL_KEY, JSON.stringify([...existing, rule]));
}

function deleteRule(key: string) {
  localStorage.setItem(GLOBAL_KEY, JSON.stringify(loadRules().filter(r => r.key !== key)));
}

function patternKey(description: string, field: string): string {
  return `${description.toLowerCase().trim()}__${field}`;
}

function suggestionPatternKey(s: CheckSuggestion): string {
  return patternKey(s.item_description || s.section_title, s.field);
}

interface QuoteCheckPanelProps {
  quoteId: string;
  onApplySuggestion: (suggestion: CheckSuggestion) => Promise<void>;
}

const CHECK_TYPES: { value: CheckType; label: string; description: string }[] = [
  { value: 'all', label: 'Volledige check', description: 'Alles in één keer' },
  { value: 'eenheden', label: 'Eenheden', description: 'm², m³, m, stuk' },
  { value: 'prijzen', label: 'Prijzen', description: 'Marktconformiteit' },
  { value: 'titels', label: 'Titels & omschrijvingen', description: 'Duidelijkheid' },
  { value: 'logica', label: 'Logische opbouw', description: 'Volledigheid' },
];

const TYPE_LABELS: Record<SuggestionType, string> = {
  eenheid: 'Eenheid', prijs: 'Prijs', titel: 'Titel', logica: 'Logica',
};
const TYPE_COLORS: Record<SuggestionType, string> = {
  eenheid: 'bg-blue-100 text-blue-700',
  prijs: 'bg-purple-100 text-purple-700',
  titel: 'bg-yellow-100 text-yellow-700',
  logica: 'bg-orange-100 text-orange-700',
};

function SeverityIcon({ severity }: { severity: Severity }) {
  if (severity === 'fout') return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
  if (severity === 'waarschuwing') return <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
  return <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />;
}

function formatVal(field: string, value: string): string {
  if (field === 'unit_price' || field === 'cost_price') {
    const n = parseFloat(value.replace(',', '.'));
    if (!isNaN(n)) return `€${n.toFixed(2).replace('.', ',')}`;
  }
  return value;
}

export default function QuoteCheckPanel({ quoteId, onApplySuggestion }: QuoteCheckPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<CheckType>('all');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CheckSuggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set()); // suggestion IDs dismissed this session
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [rules, setRules] = useState<DismissalRule[]>([]);
  const [showRules, setShowRules] = useState(false);

  // Dismiss flow
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState('');

  useEffect(() => { setRules(loadRules()); }, []);

  const dismissedPatterns = new Set(rules.map(r => r.key));

  const runCheck = async () => {
    const currentRules = loadRules();
    setLoading(true);
    setSuggestions([]);
    setDismissed(new Set());
    setAccepted(new Set());
    setHasRun(false);
    setDismissingId(null);
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_type: selectedCheck,
          dismissal_rules: currentRules.map(r => ({
            item_description: r.item_description,
            field: r.field,
            reason: r.reason,
          }))
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Filter client-side too (belt-and-suspenders)
        const ruleKeys = new Set(currentRules.map(r => r.key));
        const filtered = (data.suggestions || []).filter(
          (s: CheckSuggestion) => !ruleKeys.has(suggestionPatternKey(s))
        );
        setSuggestions(filtered);
        setRules(currentRules);
        setHasRun(true);
      } else {
        const err = await res.json();
        alert(err.debug_raw
          ? `Check mislukt: ${err.error}\n\nAI:\n${err.debug_raw}`
          : 'Check mislukt: ' + (err.error || 'Onbekende fout'));
      }
    } catch {
      alert('Er ging iets mis bij de check');
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = async (suggestion: CheckSuggestion) => {
    setApplying(suggestion.id);
    try {
      await onApplySuggestion(suggestion);
      setAccepted(prev => new Set([...prev, suggestion.id]));
    } catch (e) {
      console.error('Error applying suggestion:', e);
      alert('Kon suggestie niet toepassen');
    } finally {
      setApplying(null);
    }
  };

  const confirmDismiss = useCallback((suggestion: CheckSuggestion) => {
    const key = suggestionPatternKey(suggestion);
    const rule: DismissalRule = {
      key,
      item_description: suggestion.item_description || suggestion.section_title,
      field: suggestion.field,
      reason: dismissReason.trim(),
      dismissed_at: new Date().toISOString(),
    };
    saveRule(rule);

    // Auto-dismiss ALL visible suggestions with the same pattern
    const updatedRules = loadRules();
    const newDismissedPatterns = new Set(updatedRules.map(r => r.key));
    const toSessionDismiss = suggestions
      .filter(s => !dismissed.has(s.id) && !accepted.has(s.id))
      .filter(s => newDismissedPatterns.has(suggestionPatternKey(s)))
      .map(s => s.id);

    setDismissed(prev => new Set([...prev, ...toSessionDismiss]));
    setRules(updatedRules);
    setDismissingId(null);
    setDismissReason('');
  }, [quoteId, dismissReason, suggestions, dismissed, accepted]);

  const visible = suggestions.filter(s => !dismissed.has(s.id) && !accepted.has(s.id));
  const fouten = visible.filter(s => s.severity === 'fout').length;
  const waarschuwingen = visible.filter(s => s.severity === 'waarschuwing').length;

  // Count how many visible suggestions would be dismissed by the current pattern
  const dismissingBatchCount = dismissingId
    ? (() => {
        const s = suggestions.find(x => x.id === dismissingId);
        if (!s) return 0;
        const key = suggestionPatternKey(s);
        return visible.filter(x => suggestionPatternKey(x) === key).length;
      })()
    : 0;

  return (
    <Card className="border-2" style={{ borderColor: '#e2e8f0' }}>
      <CardHeader className="cursor-pointer select-none" onClick={() => setIsOpen(o => !o)}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-base">Offerte check</span>
            {hasRun && visible.length > 0 && (
              <span className="text-xs font-normal bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {fouten > 0 ? `${fouten} fout${fouten > 1 ? 'en' : ''}` : `${waarschuwingen} waarschuwing${waarschuwingen > 1 ? 'en' : ''}`}
              </span>
            )}
            {hasRun && visible.length === 0 && (
              <span className="text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Alles goed</span>
            )}
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </CardTitle>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 pt-0">
          {/* Check type selector */}
          <div className="flex flex-wrap gap-2">
            {CHECK_TYPES.map(ct => (
              <button key={ct.value} onClick={() => setSelectedCheck(ct.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  selectedCheck === ct.value
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                }`}>
                {ct.label}
                <span className={`ml-1.5 text-xs font-normal ${selectedCheck === ct.value ? 'text-emerald-100' : 'text-gray-400'}`}>
                  {ct.description}
                </span>
              </button>
            ))}
          </div>

          <Button onClick={runCheck} disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Controleren...</>
              : <><Sparkles className="w-4 h-4 mr-2" />{hasRun ? 'Opnieuw controleren' : 'Start check'}</>
            }
          </Button>

          {/* Dismissal rules overview */}
          {rules.length > 0 && (
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowRules(r => !r)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100"
              >
                <span><Ban className="w-3 h-3 inline mr-1" />{rules.length} vaste afwijzingsregel{rules.length !== 1 ? 's' : ''} actief</span>
                {showRules ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showRules && (
                <div className="divide-y divide-gray-100">
                  {rules.map(r => (
                    <div key={r.key} className="flex items-start justify-between gap-2 px-3 py-2 bg-white">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{r.item_description} · {r.field}</p>
                        {r.reason && <p className="text-xs text-gray-400 truncate">{r.reason}</p>}
                      </div>
                      <button
                        onClick={() => { deleteRule(r.key); setRules(loadRules()); }}
                        className="text-gray-300 hover:text-red-400 flex-shrink-0"
                        title="Verwijder regel"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {hasRun && (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {visible.length === 0 ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-700 text-sm">Geen problemen gevonden</p>
                    <p className="text-xs text-green-600">De offerte ziet er goed uit op dit gebied.</p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500">
                    {visible.length} suggestie{visible.length !== 1 ? 's' : ''} gevonden
                    {dismissed.size > 0 && ` · ${dismissed.size} afgewezen`}
                    {accepted.size > 0 && ` · ${accepted.size} toegepast`}
                  </p>
                  {visible.map(s => (
                    <div key={s.id} className="border rounded-lg p-3 bg-white space-y-2">
                      <div className="flex items-start gap-2">
                        <SeverityIcon severity={s.severity} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[s.type]}`}>
                              {TYPE_LABELS[s.type]}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mb-0.5">
                            <span className="font-medium text-gray-600">{s.section_title}</span>
                            {s.item_description && <> › <span className="font-semibold text-gray-800">{s.item_description}</span></>}
                          </div>
                          <p className="text-sm text-gray-700">{s.reason}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-xs">
                            <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded line-through">{formatVal(s.field, s.current_value)}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded font-medium">{formatVal(s.field, s.suggested_value)}</span>
                          </div>
                        </div>
                      </div>

                      {dismissingId === s.id ? (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs text-gray-500">
                            Waarom klopt dit niet? Dit wordt onthouden voor <strong>alle toekomstige offertes</strong>.
                            {dismissingBatchCount > 1 && <span className="text-amber-600"> ({dismissingBatchCount} vergelijkbare suggesties worden ook afgewezen.)</span>}
                          </p>
                          <input
                            autoFocus
                            type="text"
                            value={dismissReason}
                            onChange={e => setDismissReason(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') confirmDismiss(s);
                              if (e.key === 'Escape') { setDismissingId(null); setDismissReason(''); }
                            }}
                            placeholder="Bijv: wij rekenen zandbed altijd per m², niet m³"
                            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-300"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => confirmDismiss(s)}
                              className="flex-1 h-7 text-xs bg-red-500 hover:bg-red-600 text-white">
                              <Ban className="w-3 h-3 mr-1" />Nooit meer melden
                            </Button>
                            <Button size="sm" variant="outline"
                              onClick={() => { setDismissingId(null); setDismissReason(''); }}
                              className="h-7 text-xs text-gray-500">
                              Annuleer
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" onClick={() => acceptSuggestion(s)} disabled={applying === s.id}
                            className="flex-1 h-7 text-xs bg-green-500 hover:bg-green-600 text-white">
                            {applying === s.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <><CheckCircle2 className="w-3 h-3 mr-1" />Accepteren</>
                            }
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setDismissingId(s.id); setDismissReason(''); }}
                            disabled={applying === s.id}
                            className="flex-1 h-7 text-xs text-gray-500">
                            <XCircle className="w-3 h-3 mr-1" />Afwijzen
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
