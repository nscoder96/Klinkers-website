'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export interface QuoteTexts {
  customer_notes: string | null;
  internal_notes?: string | null;
}

interface EditQuoteTextsFormProps {
  texts: QuoteTexts;
  onSave: (updatedTexts: QuoteTexts) => Promise<void>;
  onClose: () => void;
}

export const EditQuoteTextsForm = ({
  texts,
  onSave,
  onClose,
}: EditQuoteTextsFormProps) => {
  const [formData, setFormData] = useState<QuoteTexts>(texts);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      await onSave(formData);
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

      <div>
        <label
          htmlFor="customer_notes"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Opmerkingen voor klant
        </label>
        <Textarea
          name="customer_notes"
          id="customer_notes"
          value={formData.customer_notes || ''}
          onChange={handleChange}
          placeholder="Opmerkingen die zichtbaar zijn voor de klant..."
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-1">
          Deze tekst verschijnt onderaan de offerte voor de klant
        </p>
      </div>

      <div>
        <label
          htmlFor="internal_notes"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Interne notities
        </label>
        <Textarea
          name="internal_notes"
          id="internal_notes"
          value={formData.internal_notes || ''}
          onChange={handleChange}
          placeholder="Interne notities (niet zichtbaar voor klant)..."
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          Alleen zichtbaar voor jou, niet op de offerte
        </p>
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
          ) : (
            'Opslaan'
          )}
        </Button>
      </div>
    </form>
  );
};

export default EditQuoteTextsForm;
