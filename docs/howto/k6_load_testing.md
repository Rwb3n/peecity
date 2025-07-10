---
title: "k6 Load Testing Guide"
description: "Comprehensive guide for load testing CityPee validation API using k6, including smoke tests, soak tests, thresholds, checks, output analysis, and compact mode"
category: "howto"
last_updated: "2025-07-09"
author: "Platform Engineering Team"
version: "1.0.0"
audience: "developers"
complexity: "intermediate"
tags: ["k6", "load-testing", "performance", "validation", "api-testing"]
---

# k6 Load Testing Guide

## Problem

Load testing is crucial for validating the CityPee API's performance under various load conditions. Without proper load testing, we cannot ensure the validation service can handle production traffic patterns, identify performance bottlenecks, or validate SLA compliance for tier-based validation latency requirements.

## Solution Overview

This guide provides a comprehensive approach to load testing the CityPee validation API using k6, covering smoke tests for basic functionality, soak tests for extended load scenarios, proper threshold configuration, validation checks, and output analysis techniques including compact mode for CI/CD integration.

## Prerequisites

- **k6 installed** - Download from [k6.io](https://k6.io/docs/get-started/installation/)
- **Node.js 20.x** - For any preprocessing scripts
- **CityPee API running** - Either locally or in test environment
- **Basic understanding** of HTTP APIs and validation service architecture
- **Knowledge of CityPee tiers** - Core, High-frequency, Optional, Specialized validation levels

## Step-by-Step Guide

### Step 1: Install k6 and Setup

Install k6 on your system:

```bash
# macOS (using Homebrew)
brew install k6

# Linux (using package manager)
sudo apt-get install k6

# Windows (using Chocolatey)
choco install k6

# Verify installation
k6 version
```

Create a test directory structure:

```bash
mkdir -p tests/load-testing/k6
cd tests/load-testing/k6
```

### Step 2: Basic Smoke Test Setup

Create a smoke test to validate basic API functionality:

```javascript
// tests/load-testing/k6/smoke-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 5 }, // Ramp up to 5 users over 2 minutes
    { duration: '5m', target: 5 }, // Stay at 5 users for 5 minutes
    { duration: '2m', target: 0 }, // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% of requests must be below 100ms
    http_req_failed: ['rate<0.1'], // Error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test core tier validation
  let corePayload = {
    lat: 51.5074,
    lng: -0.1278,
    name: 'Test Toilet',
    accessible: true,
    hours: '24/7',
    fee: 0,
    changing_table: false,
    payment_contactless: false,
    access: 'yes'
  };

  let response = http.post(`${BASE_URL}/api/suggest`, JSON.stringify(corePayload), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 100ms': (r) => r.timings.duration < 100,
    'response contains success': (r) => r.body.includes('success') || r.status === 200,
  });

  sleep(1);
}
```

### Step 3: Soak Test Configuration

Create a soak test for extended load scenarios:

```javascript
// tests/load-testing/k6/soak-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '5m', target: 20 }, // Ramp up to 20 users over 5 minutes
    { duration: '30m', target: 20 }, // Stay at 20 users for 30 minutes
    { duration: '5m', target: 0 }, // Ramp down to 0 users over 5 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests must be below 200ms
    http_req_failed: ['rate<0.05'], // Error rate must be below 5%
    http_reqs: ['rate>10'], // Request rate must be above 10 RPS
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data for different validation tiers
const testData = [
  // Core tier (minimal required fields)
  {
    tier: 'core',
    payload: {
      lat: 51.5074,
      lng: -0.1278,
      name: 'Core Test Toilet',
      accessible: true,
      hours: '24/7',
      fee: 0,
      changing_table: false,
      payment_contactless: false,
      access: 'yes'
    }
  },
  // High-frequency tier (additional common fields)
  {
    tier: 'high-frequency',
    payload: {
      lat: 51.5074,
      lng: -0.1278,
      name: 'High-Frequency Test Toilet',
      accessible: true,
      hours: '06:00-22:00',
      fee: 0.20,
      changing_table: true,
      payment_contactless: true,
      access: 'yes',
      male: true,
      female: true,
      unisex: false,
      'toilets:disposal': 'flush',
      operator: 'Westminster Council'
    }
  }
];

export default function () {
  // Randomly select test data
  const testCase = testData[Math.floor(Math.random() * testData.length)];
  
  let response = http.post(`${BASE_URL}/api/suggest`, JSON.stringify(testCase.payload), {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { tier: testCase.tier },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time acceptable': (r) => r.timings.duration < 200,
    'validation successful': (r) => r.status === 200 && !r.body.includes('error'),
  });

  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}
```

### Step 4: Advanced Thresholds and Checks

Create a comprehensive test with advanced thresholds:

```javascript
// tests/load-testing/k6/performance-test.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 10 }, // Steady state
    { duration: '2m', target: 20 }, // Ramp up further
    { duration: '5m', target: 20 }, // Higher load
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    // Global thresholds
    http_req_duration: ['p(95)<150', 'p(99)<300'],
    http_req_failed: ['rate<0.02'],
    
    // Tagged thresholds for different tiers
    'http_req_duration{tier:core}': ['p(95)<50'],
    'http_req_duration{tier:high-frequency}': ['p(95)<100'],
    'http_req_duration{tier:optional}': ['p(95)<200'],
    
    // Group-specific thresholds
    'group_duration{group:::validation}': ['p(95)<200'],
    'group_duration{group:::metrics}': ['p(95)<50'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  group('validation', function () {
    // Test core tier validation
    let coreResponse = http.post(`${BASE_URL}/api/suggest`, JSON.stringify({
      lat: 51.5074,
      lng: -0.1278,
      name: 'Core Load Test',
      accessible: true,
      hours: '24/7',
      fee: 0,
      changing_table: false,
      payment_contactless: false,
      access: 'yes'
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { tier: 'core' },
    });

    check(coreResponse, {
      'core validation status 200': (r) => r.status === 200,
      'core validation fast': (r) => r.timings.duration < 50,
    });

    sleep(0.5);

    // Test high-frequency tier validation
    let hfResponse = http.post(`${BASE_URL}/api/suggest`, JSON.stringify({
      lat: 51.5074,
      lng: -0.1278,
      name: 'High-Frequency Load Test',
      accessible: true,
      hours: '06:00-22:00',
      fee: 0.20,
      changing_table: true,
      payment_contactless: true,
      access: 'yes',
      male: true,
      female: true,
      unisex: false,
      'toilets:disposal': 'flush'
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { tier: 'high-frequency' },
    });

    check(hfResponse, {
      'high-frequency validation status 200': (r) => r.status === 200,
      'high-frequency validation acceptable': (r) => r.timings.duration < 100,
    });
  });

  group('metrics', function () {
    // Test metrics endpoint
    let metricsResponse = http.get(`${BASE_URL}/api/metrics`, {
      tags: { endpoint: 'metrics' },
    });

    check(metricsResponse, {
      'metrics endpoint available': (r) => r.status === 200,
      'metrics response fast': (r) => r.timings.duration < 50,
      'metrics contains validation data': (r) => r.body.includes('tier_validation'),
    });
  });

  sleep(1);
}
```

### Step 5: Output Analysis and Compact Mode

Run tests with different output formats:

```bash
# Standard output (human-readable)
k6 run tests/load-testing/k6/smoke-test.js

# Compact mode (CI/CD friendly)
k6 run --quiet tests/load-testing/k6/smoke-test.js

# JSON output for processing
k6 run --out json=results.json tests/load-testing/k6/smoke-test.js

# InfluxDB output for monitoring
k6 run --out influxdb=http://localhost:8086/k6 tests/load-testing/k6/soak-test.js

# Multiple outputs
k6 run --out json=results.json --out influxdb=http://localhost:8086/k6 tests/load-testing/k6/performance-test.js
```

### Step 6: CI/CD Integration

Create a CI-friendly test runner:

```javascript
// tests/load-testing/k6/ci-test.js
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  duration: '2m',
  vus: 10,
  thresholds: {
    http_req_duration: ['p(95)<100'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  let response = http.post(`${BASE_URL}/api/suggest`, JSON.stringify({
    lat: 51.5074,
    lng: -0.1278,
    name: 'CI Test Toilet',
    accessible: true,
    hours: '24/7',
    fee: 0,
    changing_table: false,
    payment_contactless: false,
    access: 'yes'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 100,
  });
}
```

## Verification

Verify your load testing setup:

1. **Run smoke test**: `k6 run tests/load-testing/k6/smoke-test.js`
2. **Check thresholds**: All thresholds should pass (green in output)
3. **Verify metrics**: Response times should be within expected ranges
4. **Test different tiers**: Ensure core tier performs better than optional tier
5. **Monitor resource usage**: Check CPU/memory usage during tests

Expected output indicators:
- ✓ All checks passing
- ✓ Thresholds met
- ✓ Request rate consistent
- ✓ No failed requests (or within acceptable limits)

## Troubleshooting

### Common Issues

1. **Problem**: High response times (>100ms for core tier)
   - **Symptoms**: p95 latency above thresholds, failed threshold checks
   - **Solution**: Check system resources, database performance, or reduce load

2. **Problem**: High error rates (>5%)
   - **Symptoms**: HTTP 500 errors, validation failures, timeout errors
   - **Solution**: Verify API health, check logs, ensure proper test data format

3. **Problem**: k6 connection errors
   - **Symptoms**: "connection refused", "network unreachable" errors
   - **Solution**: Verify BASE_URL, check API is running, test network connectivity

4. **Problem**: Inconsistent results
   - **Symptoms**: Variable response times, sporadic failures
   - **Solution**: Ensure consistent test environment, check for resource contention

5. **Problem**: Tests failing in CI but passing locally
   - **Symptoms**: Thresholds fail in CI environment
   - **Solution**: Adjust thresholds for CI environment, check CI resource limits

### Performance Optimization Tips

- **Gradual ramp-up**: Use stages to gradually increase load
- **Realistic sleep patterns**: Mimic actual user behavior
- **Connection pooling**: k6 reuses connections by default
- **Batch requests**: Use `http.batch()` for multiple simultaneous requests
- **Resource monitoring**: Monitor both k6 and target system resources

## Alternative Approaches

### Other Load Testing Tools

1. **Artillery.js**: JavaScript-based, good for complex scenarios
2. **Apache JMeter**: GUI-based, comprehensive feature set
3. **Locust**: Python-based, good for complex user behavior
4. **hey**: Simple HTTP load testing tool
5. **wrk**: Modern HTTP benchmarking tool

### Testing Strategies

1. **Gradual load increase**: Start small and gradually increase load
2. **Spike testing**: Test system response to sudden load increases
3. **Volume testing**: Test with large amounts of data
4. **Endurance testing**: Extended duration tests
5. **Stress testing**: Test system limits and failure points

## Related Documentation

- [Performance Monitoring Runbook](../runbooks/performance-monitoring.md) - Operational procedures for performance issues
- [Prometheus Exporter Recipe](../cookbook/recipe_prometheus_exporter.md) - Metrics collection best practices
- [Validation Service API](../reference/api/validation-service-api.md) - API contracts and endpoints
- [Tiered Validation Recipe](../cookbook/recipe_tiered_validation.md) - Understanding validation tiers
- [Architecture Documentation](../explanations/architecture.md) - System design context

### External Resources

- [k6 Documentation](https://k6.io/docs/) - Official k6 documentation
- [k6 Examples](https://github.com/grafana/k6/tree/master/examples) - Example test scripts
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/performance-testing-best-practices/) - k6 testing guidelines
- [Load Testing Patterns](https://k6.io/docs/test-types/) - Different types of load tests

### CityPee Context

- [ADR-004 Validation Performance](../adr/ADR-004-validation-performance-caching.md) - Performance optimization decisions
- [Metrics Export Guide](../cookbook/recipe_metrics_export.md) - Observability implementation
- [Suggest Agent Recipe](../cookbook/recipe_suggest_agent.md) - API implementation patterns