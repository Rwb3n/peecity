---
title: "How to Debug Suggest Agent Issues"
description: "Developer guide for diagnosing and fixing suggest-agent API endpoint issues"
category: howto
version: "1.0.0"
last_updated: "2025-07-09"
---

# How to Debug Suggest Agent Issues

This guide helps developers diagnose and fix issues with the suggest-agent API endpoint.

## Common Issues and Solutions

### 1. API Returns 500 Error for All Requests

**Symptoms:**
- All requests return HTTP 500
- Tests fail with "Expected 400/201/429, received 500"
- Error message: "Internal server error occurred"

**Debugging Steps:**

1. **Check Service Initialization**
   ```bash
   # Verify services are exported correctly
   grep -n "export const" src/services/*.ts
   ```
   Each service should have a singleton export like:
   ```typescript
   export const validationService = new ValidationService();
   ```

2. **Check File System Access**
   ```bash
   # Verify data file exists (should contain 1,042 London toilet locations)
   ls -la data/toilets.geojson
   
   # Check feature count
   grep -c '"type": "Feature"' data/toilets.geojson
   
   # If missing, regenerate using ingest agent
   npm run ingest
   
   # Check logs directory permissions
   ls -la logs/
   
   # Create logs directory if missing
   mkdir -p logs
   ```

3. **Add Debug Logging**
   ```typescript
   // In src/app/api/suggest/route.ts catch block
   console.error('Suggest API Error:', {
     error: error instanceof Error ? error.stack : error,
     message: error instanceof Error ? error.message : 'Unknown error',
     type: error?.constructor?.name
   });
   ```

4. **Test Services in Isolation**
   ```javascript
   // Create test-services.js
   const { validationService } = require('./src/services');
   
   async function testServices() {
     try {
       const result = await validationService.validateRequest({
         body: '{"lat": 51.5, "lng": -0.1, "name": "Test"}',
         ipAddress: '127.0.0.1'
       });
       console.log('Validation result:', result);
     } catch (error) {
       console.error('Service error:', error);
     }
   }
   
   testServices();
   ```

### 2. TypeScript Compilation Issues

**Symptoms:**
- "Cannot find module" errors
- Services not loading in tests
- Import errors in Jest

**Solutions:**

1. **Verify TypeScript Configuration**
   ```bash
   # Check ts-jest is installed
   npm list ts-jest
   
   # Verify jest.config.js includes TypeScript transform
   grep -A 5 "transform" jest.config.js
   ```

2. **Fix Import Paths**
   - Use relative imports without extensions in TypeScript files
   - Ensure `moduleNameMapper` in jest.config.js handles `@/` alias

3. **Clear Jest Cache**
   ```bash
   npm test -- --clearCache
   ```

### 3. Rate Limiting Not Working

**Symptoms:**
- Can submit more than 5 requests per hour
- Rate limit headers missing
- Tests expecting 429 receive 201

**Debugging:**

1. **Check Rate Limit Store**
   ```javascript
   // In src/utils/rateLimit.ts
   export function getRateLimitStats() {
     return rateLimitStore.getStats();
   }
   ```

2. **Verify IP Extraction**
   ```typescript
   // Add logging in extractIPAddress
   console.log('Headers:', Object.fromEntries(request.headers.entries()));
   console.log('Extracted IP:', ipAddress);
   ```

### 4. Duplicate Detection Failures

**Symptoms:**
- Duplicates not detected within 50m
- Wrong distance calculations
- Missing toilet data

**Debugging:**

1. **Verify Data Loading**
   ```javascript
   // Test data provider
   const { duplicateService } = require('./src/services');
   const toilets = await duplicateService.dataProvider.loadToilets();
   console.log('Loaded toilets:', toilets.length);
   ```

2. **Test Distance Calculation**
   ```javascript
   const { calculateDistance } = require('./src/utils/geospatial');
   const distance = calculateDistance(51.5074, -0.1278, 51.5076, -0.1278);
   console.log('Distance:', distance); // Should be ~22m
   ```

## Environment Setup

### Required Files and Directories

```bash
# Create necessary directories
mkdir -p logs
mkdir -p data

# Verify file permissions
chmod 755 logs
chmod 644 data/toilets.geojson

# Check if toilets data exists
test -f data/toilets.geojson && echo "Data file exists" || echo "Data file missing"
```

### Environment Variables

The suggest-agent doesn't require environment variables, but ensure:
- No `NODE_ENV=production` in tests (would disable detailed errors)
- Working directory is project root

## Testing Tools

### 1. Direct API Testing

```bash
# Test with cURL
curl -X POST http://localhost:3000/api/suggest \
  -H "Content-Type: application/json" \
  -d '{"lat": 51.5, "lng": -0.1, "name": "Test toilet"}'

# Test with httpie
http POST localhost:3000/api/suggest \
  lat=51.5 lng=-0.1 name="Test toilet"
```

### 2. Unit Test Debugging

```bash
# Run single test file with verbose output
npm test -- tests/agents/suggest_agent_validation_test.js --verbose

# Run with Node debugging
node --inspect-brk node_modules/.bin/jest tests/agents/suggest_agent_validation_test.js
```

### 3. Integration Test Pattern

```javascript
// Create minimal-suggest-test.js
const { POST } = require('./src/app/api/suggest/route');

async function minimalTest() {
  const request = new Request('http://localhost:3000/api/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat: 51.5, lng: -0.1, name: 'Test' })
  });
  
  try {
    const response = await POST(request);
    console.log('Status:', response.status);
    console.log('Body:', await response.text());
  } catch (error) {
    console.error('Error:', error);
  }
}

minimalTest();
```

## Logging and Monitoring

### Enable Debug Logging

```typescript
// In src/utils/logger.ts
export function createAgentLogger(agent: string) {
  return {
    debug: (event, message, data) => {
      if (process.env.DEBUG) {
        console.log(`[${agent}] ${event}:`, message, data);
      }
    },
    // ... other methods
  };
}
```

Run tests with debug enabled:
```bash
DEBUG=1 npm test
```

### Check Suggestion Logs

```bash
# View recent submissions
tail -n 50 logs/suggestions.log | jq .

# Count submissions by status
grep -o '"status":"[^"]*"' logs/suggestions.log | sort | uniq -c

# Find errors
grep '"status":"error"' logs/suggestions.log | jq .
```

## Performance Debugging

### Memory Leaks

```bash
# Run with memory profiling
node --expose-gc --inspect app.js

# Take heap snapshot in Chrome DevTools
```

### Slow Response Times

1. Add timing logs:
   ```typescript
   const start = Date.now();
   // ... operation ...
   logger.debug('timing', `Operation took ${Date.now() - start}ms`);
   ```

2. Profile service methods:
   - Data loading time
   - Distance calculations
   - File I/O operations

## Next Steps

If issues persist after following this guide:

1. Create minimal reproduction case
2. Check issue tracker for similar problems
3. Add detailed error logging to pinpoint failure
4. Consider adding integration tests with mocked services
5. Review `docs/cookbook/recipe_suggest_agent.md` for implementation patterns

## Related Documentation

- [Suggest API Reference](../reference/api/suggest-api.md)
- [Recipe: Suggest Agent Patterns](../cookbook/recipe_suggest_agent.md)
- [Architecture Specification](../explanations/architecture.md)
- [Testing Guide](../howto/test-api-endpoints.md)