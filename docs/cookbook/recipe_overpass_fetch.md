---
id: recipe-overpass-fetch
title: "Recipe: Overpass Fetch"
description: "Utility recipe for querying Overpass API with robust timeout, retry, and caching using http.ts and overpass.ts"
version: 1.0.0
last_updated: "2025-07-09"
category: cookbook
---
# Recipe: Overpass Fetch Utility

This recipe explains how to use `src/utils/http.ts` and `src/utils/overpass.ts` to query the Overpass API with robust timeout, retry, and caching.

## Overview

This recipe provides a robust, reusable utility for querying the Overpass API with built-in retry logic, caching, and error handling. It's designed to be used by multiple agents (ingest-agent, suggest-agent, monitor-agent) that need to fetch OSM data.

## Core Features

- **Retry Logic**: Automatic retry with exponential backoff for 429 and 5xx errors
- **Caching**: In-memory caching with configurable expiry
- **Performance Monitoring**: Built-in benchmarking and metrics
- **Type Safety**: Full TypeScript support with proper interfaces
- **Error Handling**: Comprehensive error handling for network issues
- **Native HTTP**: Uses Node.js native HTTP modules for better compatibility

## Usage

### Basic Query

```typescript
import { queryOverpass, TOILET_QUERIES } from '../utils/overpass';

// Simple query
const data = await queryOverpass(TOILET_QUERIES.LONDON);

// Custom configuration
const data = await queryOverpass('custom query', {
  apiUrl: 'https://custom-overpass.example.com/api/interpreter',
  retryAttempts: 5,
  timeoutMs: 60000,
  enableCache: true,
  cacheExpiryMs: 600000 // 10 minutes
});
```

### Predefined Queries

```typescript
import { TOILET_QUERIES } from '../utils/overpass';

// London-wide toilets
const londonData = await queryOverpass(TOILET_QUERIES.LONDON);

// Borough-specific toilets
const westminsterData = await queryOverpass(TOILET_QUERIES.BOROUGH('Westminster'));

// Radius-based query
const nearbyData = await queryOverpass(
  TOILET_QUERIES.AROUND_POINT(51.5074, -0.1278, 1000)
);
```

### Performance Monitoring

```typescript
import { benchmarkQuery, getPerformanceMetrics } from '../utils/overpass';

// Benchmark a query
const benchmark = await benchmarkQuery(TOILET_QUERIES.LONDON);
console.log(`Query took ${benchmark.duration}ms, cached: ${benchmark.cached}`);

// Get cache metrics
const metrics = getPerformanceMetrics();
console.log(`Cache size: ${metrics.cacheSize}, enabled: ${metrics.cacheEnabled}`);
```

### Cache Management

```typescript
import { clearCache } from '../utils/overpass';

// Clear cache when needed
clearCache();
```

## Configuration Options

```typescript
interface OverpassConfig {
  apiUrl: string;          // Overpass API endpoint
  retryAttempts: number;   // Number of retry attempts (default: 3)
  retryDelayMs: number;    // Initial retry delay in ms (default: 1000)
  timeoutMs: number;       // Request timeout in ms (default: 30000)
  userAgent?: string;      // Custom user agent
  enableCache?: boolean;   // Enable/disable caching (default: true)
  cacheExpiryMs?: number;  // Cache expiry in ms (default: 300000)
}
```

## Error Handling

The utility automatically handles:
- **429 Rate Limiting**: Retry with exponential backoff
- **5xx Server Errors**: Retry with exponential backoff
- **Network Timeouts**: Configurable timeout with proper error messages
- **Invalid JSON**: Proper error handling for malformed responses
- **Connection Errors**: Comprehensive error reporting

## Best Practices

### 1. Use Appropriate Timeouts

```typescript
// For quick queries
const data = await queryOverpass(query, { timeoutMs: 10000 });

// For complex queries
const data = await queryOverpass(query, { timeoutMs: 60000 });
```

### 2. Configure Caching Based on Use Case

```typescript
// For frequently accessed data
const data = await queryOverpass(query, {
  enableCache: true,
  cacheExpiryMs: 3600000 // 1 hour
});

// For real-time data
const data = await queryOverpass(query, {
  enableCache: false
});
```

### 3. Handle Errors Gracefully

```typescript
try {
  const data = await queryOverpass(query);
  // Process data
} catch (error) {
  if (error.message.includes('429')) {
    // Rate limited - implement backoff
  } else if (error.message.includes('timeout')) {
    // Timeout - retry with longer timeout
  } else {
    // Other errors - log and handle appropriately
  }
}
```

### 4. Use Predefined Queries

```typescript
// ✅ Use predefined queries for consistency
const data = await queryOverpass(TOILET_QUERIES.LONDON);

// ❌ Avoid hardcoded queries
const data = await queryOverpass('[out:json]...');
```

## Performance Considerations

- **Caching**: Enabled by default, significantly reduces API calls
- **Retry Logic**: Exponential backoff prevents overwhelming the API
- **Timeouts**: Configurable timeouts prevent hanging requests
- **Memory Usage**: Cache size is monitored and can be cleared manually

## Testing

The utility includes comprehensive tests covering:
- Basic query functionality
- Retry logic for different error types
- Caching behavior
- Performance benchmarking
- Error handling

Use the provided test patterns when creating similar utilities:

```typescript
// Mock API responses
nock('https://overpass-api.de')
  .post('/api/interpreter')
  .reply(200, mockResponse);

// Test with configuration
const result = await queryOverpass('test query', {
  retryAttempts: 2,
  enableCache: false
});
```

## Integration Examples

### In Ingest Agent

```typescript
import { queryOverpass, TOILET_QUERIES } from '../src/utils/overpass';

async function fetchOverpassData(): Promise<OverpassResponse> {
  const data = await queryOverpass(TOILET_QUERIES.LONDON, {
    apiUrl: CONFIG.overpassApiUrl,
    retryAttempts: CONFIG.retryAttempts,
    retryDelayMs: CONFIG.retryDelayMs,
    timeoutMs: CONFIG.timeoutMs,
    userAgent: 'CityPee/1.0',
    enableCache: process.env.NODE_ENV !== 'test',
    cacheExpiryMs: 300000
  });
  return data;
}
```

### In Monitor Agent

```typescript
import { benchmarkQuery, TOILET_QUERIES } from '../src/utils/overpass';

async function monitorAPIPerformance(): Promise<void> {
  const benchmark = await benchmarkQuery(TOILET_QUERIES.LONDON);
  
  if (benchmark.duration > 10000) {
    console.warn('API performance degraded:', benchmark);
  }
}
```

## Troubleshooting

### Common Issues

1. **Rate Limiting**: Increase retry attempts or delay
2. **Timeouts**: Increase timeout or simplify query
3. **Cache Issues**: Clear cache or disable for testing
4. **Memory Usage**: Monitor cache size and clear periodically

### Debug Mode

Enable debug logging by setting environment variables:

```bash
DEBUG=overpass:* npm run ingest
```

## Future Enhancements

- Add support for custom retry strategies
- Implement persistent caching (Redis/file-based)
- Add query optimization suggestions
- Support for streaming large responses
- Add rate limiting compliance helpers

## Key Points

1. AbortController handles request timeout; adjust `timeoutMs` per use-case.
2. Exponential back-off retry controlled via `retryAttempts` and `retryDelayMs`.
3. In-memory cache with configurable expiry (`cacheExpiryMs`).
4. HTTP helpers live in `utils/http.ts`; reuse for other external fetches.

> **Note (2025-07-04)**  The higher-level data fetch workflow is now encapsulated in `src/services/ingestService.ts`, with a thin CLI wrapper (`scripts/ingest-cli.ts`).  This recipe still applies for the core Overpass pattern but refer to that service for a full service-oriented implementation example.

