---
title: "ADR-003: Core Property Validation Policy"
description: "Architecture decision record defining core property validation approach balancing data quality with API compatibility"
category: adr
version: "1.0.0"
last_updated: "2025-07-09"
---

# ADR-003: Core Property Validation Policy

## Status
Accepted

## Context
During implementation of TieredValidationService (plan_validation_service_tier_0012, Task 2), a critical design decision emerged regarding core property validation. The original acceptance criteria specified "Missing core properties (lat/lng) return 400 errors", but the implementation provided default values for missing core properties to maintain v1 API compatibility.

This created a conflict between:
1. **Data Quality**: Requiring all core properties ensures accurate, complete data
2. **API Compatibility**: v1 clients expect lenient validation with defaults
3. **User Experience**: Lower barrier to entry vs data integrity

## Decision
We will implement **Option 3: Hybrid Approach** with API version detection:

- **v1 API endpoint** (`/api/suggest`): Maintains backward compatibility with default values for missing core properties
- **v2 API endpoint** (`/api/v2/suggest`): Enforces strict validation requiring all core properties

### Implementation Details

#### v1 Behavior (Backward Compatible)
```typescript
// Missing core properties receive defaults:
{
  "@id": `node/${Date.now()}`,
  "amenity": "toilets",
  "wheelchair": "no",
  "access": "yes", 
  "opening_hours": "unknown",
  "fee": false
}
```

#### v2 Behavior (Strict Validation)
```typescript
// Missing core properties return 400:
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Missing required core properties",
    "validation": {
      "errors": [
        { "field": "@id", "code": "required", "tier": "core" },
        // ... other missing fields
      ]
    }
  }
}
```

### Core Properties (8 total)
1. `lat` - Latitude coordinate (synthetic)
2. `lng` - Longitude coordinate (synthetic)
3. `@id` - OpenStreetMap node identifier
4. `amenity` - Must be "toilets"
5. `wheelchair` - Accessibility status
6. `access` - Public access level
7. `opening_hours` - Operating hours
8. `fee` - Whether a fee is charged

## Consequences

### Positive
- Maintains backward compatibility for existing v1 clients
- Provides clear migration path to stricter validation
- Improves data quality for new integrations
- Allows gradual client migration

### Negative
- Increased complexity with dual validation logic
- Maintenance of two API versions
- Potential confusion during transition period
- Additional testing requirements

### Neutral
- Requires API versioning infrastructure
- Documentation must clearly explain version differences
- Monitoring needed for version usage patterns

## Implementation Plan
1. Keep current TieredValidationService with v1 defaults
2. Add version detection logic to suggest route handler
3. Create v2 route with strict validation
4. Update tests to cover both behaviors
5. Document migration guide for clients

## References
- Issue #0014: Core Property Validation Policy
- Issue #0011: ValidationService tier-based enhancement
- Plan: plan_validation_service_tier_0012
- ADR-002: Property Tiering System