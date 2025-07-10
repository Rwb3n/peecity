---
id: recipe-shadcn-integration
title: "Recipe: shadcn/ui Integration"
description: "Integration recipe for shadcn/ui components with TailwindCSS and React setup"
version: 1.0.0
last_updated: "2025-07-09"
category: cookbook
---
# shadcn/ui Integration Recipe

**Pattern**: Design System Integration with shadcn/ui  
**Context**: Consistent component styling with customizable design tokens  
**Technology**: shadcn/ui + TailwindCSS + class-variance-authority  
**Optimization**: Performance and bundle size optimization  

## Problem Statement

Integrating shadcn/ui design system components while maintaining customization flexibility, mobile-first ergonomics, and optimal performance for a production application.

## Solution Architecture

### 1. Design System Foundation Setup

#### CSS Variables Configuration (`src/app/globals.css`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* shadcn/ui design tokens */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    /* Dark mode design tokens */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... additional dark mode tokens */
  }
}
```

#### Tailwind Configuration (`tailwind.config.js`)
```javascript
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        // ... additional color definitions
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
```

### 2. Utility Functions Setup

#### Class Name Utility (`src/lib/utils.ts`)
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function for merging class names with Tailwind CSS
 * Combines clsx for conditional classes and tailwind-merge for conflict resolution
 * 
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 3. Component Variant Patterns

#### Using class-variance-authority (cva)
```typescript
import { cva, type VariantProps } from 'class-variance-authority'

// Define component variants with shadcn/ui design tokens
const componentVariants = cva(
  // Base classes using design tokens
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary uses CSS custom properties
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        // Secondary uses design system tokens
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        // Outline uses border and accent tokens
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        // Ghost uses transparent background with accent hover
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        // Destructive uses semantic color tokens
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

// TypeScript interface extending cva variants
export interface ComponentProps
  extends React.ComponentProps<'component'>,
    VariantProps<typeof componentVariants> {
  // Additional props
}
```

### 4. Mobile-First Ergonomics Integration

#### Touch Target Enhancement
```typescript
// Extend shadcn/ui patterns with mobile requirements
const mobileOptimizedVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        // ... other variants
      },
      size: {
        // Enhanced with mobile touch targets
        sm: 'h-9 px-3 min-h-[44px] min-w-[44px]',
        default: 'h-10 px-4 py-2 min-h-[44px] min-w-[44px]',
        lg: 'h-11 px-8 min-h-[44px] min-w-[44px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
```

### 5. Performance Optimization Patterns

#### Shared Color Scheme Utilities
```typescript
// Extract common color patterns for reuse
export const shadcnColorSchemes = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
} as const

// Use in component variants
const optimizedVariants = cva(baseClasses, {
  variants: {
    variant: shadcnColorSchemes,
    // ... other variants
  },
})
```

#### Bundle Size Optimization
```typescript
// Tree-shakable imports from shadcn/ui
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Instead of importing everything
// import * as UI from '@/components/ui'

// Conditional imports for large components
const HeavyComponent = React.lazy(() => import('@/components/ui/heavy-component'))
```

### 6. Customization Patterns

#### Theme Customization
```typescript
// Custom color variants extending shadcn/ui
const customThemeVariants = {
  ...shadcnColorSchemes,
  success: 'bg-green-500 text-white hover:bg-green-600',
  warning: 'bg-yellow-500 text-black hover:bg-yellow-600',
  info: 'bg-blue-500 text-white hover:bg-blue-600',
}

// CSS custom property overrides
const themeOverrides = {
  '--primary': '142 76% 36%', // Custom primary color
  '--radius': '0.75rem',      // Custom border radius
}
```

#### Component Extension Pattern
```typescript
// Extend shadcn/ui components with additional features
interface ExtendedButtonProps extends ButtonProps {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const ExtendedButton = React.forwardRef<HTMLButtonElement, ExtendedButtonProps>(
  ({ loading, leftIcon, rightIcon, children, ...props }, ref) => {
    return (
      <Button ref={ref} disabled={loading} {...props}>
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {loading && <LoadingSpinner className="mr-2" />}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Button>
    )
  }
)
```

### 7. Testing Integration

```typescript
// Test shadcn/ui component integration
describe('shadcn/ui Integration', () => {
  it('applies design system tokens correctly', () => {
    render(<Button variant="primary">Test</Button>)
    const button = screen.getByRole('button')
    
    // Verify CSS custom properties are applied
    expect(button).toHaveClass('bg-primary')
    expect(button).toHaveClass('text-primary-foreground')
  })

  it('supports theme customization', () => {
    render(
      <div style={{ '--primary': '142 76% 36%' }}>
        <Button variant="primary">Custom Theme</Button>
      </div>
    )
    // Test custom theme application
  })
})
```

## Implementation Checklist

- [ ] Install shadcn/ui dependencies (clsx, tailwind-merge, class-variance-authority)
- [ ] Configure design tokens in globals.css
- [ ] Set up Tailwind configuration with shadcn/ui theme
- [ ] Create cn() utility function for class merging
- [ ] Implement component variants using cva patterns
- [ ] Add mobile touch target enhancements
- [ ] Extract shared color scheme utilities
- [ ] Optimize bundle size with tree-shaking
- [ ] Add comprehensive testing for design system integration
- [ ] Document customization patterns

## Performance Considerations

- **CSS-in-JS vs Utility Classes**: shadcn/ui uses utility classes for better performance
- **Bundle Optimization**: Tree-shakable imports reduce bundle size
- **Runtime Performance**: CSS custom properties enable efficient theme switching
- **Caching**: Tailwind CSS generates optimized stylesheets with aggressive purging

## Common Integration Patterns

### Form Components
```typescript
// Form integration with shadcn/ui
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const FormExample = () => (
  <form className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="Enter email" />
    </div>
    <Button type="submit" className="w-full">
      Submit
    </Button>
  </form>
)
```

### Layout Components
```typescript
// Layout integration with shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const LayoutExample = () => (
  <Card className="w-full max-w-md">
    <CardHeader>
      <CardTitle>Card Title</CardTitle>
    </CardHeader>
    <CardContent>
      <p>Card content using shadcn/ui design tokens.</p>
    </CardContent>
  </Card>
)
```

## Related Patterns

- [Atomic Components Recipe](./recipe_atomic_components.md)
- [Storybook Setup Recipe](./recipe_storybook_setup.md)
- [Performance Optimization Recipe](./recipe_performance_optimization.md)