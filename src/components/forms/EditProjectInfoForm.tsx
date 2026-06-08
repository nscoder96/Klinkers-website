'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export interface ProjectInfo {
  project_description: string | null;
  project_address: string | null;
  valid_until: string | null;
  customer_notes: string | null;
}

interface EditProjectInfoFormProps {
  projectInfo: ProjectInfo;
  onSave: (updatedInfo: ProjectInfo) => Promise<void>;
  onClose: () => void;
}

export const EditProjectInfoForm = ({
  projectInfo,
  onSave,
  onClose,
}: EditProjectInfoFormProps) => {
  const [formData, setFormData] = useState<ProjectInfo>(projectInfo);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          htmlFor="project_description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Projectomschrijving
        </label>
        <Textarea
          name="project_description"
          id="project_description"
          value={formData.project_description || ''}
          onChange={handleChange}
          placeholder="Beschrijf het project..."
          rows={4}
        />
      </div>

      <div>
        <label
          htmlFor="project_address"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Projectadres
        </label>
        <Input
          type="text"
          name="project_address"
          id="project_address"
          value={formData.project_address || ''}
          onChange={handleChange}
          placeholder="Adres van het project"
        />
      </div>

      <div>
        <label
          htmlFor="valid_until"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Geldig tot
        </label>
        <Input
          type="date"
          name="valid_until"
          id="valid_until"
          value={formData.valid_until ? formData.valid_until.split('T')[0] : ''}
          onChange={handleChange}
        />
      </div>

      <div>
        <label
          htmlFor="customer_notes"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Opmerkingen
        </label>
        <Textarea
          name="customer_notes"
          id="customer_notes"
          value={formData.customer_notes || ''}
          onChange={handleChange}
          placeholder="Extra opmerkingen voor de klant..."
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
          ) : (
            'Opslaan'
          )}
        </Button>
      </div>
    </form>
  );
};

export default EditProjectInfoForm;
