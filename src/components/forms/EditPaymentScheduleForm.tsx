'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, AlertCircle, RotateCcw } from 'lucide-react';
import { computeScheduleAmounts } from '@/lib/payment-schedule';

export interface PaymentScheduleItem {
  termijn: number;
  omschrijving: string;
  percentage: number;
}

export interface PaymentScheduleData {
  override_payment_schedule: PaymentScheduleItem[] | null;
}

interface EditPaymentScheduleFormProps {
  data: PaymentScheduleData;
  defaultSchedule: PaymentScheduleItem[];
  quoteTotal: number;
  onSave: (updatedData: PaymentScheduleData) => Promise<void>;
  onClose: () => void;
}

export const EditPaymentScheduleForm = ({
  data,
  defaultSchedule,
  quoteTotal,
  onSave,
  onClose,
}: EditPaymentScheduleFormProps) => {
  const [schedule, setSchedule] = useState<PaymentScheduleItem[]>(
    data.override_payment_schedule ?? defaultSchedule ?? []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPercentage = schedule.reduce((sum, item) => sum + item.percentage, 0);
  const isValid = totalPercentage === 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const addRow = () => {
    const newTermijn = schedule.length > 0
      ? Math.max(...schedule.map(s => s.termijn)) + 1
      : 1;
    setSchedule([
      ...schedule,
      { termijn: newTermijn, omschrijving: '', percentage: 0 },
    ]);
  };

  const removeRow = (index: number) => {
    const newSchedule = schedule.filter((_, i) => i !== index);
    // Renumber termijnen
    setSchedule(newSchedule.map((item, i) => ({ ...item, termijn: i + 1 })));
  };

  const updateRow = (index: number, field: keyof PaymentScheduleItem, value: string | number) => {
    setSchedule(schedule.map((item, i) => {
      if (i !== index) return item;
      return { ...item, [field]: value };
    }));
  };

  const resetToDefault = () => {
    setSchedule(defaultSchedule ?? []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setError('Het totaal percentage moet precies 100% zijn.');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await onSave({
        override_payment_schedule: schedule,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Betalingstermijnen</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetToDefault}
          className="text-gray-500 hover:text-gray-700"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Standaard
        </Button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 pb-2 border-b">
        <div className="col-span-1">#</div>
        <div className="col-span-5">Omschrijving</div>
        <div className="col-span-2 text-right">%</div>
        <div className="col-span-3 text-right">Bedrag</div>
        <div className="col-span-1"></div>
      </div>

      {/* Table rows */}
      <div className="space-y-2">
        {(() => {
        const scheduleAmounts = computeScheduleAmounts(quoteTotal, schedule.map((item) => item.percentage));
        return schedule.map((item, index) => {
          const amount = scheduleAmounts[index];
          return (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-1">
                <span className="text-sm text-gray-500">{item.termijn}</span>
              </div>
              <div className="col-span-5">
                <Input
                  type="text"
                  value={item.omschrijving}
                  onChange={(e) => updateRow(index, 'omschrijving', e.target.value)}
                  placeholder="Bijv. Bij opdracht"
                  className="text-sm"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={item.percentage}
                  onChange={(e) => updateRow(index, 'percentage', parseInt(e.target.value) || 0)}
                  className="text-sm text-right"
                />
              </div>
              <div className="col-span-3 text-right">
                <span className="text-sm font-medium text-gray-700">
                  {formatCurrency(amount)}
                </span>
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(index)}
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  disabled={schedule.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        });
        })()}
      </div>

      {/* Add row button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        className="w-full border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Termijn toevoegen
      </Button>

      {/* Totals */}
      <div className="grid grid-cols-12 gap-2 items-center pt-3 border-t font-medium">
        <div className="col-span-6 text-gray-700">Totaal</div>
        <div className={`col-span-2 text-right ${isValid ? 'text-green-600' : 'text-red-600'}`}>
          {totalPercentage}%
        </div>
        <div className="col-span-3 text-right text-orange-600">
          {formatCurrency(quoteTotal)}
        </div>
        <div className="col-span-1"></div>
      </div>

      {/* Validation warning */}
      {!isValid && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Het totaal percentage moet precies 100% zijn (nu: {totalPercentage}%)</span>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-700">
          <strong>Tip:</strong> De bedragen worden automatisch berekend op basis van het offerte totaal ({formatCurrency(quoteTotal)}).
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
          Annuleren
        </Button>
        <Button
          type="submit"
          disabled={isSaving || !isValid}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Opslaan...
            </>
          ) : (
            'Opslaan'
          )}
        </Button>
      </div>
    </form>
  );
};

export default EditPaymentScheduleForm;
