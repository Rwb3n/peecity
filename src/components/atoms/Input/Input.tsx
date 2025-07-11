/**
 * @fileoverview Input component - A mobile-optimized input with various types and states
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]',
  {
    variants: {
      size: {
        sm: 'h-9 min-h-[44px]',
        md: 'h-11',
        lg: 'h-12',
      },
      error: {
        true: 'border-destructive focus-visible:ring-destructive',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

/**
 * Input component props
 * @extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>
 * @extends VariantProps<typeof inputVariants>
 */
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /**
   * Whether the input has an error state
   * @default false
   */
  error?: boolean;
  /**
   * Error message to display below the input
   * Automatically sets aria-invalid and aria-describedby
   */
  errorMessage?: string;
}

const InputBase = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', size, error, errorMessage, ...props }, ref) => {
    const inputId = props.id || props.name;
    const errorId = errorMessage && inputId ? `${inputId}-error` : undefined;
    
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            inputVariants({ size, error }),
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId || props['aria-describedby']}
          {...props}
        />
        {errorMessage && (
          <p id={errorId} className="text-destructive text-sm mt-1">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

InputBase.displayName = 'Input';

/**
 * Input component with performance optimization
 * Memoized to prevent unnecessary re-renders
 */
const Input = React.memo(InputBase);

export { Input, inputVariants };