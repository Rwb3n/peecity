# src/interfaces/

Contracts and abstractions enabling dependency injection and clean architecture.

## Overview

This directory contains TypeScript interfaces that define contracts between services and their dependencies. These interfaces enable dependency injection, improve testability, and support the SOLID principles throughout the codebase.

## Interface Files

### toiletDataProvider.ts
**Purpose**: Abstraction for toilet data access (GeoJSON FeatureCollections)  
**Implementations**: `FileToiletDataProvider`

**Interfaces**:
- `ToiletDataProvider` - Basic data access contract (loadToilets, metadata)
- `CachedToiletDataProvider` - Extended with caching capabilities (used by DuplicateService)

**Methods**:
- `loadToilets()` - Fetch toilet feature data
- `isDataAvailable()` - Check data availability
- `getMetadata()` - Retrieve data source information
- `clearCache()` - Cache management
- `getCacheStats()` - Performance monitoring

### AlertSender.ts
**Purpose**: Abstraction for alert notification channels (Discord, Slack, Email)
**Implementations**: `DiscordAlertSender`

**Interfaces**:
- `AlertSender` - Contract for sending alert notifications
- `AlertData` - Data structure for alert content
- `AlertSendResult` - Result object with success/error information

**Methods**:
- `sendAlert(data: AlertData)` - Send alert notification
- `getChannelName()` - Get channel identifier for logging
- `isConfigured()` - Check if sender is properly configured

### MetricsCollector.ts
**Purpose**: Abstraction for metrics collection from various sources
**Implementations**: `ValidationSummaryMetricsCollector`, `PrometheusMetricsCollector`

**Interfaces**:
- `MetricsCollector` - Contract for collecting metrics data
- `MetricsData` - Structure for metrics information
- `MetricsCollectionResult` - Result object with collected data

**Methods**:
- `collectMetrics(requestedMetrics?: string[])` - Collect metrics from source
- `getSourceName()` - Get source identifier for logging
- `isAvailable()` - Check if collector is available
- `getAvailableMetrics()` - List available metrics

## Architecture Benefits

### Dependency Injection
Interfaces enable clean dependency injection:
```typescript
export class DuplicateService {
  constructor(private dataProvider: CachedToiletDataProvider) {}
}

// Production
const fileProvider = new FileToiletDataProvider({ filePath: 'data/toilets.geojson' });
const duplicateService = new DuplicateService(fileProvider);

// Testing  
const mockProvider = new MockToiletDataProvider();
const testService = new DuplicateService(mockProvider);
```

### SOLID Principles

#### Single Responsibility Principle
Each interface has one clear responsibility:
- `ToiletDataProvider` - Data access only
- `CachedToiletDataProvider` - Adds caching concerns

#### Open/Closed Principle  
Services are open for extension through interfaces:
```typescript
// New implementation without changing DuplicateService
class DatabaseToiletDataProvider implements CachedToiletDataProvider {
  // Implementation details
}
```

#### Dependency Inversion Principle
High-level services depend on abstractions, not concretions:
```typescript
// DuplicateService depends on interface, not FileToiletDataProvider
class DuplicateService {
  constructor(private dataProvider: CachedToiletDataProvider) {}
}
```

### Testing Benefits

#### Easy Mocking
Interfaces make service testing straightforward:
```typescript
const mockDataProvider: CachedToiletDataProvider = {
  loadToilets: jest.fn().mockResolvedValue([]),
  isDataAvailable: jest.fn().mockResolvedValue(true),
  getMetadata: jest.fn().mockResolvedValue({ source: 'test' }),
  clearCache: jest.fn(),
  getCacheStats: jest.fn().mockResolvedValue({ isValid: true }),
  isCacheValid: jest.fn().mockReturnValue(true)
};
```

#### Service Isolation
Services can be tested independently:
- Mock external dependencies
- Test business logic in isolation
- Verify interface contracts

## Design Patterns

### Provider Pattern
Data providers implement consistent interfaces:
- `FileToiletDataProvider` - Filesystem-based implementation
- `MockToiletDataProvider` - Testing implementation
- Future: `DatabaseToiletDataProvider`, `APIToiletDataProvider`

### Factory Pattern
Providers can be created through factories:
```typescript
function createToiletDataProvider(config: DataConfig): CachedToiletDataProvider {
  switch (config.type) {
    case 'file': return new FileToiletDataProvider(config);
    case 'database': return new DatabaseToiletDataProvider(config);
    default: throw new Error('Unknown provider type');
  }
}
```

### Strategy Pattern
Different implementations for different contexts:
- Production: File-based with caching
- Testing: In-memory with controlled data
- Development: Mock with predictable responses

## Interface Design Guidelines

### Contracts Over Implementations
- Define behavior, not implementation details
- Use abstract methods and properties
- Avoid exposing internal state

### Composable Interfaces
- Break complex contracts into focused interfaces
- Use inheritance for shared concerns
- Enable mix-and-match implementations

### Async by Default
- Most operations are potentially I/O bound
- Use Promise return types consistently
- Enable non-blocking service operations

### Error Handling
- Define clear error conditions in contracts
- Use typed exceptions where appropriate
- Document expected error scenarios

## Future Interfaces

As the architecture evolves, consider adding:

### LogWriter Interface
```typescript
interface LogWriter {
  write(data: string): Promise<void>;
  writeBatch(entries: string[]): Promise<void>;
  rotate(): Promise<void>;
}
```

### ConfigProvider Interface
```typescript
interface ConfigProvider {
  get<T>(key: string): T;
  set<T>(key: string, value: T): void;
  watch(key: string, callback: (value: any) => void): void;
}
```

### CacheProvider Interface
```typescript
interface CacheProvider<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttl?: number): Promise<void>;
  invalidate(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

## Maintenance Guidelines

1. **Stability**: Interfaces should change infrequently
2. **Versioning**: Consider versioned interfaces for breaking changes
3. **Documentation**: Include comprehensive JSDoc comments
4. **Examples**: Provide usage examples in documentation
5. **Testing**: All implementations must pass interface compliance tests
6. **Backwards Compatibility**: Extend rather than modify existing interfaces