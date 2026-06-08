'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calculator } from 'lucide-react';

export interface LineItemData {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total?: number;
}

interface EditLineItemFormProps {
  lineItem?: LineItemData;
  onSave: (item: LineItemData) => Promise<void>;
  onClose: () => void;
  isNew?: boolean;
}

const COMMON_UNITS = ['m²', 'm¹', 'stuk', 'uur', 'm³', 'kg', 'ton'];

export const EditLineItemForm = ({
  lineItem,
  onSave,
  onClose,
  isNew = false,
}: EditLineItemFormProps) => {
  const [formData, setFormData] = useState<LineItemData>(
    lineItem || {
      description: '',
      quantity: 1,
      unit: 'm²',
      unit_price: 0,
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatedTotal = formData.quantity * formData.unit_price;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.description.trim()) {
      setError('Omschrijving is verplicht');
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        ...formData,
        total: calculatedTotal,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Omschrijving *
        </label>
        <Textarea
          name="description"
          id="description"
          value={formData.description}
          onChange={handleChange}
          required
          placeholder="Bijv. Bestrating leggen keramische tegels"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Aantal *
          </label>
          <Input
            type="number"
            name="quantity"
            id="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label
            htmlFor="unit"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Eenheid
          </label>
          <select
            name="unit"
            id="unit"
            value={formData.unit}
            onChange={handleChange}
            className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            {COMMON_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="unit_price"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Prijs per eenheid *
          </label>
          <Input
            type="number"
            name="unit_price"
            id="unit_price"
            value={formData.unit_price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {/* Calculated Total */}
      <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <Calculator className="w-4 h-4" />
          <span className="text-sm">Berekend totaal:</span>
        </div>
        <span className="text-lg font-bold text-orange-600">
          {formatCurrency(calculatedTotal)}
        </span>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
          Annuleren
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Opslaan...
            </>
          ) : isNew ? (
            'Toevoegen'
          ) : (
            'Opslaan'
          )}
        </Button>
      </div>
    </form>
  );
};

export default EditLineItemForm;
