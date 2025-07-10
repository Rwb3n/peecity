/**
 * Shared Component Variants Utilities
 * 
 * Common variant patterns and utilities extracted from atomic components
 * for DRY principles and consistent design system implementation.
 * 
 * @doc refs docs/frontend-ui-spec.md
 * @artifact-annotation
 * canonical-docs: docs/cookbook/recipe_atomic_components.md
 * epic: frontend_ui
 * plan: plan_fix_variants_0024.txt
 * task: refactor_cleanup
 * tdd-phase: REFACTOR
 * issue-fixed: 0024
 */

import { cva } from 'class-variance-authority'

/**
 * Common size variants used across atomic components
 * Ensures consistent sizing with mobile-first ergonomics
 */
export const commonSizeVariants = {
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
} as const

/**
 * Mobile touch target utilities
 * Ensures WCAG 2.1 AA compliance with minimum 44px touch targets
 */
export const touchTargetVariants = {
  sm: 'min-h-[44px] min-w-[44px]',
  md: 'min-h-[44px] min-w-[44px]',
  lg: 'min-h-[44px] min-w-[44px]',
} as const

/**
 * Focus ring utilities for accessibility
 * Consistent focus indicators across all interactive components
 */
export const focusRingVariants = {
  default: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  button: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  input: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
} as const

/**
 * Common disabled state utilities
 * Consistent disabled styling across interactive components
 */
export const disabledVariants = {
  default: 'disabled:pointer-events-none disabled:opacity-50',
  button: 'disabled:pointer-events-none disabled:opacity-50',
  input: 'disabled:cursor-not-allowed disabled:opacity-50',
} as const

/**
 * Transition utilities for smooth interactions
 * Performance-optimized transitions for common properties
 */
export const transitionVariants = {
  colors: 'transition-colors',
  all: 'transition-all',
  opacity: 'transition-opacity',
} as const

/**
 * Common color scheme variants
 * Consistent color patterns using shadcn/ui design tokens
 * 
 * Variants include semantic colors for different states:
 * - primary/secondary: Brand colors
 * - destructive: Error/danger states
 * - success: Positive feedback
 * - warning: Caution/attention states
 * - outline/ghost: Alternative styles
 */
export const colorSchemeVariants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  success: 'bg-success text-success-foreground hover:bg-success/90',
  warning: 'bg-warning text-warning-foreground hover:bg-warning/90',
  outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
  ghost: 'bg-transparent hover:bg-accent hover:text-accent-foreground',
} as const

/**
 * Utility function to create consistent variant configurations
 * Reduces boilerplate in component variant definitions
 */
export function createStandardVariants<T extends Record<string, any>>(
  baseClasses: string,
  customVariants: T
) {
  return cva(baseClasses, {
    variants: customVariants,
  })
}

/**
 * Utility function to merge touch targets with size variants
 * Ensures all interactive components meet accessibility requirements
 */
export function withTouchTargets<T extends Record<string, string>>(
  sizeVariants: T
): T {
  return Object.entries(sizeVariants).reduce((acc, [key, value]) => {
    acc[key as keyof T] = `${value} ${touchTargetVariants[key as keyof typeof touchTargetVariants] || touchTargetVariants.md}`
    return acc
  }, {} as T)
}

/**
 * Utility function to apply focus rings to variant configurations
 * Standardizes focus indicator implementation
 */
export function withFocusRing(baseClasses: string, focusType: keyof typeof focusRingVariants = 'default'): string {
  return `${baseClasses} ${focusRingVariants[focusType]}`
}

/**
 * Utility function to apply disabled styles to variant configurations
 * Standardizes disabled state implementation
 */
export function withDisabledStyles(baseClasses: string, disabledType: keyof typeof disabledVariants = 'default'): string {
  return `${baseClasses} ${disabledVariants[disabledType]}`
}