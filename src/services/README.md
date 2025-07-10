# Services Directory

This directory contains the core business logic services following SOLID principles and service-oriented architecture.

## Current Services

### ValidationService
Handles request validation and schema checking for the suggest API.

### DuplicateService  
Performs spatial duplicate detection with configurable distance thresholds.

### RateLimitService
Manages IP-based rate limiting with in-memory storage.

### SuggestionLogService
Handles structured logging with file rotation for toilet suggestions.

### IngestService
Processes OSM data and normalizes it to GeoJSON format.

### MonitorService
Orchestrates weekly monitoring workflow with pluggable alert channels and metrics collection.

## Tier-Based Validation Pattern

The services integrate with the property tier system for intelligent validation:

```javascript
// Example: Integrating tier-based validation
const tierConfig = require('../config/suggestPropertyTiers.json');

class ValidationService {
  validateProperty(name, value) {
    const property = tierConfig.properties[name];
    if (!property) return { valid: false, error: 'Unknown property' };
    
    const tier = tierConfig.tiers[property.tier];
    
    // Apply tier-specific rules
    if (tier.strict_validation) {
      // Strict validation for core/high-frequency
      return this.strictValidate(property, value);
    } else {
      // Lenient validation for optional/specialized
      return this.lenientValidate(property, value);
    }
  }
}
```

## Property Tier Integration

Services should respect the 4-tier property classification:

1. **Core Properties** (8): Always validate strictly, return 400 on missing/invalid
2. **High-frequency** (16): Validate strictly when provided
3. **Optional** (17): Validate if present, don't require
4. **Specialized** (81): Accept with basic type checking

See [Property Prioritization Framework](../../docs/reference/property-prioritization.md) for details.

## Best Practices

1. **Single Responsibility**: Each service handles one concern
2. **Dependency Injection**: Services receive dependencies via constructor
3. **Interface Segregation**: Services expose minimal public APIs
4. **Error Standardization**: Use ErrorFactory for consistent errors
5. **Testability**: Services are unit testable in isolation

## Testing

Each service has corresponding unit tests in `tests/services/` and `tests/agents/`:
- `ValidationService_test.js`
- `DuplicateService_test.js`
- `RateLimitService_test.js`
- `SuggestionLogService_test.js`
- `IngestService_test.js`
- `monitor_agent_test.js` (15 test cases covering MonitorService workflow)

## Future Services

Planned services for tier-aware validation:
- **TieredValidationService**: Implements full tier-based validation logic
- **PropertyMappingService**: Handles OSM property conversions
- **SchemaEvolutionService**: Manages v1/v2 API compatibility

## References

- [Service Architecture Recipe](../../docs/cookbook/recipe_service_architecture.md)
- [Tiered Validation Recipe](../../docs/cookbook/recipe_tiered_validation.md)
- [Monitor Agent Patterns](../../docs/cookbook/recipe_monitor_agent_patterns.md)
- [Property Tier Config](../config/suggestPropertyTiers.json)