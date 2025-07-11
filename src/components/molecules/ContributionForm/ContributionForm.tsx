/**
 * @fileoverview ContributionForm molecule component - Form for adding new toilet locations
 * @see {@link file://./docs/explanations/frontend-ui-spec.md} for component specifications
 */

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { cn } from '@/lib/utils';

const formSchemaObject = z.object({
  name: z.string()
    .min(1, { message: 'Toilet name is required' })
    .refine((val) => val.length >= 3, { message: 'Name must be at least 3 characters' }),
  lat: z.number(),
  lng: z.number(),
  hours: z.string().optional(),
  customHours: z.string().optional(),
  accessible: z.boolean(),
  fee: z.preprocess(
    (v) => (v === '' ? Number.NaN : v),
    z.number({
      invalid_type_error: 'Please enter a valid amount'
    })
    .min(0, 'Fee must be between £0 and £10')
    .max(10, 'Fee must be between £0 and £10')
    .optional()
  ),
  features: z.object({
    babyChange: z.boolean(),
    radar: z.boolean(),
    automatic: z.boolean(),
    contactless: z.boolean(),
  }),
});

const formSchema = formSchemaObject.refine((data) => {
  if (data.hours === 'custom') {
    return !!data.customHours && data.customHours.length > 0;
  }
  return true;
}, {
  message: 'Specify hours is required for custom selection',
  path: ['customHours'],
});

export type ContributionFormData = z.infer<typeof formSchema>;


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
  const { 
    register, 
    handleSubmit, 
    control, 
    watch,
    formState: { errors, isSubmitting },
    trigger
  } = useForm<ContributionFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: initialData?.name || '',
      lat: location.lat,
      lng: location.lng,
      hours: initialData?.hours || '',
      customHours: initialData?.customHours || '',
      accessible: initialData?.accessible || false,
      fee: initialData?.fee || 0,
      features: {
        babyChange: initialData?.features?.babyChange || false,
        radar: initialData?.features?.radar || false,
        automatic: initialData?.features?.automatic || false,
        contactless: initialData?.features?.contactless || false,
      },
    }
  });

  const watchHours = watch('hours');

  const handleFormSubmit = (data: ContributionFormData) => {
    if (onSubmit) {
      onSubmit(data);
      return;
    }

    // Handle API submission asynchronously
    (async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const endpoint = `${baseUrl}/api/v2/suggest`;
        
        const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          hours: data.hours === 'custom' ? data.customHours : data.hours,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit suggestion.');
      }

        onSuccess?.(result);
      } catch (error) {
        // You can use a state to show API errors in the UI
        console.error(error);
      }
    })();
  };

  const isLoading = loading || isSubmitting;

  return (
    <form
      role="form"
      aria-label="Toilet contribution form"
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn('space-y-4', className)}
      noValidate
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
          {...register('name')}
          placeholder="e.g., Victoria Station Public Toilet"
          disabled={isLoading}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className="min-h-[44px]"
        />
        {errors.name && (
          <p id="name-error" role="alert" className="text-sm text-red-600 mt-1">
            {errors.name.message}
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
              {...register('lat', { valueAsNumber: true })}
              readOnly
              disabled={isLoading}
              tabIndex={-1}
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
              {...register('lng', { valueAsNumber: true })}
              readOnly
              disabled={isLoading}
              tabIndex={-1}
              className="min-h-[44px] bg-gray-50"
            />
          </div>
        </div>
      </fieldset>

      {/* Opening hours */}
      <div>
        <label htmlFor="opening-hours" className="block text-sm font-medium mb-1">
          Opening Hours *
        </label>
        <select
          id="opening-hours"
          {...register('hours')}
          disabled={isLoading}
          className="block w-full min-h-[44px] border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          aria-invalid={!!errors.hours}
        >
          <option value="">Select hours...</option>
          <option value="24/7">24/7</option>
          <option value="dawn to dusk">Dawn to Dusk</option>
          <option value="custom">Custom</option>
        </select>
        {errors.hours && (
          <p role="alert" className="text-sm text-red-600 mt-1">
            {errors.hours.message}
          </p>
        )}
      </div>
      
      {watchHours === 'custom' && (
        <div>
          <label htmlFor="custom-hours" className="block text-sm font-medium mb-1">
            Specify hours
          </label>
          <Input
            id="custom-hours"
            type="text"
            {...register('customHours')}
            placeholder="e.g., Mon-Fri 09:00-17:00"
            disabled={isLoading}
            aria-invalid={!!errors.customHours}
            aria-describedby={errors.customHours ? 'custom-hours-error' : undefined}
            className="min-h-[44px]"
          />
          {errors.customHours && (
            <p id="custom-hours-error" role="alert" className="text-sm text-red-600 mt-1">
              {errors.customHours.message}
            </p>
          )}
        </div>
      )}

      {/* Fee field */}
      <div>
        <label htmlFor="usage-fee" className="block text-sm font-medium mb-1">
          Usage Fee (£)
        </label>
        <Input
          id="usage-fee"
          type="number"
          step="0.01"
          {...register('fee')}
          placeholder="e.g., 0.50"
          disabled={isLoading}
          aria-invalid={!!errors.fee}
          aria-describedby={errors.fee ? 'fee-error' : undefined}
          className="min-h-[44px]"
        />
        {errors.fee && (
          <p id="fee-error" role="alert" className="text-sm text-red-600 mt-1">
            {errors.fee.message}
          </p>
        )}
      </div>
      
      {/* Features */}
      <fieldset>
        <legend className="text-sm font-medium mb-2">Features</legend>
        <div className="space-y-2">
          <div className="flex items-center">
            <input id="accessible" type="checkbox" {...register('accessible')} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
            <label htmlFor="accessible" className="ml-2 block text-sm">Wheelchair Accessible</label>
          </div>
          <div className="flex items-center">
            <input id="baby-change" type="checkbox" {...register('features.babyChange')} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
            <label htmlFor="baby-change" className="ml-2 block text-sm">Baby Changing Facilities</label>
          </div>
          <div className="flex items-center">
            <input id="radar-key" type="checkbox" {...register('features.radar')} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
            <label htmlFor="radar-key" className="ml-2 block text-sm">Radar Key Required</label>
          </div>
          <div className="flex items-center">
            <input id="automatic" type="checkbox" {...register('features.automatic')} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
            <label htmlFor="automatic" className="ml-2 block text-sm">Automatic</label>
          </div>
          <div className="flex items-center">
            <input id="contactless" type="checkbox" {...register('features.contactless')} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
            <label htmlFor="contactless" className="ml-2 block text-sm">Contactless Payment</label>
          </div>
        </div>
      </fieldset>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} aria-busy={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </form>
  );
};