/**
 * @fileoverview SuggestionModal organism component - Modal interface for toilet suggestion submissions
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ContributionForm } from '@/components/molecules/ContributionForm';
import { cn } from '@/lib/utils';

export interface SuggestionModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should be closed */
  onClose: () => void;
  /** Callback when form submission is successful */
  onSuccess?: (response: any) => void;
  /** Callback when form submission fails */
  onError?: (error: any) => void;
  /** Specific location data for the toilet suggestion */
  location?: { lat: number; lng: number };
  /** Fallback map center location if no specific location provided */
  mapCenter?: { lat: number; lng: number };
  /** Additional CSS classes to apply */
  className?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/**
 * SuggestionModal - Modal interface for toilet suggestion submissions
 * 
 * Provides a modal wrapper around ContributionForm for toilet suggestions.
 * Handles location data flow, API submission, and modal behaviors with full accessibility.
 * 
 * @example
 * ```tsx
 * <SuggestionModal 
 *   isOpen={isModalOpen}
 *   onClose={handleCloseModal}
 *   onSuccess={handleSubmissionSuccess}
 *   onError={handleSubmissionError}
 *   location={currentLocation}
 * />
 * ```
 */
export const SuggestionModal: React.FC<SuggestionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  location,
  mapCenter,
  className,
  'data-testid': testId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Determine initial location data - prioritize specific location over map center
  const initialLocation = location || mapCenter;

  // Handle form submission
  const handleFormSubmit = useCallback(async (formData: any) => {
    setIsLoading(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/v2/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          status: response.status,
          data: errorData,
        };
      }

      const successData = await response.json();
      
      setSubmitSuccess(true);
      onSuccess?.(successData);
      
      // Close modal after successful submission
      setTimeout(() => {
        onClose();
        setSubmitSuccess(false);
      }, 1500);

    } catch (error: any) {
      console.error('Form submission error:', error);
      
      if (error.message?.includes('fetch')) {
        // Network error
        setSubmitError('Network error occurred. Please try again.');
        onError?.(error);
      } else {
        // API error
        setSubmitError('Error submitting suggestion. Please try again.');
        onError?.(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError, onClose]);

  // Handle form cancel
  const handleFormCancel = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [onClose, isLoading]);

  // Handle modal close - prevent closing during submission
  const handleModalClose = useCallback((open: boolean) => {
    if (!open && !isLoading) {
      onClose();
      // Reset states when closing
      setSubmitSuccess(false);
      setSubmitError(null);
    }
  }, [onClose, isLoading]);

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={handleModalClose}
      data-testid={testId}
    >
      <DialogContent 
        className={cn(
          'sm:max-w-md',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className
        )}
        aria-labelledby="suggestion-modal-title"
      >
        <DialogHeader>
          <DialogTitle id="suggestion-modal-title">
            Add New Toilet Location
          </DialogTitle>
          <DialogDescription>
            Help others find accessible facilities by adding a new toilet location.
          </DialogDescription>
        </DialogHeader>

        {/* Success State */}
        {submitSuccess && (
          <div className="text-center p-4">
            <div className="text-green-600 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-700 font-medium">
              Toilet suggestion successfully submitted!
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Thank you for contributing to our community.
            </p>
          </div>
        )}

        {/* Error State */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="text-red-600 mb-2">
              <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Error submitting suggestion
            </div>
            <p className="text-red-700 text-sm">{submitError}</p>
          </div>
        )}

        {/* Form Content */}
        {!submitSuccess && initialLocation && (
          <ContributionForm
            location={initialLocation}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            loading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

SuggestionModal.displayName = 'SuggestionModal';