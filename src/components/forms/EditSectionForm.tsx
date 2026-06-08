'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export interface SectionData {
  id?: string;
  title: string;
  description: string | null;
  display_order?: number;
}

interface EditSectionFormProps {
  section?: SectionData;
  onSave: (section: SectionData) => Promise<void>;
  onClose: () => void;
  isNew?: boolean;
}

export const EditSectionForm = ({
  section,
  onSave,
  onClose,
  isNew = false,
}: EditSectionFormProps) => {
  const [formData, setFormData] = useState<SectionData>(
    section || {
      title: '',
      description: null,
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Titel is verplicht');
      return;
    }

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
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Sectie titel *
        </label>
        <Input
          type="text"
          name="title"
          id="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="Bijv. Bestrating, Beplanting, Afscheiding"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Beschrijving (optioneel)
        </label>
        <Textarea
          name="description"
          id="description"
          value={formData.description || ''}
          onChange={handleChange}
          placeholder="Extra toelichting voor deze sectie..."
          rows={3}
        />
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

export default EditSectionForm;
