---
title: "Prometheus Exporter Best Practices"
description: "Comprehensive guide for implementing Prometheus exporters with proper naming conventions, labels, HELP strings, and maintainability principles"
category: "cookbook"
last_updated: "2025-07-09"
author: "Platform Engineering Team"
version: "1.0.0"
audience: "developers"
complexity: "intermediate"
tags: ["prometheus", "exporter", "metrics", "monitoring", "observability"]
---

# Prometheus Exporter Best Practices

## Overview

This comprehensive guide covers best practices for implementing Prometheus exporters, focusing on proper naming conventions, effective use of labels, meaningful HELP strings, and maintainability principles. These practices ensure your metrics are consistent, discoverable, and provide maximum value for monitoring and alerting.

## Prerequisites

- **Node.js 20.x** or higher with npm
- **prom-client** library (`npm install prom-client`)
- Basic understanding of Prometheus concepts (metrics, labels, scraping)
- Familiarity with HTTP servers and REST APIs
- Understanding of the CityPee validation service architecture

## Implementation

### Step 1: Setup

Install the required dependencies and establish the basic exporter structure:

```bash
npm install prom-client
```

Create the basic exporter module:

```javascript
// src/exporters/prometheus.js
const client = require('prom-client');

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (process, Node.js runtime)
client.collectDefaultMetrics({ register });

module.exports = { register, client };
```

### Step 2: Core Implementation

Define metrics following Prometheus naming conventions and best practices:

```javascript
// src/exporters/prometheus.js (continued)
const { register, client } = require('./prometheus');

// 1. COUNTER: Monotonically increasing values
const validationRequestsTotal = new client.Counter({
  name: 'tier_validation_requests_total',
  help: 'Total number of validation requests processed by tier',
  labelNames: ['tier', 'version', 'endpoint'],
  registers: [register]
});

// 2. COUNTER: Error tracking
const validationErrorsTotal = new client.Counter({
  name: 'tier_validation_errors_total',
  help: 'Total number of validation errors by tier and error type',
  labelNames: ['tier', 'error_type', 'version'],
  registers: [register]
});

// 3. HISTOGRAM: Request duration tracking
const validationDuration = new client.Histogram({
  name: 'tier_validation_duration_seconds',
  help: 'Duration of validation requests in seconds',
  labelNames: ['tier', 'version'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
  registers: [register]
});

// 4. GAUGE: Current active connections
const activeConnections = new client.Gauge({
  name: 'validation_active_connections',
  help: 'Number of currently active validation connections',
  labelNames: ['endpoint'],
  registers: [register]
});

// Export metrics for use in application
module.exports = {
  register,
  validationRequestsTotal,
  validationErrorsTotal,
  validationDuration,
  activeConnections
};
```

### Step 3: Testing

Create comprehensive tests for your exporter:

```javascript
// tests/exporters/prometheus_test.js
import { describe, it, expect, beforeEach } from '@jest/globals';
import { register, validationRequestsTotal } from '../../src/exporters/prometheus.js';

describe('Prometheus Exporter', () => {
  beforeEach(() => {
    // Reset metrics before each test
    register.resetMetrics();
  });

  it('should increment validation requests counter', async () => {
    validationRequestsTotal.inc({ tier: 'core', version: 'v1', endpoint: '/suggest' });
    
    const metrics = await register.metrics();
    expect(metrics).toMatch(/tier_validation_requests_total{tier="core",version="v1",endpoint="\/suggest"} 1/);
  });

  it('should generate valid prometheus format', async () => {
    const metrics = await register.metrics();
    
    // Check for valid Prometheus format
    expect(metrics).toMatch(/# HELP/);
    expect(metrics).toMatch(/# TYPE/);
    expect(metrics).toMatch(/tier_validation_requests_total/);
  });
});
```

## Usage Examples

### Basic Counter Usage

```javascript
// In your validation service
const { validationRequestsTotal, validationErrorsTotal } = require('../exporters/prometheus');

async function validateSuggestion(data, tier = 'core') {
  // Increment request counter
  validationRequestsTotal.inc({ tier, version: 'v1', endpoint: '/suggest' });
  
  try {
    const result = await performValidation(data);
    return result;
  } catch (error) {
    // Increment error counter
    validationErrorsTotal.inc({ tier, error_type: error.name, version: 'v1' });
    throw error;
  }
}
```

### Histogram for Duration Tracking

```javascript
// Time validation operations
const { validationDuration } = require('../exporters/prometheus');

async function timedValidation(data, tier) {
  const endTimer = validationDuration.startTimer({ tier, version: 'v1' });
  
  try {
    const result = await validateSuggestion(data, tier);
    return result;
  } finally {
    endTimer(); // Automatically records duration
  }
}
```

### HTTP Endpoint Integration

```javascript
// src/routes/metrics.js
const express = require('express');
const { register } = require('../exporters/prometheus');

const router = express.Router();

router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
});

module.exports = router;
```

## Best Practices

### Naming Conventions

- **Use descriptive names**: `tier_validation_requests_total` vs `requests`
- **Include units**: `_seconds`, `_bytes`, `_total` for counters
- **Use snake_case**: `validation_duration_seconds` not `validationDurationSeconds`
- **Start with namespace**: `tier_validation_*` for CityPee validation metrics

### Labels Strategy

- **Keep cardinality low**: Avoid labels with unbounded values (user IDs, timestamps)
- **Use semantic labels**: `tier`, `version`, `error_type` provide meaningful grouping
- **Consistent label names**: Use the same label names across related metrics
- **Avoid redundant labels**: Don't duplicate information in metric name and labels

### HELP Strings

- **Be descriptive**: Explain what the metric measures and its purpose
- **Include units**: Specify if it's seconds, bytes, requests, etc.
- **Explain labels**: Describe what each label represents
- **Keep concise**: One clear sentence is better than a paragraph

### Performance Considerations

- **Use appropriate metric types**: Counters for totals, Histograms for durations, Gauges for current values
- **Configure histogram buckets**: Customize buckets for your use case (latency ranges)
- **Monitor memory usage**: High cardinality metrics can consume significant memory
- **Consider sampling**: For very high-frequency metrics, implement sampling strategies

### Maintainability Principles

- **Centralize metric definitions**: Keep all metrics in one module
- **Use consistent patterns**: Follow the same structure for similar metrics
- **Document business context**: Explain why metrics are important for your domain
- **Version your metrics**: Use labels to track API versions and enable gradual migration

## Troubleshooting

### Common Issues

1. **Issue**: High memory usage in production
   - **Symptoms**: Increasing Node.js memory consumption, slow scraping
   - **Solution**: Audit label cardinality, implement label cleanup, use histogram sampling

2. **Issue**: Metrics not appearing in Prometheus
   - **Symptoms**: Empty /metrics endpoint, missing metrics in Prometheus UI
   - **Solution**: Check metric registration, verify HTTP endpoint, review Prometheus configuration

3. **Issue**: Inconsistent metric naming
   - **Symptoms**: Metrics with similar names but different conventions
   - **Solution**: Establish naming guidelines, use metric prefixes, implement linting rules

4. **Issue**: Label cardinality explosion
   - **Symptoms**: Exponentially growing metric series, memory issues
   - **Solution**: Remove unbounded labels, aggregate high-cardinality dimensions, use recording rules

5. **Issue**: Slow metrics collection
   - **Symptoms**: Long response times for /metrics endpoint
   - **Solution**: Optimize metric collection, implement async collection, use metric caching

## Related Documentation

- [Metrics Export Guide](./recipe_metrics_export.md) - Complete observability implementation
- [Validation Service API](../reference/api/validation-service-api.md) - API contracts and endpoints
- [Performance Monitoring Runbook](../runbooks/performance-monitoring.md) - Operational procedures
- [Architecture Documentation](../explanations/architecture.md) - System design context

## References

### Prometheus Documentation
- [Prometheus Metric Types](https://prometheus.io/docs/concepts/metric_types/) - Official metric type reference
- [Prometheus Naming Conventions](https://prometheus.io/docs/practices/naming/) - Official naming guidelines
- [Prometheus Best Practices](https://prometheus.io/docs/practices/) - Comprehensive best practices guide

### prom-client Library
- [prom-client Documentation](https://github.com/siimon/prom-client) - Node.js Prometheus client library
- [prom-client Examples](https://github.com/siimon/prom-client/tree/master/example) - Implementation examples

### CityPee Context
- [Tiered Validation Recipe](./recipe_tiered_validation.md) - Understanding the validation tiers
- [Suggest Agent Recipe](./recipe_suggest_agent.md) - API implementation patterns
- [ADR-004 Validation Performance](../adr/ADR-004-validation-performance-caching.md) - Performance optimization decisions

### Industry Standards
- [OpenMetrics Specification](https://openmetrics.io/) - Standardized metrics format
- [SLI/SLO Best Practices](https://sre.google/sre-book/service-level-objectives/) - Service reliability metrics
- [Grafana Dashboard Design](https://grafana.com/docs/grafana/latest/best-practices/) - Visualization best practices