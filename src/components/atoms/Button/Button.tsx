/**
 * @fileoverview Button component - A versatile button with multiple variants and states
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-9 px-3 min-h-[44px]',
        md: 'h-11 px-4 py-2',
        lg: 'h-11 px-8',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

/**
 * Button component props
 * @extends React.ButtonHTMLAttributes<HTMLButtonElement>
 * @extends VariantProps<typeof buttonVariants>
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Whether to render as a child component using Radix UI Slot
   * @default false
   */
  asChild?: boolean;
  /**
   * Whether the button is in a loading state
   * @default false
   */
  loading?: boolean;
  /**
   * Text to display when in loading state
   * If not provided, children are hidden during loading
   */
  loadingText?: string;
}

const ButtonBase = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    disabled,
    children,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;
    
    // For asChild, we need to pass props to the child element
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          disabled={isDisabled}
          aria-busy={loading ? 'true' : undefined}
          {...props}
        >
          {children}
        </Slot>
      );
    }
    
    // Normal button rendering
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading ? 'true' : undefined}
        {...props}
      >
        {loading && (
          <span 
            data-testid="button-spinner"
            className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {loading && loadingText && loadingText}
        {loading && !loadingText && (
          <span hidden>{children}</span>
        )}
        {!loading && children}
      </button>
    );
  }
);

ButtonBase.displayName = 'Button';

/**
 * Button component with performance optimization
 * Memoized to prevent unnecessary re-renders
 */
const Button = React.memo(ButtonBase);

export { Button, buttonVariants };