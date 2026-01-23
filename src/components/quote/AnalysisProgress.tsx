'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  XCircle,
  RefreshCw,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface Activity {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  notes: string;
}

interface LinkedTask {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  parent_activity: string;
}

interface QuoteItem {
  id: string;
  description: string;
  category: string;
  line_type: 'arbeid' | 'materiaal';
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  pricing_id: string | null;
  is_ai_calculated: boolean;
  calculation_breakdown: {
    formula: string;
    explanation: string;
    source: string;
  } | null;
}

interface Section {
  category: string;
  title: string;
  items: QuoteItem[];
  subtotal: number;
}

interface AnalysisResult {
  analysis: string;
  sections: Section[];
  totals: {
    subtotal: number;
    btw: number;
    total: number;
  };
  activities: Activity[];
  linked_tasks: LinkedTask[];
}

interface StepStatus {
  step: number;
  status: 'pending' | 'in_progress' | 'complete' | 'error';
  message?: string;
  error?: string;
  activities?: Activity[];
  tasks_added?: number;
  tasks?: LinkedTask[];
  items_count?: number;
}

interface AnalysisProgressProps {
  notes: string;
  onComplete: (result: AnalysisResult) => void;
  onCancel: () => void;
}

export default function AnalysisProgress({
  notes,
  onComplete,
  onCancel
}: AnalysisProgressProps) {
  const [steps, setSteps] = useState<StepStatus[]>([
    { step: 1, status: 'pending', message: 'Werkzaamheden detecteren' },
    { step: 2, status: 'pending', message: 'Gekoppelde taken bepalen' },
    { step: 3, status: 'pending', message: 'Materialen en prijzen berekenen' }
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const runAnalysis = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    setSteps([
      { step: 1, status: 'pending', message: 'Werkzaamheden detecteren' },
      { step: 2, status: 'pending', message: 'Gekoppelde taken bepalen' },
      { step: 3, status: 'pending', message: 'Materialen en prijzen berekenen' }
    ]);

    try {
      const response = await fetch('/api/admin/analyze-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });

      if (!response.ok) {
        throw new Error('Analyse mislukt');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Geen response stream');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              // Handle step updates
              if (data.step && data.status) {
                setSteps(prev => prev.map(s =>
                  s.step === data.step
                    ? {
                        ...s,
                        status: data.status,
                        message: data.message || s.message,
                        error: data.error,
                        activities: data.activities,
                        tasks_added: data.tasks_added,
                        tasks: data.tasks,
                        items_count: data.items_count
                      }
                    : s
                ));
              }

              // Handle completion
              if (data.complete) {
                setResult(data as AnalysisResult);
                onComplete(data as AnalysisResult);
              }

              // Handle errors
              if (data.error && !data.step) {
                setError(data.error);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analyse mislukt');
    } finally {
      setIsRunning(false);
    }
  }, [notes, onComplete]);

  // Start analysis on mount
  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  const getStepIcon = (status: StepStatus['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getProgressPercentage = () => {
    const completed = steps.filter(s => s.status === 'complete').length;
    const inProgress = steps.filter(s => s.status === 'in_progress').length;
    return ((completed + inProgress * 0.5) / steps.length) * 100;
  };

  return (
    <Card className="border-2 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-500" />
          <span className="text-orange-700">Offerte wordt opgesteld</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.step} className="flex items-start gap-3">
              {getStepIcon(step.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${
                    step.status === 'complete' ? 'text-green-700' :
                    step.status === 'in_progress' ? 'text-orange-700' :
                    step.status === 'error' ? 'text-red-700' :
                    'text-gray-500'
                  }`}>
                    Stap {step.step}: {step.message}
                  </span>
                </div>

                {/* Step details */}
                {step.status === 'complete' && step.activities && (
                  <p className="text-sm text-gray-600 mt-1">
                    → {step.activities.map(a => `${a.name} (${a.quantity}${a.unit})`).join(', ')}
                  </p>
                )}
                {step.status === 'complete' && step.tasks_added !== undefined && (
                  <p className="text-sm text-gray-600 mt-1">
                    → {step.tasks_added} taken toegevoegd op basis van arbeidsregels
                  </p>
                )}
                {step.status === 'complete' && step.items_count !== undefined && (
                  <p className="text-sm text-gray-600 mt-1">
                    → {step.items_count} items berekend met prijzen
                  </p>
                )}
                {step.status === 'error' && step.error && (
                  <p className="text-sm text-red-600 mt-1">
                    {step.error}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-700">Analyse niet volledig</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          {error ? (
            <>
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button
                onClick={runAnalysis}
                disabled={isRunning}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Opnieuw proberen
              </Button>
            </>
          ) : result ? (
            <Button
              onClick={() => onComplete(result)}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Bekijk offerte
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isRunning}
              className="w-full"
            >
              Annuleren
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
