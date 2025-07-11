/**
 * @fileoverview Badge component - A versatile badge for status indicators and notifications
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border text-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        success: 'bg-green-500 text-white',
        warning: 'bg-yellow-500 text-yellow-900',
      },
      size: {
        sm: 'h-5 px-2 text-xs',
        md: 'h-6 px-2.5 text-xs',
        lg: 'h-7 px-3 text-sm',
      },
      position: {
        topRight: 'absolute -top-2 -right-2',
        topLeft: 'absolute -top-2 -left-2',
        bottomRight: 'absolute -bottom-2 -right-2',
        bottomLeft: 'absolute -bottom-2 -left-2',
      },
      animate: {
        pulse: 'animate-pulse',
        bounce: 'animate-bounce',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

/**
 * Badge component props
 * @extends React.HTMLAttributes<HTMLSpanElement>
 * @extends VariantProps<typeof badgeVariants>
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Whether to render as a dot indicator
   * @default false
   */
  dot?: boolean;
  /**
   * Numeric count to display
   * Displays "99+" for counts over 99
   */
  count?: number;
  /**
   * Whether to show badge when count is 0
   * @default false
   */
  showZero?: boolean;
}

const BadgeBase = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    position,
    animate,
    dot,
    count,
    showZero = false,
    children,
    ...props 
  }, ref) => {
    // Handle count display
    let content = children;
    if (count !== undefined) {
      if (count === 0 && !showZero) {
        return null;
      }
      content = count > 99 ? '99+' : count.toString();
    }
    
    // Handle dot indicator
    if (dot) {
      return (
        <span
          ref={ref}
          data-testid="badge-dot"
          className={cn(
            'h-2 w-2 p-0 rounded-full',
            badgeVariants({ variant, position, animate }),
            className
          )}
          {...props}
        />
      );
    }
    
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, position, animate }), className)}
        {...props}
      >
        {content}
      </span>
    );
  }
);

BadgeBase.displayName = 'Badge';

/**
 * Badge component with performance optimization
 * Memoized to prevent unnecessary re-renders
 */
const Badge = React.memo(BadgeBase);

export { Badge, badgeVariants };