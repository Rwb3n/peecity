---
title: "How to Test API Endpoints"
description: "Guide covering various methods for testing CityPee API endpoints"
category: howto
version: "1.0.0"
last_updated: "2025-07-09"
---

# How to Test API Endpoints

This guide covers various methods for testing the CityPee API endpoints.

## Prerequisites

- Node.js and npm installed
- Project dependencies installed (`npm install`)
- Development server running (`npm run dev`)

## Testing Tools

### 1. cURL (Command Line)

Basic POST request:
```bash
curl -X POST http://localhost:3000/api/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 51.5074,
    "lng": -0.1278,
    "name": "Test Toilet"
  }'
```

With all v1 fields:
```bash
curl -X POST http://localhost:3000/api/suggest \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 192.168.1.100" \
  -d '{
    "lat": 51.5074,
    "lng": -0.1278,
    "name": "Victoria Station Toilets",
    "accessible": true,
    "hours": "24/7",
    "fee": 0.50,
    "description": "Near main entrance"
  }' | jq .
```

### Testing v2 API (Strict Validation)

Basic v2 request with all core properties:
```bash
curl -X POST http://localhost:3000/api/v2/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 51.5074,
    "lng": -0.1278,
    "@id": "node/123456789",
    "amenity": "toilets",
    "wheelchair": "yes",
    "access": "yes",
    "opening_hours": "24/7",
    "fee": true,
    "name": "Victoria Station Toilets"
  }' | jq .
```

v2 with extended OSM properties:
```bash
curl -X POST http://localhost:3000/api/v2/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 51.5074,
    "lng": -0.1278,
    "@id": "node/123456789",
    "amenity": "toilets",
    "wheelchair": "yes",
    "access": "yes",
    "opening_hours": "Mo-Fr 08:00-20:00; Sa-Su 09:00-18:00",
    "fee": true,
    "name": "Victoria Station Premium Facilities",
    "male": true,
    "female": true,
    "unisex": false,
    "changing_table": true,
    "toilets:disposal": "flush",
    "toilets:handwashing": true,
    "payment:contactless": "yes",
    "payment:cash": "no",
    "operator": "Network Rail",
    "level": "0",
    "check_date": "2025-07-07"
  }' | jq .
```

Testing validation errors:
```bash
# Missing required field
curl -X POST http://localhost:3000/api/suggest \
  -H "Content-Type: application/json" \
  -d '{"lng": -0.1278, "name": "Test"}' | jq .

# Invalid latitude
curl -X POST http://localhost:3000/api/suggest \
  -H "Content-Type: application/json" \
  -d '{"lat": 95, "lng": -0.1278, "name": "Test"}' | jq .
```

### 2. HTTPie (User-Friendly CLI)

Install HTTPie:
```bash
pip install httpie
# or
brew install httpie
```

Basic v1 request:
```bash
http POST localhost:3000/api/suggest \
  lat=51.5074 lng=-0.1278 name="Test Toilet"
```

With custom headers:
```bash
http POST localhost:3000/api/suggest \
  X-Forwarded-For:192.168.1.100 \
  lat=51.5074 lng=-0.1278 name="Test Toilet" \
  accessible=true hours="24/7" fee=0.50
```

v2 API request:
```bash
http POST localhost:3000/api/v2/suggest \
  lat=51.5074 lng=-0.1278 '@id'="node/123456789" \
  amenity="toilets" wheelchair="yes" access="yes" \
  opening_hours="24/7" fee=true name="Test Toilet" \
  male=true female=true changing_table=true
```

### 3. Postman

1. Create new request
2. Set method to POST
3. URL: `http://localhost:3000/api/suggest`
4. Headers:
   - `Content-Type: application/json`
5. Body (raw JSON):
   ```json
   {
     "lat": 51.5074,
     "lng": -0.1278,
     "name": "Test Toilet"
   }
   ```

### 4. VS Code REST Client

Create a file `test-api.http`:
```http
### Test Valid v1 Submission
POST http://localhost:3000/api/suggest
Content-Type: application/json

{
  "lat": 51.5074,
  "lng": -0.1278,
  "name": "Test Toilet",
  "accessible": true,
  "hours": "24/7"
}

### Test Valid v2 Submission (All Core Properties)
POST http://localhost:3000/api/v2/suggest
Content-Type: application/json

{
  "lat": 51.5074,
  "lng": -0.1278,
  "@id": "node/123456789",
  "amenity": "toilets",
  "wheelchair": "yes",
  "access": "yes",
  "opening_hours": "24/7",
  "fee": true,
  "name": "Test Toilet"
}

### Test v2 with Extended Properties
POST http://localhost:3000/api/v2/suggest
Content-Type: application/json

{
  "lat": 51.5074,
  "lng": -0.1278,
  "@id": "node/123456789",
  "amenity": "toilets",
  "wheelchair": "yes",
  "access": "yes",
  "opening_hours": "Mo-Fr 08:00-20:00",
  "fee": true,
  "name": "Premium Facilities",
  "male": true,
  "female": true,
  "unisex": false,
  "changing_table": true,
  "toilets:disposal": "flush",
  "payment:contactless": "yes",
  "operator": "City Council"
}

### Test Missing Latitude
POST http://localhost:3000/api/suggest
Content-Type: application/json

{
  "lng": -0.1278,
  "name": "Test Toilet"
}

### Test v2 Missing Core Property (Should Fail)
POST http://localhost:3000/api/v2/suggest
Content-Type: application/json

{
  "lat": 51.5074,
  "lng": -0.1278,
  "name": "Test Toilet"
}

### Test Rate Limiting
POST http://localhost:3000/api/suggest
Content-Type: application/json
X-Forwarded-For: 10.0.0.1

{
  "lat": 51.5074,
  "lng": -0.1278,
  "name": "Test Toilet {{$randomInt 1 1000}}"
}
```

## Testing Scenarios

### 1. Validation Testing

**Valid submission:**
```json
{
  "lat": 51.5074,
  "lng": -0.1278,
  "name": "Valid Toilet"
}
```
Expected: 201 Created

**Missing required field:**
```json
{
  "lng": -0.1278,
  "name": "Missing Latitude"
}
```
Expected: 400 Bad Request

**Invalid data type:**
```json
{
  "lat": "not-a-number",
  "lng": -0.1278,
  "name": "Invalid Type"
}
```
Expected: 400 Bad Request

**Out of range:**
```json
{
  "lat": 95,
  "lng": -0.1278,
  "name": "Invalid Latitude"
}
```
Expected: 400 Bad Request

### v2 API Validation Testing

**Valid v2 submission:**
```json
{
  "lat": 51.5074,
  "lng": -0.1278,
  "@id": "node/123456789",
  "amenity": "toilets",
  "wheelchair": "yes",
  "access": "yes",
  "opening_hours": "24/7",
  "fee": true,
  "name": "Valid v2 Toilet"
}
```
Expected: 201 Created

**Missing core property (v2):**
```json
{
  "lat": 51.5074,
  "lng": -0.1278,
  "name": "Missing Core Properties"
}
```
Expected: 400 Bad Request with tier information:
```json
{
  "validation": {
    "tierSummary": {
      "core": { "provided": 2, "required": 8 }
    },
    "errorsByTier": {
      "core": 6
    }
  }
}
```

**v2 with tier-based properties:**
```json
{
  "lat": 51.5074,
  "lng": -0.1278,
  "@id": "node/123456789",
  "amenity": "toilets",
  "wheelchair": "yes",
  "access": "yes",
  "opening_hours": "24/7",
  "fee": true,
  "name": "Tier Test",
  "male": true,              // high-frequency
  "operator": "Council",     // optional
  "roof:shape": "flat"       // specialized
}
```
Expected: 201 Created with validation summary

### 2. Duplicate Detection Testing

**First submission:**
```json
{
  "lat": 51.5074,
  "lng": -0.1278,
  "name": "Original Toilet"
}
```
Expected: 201 Created

**Duplicate within 50m:**
```json
{
  "lat": 51.5075,
  "lng": -0.1278,
  "name": "Duplicate Toilet"
}
```
Expected: 409 Conflict

**Non-duplicate (>50m away):**
```json
{
  "lat": 51.5100,
  "lng": -0.1278,
  "name": "Different Toilet"
}
```
Expected: 201 Created

### 3. Rate Limiting Testing

```bash
# Submit 5 requests quickly
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/suggest \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: 192.168.1.100" \
    -d "{\"lat\": 51.5074, \"lng\": -0.1278, \"name\": \"Test $i\"}"
  echo ""
done
```

Expected:
- Requests 1-5: 201 Created
- Request 6: 429 Too Many Requests

## Automated Testing

### Jest Integration Tests

```javascript
// test-suggest-api.test.js
const request = require('supertest');

describe('Suggest API', () => {
  const baseUrl = 'http://localhost:3000';
  
  describe('v1 API', () => {
    it('should accept valid submission', async () => {
      const response = await request(baseUrl)
        .post('/api/suggest')
        .send({
          lat: 51.5074,
          lng: -0.1278,
          name: 'Test Toilet'
        });
        
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.suggestionId).toBeDefined();
    });
    
    it('should reject invalid submission', async () => {
      const response = await request(baseUrl)
        .post('/api/suggest')
        .send({
          lng: -0.1278,
          name: 'Missing Latitude'
        });
        
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.validation.errors).toHaveLength(1);
    });
  });

  describe('v2 API', () => {
    it('should accept valid v2 submission with all core properties', async () => {
      const response = await request(baseUrl)
        .post('/api/v2/suggest')
        .send({
          lat: 51.5074,
          lng: -0.1278,
          '@id': 'node/123456789',
          amenity: 'toilets',
          wheelchair: 'yes',
          access: 'yes',
          opening_hours: '24/7',
          fee: true,
          name: 'Test v2 Toilet'
        });
        
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
    
    it('should reject v2 submission missing core properties', async () => {
      const response = await request(baseUrl)
        .post('/api/v2/suggest')
        .send({
          lat: 51.5074,
          lng: -0.1278,
          name: 'Missing Core'
        });
        
      expect(response.status).toBe(400);
      expect(response.body.validation.tierSummary.core.required).toBe(8);
      expect(response.body.validation.tierSummary.core.provided).toBeLessThan(8);
    });
    
    it('should validate tier-based properties', async () => {
      const response = await request(baseUrl)
        .post('/api/v2/suggest')
        .send({
          lat: 51.5074,
          lng: -0.1278,
          '@id': 'node/123456789',
          amenity: 'toilets',
          wheelchair: 'yes',
          access: 'yes',
          opening_hours: '24/7',
          fee: true,
          name: 'Tier Test',
          male: true,                    // high-frequency
          'toilets:disposal': 'flush',   // high-frequency
          operator: 'Council',           // optional
          'roof:shape': 'flat'           // specialized
        });
        
      expect(response.status).toBe(201);
      expect(response.body.validation.tierSummary).toBeDefined();
    });
  });
});
```

### Node.js Script

```javascript
// test-api.js
async function testSuggestAPI() {
  // v1 API test cases
  const v1TestCases = [
    {
      name: 'v1: Valid submission',
      endpoint: '/api/suggest',
      data: { lat: 51.5074, lng: -0.1278, name: 'Test' },
      expected: 201
    },
    {
      name: 'v1: Missing latitude',
      endpoint: '/api/suggest',
      data: { lng: -0.1278, name: 'Test' },
      expected: 400
    },
    {
      name: 'v1: Invalid latitude range',
      endpoint: '/api/suggest',
      data: { lat: 95, lng: -0.1278, name: 'Test' },
      expected: 400
    }
  ];
  
  // v2 API test cases
  const v2TestCases = [
    {
      name: 'v2: Valid with all core',
      endpoint: '/api/v2/suggest',
      data: {
        lat: 51.5074,
        lng: -0.1278,
        '@id': 'node/123456789',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: '24/7',
        fee: true,
        name: 'Test v2'
      },
      expected: 201
    },
    {
      name: 'v2: Missing core properties',
      endpoint: '/api/v2/suggest',
      data: { lat: 51.5074, lng: -0.1278, name: 'Test' },
      expected: 400
    },
    {
      name: 'v2: Extended properties',
      endpoint: '/api/v2/suggest',
      data: {
        lat: 51.5074,
        lng: -0.1278,
        '@id': 'node/123456789',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: '24/7',
        fee: true,
        name: 'Extended Test',
        male: true,
        female: true,
        'toilets:disposal': 'flush',
        operator: 'Council'
      },
      expected: 201
    }
  ];
  
  const allTests = [...v1TestCases, ...v2TestCases];
  
  for (const test of allTests) {
    try {
      const response = await fetch(`http://localhost:3000${test.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.data)
      });
      
      const result = await response.json();
      console.log(`${test.name}: ${response.status === test.expected ? '✓' : '✗'}`);
      
      if (response.status !== test.expected) {
        console.log(`  Expected: ${test.expected}, Got: ${response.status}`);
        console.log(`  Response:`, result);
      }
      
      // Show tier summary for v2 responses
      if (test.endpoint.includes('v2') && result.validation?.tierSummary) {
        console.log(`  Tier Summary:`, result.validation.tierSummary);
      }
    } catch (error) {
      console.error(`${test.name}: Error -`, error.message);
    }
  }
}

testSuggestAPI();
```

## Debugging Tips

### View Request/Response Details

With cURL:
```bash
curl -v -X POST http://localhost:3000/api/suggest \
  -H "Content-Type: application/json" \
  -d '{"lat": 51.5074, "lng": -0.1278, "name": "Test"}'
```

### Check Rate Limit Headers
```bash
curl -i -X POST http://localhost:3000/api/suggest \
  -H "Content-Type: application/json" \
  -d '{"lat": 51.5074, "lng": -0.1278, "name": "Test"}' \
  | grep -i "x-ratelimit"
```

### Test Different IP Addresses
```bash
# Test from different IPs
for ip in 10.0.0.{1..10}; do
  echo "Testing from IP: $ip"
  curl -s -X POST http://localhost:3000/api/suggest \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: $ip" \
    -d '{"lat": 51.5074, "lng": -0.1278, "name": "Test"}' \
    | jq .success
done
```

## Performance Testing

### Simple Load Test
```bash
# Send 100 requests with concurrency of 10
ab -n 100 -c 10 -p request.json -T application/json \
  http://localhost:3000/api/suggest
```

### Using k6
```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function() {
  let payload = JSON.stringify({
    lat: 51.5074 + (Math.random() - 0.5) * 0.01,
    lng: -0.1278 + (Math.random() - 0.5) * 0.01,
    name: `Test Toilet ${Math.random()}`
  });
  
  let params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  let res = http.post('http://localhost:3000/api/suggest', payload, params);
  
  check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

## Next Steps

- Review the [Suggest API Reference](../reference/api/suggest-api.md)
- Check [Debugging Guide](debug-suggest-agent.md) if tests fail
- See [Recipe: Suggest Agent](../cookbook/recipe_suggest_agent.md) for implementation details