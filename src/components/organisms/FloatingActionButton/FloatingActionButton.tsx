/**
 * @fileoverview FloatingActionButton organism component - Material design FAB for primary actions
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { cn } from '@/lib/utils';

export interface FloatingActionButtonProps {
  /** Click handler for the FAB button */
  onClick: () => void;
  /** Optional callback when modal should be opened */
  onModalOpen?: () => void;
  /** Whether the suggestion modal is currently open (hides FAB when true) */
  isModalOpen?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Additional CSS classes to apply */
  className?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/**
 * FloatingActionButton (FAB) - Material design floating action button for primary actions
 * 
 * Provides a prominent, accessible button for the primary action (adding toilet suggestions).
 * Features fixed bottom-right positioning, material design styling, and full accessibility support.
 * 
 * @example
 * ```tsx
 * <FloatingActionButton 
 *   onClick={handleAddToilet}
 *   onModalOpen={handleModalOpen}
 *   isModalOpen={isModalOpen}
 * />
 * ```
 */
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  onModalOpen,
  isModalOpen = false,
  disabled = false,
  className,
  'data-testid': testId,
}) => {
  // Handle click - call both onClick and onModalOpen if provided
  const handleClick = () => {
    if (!disabled) {
      onClick();
      onModalOpen?.();
    }
  };

  // Hide FAB when modal is open to prevent conflicts
  if (isModalOpen) {
    return null;
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label="Add new toilet location"
      data-testid={testId}
      className={cn(
        // Fixed positioning - bottom-right with responsive spacing
        'fixed bottom-4 right-4 sm:bottom-6 sm:right-6',
        
        // Z-index for overlay positioning
        'z-50',
        
        // Size - meets 44px touch target minimum (48px = h-12 w-12, 56px = sm:h-14 sm:w-14)
        'h-12 w-12 sm:h-14 sm:w-14',
        
        // Circular appearance
        'rounded-full',
        
        // Padding for icon centering
        'p-3',
        
        // Flexbox for icon centering
        'flex items-center justify-center',
        
        // Material design colors
        'bg-blue-600 hover:bg-blue-700 text-white',
        
        // Elevation and shadows
        'shadow-lg hover:shadow-lg',
        
        // Animations and transitions
        'transition-all duration-200',
        'hover:scale-110 focus:scale-105 active:scale-95',
        
        // Disabled state
        'disabled:hover:scale-100',
        disabled && 'opacity-50',
        disabled && 'cursor-not-allowed',
        
        // Focus states
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        
        className
      )}
    >
      <Plus 
        className="h-6 w-6" 
        aria-hidden="true"
      />
      
      {/* Screen reader text */}
      <span className="sr-only">Add new toilet</span>
    </Button>
  );
};

FloatingActionButton.displayName = 'FloatingActionButton';