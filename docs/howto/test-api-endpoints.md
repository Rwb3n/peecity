---
title: "How to Test API Endpoints"
description: "Guide covering various methods for testing CityPee API endpoints"
category: howto
version: "1.1.0"
last_updated: "2025-07-11"
tags: ["api", "testing", "endpoints", "jest", "curl", "validation", "integration-testing"]
author: "Development Team"
status: "published"
audience: "developers"
complexity: "intermediate"
dependencies: ["jest", "nock", "supertest", "httpie", "curl"]
related_files: ["../cookbook/recipe_react_hook_form_with_zod.md", "../cookbook/recipe_robust_react_testing.md"]
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

## Automated Integration Testing with Jest

For robust, repeatable, and automated testing of components that interact with API endpoints, manual tools like cURL are insufficient. The recommended approach is to use Jest's built-in mocking capabilities to simulate API responses within your test environment.

### Critical Lesson: Avoid `nock` in Modern React Testing

Based on extensive debugging experience with the ContributionForm component (see status/plan_frontend_ui_detailed_task_molecules_implementation_status.md), we have identified that `nock` can be extremely problematic in Jest/jsdom environments:

1. **Environment Mismatches**: `nock` intercepts at the Node.js HTTP level, but jsdom uses its own fetch implementation
2. **Base URL Issues**: Tests often fail to match interceptors due to URL construction differences
3. **Debugging Difficulty**: When nock fails, it's often silent or gives cryptic errors
4. **Timing Issues**: Race conditions between nock setup and component rendering

### Strongly Recommended Method: `jest.spyOn(global, 'fetch')`

The **proven and most reliable method** is to directly mock the global `fetch` function using `jest.spyOn`. This approach has been battle-tested through the ContributionForm debugging saga and provides:

- **Direct Control**: Mock at the exact level your component uses
- **Clear Debugging**: Easy to inspect what was called and with what arguments
- **Synchronous Behavior**: No timing issues or race conditions
- **Type Safety**: Full TypeScript support for mocked responses

#### Example: Testing a Component's API Interaction

The following example demonstrates how to test a component (e.g., `ContributionForm`) that makes a `POST` request to `/api/suggest`.

**File**: `tests/components/molecules/ContributionForm_test.tsx`

```tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContributionForm } from '@/components/molecules/ContributionForm';

// Mock the global fetch function before each test
beforeEach(() => {
  // jest.spyOn returns a mock function, allowing us to customize it for each test.
  // We use mockResolvedValue to simulate a successful API response.
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, id: 'new-toilet-123' }),
  } as Response);
});

// Restore the original fetch function after all tests are done
afterEach(() => {
  jest.restoreAllMocks();
});

describe('ContributionForm API Integration', () => {

  // Test Case 1: Successful Submission
  it('should call the suggest API with the correct payload on successful submission', async () => {
    render(<ContributionForm location={{ lat: 51.5, lng: -0.1 }} />);
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/toilet name/i), 'Test Toilet');
    await userEvent.click(screen.getByLabelText(/accessible/i));
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    // Assert that fetch was called correctly
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/suggest',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Toilet',
            lat: 51.5,
            lng: -0.1,
            accessible: true,
            // ... other fields
          }),
        })
      );
    });
  });

  // Test Case 2: API Returns an Error
  it('should display an error message if the API call fails', async () => {
    // Override the default mock for this specific test
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
    } as Response);
    
    render(<ContributionForm location={{ lat: 51.5, lng: -0.1 }} />);
    
    // Fill out and submit the form
    await userEvent.type(screen.getByLabelText(/toilet name/i), 'Test Toilet');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    // Assert that an error message is displayed
    expect(await screen.findByRole('alert')).toHaveTextContent(/internal server error/i);
  });

  // Test Case 3: Network Error
  it('should display a generic error on network failure', async () => {
    // Simulate a network error by rejecting the fetch promise
    (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    
    render(<ContributionForm location={{ lat: 51.5, lng: -0.1 }} />);
    
    // Fill out and submit the form
    await userEvent.type(screen.getByLabelText(/toilet name/i), 'Test Toilet');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    // Assert that a generic error message is shown
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to submit/i);
  });
});
```

### Common Pitfalls and Solutions

Based on real-world debugging experience, here are critical pitfalls to avoid:

#### 1. Form Data Not Reaching API

**Problem**: Your component collects form data but the API receives empty or partial payloads.

**Solution**: Ensure your form submission handler properly collects all form data:
```tsx
// ❌ BAD: Manual data collection can miss fields
const handleSubmit = () => {
  const data = {
    name: formData.name,
    // Easy to forget fields here!
  };
  fetch('/api/suggest', { body: JSON.stringify(data) });
};

// ✅ GOOD: Use React Hook Form's handleSubmit
const onSubmit = handleSubmit(async (data) => {
  // data contains ALL registered form fields
  await fetch('/api/suggest', { 
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data) 
  });
});
```

#### 2. Test Expectations vs Component Behavior

**Problem**: Tests expect immediate validation errors, but your form validates on submit.

**Solution**: Understand and test the actual UX pattern:
```tsx
// ❌ BAD: Expecting immediate validation
await userEvent.type(screen.getByLabelText(/name/i), 'ab');
expect(screen.getByText(/must be at least 3 characters/i)).toBeInTheDocument();

// ✅ GOOD: Test the actual behavior (validation on submit)
await userEvent.type(screen.getByLabelText(/name/i), 'ab');
await userEvent.click(screen.getByRole('button', { name: /submit/i }));
const error = await screen.findByText(/must be at least 3 characters/i);
expect(error).toBeInTheDocument();
```

#### 3. Focus Order Testing

**Problem**: Keyboard navigation tests fail due to unexpected tab order.

**Solution**: Test the actual DOM order, not your assumptions:
```tsx
// Debug helper to see actual tab order
const debugTabOrder = async () => {
  const elements = [];
  await userEvent.tab();
  while (document.activeElement && document.activeElement !== document.body) {
    elements.push({
      tag: document.activeElement.tagName,
      name: document.activeElement.getAttribute('name'),
      type: document.activeElement.getAttribute('type')
    });
    await userEvent.tab();
  }
  console.log('Tab order:', elements);
};
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