'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HelpCircle, Plus, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

interface OptionalQuestion {
  question: string;
  impacts: string;
  default: string;
  additionalItems?: Array<{
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
  }>;
  requiresInput?: boolean;
  inputLabel?: string;
  inputUnit?: string;
}

interface OptionalQuestionsProps {
  questions: OptionalQuestion[];
  onAnswer: (questionIndex: number, answer: 'ja' | 'nee', inputValue?: number) => void;
  answers: Record<number, { answer: 'ja' | 'nee'; inputValue?: number }>;
}

export default function OptionalQuestions({ questions, onAnswer, answers }: OptionalQuestionsProps) {
  const [expanded, setExpanded] = useState(true);
  const [inputValues, setInputValues] = useState<Record<number, string>>({});

  if (questions.length === 0) return null;

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader
        className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-amber-800 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Optionele werkzaamheden
            <span className="text-sm font-normal text-amber-600">
              ({answeredCount}/{questions.length} beantwoord)
            </span>
          </CardTitle>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-amber-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-amber-600" />
          )}
        </div>
        {allAnswered && (
          <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
            <Check className="w-4 h-4" />
            Alle vragen beantwoord
          </p>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="p-0 divide-y divide-amber-100">
          {questions.map((q, index) => {
            const answer = answers[index];
            const inputValue = inputValues[index] || '';

            return (
              <div
                key={index}
                className={`p-4 transition-colors ${
                  answer ? 'bg-white' : 'bg-amber-50/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{q.question}</p>
                    <p className="text-sm text-slate-500 mt-1">{q.impacts}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {q.requiresInput && answer?.answer === 'ja' && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={inputValue}
                          onChange={(e) => {
                            setInputValues({ ...inputValues, [index]: e.target.value });
                          }}
                          onBlur={() => {
                            if (inputValue) {
                              onAnswer(index, 'ja', parseFloat(inputValue));
                            }
                          }}
                          placeholder={q.inputLabel || 'Waarde'}
                          className="w-24 h-9"
                        />
                        <span className="text-sm text-slate-500">{q.inputUnit || ''}</span>
                      </div>
                    )}

                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={answer?.answer === 'ja' ? 'default' : 'outline'}
                        onClick={() => {
                          if (q.requiresInput) {
                            onAnswer(index, 'ja');
                          } else {
                            onAnswer(index, 'ja');
                          }
                        }}
                        className={`min-w-[60px] ${
                          answer?.answer === 'ja'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'hover:bg-green-50 hover:text-green-700 hover:border-green-300'
                        }`}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Ja
                      </Button>
                      <Button
                        size="sm"
                        variant={answer?.answer === 'nee' ? 'default' : 'outline'}
                        onClick={() => onAnswer(index, 'nee')}
                        className={`min-w-[60px] ${
                          answer?.answer === 'nee'
                            ? 'bg-slate-600 hover:bg-slate-700'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Nee
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Show what will be added if answered yes */}
                {answer?.answer === 'ja' && q.additionalItems && q.additionalItems.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800 mb-2 flex items-center gap-1">
                      <Plus className="w-4 h-4" />
                      Toegevoegd aan offerte:
                    </p>
                    <ul className="space-y-1">
                      {q.additionalItems.map((item, i) => (
                        <li key={i} className="text-sm text-green-700 flex justify-between">
                          <span>{item.description}</span>
                          <span className="font-medium">
                            {item.quantity} {item.unit} × €{item.unit_price} = €{(item.quantity * item.unit_price).toFixed(0)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}

// Sub-items display for workbon preview
export function SubItemsDisplay({ subItems }: {
  subItems: Array<{
    description: string;
    quantity: number;
    unit: string;
    reasoning?: string;
  }>;
}) {
  if (!subItems || subItems.length === 0) return null;

  return (
    <div className="mt-2 ml-4 p-2 bg-slate-50 rounded border-l-2 border-slate-300">
      <p className="text-xs font-medium text-slate-500 mb-1">Werkbon details:</p>
      <ul className="space-y-0.5">
        {subItems.map((item, i) => (
          <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
            <span className="w-4 h-4 rounded border border-slate-300 flex-shrink-0" />
            <span>{item.description}</span>
            <span className="text-slate-400">
              ({item.quantity} {item.unit})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
