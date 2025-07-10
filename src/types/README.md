# src/types/

Centralized TypeScript type definitions shared across services, agents, frontend components, and tests.

## Type Files

| File | Contents |
|------|----------|
| `geojson.ts` | Strict interfaces for GeoJSON collections (`OverpassResponse`, `ToiletFeature`, `ToiletCollection`). Provides type guards for runtime validation. |
| `suggestions.ts` | Complete schemas for suggestion workflow (`SuggestionPayload`, `SuggestionLogEntry`, `SuggestionValidation`, `ProcessedSuggestion`). |

## Service Integration

These types are used throughout the service-oriented architecture:

### ValidationService Types
- `SuggestionPayload` - Input validation schema
- `SuggestionValidation` - Validation result structure
- `ValidationError` - Validation failure details

### DuplicateService Types  
- `ToiletFeature` - Spatial feature for proximity calculations
- `SuggestionValidation` - Enhanced with duplicate detection results

### LoggingService Types
- `SuggestionLogEntry` - Structured log event format
- `ProcessedSuggestion` - Complete suggestion with metadata

### IngestService Types
- `OverpassResponse` - Raw OSM API response format
- `ToiletFeature` - Normalized internal representation
- `ToiletCollection` - GeoJSON feature collection

## Design Principles

1. **Framework Agnostic**: No React, Next.js, or browser-specific types
2. **Granular Interfaces**: Prefer specific types over `any` or broad unions
3. **Extensible**: Use composition and extension rather than mutation
4. **Runtime Safe**: Include type guards where runtime validation is needed
5. **Service Contracts**: Types define clear contracts between services
6. **Validation Ready**: Compatible with schema validation libraries

## Usage Patterns

### Service Method Signatures
```typescript
// Clear input/output contracts
async validateRequest(request: ValidationRequest): Promise<ValidationResult>
async checkDuplicate(request: DuplicateCheckRequest): Promise<DuplicateCheckResult>
```

### Type Guards
```typescript
// Runtime type safety
if (isToiletFeature(data)) {
  // TypeScript knows data is ToiletFeature
}
```

### Schema Validation
```typescript
// Compatible with validation utilities
const result = validateSuggestionPayload(requestData);
```

## Maintenance Guidelines

1. **Centralization**: All shared types must live here
2. **Documentation**: Include JSDoc for complex interfaces
3. **Versioning**: Consider backwards compatibility when changing types
4. **Testing**: Type definitions should have corresponding test coverage
5. **Barrel Exports**: Add `index.ts` when directory grows beyond 3 files
6. **Cross-References**: Use `@doc refs` annotations linking to architecture specs 