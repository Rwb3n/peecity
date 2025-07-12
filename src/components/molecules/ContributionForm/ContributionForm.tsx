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
import { act } from 'react';
import { SuggestPayloadTransformer } from '@/services/SuggestPayloadTransformer';

const formSchemaObject = z.object({
  name: z.string()
    .trim()
    .refine(val => val.length > 0, { message: 'Toilet name is required' })
    .refine(val => val.length >= 3, { message: 'Name must be at least 3 characters' }),
  lat: z.number(),
  lng: z.number(),
  hours: z.string().optional(),
  customHours: z.string().optional(),
  accessible: z.boolean(),
  fee: z.coerce.number().min(0, 'Fee must be between £0 and £10').max(10, 'Fee must be between £0 and £10').optional().default(0),
  features: z.object({
    babyChange: z.boolean(),
    radar: z.boolean(),
    automatic: z.boolean(),
    contactless: z.boolean(),
  }),
});

// Extract features type from schema for type safety
type Features = z.infer<typeof formSchemaObject>['features'];

/**
 * Maps form feature selections to v1 API payload format
 * @param features - Feature selections from the form
 * @returns Object with v1 API field names and values
 * 
 * Current v1 API mappings:
 * - babyChange -> changing_table
 * - contactless -> payment_contactless
 * - radar and automatic are not supported in v1
 */
const mapFeaturesToApi = (features?: Features): Record<string, boolean> => {
  const mapped: Record<string, boolean> = {};
  
  if (!features) {
    return mapped;
  }
  
  // Map only v1 supported features
  if (features.babyChange) {
    mapped.changing_table = true;
  }
  
  if (features.contactless) {
    mapped.payment_contactless = true;
  }
  
  // Note: radar and automatic are intentionally not mapped (v1 limitation)
  
  return mapped;
};

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
  apiVersion?: 'v1' | 'v2';
}

export const ContributionForm: React.FC<ContributionFormProps> = ({
  location,
  onSubmit,
  onCancel,
  onSuccess,
  loading = false,
  initialData,
  className,
  apiVersion: apiVersionProp,
}) => {
  // Determine API version with precedence: prop > env var > default
  const getApiVersion = (): 'v1' | 'v2' => {
    // 1. Prop takes highest precedence
    if (apiVersionProp) {
      return apiVersionProp;
    }
    
    // 2. Environment variable takes second precedence
    const envVersion = process.env.NEXT_PUBLIC_SUGGEST_API_VERSION;
    if (envVersion === 'v2') {
      return 'v2';
    }
    
    // 3. Default to v1
    return 'v1';
  };
  
  const apiVersion = getApiVersion();
  const [apiError, setApiError] = React.useState<string | null>(null);
  
  const [manualErrors, setManualErrors] = React.useState<Record<string, { message: string }>>({});
  const [isSubmittingManually, setIsSubmittingManually] = React.useState(false);
  const [feeValue, setFeeValue] = React.useState<string>('');

  const { 
    register, 
    handleSubmit, 
    control, 
    watch,
    formState: { errors: rhfErrors, isSubmitting: rhfIsSubmitting },
    trigger,
    getValues
  } = useForm<ContributionFormData>({
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

  // Use manual errors when available, fallback to RHF errors
  const errors = Object.keys(manualErrors).length > 0 ? manualErrors : rhfErrors;
  const isSubmitting = isSubmittingManually || rhfIsSubmitting;
  

  const watchHours = watch('hours');

  // Handle fee input validation in real-time
  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFeeValue(value);
    
    // Clear previous fee errors
    setManualErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.fee;
      return newErrors;
    });
    
    // Validate fee immediately for non-empty values
    if (value.trim() !== '') {
      const num = parseFloat(value);
      // Check if the value is actually a valid number (not NaN) and the entire string is a valid number
      const isValidNumber = !isNaN(num) && /^\d*\.?\d*$/.test(value.trim());
      
      if (!isValidNumber) {
        setManualErrors(prev => ({
          ...prev,
          fee: { message: 'Please enter a valid amount' }
        }));
      } else if (num < 0 || num > 10) {
        setManualErrors(prev => ({
          ...prev,
          fee: { message: 'Fee must be between £0 and £10' }
        }));
      }
    }
  };

  const handleFormSubmit = async (data: ContributionFormData) => {
    setApiError(null); // Clear any previous API errors
    setManualErrors({}); // Clear any previous validation errors
    setIsSubmittingManually(true);
    
    try {
      // Use manual fee value instead of form value
      const formDataWithFee = {
        ...data,
        fee: feeValue ? parseFloat(feeValue) || 0 : 0
      };
      
      // Manual validation
      const validationResult = formSchema.safeParse(formDataWithFee);
      
      if (!validationResult.success) {
        const newErrors: Record<string, { message: string }> = {};
        
        // ZodError has an 'issues' property that contains the array of errors
        if (validationResult.error && validationResult.error.issues) {
          validationResult.error.issues.forEach(error => {
            if (error.path && error.path.length > 0) {
              const path = error.path[0] as string;
              // Only set the first error for each field to avoid overwriting priority errors
              if (!newErrors[path]) {
                newErrors[path] = { message: error.message };
              }
            }
          });
        }
        
        setManualErrors(newErrors);
        setIsSubmittingManually(false);
        return;
      }
      
      if (onSubmit) {
        onSubmit(validationResult.data);
        setIsSubmittingManually(false);
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const endpoint = apiVersion === 'v2' ? `${baseUrl}/api/v2/suggest` : `${baseUrl}/api/suggest`;
      
      // Log API version usage for monitoring
      console.log('[ContributionForm] Submitting suggestion', {
        apiVersion,
        endpoint,
        timestamp: new Date().toISOString(),
        hasName: !!validationResult.data.name,
        coordinates: { lat: validationResult.data.lat, lng: validationResult.data.lng }
      });
      
      // Create transformer instance
      const transformer = new SuggestPayloadTransformer();
      
      // Build form data with resolved hours
      const formDataForTransformer = {
        ...validationResult.data,
        hours: validationResult.data.hours === 'custom' ? validationResult.data.customHours : validationResult.data.hours,
        fee: parseFloat(feeValue) || 0,
      };
      
      // Use transformer based on API version
      const requestBody = apiVersion === 'v2' 
        ? transformer.transformToV2Payload(formDataForTransformer)
        : transformer.transformToV1Payload(formDataForTransformer);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        // Log API errors for monitoring
        console.error('[ContributionForm] API error', {
          apiVersion,
          endpoint,
          status: response.status,
          error: result.error,
          timestamp: new Date().toISOString()
        });
        throw new Error(result.error || 'Failed to submit suggestion.');
      }

      // Log successful submission
      console.log('[ContributionForm] Submission successful', {
        apiVersion,
        suggestionId: result.id || result.suggestionId,
        timestamp: new Date().toISOString()
      });

      onSuccess?.(result);
    } catch (error) {
      // Display API errors in the UI
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit suggestion.';
      setApiError(errorMessage);
      console.error(error);
    } finally {
      setIsSubmittingManually(false);
    }
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

      {/* Fee field */}
      <div>
        <label htmlFor="usage-fee" className="block text-sm font-medium mb-1">
          Usage Fee (£)
        </label>
        <Input
          id="usage-fee"
          type="text"
          inputMode="decimal"
          value={feeValue}
          onChange={handleFeeChange}
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

      {/* API Error Display */}
      {apiError && (
        <div role="alert" className="text-sm text-red-600 mt-2">
          {apiError}
        </div>
      )}

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