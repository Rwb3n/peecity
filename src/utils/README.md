# src/utils/

Framework-agnostic utility modules supporting the service-oriented architecture.

## Core Utilities

| File | Purpose | Key Features |
|------|---------|--------------|
| `config.ts` | Centralized configuration management | Environment overrides, type-safe settings, validation rules |
| `errors.ts` | Standardized error handling and response formatting | Custom error classes, ErrorFactory, consistent HTTP responses |
| `logger.ts` | Agent-specific structured logging | File rotation, performance metrics, configurable levels |
| `fileLogWriter.ts` | Low-level file operations for logging systems | Atomic writes, directory creation, error resilience |

## Specialized Utilities

| File | Purpose | Key Features |
|------|---------|--------------|
| `http.ts` | Low-level HTTP operations | AbortController timeouts, retry helpers, `makeRequest`, `sleep` |
| `overpass.ts` | Overpass API client | Built on `http.ts`, caching, exponential backoff, predefined queries |
| `validation.ts` | Schema validation for user input | Joi-style checks, data sanitization, type conversion |
| `rateLimit.ts` | IP-based rate limiting | In-memory tracking, sliding windows, statistics reporting |
| `geospatial.ts` | Spatial calculations and indexing | Haversine distance, optimized nearest neighbor, GeoJSON utilities |

## Architecture Integration

### Service Dependencies
Utilities are injected into services for clean separation:
```typescript
// Configuration
const config = getValidationConfig(); // Centralized settings

// Error handling  
const error = ErrorFactory.validation('Invalid coordinates'); // Standardized errors

// Logging
const logger = createAgentLogger('suggest-agent'); // Agent-specific logging
```

### Error Standardization
All utilities use consistent error patterns:
- `ErrorFactory` for creating typed errors
- `AppError` base class with HTTP status codes
- Graceful error handling with fallbacks
- Structured error logging

### Configuration Management
Centralized configuration with environment support:
- Type-safe configuration objects
- Environment variable overrides
- Runtime validation
- Service-specific configurations

### Performance Optimization
- **Caching**: Time-based invalidation with hit/miss tracking
- **Spatial Indexing**: O(k) performance for proximity searches
- **Connection Pooling**: Reusable HTTP connections
- **Memory Management**: Efficient data structures

## Utility Categories

### Infrastructure
- `config.ts` - Application configuration
- `errors.ts` - Error handling framework
- `logger.ts` - Logging infrastructure
- `fileLogWriter.ts` - File operations

### Network & Data
- `http.ts` - HTTP client utilities
- `overpass.ts` - OSM data fetching
- `validation.ts` - Input validation
- `geospatial.ts` - Spatial operations

### Security & Rate Limiting
- `rateLimit.ts` - API protection

## Design Principles

1. **Framework Agnostic**: No Next.js, React, or browser dependencies
2. **Pure Functions**: Stateless utilities where possible
3. **Error Resilient**: Graceful handling of all failure modes
4. **Performance Focused**: Optimized for production workloads
5. **Testable**: Easy unit testing with clear interfaces
6. **Configurable**: Environment-aware with sensible defaults
7. **Logging Integrated**: Structured logging for monitoring

## Testing Strategy

### Unit Tests
Location: `tests/utils/`
- Fast, isolated testing
- Edge case coverage  
- Performance validation
- Error scenario testing

### Integration Tests
Utilities tested within service context:
- Real API interactions
- Configuration loading
- Error propagation

## Usage Patterns

### Service Integration
```typescript
// Dependency injection pattern
export class ValidationService {
  constructor(
    private config = getValidationConfig(),
    private logger = createAgentLogger('validation-service')
  ) {}
}
```

### Error Handling
```typescript
try {
  const result = await riskyOperation();
  return createSuccessResponse(result);
} catch (error) {
  logger.error('operation_failed', 'Operation description', { error });
  const appError = handleUnexpectedError(error);
  return createErrorResponse(appError);
}
```

### Configuration Access
```typescript
const rateLimitConfig = getRateLimitConfig();
// { maxSubmissions: 5, windowDuration: 3600000 }

const validationConfig = getValidationConfig();
// { coordinatePrecision: 6, maxNameLength: 100 }
```

## Guidelines

1. **Single Responsibility**: Each utility has one clear purpose
2. **Immutable**: Prefer pure functions over stateful utilities
3. **Type Safety**: Full TypeScript coverage with strict types
4. **Documentation**: JSDoc for all public functions
5. **Performance**: Profile and optimize critical paths
6. **Error Handling**: Never let errors propagate unhandled
7. **Testing**: Comprehensive test coverage for all edge cases
8. **Logging**: Structured logging for debugging and monitoring