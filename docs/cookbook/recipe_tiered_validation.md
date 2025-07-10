---
title: "Recipe: Tiered Property Validation"
description: "Tier-based validation implementation for OpenStreetMap properties with strict validation for core properties and flexibility for optional fields"
category: cookbook
version: "1.0.0"
last_updated: "2025-07-09"
---

# Recipe: Tiered Property Validation

## Overview

This recipe demonstrates how to implement tier-based validation for OpenStreetMap properties using the property tier configuration. The pattern supports strict validation for core/high-frequency properties while allowing flexibility for optional/specialized fields.

**Last Updated**: 2025-07-07 (Task 8 Complete)
**Status**: Production-ready with optimized performance and 99%+ test coverage

## Context

CityPee uses a 4-tier system to classify 120 OpenStreetMap properties:
- **Core**: Essential, always required
- **High-frequency**: Common, strictly validated when present
- **Optional**: Advanced, validated if provided
- **Specialized**: Edge cases, basic type checking only

## Implementation

### 1. Loading the Configuration

```javascript
// src/services/TieredValidationService.js
const fs = require('fs');
const path = require('path');

class TieredValidationService {
  constructor() {
    this.loadConfiguration();
  }

  loadConfiguration() {
    const configPath = path.join(__dirname, '../config/suggestPropertyTiers.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    this.config = JSON.parse(configData);
    
    // Build lookup maps for performance
    this.propertyMap = new Map();
    Object.entries(this.config.properties).forEach(([name, info]) => {
      this.propertyMap.set(name, info);
    });
  }

  getPropertyInfo(propertyName) {
    return this.propertyMap.get(propertyName);
  }

  getTierConfig(tierName) {
    return this.config.tiers[tierName];
  }
}
```

### 2. Tier-Based Validation Logic

```javascript
// src/services/TieredValidationService.js (continued)

validateProperty(name, value) {
  const property = this.getPropertyInfo(name);
  
  if (!property) {
    // Unknown property - decide policy (reject or accept as specialized)
    return { 
      valid: false, 
      error: `Unknown property: ${name}` 
    };
  }

  const tier = this.getTierConfig(property.tier);
  
  // Core properties must be present
  if (tier.required && (value === undefined || value === null)) {
    return { 
      valid: false, 
      error: `${name} is required (core property)`,
      severity: 'error'
    };
  }
  
  // Skip validation if not provided and not required
  if (value === undefined || value === null) {
    return { valid: true, skipped: true };
  }
  
  // Apply tier-specific validation
  if (tier.strict_validation) {
    return this.strictValidate(property, value);
  } else {
    return this.lenientValidate(property, value);
  }
}

strictValidate(property, value) {
  switch (property.validationType) {
    case 'boolean':
      if (typeof value !== 'boolean') {
        return { 
          valid: false, 
          error: `${property.tier} property must be boolean`,
          severity: 'error'
        };
      }
      break;
      
    case 'enum':
      const validValues = this.getEnumValues(property);
      if (!validValues.includes(value)) {
        return { 
          valid: false, 
          error: `Invalid value. Must be one of: ${validValues.join(', ')}`,
          severity: 'error'
        };
      }
      break;
      
    case 'monetary':
      if (typeof value !== 'number' || value < 0) {
        return { 
          valid: false, 
          error: 'Must be a positive number',
          severity: 'error'
        };
      }
      break;
      
    // Add more validation types...
  }
  
  return { valid: true };
}

lenientValidate(property, value) {
  // Basic type checking only
  if (value === null || value === undefined) {
    return { valid: true };
  }
  
  // Warn but don't fail for type mismatches
  const expectedType = this.getExpectedJsType(property.validationType);
  if (typeof value !== expectedType) {
    return { 
      valid: true, 
      warning: `Expected ${expectedType}, got ${typeof value}`,
      severity: 'warning'
    };
  }
  
  return { valid: true };
}
```

### 3. Batch Validation with Summary

```javascript
// src/services/TieredValidationService.js (continued)

validateSuggestion(data) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    summary: {
      core: { validated: 0, failed: 0 },
      high_frequency: { validated: 0, failed: 0 },
      optional: { validated: 0, failed: 0 },
      specialized: { validated: 0, failed: 0 }
    }
  };
  
  // Check all core properties are present
  Object.entries(this.config.properties).forEach(([name, info]) => {
    if (info.tier === 'core' && !info.synthetic) {
      const validation = this.validateProperty(name, data[name]);
      
      if (!validation.valid) {
        results.valid = false;
        results.errors.push({
          property: name,
          error: validation.error,
          tier: 'core'
        });
        results.summary.core.failed++;
      } else {
        results.summary.core.validated++;
      }
    }
  });
  
  // Validate provided properties
  Object.entries(data).forEach(([name, value]) => {
    const property = this.getPropertyInfo(name);
    if (!property || property.tier === 'core') return; // Core already checked
    
    const validation = this.validateProperty(name, value);
    const tier = property.tier;
    
    if (!validation.valid) {
      results.valid = false;
      results.errors.push({
        property: name,
        error: validation.error,
        tier
      });
      results.summary[tier].failed++;
    } else {
      results.summary[tier].validated++;
      if (validation.warning) {
        results.warnings.push({
          property: name,
          warning: validation.warning,
          tier
        });
      }
    }
  });
  
  return results;
}
```

### 4. UI Component Integration

```jsx
// src/components/ToiletForm.jsx
import React, { useState } from 'react';
import { TieredValidationService } from '../services/TieredValidationService';

const validationService = new TieredValidationService();

function ToiletForm() {
  const [formData, setFormData] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Group properties by tier
  const propertyGroups = {
    core: [],
    high_frequency: [],
    optional: [],
    specialized: []
  };
  
  Object.entries(validationService.config.properties).forEach(([name, info]) => {
    if (!info.synthetic) { // Skip lat/lng
      propertyGroups[info.tier].push({ name, ...info });
    }
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validation = validationService.validateSuggestion(formData);
    
    if (!validation.valid) {
      // Convert to error map for display
      const errorMap = {};
      validation.errors.forEach(err => {
        errorMap[err.property] = err.error;
      });
      setValidationErrors(errorMap);
      return;
    }
    
    // Process valid submission
    submitToilet(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Core Properties - Always Visible */}
      <section>
        <h3>Essential Information</h3>
        {propertyGroups.core.map(prop => (
          <FormField
            key={prop.name}
            property={prop}
            value={formData[prop.name]}
            onChange={(value) => setFormData({...formData, [prop.name]: value})}
            error={validationErrors[prop.name]}
            required
          />
        ))}
      </section>
      
      {/* High Frequency - Collapsible but Visible */}
      <details open>
        <summary>Additional Details</summary>
        {propertyGroups.high_frequency.map(prop => (
          <FormField
            key={prop.name}
            property={prop}
            value={formData[prop.name]}
            onChange={(value) => setFormData({...formData, [prop.name]: value})}
            error={validationErrors[prop.name]}
          />
        ))}
      </details>
      
      {/* Optional - Hidden by Default */}
      {showAdvanced && (
        <section>
          <h3>Advanced Options</h3>
          {propertyGroups.optional.map(prop => (
            <FormField
              key={prop.name}
              property={prop}
              value={formData[prop.name]}
              onChange={(value) => setFormData({...formData, [prop.name]: value})}
              error={validationErrors[prop.name]}
            />
          ))}
        </section>
      )}
      
      <button 
        type="button" 
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
      </button>
      
      <button type="submit">Submit Toilet</button>
    </form>
  );
}
```

### 5. Express Route Integration

```javascript
// src/routes/suggest.js
const { TieredValidationService } = require('../services/TieredValidationService');

const validationService = new TieredValidationService();

router.post('/api/suggest', async (req, res) => {
  // Tier-based validation
  const validation = validationService.validateSuggestion(req.body);
  
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.errors,
      warnings: validation.warnings,
      summary: validation.summary
    });
  }
  
  // Log warnings for monitoring
  if (validation.warnings.length > 0) {
    logger.warn('Suggestion has warnings', {
      warnings: validation.warnings,
      ip: req.ip
    });
  }
  
  // Continue with duplicate checking, rate limiting, etc.
  // ...
});
```

## Testing

```javascript
// tests/services/tiered_validation_test.js
describe('TieredValidationService', () => {
  let service;
  
  beforeEach(() => {
    service = new TieredValidationService();
  });
  
  it('should require all core properties', () => {
    const result = service.validateSuggestion({
      lat: 51.5,
      lng: -0.1,
      // Missing other core properties
    });
    
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(6); // Missing 6 core properties
  });
  
  it('should allow missing optional properties', () => {
    const result = service.validateSuggestion({
      // All core properties
      lat: 51.5,
      lng: -0.1,
      '@id': 'node/123',
      amenity: 'toilets',
      wheelchair: true,
      access: 'yes',
      opening_hours: '24/7',
      fee: 0,
      // No optional properties
    });
    
    expect(result.valid).toBe(true);
    expect(result.summary.optional.validated).toBe(0);
  });
  
  it('should validate enum values strictly', () => {
    const result = service.validateProperty('access', 'invalid');
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Must be one of');
  });
});
```

## Best Practices

1. **Cache Configuration**: Load tier config once at startup, not per request
2. **Fail Fast**: Validate core properties first
3. **Clear Messaging**: Different error messages for missing vs invalid
4. **Progressive Disclosure**: UI matches tier visibility recommendations
5. **Monitoring**: Track validation failures by tier to identify issues

## Related Patterns

- [Service-Oriented Architecture](./recipe_service_architecture.md)
- [Error Handling](./recipe_error_handling.md)
- [API Documentation](../reference/api/suggest-api.md)

## Using v2 Strict Validation

### When to Use v2

The v2 endpoint (`/api/v2/suggest`) is recommended for:
- Production data collection systems
- Applications where data quality is critical
- Systems that can provide all core properties
- Integrations that need explicit control over all fields

### v2 Client Implementation

```javascript
// Example v2 client with all core properties
async function submitToiletV2(toiletData) {
  // Ensure all core properties are present
  const coreProperties = {
    lat: toiletData.lat,
    lng: toiletData.lng,
    '@id': toiletData['@id'] || `node/${Date.now()}`,
    amenity: 'toilets',
    wheelchair: toiletData.wheelchair || 'unknown',
    access: toiletData.access || 'yes',
    opening_hours: toiletData.opening_hours || 'unknown',
    fee: Boolean(toiletData.fee)
  };
  
  // Merge with additional properties
  const payload = {
    ...coreProperties,
    ...toiletData
  };
  
  const response = await fetch('/api/v2/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    // Handle tier-specific errors
    if (result.validation?.errorsByTier?.core > 0) {
      throw new Error('Missing required core properties');
    }
    throw new Error(result.message);
  }
  
  return result;
}
```

### Error Handling for v2

```javascript
// Handle v2 validation errors with tier information
function handleV2Error(error) {
  if (error.validation?.tierSummary) {
    const { core, high_frequency } = error.validation.tierSummary;
    
    console.log(`Core properties: ${core.provided}/${core.required}`);
    console.log(`Errors by tier:`, error.validation.errorsByTier);
    
    // Show specific field errors
    error.validation.errors.forEach(err => {
      console.log(`${err.tier} property "${err.field}": ${err.message}`);
    });
  }
}
```

## Performance Metrics and Monitoring

### Metrics Collection (Added in Task 7)

The `TieredValidationServiceWithMetrics` extends the base service to add comprehensive performance monitoring:

```typescript
// src/services/TieredValidationServiceWithMetrics.ts
interface ValidationMetrics {
  totalRequests: number;
  requestsByTier: {
    core: number;
    high_frequency: number;
    optional: number;
    specialized: number;
  };
  errorsByTier: {
    core: number;
    high_frequency: number;
    optional: number;
    specialized: number;
  };
  performanceMetrics: {
    count: number;
    sum: number;
    min: number;
    max: number;
    p95: number[];
  };
}
```

### Usage Example

```typescript
const service = new TieredValidationServiceWithMetrics();

// Validate with automatic metrics collection
const result = await service.validateSuggestion(data);

// Get current metrics
const metrics = service.getMetrics();
console.log(`Total requests: ${metrics.totalRequests}`);
console.log(`p95 latency: ${metrics.performanceMetrics.p95[0]}ms`);
console.log(`Error rate by tier:`, metrics.errorsByTier);
```

### Performance Benchmarks

Based on production testing, the following performance targets are achieved:

| Operation | Local p95 | CI p95 | Notes |
|-----------|-----------|--------|-------|
| Minimal (9 props) | ~10ms | ~20ms | Includes tier classification |
| Full (120 props) | ~15ms | ~30ms | All properties validated |
| Config loading | ~15ms | ~30ms | First load only |
| Cached operation | <1ms | <2ms | Subsequent requests |

### Structured Logging

All validation events are logged with structured data:

```typescript
logger.info('validation_completed', 'Validation completed', {
  duration: 8.45,
  valid: true,
  errorCount: 0,
  warningCount: 2,
  propertyCount: 45,
  tierSummary: {
    core: { validated: 8, errors: 0 },
    high_frequency: { validated: 12, errors: 0 },
    optional: { validated: 15, errors: 0 },
    specialized: { validated: 10, errors: 0 }
  }
});
```

### Monitoring Integration (Draft - Phase 2)

For production monitoring, metrics can be exported to Prometheus (planned for Metrics Phase 2):

```typescript
// DRAFT: Prometheus integration planned for Phase 2
// The metrics are collected but endpoint not yet implemented
// 
// app.get('/metrics', (req, res) => {
//   const metrics = validationService.getMetrics();
//   // Export metrics in Prometheus format
// });
```

**Note**: Full Prometheus integration is planned for the Metrics Phase 2 implementation. Currently, metrics are collected internally and available via the `getMetrics()` method.

## Production Deployment

### Using the Optimized Service

The optimized `TieredValidationServiceOptimized` provides 20-50% performance improvements through:
- Map-based property lookups (O(1) instead of O(n))
- Pre-computed core property sets
- Single-pass validation algorithm
- Standardized error message formatting

To use the optimized service in production:

```typescript
import { TieredValidationServiceOptimized } from '../services/TieredValidationService_optimized';

const tieredValidationService = new TieredValidationServiceOptimized();
```

### Rollback Plan

If issues arise with the optimized service, you can quickly rollback to the original implementation:

1. **Option 1: Quick Rollback** (Recommended for emergencies)
   ```typescript
   // In src/app/api/suggest/route.ts and src/app/api/v2/suggest/route.ts
   
   // Change from:
   import { TieredValidationServiceOptimized } from '../../../services';
   
   // Change to:
   import { TieredValidationService } from '../../../services';
   
   // Update instantiation:
   const tieredValidationService = new TieredValidationService();
   ```

2. **Option 2: Canary Deployment** (Recommended for gradual rollout)
   - Deploy optimized service to a subset of traffic
   - Monitor performance metrics and error rates
   - Gradually increase traffic percentage
   - Full rollback if metrics degrade

### Monitoring During Migration

Track these metrics when switching to the optimized service:
- P95 validation latency (should decrease by 20-50%)
- Error rates (should remain stable)
- Memory usage (should remain stable or decrease slightly)
- CPU usage (should decrease)

See issue #0018 for the complete optimization implementation details.

## References

- [Property Prioritization Framework](../reference/property-prioritization.md)
- [ADR-002: Property Tiering](../adr/ADR-002-property-tiering.md)
- [ADR-003: Core Property Validation](../adr/ADR-003-core-property-validation.md)
- [ADR-004: Performance and Caching Strategy](../adr/ADR-004-validation-performance-caching-DRAFT.md)
- [Property Tier Configuration](../../src/config/suggestPropertyTiers.json)
- [Suggest API Reference](../reference/api/suggest-api.md)
- [Performance Benchmarking Guide](../howto/perf-benchmarks.md)

## TypeScript Utility Functions (Added in Task 5)

### Tier-Aware Property Validation

```typescript
// src/utils/validation.ts
export interface PropertyValidationContext {
  propertyName: string;
  value: any;
  tier: string;
  validationType: string;
  isRequired: boolean;
  strictValidation: boolean;
}

export function validatePropertyByTier(
  context: PropertyValidationContext
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const { propertyName, value, tier, validationType, isRequired, strictValidation } = context;
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required field check (core tier only)
  if (isRequired && (value === undefined || value === null)) {
    errors.push({
      field: propertyName,
      message: `${propertyName} is required`,
      code: 'required'
    });
    return { errors, warnings };
  }

  // Type validation based on tier
  if (tier === 'core' || tier === 'high_frequency') {
    const typeError = validateStrictType(propertyName, value, validationType);
    if (typeError) errors.push(typeError);
  } else if (tier === 'optional') {
    const coercionResult = validateWithCoercion(propertyName, value, validationType);
    if (coercionResult.error) errors.push(coercionResult.error);
    if (coercionResult.warning) warnings.push(coercionResult.warning);
  } else if (tier === 'specialized') {
    const typeWarning = validateSpecializedType(propertyName, value, validationType);
    if (typeWarning) warnings.push(typeWarning);
  }

  return { errors, warnings };
}
```

### Performance-Optimized Batch Validation

```typescript
export function validateManyProperties(
  data: Record<string, any>,
  propertyConfigs: Record<string, any>
): { errors: ValidationError[]; warnings: ValidationWarning[]; validCount: number } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let validCount = 0;

  // Process core properties first (fail fast)
  const coreProps = Object.entries(propertyConfigs).filter(([_, config]) => config.tier === 'core');
  for (const [propName, config] of coreProps) {
    const result = validatePropertyByTier({
      propertyName: propName,
      value: data[propName],
      tier: config.tier,
      validationType: config.validationType,
      isRequired: true,
      strictValidation: true
    });

    if (result.errors.length > 0) {
      errors.push(...result.errors);
    } else if (data[propName] !== undefined) {
      validCount++;
    }
  }

  // If core validation failed, skip the rest for performance
  if (errors.length > 0) {
    return { errors, warnings, validCount };
  }

  // Process non-core properties
  // ... (see full implementation in validation.ts)
  
  return { errors, warnings, validCount };
}
```

### Validation Result Aggregation

```typescript
export interface TierValidationSummary {
  core: { provided: number; required: number; valid: number; errors: number };
  high_frequency: { provided: number; valid: number; errors: number };
  optional: { provided: number; valid: number; warnings: number };
  specialized: { provided: number; valid: number; warnings: number };
}

export function aggregateValidationByTier(
  validationResult: SuggestionValidation,
  propertyTiers: Record<string, string>
): TierValidationSummary {
  const summary: TierValidationSummary = {
    core: { provided: 0, required: 0, valid: 0, errors: 0 },
    high_frequency: { provided: 0, valid: 0, errors: 0 },
    optional: { provided: 0, valid: 0, warnings: 0 },
    specialized: { provided: 0, valid: 0, warnings: 0 }
  };

  // Count errors by tier
  validationResult.errors.forEach(error => {
    const tier = propertyTiers[error.field] || 'specialized';
    if (tier === 'core') {
      summary.core.errors++;
    } else if (tier === 'high_frequency') {
      summary.high_frequency.errors++;
    }
  });

  // Count warnings by tier  
  validationResult.warnings.forEach(warning => {
    const tier = propertyTiers[warning.field] || 'specialized';
    if (tier === 'optional') {
      summary.optional.warnings++;
    } else if (tier === 'specialized') {
      summary.specialized.warnings++;
    }
  });

  return summary;
}
```

## Complete Implementation Examples (Added in Task 8)

### Using the Optimized Service

```typescript
import { TieredValidationService } from './services/TieredValidationService_optimized';

// Initialize service (singleton pattern recommended)
const validationService = new TieredValidationService();

// Example 1: Validate minimal v1 data
const v1Data = {
  lat: 51.5074,
  lng: -0.1278,
  name: 'Victoria Station Toilets',
  accessible: true,  // v1 field - will be mapped to wheelchair
  hours: 'Mon-Fri 9-5',  // v1 field - will be mapped to opening_hours
  fee: 0.50  // v1 numeric fee - will be converted to boolean + charge
};

const result = await validationService.validateRequest({
  body: JSON.stringify(v1Data),
  headers: {},
  method: 'POST',
  url: '/api/suggest',
  version: 'v1'  // Triggers compatibility mode
});
```

### Performance Optimization Patterns

```typescript
// Pattern 1: Reuse service instance (avoid re-initialization)
const service = new TieredValidationService();
await service.initialize();  // Do this once

// Pattern 2: Batch validation for multiple items
async function validateBatch(items: any[]) {
  const results = await Promise.all(
    items.map(item => service.validateRequest({
      body: JSON.stringify(item),
      headers: {},
      method: 'POST',
      url: '/api/suggest'
    }))
  );
  
  return results;
}
```

## Comprehensive Testing Strategy

### Test Coverage Achievements (Task 8 Complete)

The tier validation system now has comprehensive test coverage:

- **TieredValidationServiceOptimized**: 99.45% statement coverage, 95.48% branch coverage
- **errorMessages.ts**: 99.64% statement coverage, 98.76% branch coverage  
- **100+ test cases** covering negative scenarios, edge cases, and boundary conditions

### Testing Patterns

```javascript
// tests/services/TieredValidationService_optimized_comprehensive_test.js

describe('Tier Validation Edge Cases', () => {
  test('should handle v1 field mapping with fee conversion', async () => {
    const body = JSON.stringify({
      lat: 51.5074,
      lng: -0.1278,
      name: 'Test Toilet',
      fee: 1.50  // Should convert to fee: true, charge: '1.50 GBP'
    });

    const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
    expect(result.isValid).toBe(true);
    expect(result.data.fee).toBe(true);
    expect(result.data.charge).toBe('1.50 GBP');
  });

  test('should generate warnings for optional property type coercion', async () => {
    const body = JSON.stringify({
      // Valid core properties...
      lat: 51.5074,
      lng: -0.1278,
      '@id': 'node/123',
      amenity: 'toilets',
      // Optional properties needing coercion
      description: 123  // Number to string coercion
    });

    const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
    expect(result.isValid).toBe(true);
    expect(result.validation.warnings.some(w => w.code === 'type_coercion')).toBe(true);
  });
});
```

### Error Message Testing

```javascript
// tests/utils/errorMessages_template_usage_test.js

describe('Error Message Templates', () => {
  test('should format all validation error types', () => {
    expect(ValidationErrorMessages.REQUIRED('email')).toBe('email is required');
    expect(ValidationErrorMessages.OUT_OF_RANGE('score', 0, 100))
      .toBe('score must be between 0 and 100');
    expect(ValidationErrorMessages.INVALID_ENUM('status', ['active', 'inactive']))
      .toBe('status must be one of: active, inactive');
  });

  test('should format field names for user display', () => {
    expect(formatFieldName('lat')).toBe('Latitude');
    expect(formatFieldName('wheelchair')).toBe('Wheelchair accessibility');
    expect(formatFieldName('unknown_field')).toBe('Unknown field');
  });
});
```

### Rollback Plan

If the optimized service causes issues in production:

1. **Quick Rollback**: Update service imports to use original `TieredValidationService`
2. **Gradual Migration**: Use feature flags to control which validation service is used
3. **Configuration Rollback**: Restore previous tier configuration if needed

```typescript
// Rollback example
import { 
  TieredValidationService  // Original service
  // TieredValidationServiceOptimized  // Optimized service
} from '../services';

const validationService = new TieredValidationService();
```

