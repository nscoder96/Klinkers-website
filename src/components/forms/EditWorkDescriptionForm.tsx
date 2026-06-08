'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Image, X } from 'lucide-react';

export interface WorkDescriptionData {
  work_description: string | null;
  work_description_image_url: string | null;
}

interface EditWorkDescriptionFormProps {
  data: WorkDescriptionData;
  projectDescription: string | null;
  sections: { title: string; line_items: { description: string }[] }[];
  onSave: (updatedData: WorkDescriptionData) => Promise<void>;
  onClose: () => void;
}

export const EditWorkDescriptionForm = ({
  data,
  projectDescription,
  sections,
  onSave,
  onClose,
}: EditWorkDescriptionFormProps) => {
  const [formData, setFormData] = useState<WorkDescriptionData>(data);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateWithAI = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Build context from project description and sections
      const sectionsSummary = sections.map(s => {
        const items = s.line_items.map(i => i.description).join(', ');
        return `${s.title}: ${items}`;
      }).join('\n');

      const response = await fetch('/api/admin/ai/generate-work-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectDescription: projectDescription || '',
          sections: sectionsSummary,
        }),
      });

      if (!response.ok) {
        throw new Error('AI generatie mislukt');
      }

      const result = await response.json();
      setFormData(prev => ({
        ...prev,
        work_description: result.description,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis met de AI generatie');
    } finally {
      setIsGenerating(false);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="work_description"
            className="block text-sm font-medium text-gray-700"
          >
            Werkomschrijving
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateWithAI}
            disabled={isGenerating}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Genereren...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Genereer met AI
              </>
            )}
          </Button>
        </div>
        <Textarea
          name="work_description"
          id="work_description"
          value={formData.work_description || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, work_description: e.target.value || null }))}
          placeholder="Beschrijf de werkzaamheden in detail..."
          rows={10}
          className="font-normal"
        />
        <p className="text-xs text-gray-500 mt-1">
          Een gedetailleerde beschrijving van de uit te voeren werkzaamheden.
          Gebruik de AI knop om automatisch een beschrijving te genereren op basis van de offerte.
        </p>
      </div>

      <div>
        <label
          htmlFor="work_description_image_url"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-gray-500" />
            Afbeelding URL (optioneel)
          </div>
        </label>
        <div className="flex gap-2">
          <Input
            type="url"
            name="work_description_image_url"
            id="work_description_image_url"
            value={formData.work_description_image_url || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, work_description_image_url: e.target.value || null }))}
            placeholder="https://..."
            className="flex-1"
          />
          {formData.work_description_image_url && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setFormData(prev => ({ ...prev, work_description_image_url: null }))}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        {formData.work_description_image_url && (
          <div className="mt-3 border rounded-lg overflow-hidden">
            <img
              src={formData.work_description_image_url}
              alt="Preview"
              className="max-h-40 object-cover w-full"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving || isGenerating}>
          Annuleren
        </Button>
        <Button
          type="submit"
          disabled={isSaving || isGenerating}
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

export default EditWorkDescriptionForm;
