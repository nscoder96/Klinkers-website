'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileCheck, XCircle, RotateCcw } from 'lucide-react';

export interface ConditionsData {
  override_conditions_uitgangspunten: string | null;
  override_conditions_uitgesloten: string | null;
}

interface EditConditionsFormProps {
  data: ConditionsData;
  defaultUitgangspunten: string | null;
  defaultUitgesloten: string | null;
  onSave: (updatedData: ConditionsData) => Promise<void>;
  onClose: () => void;
}

export const EditConditionsForm = ({
  data,
  defaultUitgangspunten,
  defaultUitgesloten,
  onSave,
  onClose,
}: EditConditionsFormProps) => {
  const [formData, setFormData] = useState<ConditionsData>({
    override_conditions_uitgangspunten: data.override_conditions_uitgangspunten ?? defaultUitgangspunten,
    override_conditions_uitgesloten: data.override_conditions_uitgesloten ?? defaultUitgesloten,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetToDefault = (field: 'uitgangspunten' | 'uitgesloten') => {
    if (field === 'uitgangspunten') {
      setFormData(prev => ({
        ...prev,
        override_conditions_uitgangspunten: defaultUitgangspunten,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        override_conditions_uitgesloten: defaultUitgesloten,
      }));
    }
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="uitgangspunten"
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <FileCheck className="w-4 h-4 text-green-600" />
            Uitgangspunten
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetToDefault('uitgangspunten')}
            className="text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Standaard
          </Button>
        </div>
        <Textarea
          name="uitgangspunten"
          id="uitgangspunten"
          value={formData.override_conditions_uitgangspunten || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            override_conditions_uitgangspunten: e.target.value || null,
          }))}
          placeholder="Voer elke uitgangspunt in op een nieuwe regel..."
          rows={8}
          className="font-normal"
        />
        <p className="text-xs text-gray-500 mt-1">
          Elke regel wordt als apart punt weergegeven in de offerte.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="uitgesloten"
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <XCircle className="w-4 h-4 text-red-500" />
            Uitgesloten werkzaamheden
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetToDefault('uitgesloten')}
            className="text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Standaard
          </Button>
        </div>
        <Textarea
          name="uitgesloten"
          id="uitgesloten"
          value={formData.override_conditions_uitgesloten || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            override_conditions_uitgesloten: e.target.value || null,
          }))}
          placeholder="Voer elke uitgesloten werkzaamheid in op een nieuwe regel..."
          rows={6}
          className="font-normal"
        />
        <p className="text-xs text-gray-500 mt-1">
          Elke regel wordt als apart punt weergegeven in de offerte.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-700">
          <strong>Tip:</strong> Wijzigingen hier gelden alleen voor deze offerte.
          Ga naar Instellingen om de standaard condities aan te passen.
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

export default EditConditionsForm;
