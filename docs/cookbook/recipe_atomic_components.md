---
id: recipe-atomic-components
title: "Recipe: Atomic Components"
description: "Comprehensive recipe for implementing atomic design level 1 components with React, TypeScript, and shadcn/ui"
version: 1.0.0
last_updated: "2025-07-09"
category: cookbook
---
# Atomic Components Development Recipe

**Pattern**: Atomic Design Level 1 Components  
**Context**: Mobile-first, accessible component development  
**Technology**: React + TypeScript + shadcn/ui + TailwindCSS  
**Performance**: Optimized with React.memo and shared utilities  

## Problem Statement

Creating consistent, accessible, and performant atomic components that serve as the foundation for a complete design system while maintaining mobile-first ergonomics and WCAG 2.1 AA compliance.

## Solution Architecture

### 1. Shared Variant Utilities (`src/lib/variants.ts`)

Extract common patterns to eliminate duplication and ensure consistency:

```typescript
// Touch target utilities for mobile accessibility
export const touchTargetVariants = {
  sm: 'min-h-[44px] min-w-[44px]',
  md: 'min-h-[44px] min-w-[44px]',
  lg: 'min-h-[44px] min-w-[44px]',
} as const

// Focus ring utilities for WCAG compliance
export const focusRingVariants = {
  button: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  input: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
} as const

// Utility function to merge touch targets with size variants
export function withTouchTargets<T extends Record<string, string>>(
  sizeVariants: T
): T {
  return Object.entries(sizeVariants).reduce((acc, [key, value]) => {
    acc[key as keyof T] = `${value} ${touchTargetVariants[key as keyof typeof touchTargetVariants] || touchTargetVariants.md}`
    return acc
  }, {} as T)
}
```

### 2. Component Structure Pattern

```typescript
/**
 * Enhanced JSDoc Documentation
 * - @example usage patterns
 * - @accessibility requirements
 * - @performance optimizations
 */

// Imports with shared utilities
import { colorSchemeVariants, withTouchTargets, withFocusRing } from '../../../lib/variants'

// Optimized variant definition using shared patterns
const componentVariants = cva(
  withFocusRing('base-classes', 'component-type'),
  {
    variants: {
      variant: colorSchemeVariants, // Shared color schemes
      size: withTouchTargets({      // Automatic touch targets
        sm: 'size-specific-classes',
        md: 'size-specific-classes',
        lg: 'size-specific-classes',
      }),
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

// Memoized sub-components for performance
const LoadingSpinner = React.memo(() => (/* optimized spinner */))

// Main component with forwardRef
const ComponentImpl = React.forwardRef<HTMLElement, ComponentProps>(
  (props, ref) => {
    // Implementation with accessibility features
  }
)

// Memoized export for performance
export const Component = React.memo(ComponentImpl)
```

### 3. TypeScript Documentation Standards

```typescript
/**
 * Props interface with comprehensive JSDoc
 * 
 * @interface ComponentProps
 * @extends {React.HTMLAttributes<HTMLElement>}
 * @extends {VariantProps<typeof componentVariants>}
 */
export interface ComponentProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof componentVariants> {
  /** 
   * Detailed prop description with examples
   * @default defaultValue
   * @example <Component prop="value" />
   */
  prop?: PropType
}
```

### 4. Performance Optimization Patterns

#### React.memo Implementation
```typescript
// Wrap components in React.memo to prevent unnecessary re-renders
const Component = React.memo(ComponentImpl)

// Memoize expensive sub-components
const ExpensiveSubComponent = React.memo(({ data }) => (
  // Complex rendering logic
))
```

#### Class Composition Optimization
```typescript
// Use shared utility functions to reduce bundle size
const optimizedClasses = cn(
  componentVariants({ variant, size }),
  conditionalClasses && 'conditional-styles',
  className
)
```

### 5. Accessibility Implementation

#### Touch Targets
```typescript
// Ensure minimum 44px touch targets for mobile
size: withTouchTargets({
  sm: 'h-9 px-3 text-sm',     // Results in: h-9 px-3 text-sm min-h-[44px] min-w-[44px]
  md: 'h-10 px-4 py-2',       // Results in: h-10 px-4 py-2 min-h-[44px] min-w-[44px]
  lg: 'h-11 px-8 text-base',  // Results in: h-11 px-8 text-base min-h-[44px] min-w-[44px]
})
```

#### Keyboard Navigation
```typescript
const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
  if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault()
    onClick?.(event as any)
  }
}, [disabled, onClick])
```

#### ARIA Attributes
```typescript
<Component
  aria-disabled={disabled}
  aria-busy={loading}
  aria-label={accessibleLabel}
  role={semanticRole}
/>
```

### 6. Testing Strategy

```typescript
// Component testing patterns
describe('AtomicComponent', () => {
  it('meets touch target requirements', () => {
    render(<Component size="sm" />)
    const element = screen.getByRole('button')
    const styles = window.getComputedStyle(element)
    expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44)
    expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44)
  })

  it('supports keyboard navigation', async () => {
    const handleClick = jest.fn()
    render(<Component onClick={handleClick} />)
    
    const element = screen.getByRole('button')
    await userEvent.type(element, '{enter}')
    expect(handleClick).toHaveBeenCalled()
  })

  it('renders all variants without errors', () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost']
    variants.forEach(variant => {
      render(<Component variant={variant} />)
    })
  })
})
```

## Implementation Checklist

- [ ] Extract shared variant utilities to `src/lib/variants.ts`
- [ ] Implement component with forwardRef pattern
- [ ] Add comprehensive TypeScript JSDoc documentation
- [ ] Apply React.memo optimization
- [ ] Ensure 44px minimum touch targets
- [ ] Implement keyboard navigation support
- [ ] Add proper ARIA attributes
- [ ] Create comprehensive test suite
- [ ] Add artifact annotations linking to specifications
- [ ] Verify WCAG 2.1 AA compliance

## Performance Metrics

- **Bundle Size**: < 10KB gzipped per atomic component
- **Render Performance**: < 16ms per component render
- **Memory Usage**: Minimized through memoization and shared utilities
- **Tree Shaking**: Optimized imports and exports for dead code elimination

## Related Patterns

- [Storybook Setup Recipe](./recipe_storybook_setup.md)
- [shadcn/ui Integration Recipe](./recipe_shadcn_integration.md)
- [Mobile-First Development Recipe](./recipe_mobile_first.md)