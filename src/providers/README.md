# src/providers/

Data access layer implementations supporting the service-oriented architecture.

## Overview

This directory contains concrete implementations of data provider interfaces. Providers handle the complexity of data access, caching, and error handling while exposing clean interfaces to services.

## Current Providers

### FileToiletDataProvider
**Purpose**: File-based toilet data access with caching  
**File**: `fileToiletDataProvider.ts`  
**Interface**: `CachedToiletDataProvider`
**Data**: 1,041+ London toilet features from OpenStreetMap

**Features**:
- GeoJSON file reading with error handling
- Time-based cache invalidation (configurable TTL)
- Performance metrics (cache hits/misses)
- Atomic file operations for large datasets (480KB+ GeoJSON)
- Structured logging integration
- Integration with DuplicateService for geospatial operations

**Configuration**:
```typescript
interface FileToiletDataConfig {
  filePath: string;           // Path to GeoJSON file
  cacheValidityMs?: number;   // Cache TTL (default: 60000ms)
  encoding?: BufferEncoding;  // File encoding (default: 'utf8')
}
```

**Usage**:
```typescript
const provider = createFileToiletDataProvider({
  filePath: 'data/toilets.geojson',
  cacheValidityMs: 60000
});

const toilets = await provider.loadToilets();
const stats = await provider.getCacheStats();
```

## Architecture Integration

### Service Injection
Providers are injected into services for clean separation:
```typescript
// Production configuration
const dataProvider = createFileToiletDataProvider({
  filePath: config.toiletsData,
  cacheValidityMs: 60000
});

const duplicateService = new DuplicateService(dataProvider);
```

### Interface Compliance
All providers implement defined interfaces:
```typescript
export class FileToiletDataProvider implements CachedToiletDataProvider {
  async loadToilets(): Promise<ToiletFeature[]> { /* */ }
  async isDataAvailable(): Promise<boolean> { /* */ }
  async getMetadata(): Promise<{ /* */ }> { /* */ }
  async clearCache(): Promise<void> { /* */ }
  async getCacheStats(): Promise<{ /* */ }> { /* */ }
  isCacheValid(): boolean { /* */ }
}
```

### Error Handling
Providers implement robust error handling:
- File access errors → graceful degradation
- JSON parsing errors → detailed error reporting
- Cache errors → fallback to direct file access
- Network timeouts → retry with exponential backoff

## Design Patterns

### Provider Pattern
Encapsulates data access complexity:
- Clean interface for consumers
- Hidden implementation details
- Swappable implementations

### Cache-Aside Pattern
Manual cache management with fallback:
```typescript
// Check cache first
if (this.isCacheValid() && this.cachedData) {
  return this.cachedData; // Cache hit
}

// Cache miss - load from source
const data = await this.loadFromFile();
this.cachedData = data;
return data;
```

### Factory Pattern
Providers created through factory functions:
```typescript
export function createFileToiletDataProvider(
  config: FileToiletDataConfig
): FileToiletDataProvider {
  return new FileToiletDataProvider(config);
}
```

## Performance Features

### Intelligent Caching
- **Time-based invalidation**: Configurable TTL for cache entries
- **Hit/miss tracking**: Performance monitoring and optimization
- **Memory efficiency**: Only cache when beneficial
- **Cache statistics**: Real-time performance metrics

### Optimized File Operations
- **Async I/O**: Non-blocking file operations
- **Encoding optimization**: Configurable text encoding
- **Error resilience**: Graceful handling of file system issues
- **Atomic operations**: Consistent data access

### Monitoring Integration
- **Structured logging**: Performance and error tracking
- **Metrics collection**: Cache hit rates, load times
- **Health checks**: Data availability monitoring

## Testing Support

### Mock Provider
```typescript
class MockToiletDataProvider implements CachedToiletDataProvider {
  private mockData: ToiletFeature[] = [];
  
  async loadToilets(): Promise<ToiletFeature[]> {
    return this.mockData;
  }
  
  setMockData(data: ToiletFeature[]): void {
    this.mockData = data;
  }
  
  // Other interface methods...
}
```

### Test Helpers
```typescript
function createTestDataProvider(data?: ToiletFeature[]): CachedToiletDataProvider {
  const provider = new MockToiletDataProvider();
  if (data) provider.setMockData(data);
  return provider;
}
```

## Future Providers

### DatabaseToiletDataProvider
For production scalability:
```typescript
class DatabaseToiletDataProvider implements CachedToiletDataProvider {
  constructor(private connectionPool: DatabasePool) {}
  
  async loadToilets(): Promise<ToiletFeature[]> {
    const query = 'SELECT * FROM toilets WHERE enabled = true';
    const rows = await this.connectionPool.query(query);
    return rows.map(this.rowToFeature);
  }
}
```

### APIToiletDataProvider
For remote data sources:
```typescript
class APIToiletDataProvider implements CachedToiletDataProvider {
  constructor(private apiClient: HttpClient) {}
  
  async loadToilets(): Promise<ToiletFeature[]> {
    const response = await this.apiClient.get('/api/toilets');
    return response.features;
  }
}
```

### RedisToiletDataProvider
For distributed caching:
```typescript
class RedisToiletDataProvider implements CachedToiletDataProvider {
  constructor(private redisClient: RedisClient) {}
  
  async loadToilets(): Promise<ToiletFeature[]> {
    const cached = await this.redisClient.get('toilets:data');
    if (cached) return JSON.parse(cached);
    
    // Fallback to primary data source
    const data = await this.primaryProvider.loadToilets();
    await this.redisClient.setex('toilets:data', 300, JSON.stringify(data));
    return data;
  }
}
```

## Configuration Management

### Environment-Aware Configuration
```typescript
function createProductionDataProvider(): CachedToiletDataProvider {
  const config = getFilePathsConfig();
  
  return createFileToiletDataProvider({
    filePath: config.toiletsData,
    cacheValidityMs: process.env.NODE_ENV === 'production' ? 300000 : 60000,
    encoding: 'utf8'
  });
}
```

### Multi-Provider Strategy
```typescript
class CompositeToiletDataProvider implements CachedToiletDataProvider {
  constructor(
    private primary: CachedToiletDataProvider,
    private fallback: CachedToiletDataProvider
  ) {}
  
  async loadToilets(): Promise<ToiletFeature[]> {
    try {
      return await this.primary.loadToilets();
    } catch (error) {
      logger.warn('Primary provider failed, using fallback');
      return await this.fallback.loadToilets();
    }
  }
}
```

## Guidelines

1. **Interface First**: Always implement defined interfaces
2. **Error Resilience**: Handle all failure modes gracefully  
3. **Performance**: Optimize for production workloads
4. **Caching**: Implement intelligent caching strategies
5. **Logging**: Provide detailed operation logging
6. **Configuration**: Support environment-specific settings
7. **Testing**: Include comprehensive test coverage
8. **Documentation**: Document configuration options and usage patterns