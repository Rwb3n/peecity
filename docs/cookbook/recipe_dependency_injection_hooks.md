---
title: "Dependency Injection for React Hooks Testing"
description: "How to use dependency injection to bypass Jest module mocking issues with React hooks"
category: "cookbook"
created_at: 2025-07-09
updated_at: 2025-07-09
tags: ["testing", "react", "hooks", "jest", "dependency-injection"]
related_recipes: ["recipe_tiered_validation.md", "recipe_metrics_export.md"]
---

# Dependency Injection for React Hooks Testing

## Problem Statement

When testing React components that use custom hooks, Jest's module mocking can become unreliable or fail entirely, especially when:
- Using ES modules with TypeScript
- Working with module path aliases (`@/hooks/...`)
- Dealing with Jest's hoisting behavior
- Encountering "Cannot access before initialization" errors

After 60+ debugging attempts on the SearchBar component, we discovered that Jest's module mocking system has fundamental limitations when mocking React hooks in certain configurations.

## Solution: Dependency Injection Pattern

Instead of fighting Jest's module mocking system, use dependency injection to make hooks replaceable at the component level.

### Implementation

1. **Add an optional prop to accept the hook**:

```typescript
// src/components/molecules/SearchBar/SearchBar.tsx
import { useGeolocation } from '@/hooks/useGeolocation'

interface SearchBarProps {
  // ... other props
  useGeolocationHook?: typeof useGeolocation  // Optional with default
}

export function SearchBar({ 
  // ... other props
  useGeolocationHook = useGeolocation,  // Default to real hook
}: SearchBarProps) {
  // Use the injected hook
  const { loading, error, location, requestLocation } = useGeolocationHook()
  
  // ... rest of component logic
}
```

2. **In tests, pass mock implementations directly**:

```typescript
// tests/components/molecules/SearchBar_test.tsx
describe('SearchBar', () => {
  test('should show loading state', () => {
    // Create a mock hook for this specific test
    const mockGeoHook = () => ({
      loading: true,
      error: null,
      location: null,
      requestLocation: jest.fn()
    })
    
    // Pass the mock as a prop
    render(<SearchBar useGeolocationHook={mockGeoHook} />)
    
    // Assertions work reliably
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })
  
  test('should handle errors', () => {
    const mockGeoHook = () => ({
      loading: false,
      error: 'Permission denied',
      location: null,
      requestLocation: jest.fn()
    })
    
    render(<SearchBar useGeolocationHook={mockGeoHook} />)
    
    expect(screen.getByText(/permission denied/i)).toBeInTheDocument()
  })
})
```

## Benefits

1. **Reliability**: No Jest mocking magic - just plain function passing
2. **Explicitness**: Dependencies are visible in the component interface
3. **Testability**: Each test controls exactly what the hook returns
4. **Simplicity**: No complex mock setup or cleanup needed
5. **Type Safety**: TypeScript ensures mock matches hook interface

## When to Use This Pattern

Consider dependency injection when:
- Jest module mocking fails or becomes unreliable
- You need fine-grained control over hook behavior in tests
- Multiple tests need different hook states
- You're experiencing Jest hoisting issues

## Trade-offs

- **Pro**: Complete control and reliability in tests
- **Pro**: Makes dependencies explicit
- **Pro**: No Jest configuration needed
- **Con**: Slightly more verbose component interface
- **Con**: Requires discipline to maintain default values

## Alternative Approaches Considered

Before arriving at dependency injection, we attempted:
1. Manual mocks in `__mocks__` directory - precedence issues
2. Jest mock hoisting patterns - initialization errors
3. Various jest.mock() configurations - module resolution failures
4. Mock factory functions - couldn't access mock state

## Real-World Example

The CityPee project's SearchBar component was blocked for hours due to Jest mocking issues. After implementing dependency injection:
- All 21 tests passed (up from 17/21)
- No more flaky test failures
- Clear, maintainable test code
- Pattern now available for other components

## Code References

- Implementation: `src/components/molecules/SearchBar/SearchBar.tsx:38`
- Tests: `tests/components/molecules/SearchBar_test.tsx:199-277`
- Status Report: `status/plan_frontend_molecules_task_search_impl_status.md`

## Conclusion

When Jest's module mocking becomes a bottleneck, dependency injection provides a clean architectural solution that improves both testability and code quality. This pattern transforms an intractable testing problem into a simple parameter passing exercise.