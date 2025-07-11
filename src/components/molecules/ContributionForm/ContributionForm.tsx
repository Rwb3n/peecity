/**
 * @fileoverview ContributionForm molecule component - Form for adding new toilet locations
 * @see {@link file://./docs/explanations/frontend-ui-spec.md} for component specifications
 */

import React, { useState } from 'react';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { cn } from '@/lib/utils';

export interface ContributionFormData {
  name: string;
  lat: number;
  lng: number;
  hours: string;
  accessible: boolean;
  fee: number;
  features: {
    babyChange: boolean;
    radar: boolean;
    automatic: boolean;
    contactless: boolean;
  };
}

export interface ContributionFormProps {
  location: {
    lat: number;
    lng: number;
  };
  onSubmit?: (data: ContributionFormData) => void;
  onCancel?: () => void;
  onSuccess?: (response: any) => void;
  loading?: boolean;
  initialData?: Partial<ContributionFormData>;
  className?: string;
}

export const ContributionForm: React.FC<ContributionFormProps> = ({
  location,
  onSubmit,
  onCancel,
  onSuccess,
  loading = false,
  initialData,
  className,
}) => {
  const [formData, setFormData] = useState<ContributionFormData>({
    name: initialData?.name || '',
    lat: location.lat,
    lng: location.lng,
    hours: initialData?.hours || '',
    accessible: initialData?.accessible || false,
    fee: initialData?.fee || 0,
    features: {
      babyChange: initialData?.features?.babyChange || false,
      radar: initialData?.features?.radar || false,
      automatic: initialData?.features?.automatic || false,
      contactless: initialData?.features?.contactless || false,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customHours, setCustomHours] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Toilet name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (formData.fee < 0 || formData.fee > 10) {
      newErrors.fee = 'Fee must be between £0 and £10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    if (onSubmit) {
      onSubmit(formData);
      return;
    }

    // If no onSubmit handler, make API call
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          lat: formData.lat,
          lng: formData.lng,
          hours: formData.hours,
          accessible: formData.accessible,
          fee: formData.fee,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      onSuccess?.(data);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ContributionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleFeatureChange = (feature: keyof ContributionFormData['features']) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature],
      },
    }));
  };

  const handleHoursChange = (value: string) => {
    if (value === 'custom') {
      handleInputChange('hours', customHours);
    } else {
      handleInputChange('hours', value);
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <form
      role="form"
      aria-label="Toilet contribution form"
      onSubmit={handleSubmit}
      className={cn('space-y-4', className)}
    >
      <div>
        <h2 className="text-xl font-semibold">Add a Toilet</h2>
        <p className="text-sm text-gray-600 mt-1">
          Help others by adding a public toilet
        </p>
      </div>

      {/* Name field */}
      <div>
        <label htmlFor="toilet-name" className="block text-sm font-medium mb-1">
          Toilet Name *
        </label>
        <Input
          id="toilet-name"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="e.g., Victoria Station Public Toilet"
          disabled={isLoading}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className="min-h-[44px]"
        />
        {errors.name && (
          <p id="name-error" role="alert" className="text-sm text-red-600 mt-1">
            {errors.name}
          </p>
        )}
      </div>

      {/* Location fields */}
      <fieldset>
        <legend className="text-sm font-medium mb-2">Location</legend>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="latitude" className="block text-sm mb-1">
              Latitude
            </label>
            <Input
              id="latitude"
              type="number"
              value={formData.lat}
              readOnly
              disabled={isLoading}
              className="min-h-[44px] bg-gray-50"
            />
          </div>
          <div>
            <label htmlFor="longitude" className="block text-sm mb-1">
              Longitude
            </label>
            <Input
              id="longitude"
              type="number"
              value={formData.lng}
              readOnly
              disabled={isLoading}
              className="min-h-[44px] bg-gray-50"
            />
          </div>
        </div>
      </fieldset>

      {/* Opening hours */}
      <div>
        <label htmlFor="opening-hours" className="block text-sm font-medium mb-1">
          Opening Hours
        </label>
        <select
          id="opening-hours"
          value={formData.hours === '24/7' || formData.hours === 'Dawn to dusk' ? formData.hours : 'custom'}
          onChange={(e) => handleHoursChange(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[44px]"
        >
          <option value="">Select hours</option>
          <option value="24/7">24/7</option>
          <option value="Dawn to dusk">Dawn to dusk</option>
          <option value="custom">Custom</option>
        </select>
        {(formData.hours !== '24/7' && formData.hours !== 'Dawn to dusk' && formData.hours !== '') && (
          <Input
            type="text"
            value={formData.hours}
            onChange={(e) => {
              handleInputChange('hours', e.target.value);
              setCustomHours(e.target.value);
            }}
            placeholder="e.g., Mon-Fri: 8am-6pm"
            disabled={isLoading}
            aria-label="Specify hours"
            className="mt-2 min-h-[44px]"
          />
        )}
      </div>

      {/* Fee */}
      <div>
        <label htmlFor="usage-fee" className="block text-sm font-medium mb-1">
          Usage Fee (£)
        </label>
        <Input
          id="usage-fee"
          type="number"
          step="0.01"
          min="0"
          max="10"
          value={formData.fee}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
              handleInputChange('fee', value);
            }
          }}
          onInvalid={() => setErrors({ ...errors, fee: 'Please enter a valid amount' })}
          disabled={isLoading}
          aria-invalid={!!errors.fee}
          aria-describedby={errors.fee ? 'fee-error' : undefined}
          className="min-h-[44px]"
        />
        {errors.fee && (
          <p id="fee-error" role="alert" className="text-sm text-red-600 mt-1">
            {errors.fee}
          </p>
        )}
      </div>

      {/* Features */}
      <fieldset role="group" aria-label="Features">
        <legend className="text-sm font-medium mb-2">Features</legend>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.accessible}
              onChange={() => handleInputChange('accessible', !formData.accessible)}
              disabled={isLoading}
              className="mr-2"
            />
            <span className="text-sm">Wheelchair accessible</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.features.babyChange}
              onChange={() => handleFeatureChange('babyChange')}
              disabled={isLoading}
              className="mr-2"
            />
            <span className="text-sm">Baby changing facilities</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.features.radar}
              onChange={() => handleFeatureChange('radar')}
              disabled={isLoading}
              className="mr-2"
            />
            <span className="text-sm">RADAR key required</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.features.automatic}
              onChange={() => handleFeatureChange('automatic')}
              disabled={isLoading}
              className="mr-2"
            />
            <span className="text-sm">Automatic</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.features.contactless}
              onChange={() => handleFeatureChange('contactless')}
              disabled={isLoading}
              className="mr-2"
            />
            <span className="text-sm">Contactless payment</span>
          </label>
        </div>
      </fieldset>

      {/* API Error */}
      {apiError && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm text-red-800">{apiError}</p>
        </div>
      )}

      {/* Form actions */}
      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="flex-1 min-h-[44px]"
        >
          {isLoading ? 'Submitting...' : 'Submit'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 min-h-[44px]"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};