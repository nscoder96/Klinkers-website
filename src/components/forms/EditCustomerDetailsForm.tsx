'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export interface CustomerData {
  id?: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string;
}

interface EditCustomerDetailsFormProps {
  customer: CustomerData;
  onSave: (updatedCustomer: CustomerData) => Promise<void>;
  onClose: () => void;
}

export const EditCustomerDetailsForm = ({
  customer,
  onSave,
  onClose,
}: EditCustomerDetailsFormProps) => {
  const [formData, setFormData] = useState<CustomerData>(customer);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Naam *
        </label>
        <Input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Volledige naam"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <Input
          type="email"
          name="email"
          id="email"
          value={formData.email || ''}
          onChange={handleChange}
          placeholder="email@voorbeeld.nl"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Telefoon
        </label>
        <Input
          type="tel"
          name="phone"
          id="phone"
          value={formData.phone || ''}
          onChange={handleChange}
          placeholder="06-12345678"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Adres
        </label>
        <Input
          type="text"
          name="address"
          id="address"
          value={formData.address || ''}
          onChange={handleChange}
          placeholder="Straatnaam 123"
        />
      </div>

      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
          Stad *
        </label>
        <Input
          type="text"
          name="city"
          id="city"
          value={formData.city}
          onChange={handleChange}
          required
          placeholder="Plaatsnaam"
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

export default EditCustomerDetailsForm;
