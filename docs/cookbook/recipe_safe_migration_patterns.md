---
title: "Cookbook: Safe Migration and Refactoring Patterns"
description: "Battle-tested patterns for evolving codebases without breaking working functionality, based on successful ContributionForm migration strategy"
category: cookbook
version: "1.0.0"
last_updated: "2025-07-11"
tags: ["migration", "refactoring", "safety", "testing", "feature-flags", "best-practices"]
author: "Development Team"
status: "published"
audience: "developers"
complexity: "advanced"
related_files: ["../../plans/plan_fix_contributionform_payload_0065.txt", "../../plans/plan_contributionform_v2_migration_0066.txt", "../../templates/template_safe_migration_plan.json"]
---

# Cookbook: Safe Migration and Refactoring Patterns

This cookbook captures the proven patterns for safely evolving production code without breaking existing functionality. These patterns were validated during the successful ContributionForm debugging saga and subsequent migration planning.

## Overview

When modifying working production code, the primary risk is introducing regressions that break existing functionality. This cookbook provides a systematic approach to minimize that risk while still allowing necessary evolution of the codebase.

## Core Principles

### 1. **Verify Before You Modify**
Never change code without first verifying its current state:
- Run all existing tests
- Document current behavior
- Create isolated branches
- Establish measurable baselines

### 2. **Gate Every Change**
Use safety gates as checkpoints:
- **Pre-condition gates**: Verify starting state
- **Implementation gates**: Ensure changes don't break existing features  
- **Post-condition gates**: Validate final state

### 3. **Incremental Over Big Bang**
Break large changes into small, safe steps:
- Each step should be independently valuable
- Each step should be reversible
- Each step should maintain all existing functionality

## Pattern 1: Safe Bug Fix with TDD

When fixing bugs in working components, follow this pattern:

### Step 1: Establish Baseline
```typescript
// First, verify all existing tests pass
npm test -- tests/components/MyComponent_test.tsx

// Document current behavior
console.log('Current payload:', JSON.stringify(requestBody));

// Create safety branch
git checkout -b fix/component-bug
```

### Step 2: Write Failing Test (Red)
```typescript
it('should include missing data in payload', async () => {
  render(<MyComponent />);
  
  // Perform actions that should trigger the bug
  await userEvent.click(screen.getByLabelText(/feature/i));
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  // Assert the expected behavior (this should fail)
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"feature_field": true')
      })
    );
  });
});
```

### Step 3: Minimal Fix (Green)
```typescript
// Make the smallest change possible to fix the bug
const requestBody = {
  ...existingFields,
  // Just add the missing field
  feature_field: formData.features?.someFeature || false
};
```

### Step 4: Verify No Regressions
```typescript
// Run ALL tests, not just the new one
npm test

// Verify: X passing (including new test), 0 failing
```

### Step 5: Refactor for Maintainability
Only after all tests pass, improve the code structure:
```typescript
// Extract logic for clarity
const mapFeaturesToPayload = (features) => ({
  feature_field: features?.someFeature || false,
  another_field: features?.anotherFeature || false
});

const requestBody = {
  ...existingFields,
  ...mapFeaturesToPayload(formData.features)
};
```

## Pattern 2: API Version Migration

When migrating between API versions, use feature flags and dual support:

### Step 1: Create Transformation Layer
```typescript
// src/services/PayloadTransformer.ts
export class PayloadTransformer {
  transformToV1(data: FormData): V1Payload {
    return {
      // Simple v1 format
      name: data.name,
      feature: data.feature
    };
  }
  
  transformToV2(data: FormData): V2Payload {
    return {
      // Complex v2 format with different structure
      '@id': `node/temp_${Date.now()}`,
      'amenity': 'toilets',
      'feature:enabled': data.feature ? 'yes' : 'no',
      // Apply smart defaults for required fields
      ...this.getV2Defaults(data)
    };
  }
}
```

### Step 2: Add Feature Flag Support
```typescript
interface ComponentProps {
  // Allow version override via props
  apiVersion?: 'v1' | 'v2';
}

const MyComponent: React.FC<ComponentProps> = ({ 
  apiVersion = process.env.NEXT_PUBLIC_API_VERSION || 'v1' 
}) => {
  // Component can now support both versions
  const endpoint = apiVersion === 'v2' ? '/api/v2/endpoint' : '/api/endpoint';
  const transformer = new PayloadTransformer();
  
  const handleSubmit = async (data) => {
    const payload = apiVersion === 'v2' 
      ? transformer.transformToV2(data)
      : transformer.transformToV1(data);
      
    await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  };
};
```

### Step 3: Separate Test Suites
```typescript
// tests/components/MyComponent_v1_test.tsx
describe('MyComponent v1 API', () => {
  it('works with v1 endpoint', async () => {
    render(<MyComponent apiVersion="v1" />);
    // Test v1 behavior
  });
});

// tests/components/MyComponent_v2_test.tsx  
describe('MyComponent v2 API', () => {
  it('works with v2 endpoint', async () => {
    render(<MyComponent apiVersion="v2" />);
    // Test v2 behavior
  });
});
```

### Step 4: Gradual Rollout
```yaml
# Production rollout strategy
environments:
  development:
    NEXT_PUBLIC_API_VERSION: v2
  staging:
    NEXT_PUBLIC_API_VERSION: v2
  production:
    # Start with v1, gradually move to v2
    NEXT_PUBLIC_API_VERSION: v1
```

## Pattern 3: Complex Refactoring

When refactoring complex components, use the Parallel Change pattern:

### Step 1: Create New Implementation Alongside Old
```typescript
// Keep old implementation working
const OldImplementation = () => { /* existing code */ };

// Build new implementation in parallel
const NewImplementation = () => { /* refactored code */ };

// Use feature flag to switch
const MyComponent = () => {
  const useNewImplementation = process.env.NEXT_PUBLIC_USE_NEW_IMPL === 'true';
  
  return useNewImplementation 
    ? <NewImplementation />
    : <OldImplementation />;
};
```

### Step 2: Test Both Implementations
```typescript
describe.each([
  ['old', false],
  ['new', true]
])('MyComponent (%s implementation)', (name, useNew) => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_NEW_IMPL = useNew.toString();
  });
  
  // Same tests run against both implementations
  it('handles user input correctly', async () => {
    // Test behavior, not implementation
  });
});
```

## Monitoring and Rollback

### Add Comprehensive Monitoring
```typescript
const trackMigration = (version: string, success: boolean, error?: Error) => {
  // Log to your monitoring service
  console.log({
    event: 'api_migration',
    version,
    success,
    error: error?.message,
    timestamp: new Date().toISOString()
  });
};

// In your component
try {
  await fetch(endpoint, options);
  trackMigration(apiVersion, true);
} catch (error) {
  trackMigration(apiVersion, false, error);
  throw error;
}
```

### Implement Circuit Breaker
```typescript
class MigrationCircuitBreaker {
  private failureCount = 0;
  private readonly threshold = 10;
  
  recordSuccess() {
    this.failureCount = 0;
  }
  
  recordFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      // Automatic rollback
      process.env.NEXT_PUBLIC_API_VERSION = 'v1';
      console.error('Circuit breaker triggered - rolling back to v1');
    }
  }
}
```

## Common Pitfalls to Avoid

### 1. **Changing Too Much at Once**
❌ **Bad**: Refactor + new features + API migration in one PR
✅ **Good**: Separate PRs for each concern

### 2. **Insufficient Test Coverage**
❌ **Bad**: Only test the happy path
✅ **Good**: Test edge cases, errors, and rollback scenarios

### 3. **No Rollback Plan**
❌ **Bad**: Hope nothing goes wrong
✅ **Good**: Clear rollback procedure at each step

### 4. **Skipping Baseline Verification**
❌ **Bad**: Assume tests are passing
✅ **Good**: Always verify current state first

## Checklist for Safe Migrations

- [ ] All existing tests passing before changes
- [ ] Current behavior documented
- [ ] Safety branch created
- [ ] Failing test written for new behavior
- [ ] Minimal implementation to pass test
- [ ] All tests still passing after change
- [ ] Refactoring done separately from bug fix
- [ ] Feature flags for risky changes
- [ ] Monitoring in place
- [ ] Rollback plan documented and tested
- [ ] Gradual rollout strategy defined

## Example: ContributionForm Migration

The patterns in this cookbook were validated during the ContributionForm migration:

1. **Phase 1**: Fixed dropped payload bug using minimal changes
2. **Phase 2**: Added comprehensive test coverage
3. **Phase 3**: Refactored for maintainability
4. **Phase 4**: Planned v2 migration with feature flags

Each phase had clear gates and rollback procedures, resulting in zero production incidents.

## Related Documentation

- [Template: Safe Migration Plan](../../templates/template_safe_migration_plan.json)
- [Example: ContributionForm Payload Fix](../../plans/plan_fix_contributionform_payload_0065.txt)
- [Example: v2 API Migration Plan](../../plans/plan_contributionform_v2_migration_0066.txt)
- [React Hook Form with Zod](./recipe_react_hook_form_with_zod.md)
- [Robust React Testing](./recipe_robust_react_testing.md)

## References

- Martin Fowler's "Parallel Change" pattern
- Feature Toggles (Feature Flags) by Pete Hodgson
- Michael Feathers' "Working Effectively with Legacy Code"