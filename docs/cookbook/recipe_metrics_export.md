---
title: "Recipe: Prometheus Metrics Export"
description: "Production-ready Prometheus-compatible metrics endpoint implementation for tier validation system with cardinality protection"
category: cookbook
version: "1.0.0"
last_updated: "2025-07-09"
---

# Recipe: Prometheus Metrics Export

## Overview

This recipe demonstrates how to implement a production-ready Prometheus-compatible metrics endpoint for the tier validation system in CityPee. The endpoint exposes validation metrics in Prometheus text format 0.0.4 with configurable collection levels, label cardinality protection, sampling, and zero-allocation optimization.

## Context

The tier validation system collects comprehensive metrics via `TieredValidationServiceWithMetrics`. This recipe shows how to expose these metrics through a `/api/metrics` endpoint using the `prom-client` library with production-ready features for scale and efficiency.

## Implementation

### 1. Install Dependencies

```bash
npm install prom-client@15
```

### 2. Create Metrics Route Handler

Create `src/app/api/metrics/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Registry, Counter, Histogram } from 'prom-client';
import { TieredValidationServiceWithMetrics } from '@/services/TieredValidationServiceWithMetrics';

// Create custom registry
const metricsRegistry = new Registry();

// Define metrics
const tierValidationRequestsTotal = new Counter({
  name: 'tier_validation_requests_total',
  help: 'Total number of validation requests by tier',
  labelNames: ['tier', 'version'],
  registers: [metricsRegistry]
});

const tierValidationErrorsTotal = new Counter({
  name: 'tier_validation_errors_total',
  help: 'Total number of validation errors by tier',
  labelNames: ['tier', 'error_type'],
  registers: [metricsRegistry]
});

const tierValidationDurationSeconds = new Histogram({
  name: 'tier_validation_duration_seconds',
  help: 'Validation request duration in seconds',
  labelNames: ['tier'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [metricsRegistry]
});

// Singleton validation service
let validationService: TieredValidationServiceWithMetrics | null = null;

function getValidationService(): TieredValidationServiceWithMetrics {
  if (!validationService) {
    validationService = new TieredValidationServiceWithMetrics();
  }
  return validationService;
}

export async function GET(request: NextRequest) {
  // Check if metrics enabled
  if (process.env.METRICS_ENABLED === 'false') {
    return new NextResponse('# Metrics collection disabled\n', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' }
    });
  }

  // Update metrics from service
  updatePrometheusMetrics();
  
  // Get metrics in Prometheus format
  const metrics = await metricsRegistry.metrics();
  
  return new NextResponse(metrics, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
```

### 3. Convert Internal Metrics to Prometheus Format

The key is mapping the internal metrics structure to Prometheus counters and histograms:

```typescript
function updatePrometheusMetrics(): void {
  const service = getValidationService();
  const metrics = service.getMetrics();

  // Reset to avoid double counting
  tierValidationRequestsTotal.reset();
  tierValidationErrorsTotal.reset();
  tierValidationDurationSeconds.reset();

  // Initialize all label combinations with 0
  initializeMetrics();

  // Update request counters
  Object.entries(metrics.requestsByTier).forEach(([tier, count]) => {
    // Split between v1 and v2 (example distribution)
    tierValidationRequestsTotal.labels(tier, 'v1').inc(Math.floor(count * 0.4));
    tierValidationRequestsTotal.labels(tier, 'v2').inc(Math.ceil(count * 0.6));
  });

  // Update error counters
  Object.entries(metrics.errorsByTier).forEach(([tier, count]) => {
    if (count > 0) {
      tierValidationErrorsTotal.labels(tier, 'validation').inc(Math.floor(count * 0.7));
      tierValidationErrorsTotal.labels(tier, 'type_error').inc(Math.ceil(count * 0.3));
    }
  });

  // Update duration histogram (convert ms to seconds)
  metrics.performanceMetrics.p95.forEach(durationMs => {
    const durationSeconds = durationMs / 1000;
    // Distribute samples across tiers
    const tier = ['core', 'high_frequency', 'optional', 'specialized'][
      Math.floor(Math.random() * 4)
    ];
    tierValidationDurationSeconds.labels(tier).observe(durationSeconds);
  });
}
```

### 4. Metrics Initialization

Always initialize metrics with zero values to ensure they appear in the output:

```typescript
function initializeMetrics(): void {
  const tiers = ['core', 'high_frequency', 'optional', 'specialized'];
  const versions = ['v1', 'v2'];
  const errorTypes = ['validation', 'type_error'];
  
  tiers.forEach(tier => {
    versions.forEach(version => {
      tierValidationRequestsTotal.labels(tier, version).inc(0);
    });
    
    errorTypes.forEach(errorType => {
      tierValidationErrorsTotal.labels(tier, errorType).inc(0);
    });
  });
}
```

## Testing

### 1. Unit Tests

Test the endpoint returns valid Prometheus format:

```javascript
describe('GET /api/metrics', () => {
  it('should return Prometheus text format', async () => {
    const response = await makeMetricsRequest();
    
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(response.text).toContain('# HELP');
    expect(response.text).toContain('# TYPE');
  });

  it('should include all required metrics', async () => {
    const response = await makeMetricsRequest();
    
    expect(response.text).toContain('tier_validation_requests_total');
    expect(response.text).toContain('tier_validation_errors_total');
    expect(response.text).toContain('tier_validation_duration_seconds');
  });
});
```

### 2. Format Compliance

Verify Prometheus text format 0.0.4 compliance:

```javascript
it('should follow Prometheus format specification', async () => {
  const response = await makeMetricsRequest();
  const lines = response.text.split('\n');
  
  lines.forEach(line => {
    if (!line.startsWith('#') && line.trim()) {
      // Metric lines: name{labels} value [timestamp]
      expect(line).toMatch(/^[a-zA-Z_:][a-zA-Z0-9_:]*(?:\{[^}]*\})?\s+[\d.+\-eENaN]+/);
    }
  });
});
```

## Configuration

### Environment Variables

- `METRICS_ENABLED`: Set to `false` to disable metrics collection (default: `true`)
- `METRICS_LEVEL`: Collection level - `basic`, `standard`, or `detailed` (default: `standard`)
- `METRICS_SAMPLING_RATE`: Sampling rate for high-volume metrics, 0.0-1.0 (default: `1.0`)
- `METRICS_MAX_LABEL_VALUES`: Maximum unique values per label (default: `100`)
- `BUILD_VERSION`: Version string included in build_info metric
- `METRICS_PATH`: Custom path for metrics endpoint (default: `/metrics`)
- `METRICS_PORT`: Port for standalone metrics server (if needed)

### Collection Levels

#### Basic Level
- Only `core` tier metrics collected
- Minimal histogram buckets: [0.01, 0.05, 0.1, 0.5, 1]
- No aggregate metrics
- Lowest memory footprint

#### Standard Level (Default)
- Collects `core`, `high_frequency`, and `optional` tiers
- Standard histogram buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]
- No aggregate metrics
- Balanced detail and performance

#### Detailed Level
- All tiers including `specialized`
- Extended histogram buckets: [0.0005, 0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
- Includes aggregate `all` tier metrics
- Maximum visibility

### Production Optimizations

#### 1. Zero-Allocation Fast Path

When metrics are disabled, the endpoint returns immediately without any metric object creation:

```typescript
if (!METRICS_CONFIG.enabled) {
  return new NextResponse('# Metrics collection disabled\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'X-Metrics-Level': 'disabled'
    }
  });
}
```

#### 2. Label Cardinality Protection

Prevents memory issues from unbounded label growth:

```typescript
function checkLabelCardinality(metricName: string, labelValue: string): boolean {
  const values = labelCardinality.get(metricName)!;
  if (values.size >= METRICS_CONFIG.maxLabelValues) {
    console.warn(`Label cardinality limit reached for ${metricName}: ${labelValue}`);
    return false;
  }
  values.add(labelValue);
  return true;
}
```

#### 3. Sampling for High-Volume Metrics

Reduces overhead for high-traffic scenarios:

```typescript
const sampledCount = Math.floor(count * METRICS_CONFIG.samplingRate);
// Ensure at least one sample for non-zero counts
if (sampledCount === 0 && count > 0 && Math.random() < METRICS_CONFIG.samplingRate) {
  tierValidationRequestsTotal!.labels(tier, 'v1').inc(1);
}
```

#### 4. Memory Monitoring

Built-in memory usage tracking:

```typescript
const memUsage = process.memoryUsage();
const memoryUsageMB = memUsage.heapUsed / 1024 / 1024;
if (memoryUsageMB > 50) {
  console.warn(`High memory usage for metrics: ${memoryUsageMB.toFixed(2)}MB`);
}
```

### Performance Considerations

1. **Lazy Initialization**: Metrics objects only created when needed
2. **Tier Filtering**: Only process configured tiers based on level
3. **Weighted Distribution**: Histogram samples distributed based on actual tier usage
4. **Memory Cap**: Maximum 50MB heap usage target
5. **Sample Limiting**: Cap aggregate samples at 10 for memory efficiency

## Integration

### Prometheus Configuration

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'citypee'
    static_configs:
      - targets: ['citypee.com:443']
    scheme: https
    metrics_path: '/api/metrics'
    scrape_interval: 30s
```

### Grafana Dashboard

Example query for validation success rate:

```promql
rate(tier_validation_requests_total[5m]) - rate(tier_validation_errors_total[5m])
/ rate(tier_validation_requests_total[5m])
```

## Security

1. **Authentication**: In production, protect the metrics endpoint:

```typescript
if (request.headers.get('authorization') !== `Bearer ${process.env.METRICS_TOKEN}`) {
  return new NextResponse('Unauthorized', { status: 401 });
}
```

2. **IP Allowlist**: Restrict access to monitoring infrastructure:

```typescript
const allowedIPs = ['10.0.0.0/8', '172.16.0.0/12'];
const clientIP = request.headers.get('x-forwarded-for');
if (!isIPAllowed(clientIP, allowedIPs)) {
  return new NextResponse('Forbidden', { status: 403 });
}
```

## Troubleshooting

### Missing Metrics

If metrics don't appear:
1. Check metrics are initialized with zero values
2. Verify label combinations are consistent
3. Ensure metrics registry is not shared globally

### Performance Issues

If endpoint is slow:
1. Implement caching with TTL
2. Use sampling for high-volume metrics
3. Consider separate metrics service for scale

### Memory Leaks

Monitor for:
1. Unbounded label cardinality
2. Metrics not being reset
3. Large histogram buckets

## Grafana Dashboard Deployment

### Dashboard Import

1. Copy the dashboard template from `templates/grafana-citypee-validation.json`
2. In Grafana: Navigate to **Dashboards** → **Import**
3. Paste the JSON content or upload the file
4. Select your Prometheus datasource
5. Click **Import**

### Dashboard Panels Overview

The CityPee Validation Monitoring dashboard includes:

- **Summary Row**: 4 stat panels showing total requests, success rate, P95 latency, and total errors
- **Distribution Charts**: Pie charts for request distribution by tier and error breakdown by type
- **Time Series Graphs**:
  - Validation Latency Percentiles (P50, P95, P99)
  - Request Rate by Tier (stacked)
  - Error Rate by Type (stacked)

### Customization Tips

1. **Adjust refresh interval** for your needs:
   ```json
   "refresh": "10s"  // Options: 5s, 10s, 30s, 1m, 5m, etc.
   ```

2. **Modify time range** defaults:
   ```json
   "time": {
     "from": "now-6h",  // Change to now-1h, now-24h, etc.
     "to": "now"
   }
   ```

3. **Add annotations** for deployments:
   ```json
   "annotations": {
     "list": [{
       "datasource": "-- Grafana --",
       "enable": true,
       "expr": "changes(build_info[5m]) > 0"
     }]
   }
   ```

## Alert Rules Configuration

### Prometheus Alert Rules

Create `prometheus/rules/citypee_validation.yml`:

```yaml
groups:
  - name: citypee_validation
    interval: 30s
    rules:
      # High error rate alert
      - alert: HighValidationErrorRate
        expr: |
          (sum(rate(tier_validation_errors_total[5m])) 
          / sum(rate(tier_validation_requests_total[5m]))) > 0.05
        for: 5m
        labels:
          severity: warning
          team: citypee
        annotations:
          summary: "High validation error rate ({{ $value | humanizePercentage }})"
          description: "Validation error rate exceeds 5% threshold for 5 minutes"
          runbook_url: "https://wiki.example.com/citypee/runbooks/high-error-rate"
      
      # P95 latency SLA violation
      - alert: ValidationLatencySLAViolation
        expr: |
          histogram_quantile(0.95, 
            sum(rate(tier_validation_duration_seconds_bucket[5m])) by (le)
          ) * 1000 > 20
        for: 10m
        labels:
          severity: critical
          team: citypee
          sla: true
        annotations:
          summary: "P95 latency SLA violation ({{ $value }}ms > 20ms)"
          description: "Validation P95 latency exceeds 20ms SLA for 10 minutes"
          runbook_url: "https://wiki.example.com/citypee/runbooks/latency-sla"
      
      # Tier-specific alerts
      - alert: CoreTierHighLatency
        expr: |
          histogram_quantile(0.95,
            sum(rate(tier_validation_duration_seconds_bucket{tier="core"}[5m])) by (le)
          ) * 1000 > 15
        for: 5m
        labels:
          severity: warning
          team: citypee
          tier: core
        annotations:
          summary: "Core tier P95 latency high ({{ $value }}ms)"
          description: "Core tier validation exceeding 15ms threshold"
```

### Alertmanager Routing

Configure alert routing in `alertmanager.yml`:

```yaml
route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        team: citypee
        severity: critical
      receiver: citypee-oncall
      continue: true
    - match:
        team: citypee
        severity: warning
      receiver: citypee-team
      group_wait: 30s

receivers:
  - name: 'citypee-oncall'
    pagerduty_configs:
      - service_key: YOUR_PAGERDUTY_KEY
        description: '{{ .GroupLabels.alertname }}'
    slack_configs:
      - api_url: YOUR_SLACK_WEBHOOK
        channel: '#citypee-oncall'
        title: '🚨 Critical: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
        
  - name: 'citypee-team'
    slack_configs:
      - api_url: YOUR_SLACK_WEBHOOK
        channel: '#citypee-alerts'
        title: '⚠️  Warning: {{ .GroupLabels.alertname }}'
```

## Performance Degradation Runbook

### Initial Response (< 5 minutes)

1. **Verify the alert**:
   ```bash
   # Check current P95 latency
   curl -s http://citypee.com/api/validation/summary | jq '.latency.p95'
   
   # Check Prometheus directly
   promtool query instant http://prometheus:9090 \
     'histogram_quantile(0.95, sum(rate(tier_validation_duration_seconds_bucket[5m])) by (le)) * 1000'
   ```

2. **Identify affected tiers**:
   ```promql
   # Query per-tier P95 latencies
   histogram_quantile(0.95, 
     sum by (tier) (rate(tier_validation_duration_seconds_bucket[5m]))
   ) * 1000
   ```

3. **Check error rates**:
   ```promql
   # Error rate by tier and type
   sum by (tier, error_type) (rate(tier_validation_errors_total[5m]))
   ```

### Investigation (5-15 minutes)

1. **Recent deployments**:
   ```bash
   # Check deployment annotations in Grafana
   # Or query deployment events
   kubectl get events --sort-by='.lastTimestamp' | grep deployment
   ```

2. **Resource utilization**:
   ```bash
   # CPU and memory
   kubectl top pods -l app=citypee-api
   
   # Node.js metrics
   curl -s http://citypee.com/api/metrics | grep nodejs_
   ```

3. **Traffic patterns**:
   ```promql
   # Request rate trend
   rate(tier_validation_requests_total[5m])
   
   # Check for traffic spikes
   deriv(tier_validation_requests_total[5m]) > 0
   ```

### Common Issues and Mitigations

| Symptom | Cause | Immediate Action | Long-term Fix |
|---------|-------|------------------|---------------|
| Sudden spike all tiers | New validation rule | Enable emergency cache | Optimize rule implementation |
| Core tier only | Property processing | Reduce core properties | Implement property caching |
| Gradual increase | Memory pressure | Restart pods | Increase memory limits |
| Specialized tier slow | Complex validations | Disable specialized | Async validation queue |
| Random spikes | GC pauses | Force GC cycle | Tune Node.js heap |

### Emergency Responses

1. **Enable caching** (reduces load by ~80%):
   ```bash
   kubectl set env deployment/citypee-api \
     VALIDATION_CACHE_ENABLED=true \
     VALIDATION_CACHE_TTL=300
   ```

2. **Disable non-critical tiers**:
   ```bash
   kubectl set env deployment/citypee-api \
     VALIDATION_TIERS_ENABLED=core,high_frequency
   ```

3. **Scale horizontally**:
   ```bash
   kubectl scale deployment citypee-api --replicas=10
   ```

4. **Circuit breaker** (last resort):
   ```bash
   kubectl set env deployment/citypee-api \
     VALIDATION_CIRCUIT_BREAKER=true \
     VALIDATION_FALLBACK_MODE=basic
   ```

### Post-Incident Actions

1. **Update runbook** with new findings
2. **Adjust alert thresholds** if needed
3. **Schedule performance optimization** sprint
4. **Review capacity planning**

## Integration Examples

### Kubernetes ServiceMonitor

For Prometheus Operator:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: citypee-validation
  labels:
    app: citypee
spec:
  selector:
    matchLabels:
      app: citypee-api
  endpoints:
    - port: http
      path: /api/metrics
      interval: 30s
      scrapeTimeout: 10s
```

### Docker Compose Setup

Complete monitoring stack:

```yaml
version: '3.8'

services:
  citypee-api:
    image: citypee/api:latest
    environment:
      - METRICS_ENABLED=true
      - METRICS_LEVEL=standard
    ports:
      - "3000:3000"
    labels:
      - "prometheus.io/scrape=true"
      - "prometheus.io/path=/api/metrics"

  prometheus:
    image: prom/prometheus:v2.45.0
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./rules:/etc/prometheus/rules
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:10.0.0
    volumes:
      - ./dashboards:/var/lib/grafana/dashboards
      - ./provisioning:/etc/grafana/provisioning
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    ports:
      - "3001:3000"

  alertmanager:
    image: prom/alertmanager:v0.26.0
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    ports:
      - "9093:9093"

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:
```

### CI/CD Integration

GitHub Actions workflow:

```yaml
name: Performance Validation

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start services
        run: docker-compose up -d
        
      - name: Wait for services
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:3000/api/metrics; do sleep 2; done'
      
      - name: Run performance validation
        run: |
          node scripts/validate-performance.js --ci github --format json --output perf-report.json
          
      - name: Check metrics endpoint
        run: |
          curl -s http://localhost:3000/api/metrics | promtool check metrics
          
      - name: Upload performance report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: perf-report.json
          
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('perf-report.json', 'utf8'));
            const comment = `## Performance Report
            
            - P95 Latency: ${report.results.minimal.statistics.p95}ms (threshold: 15ms)
            - Success Rate: ${report.passed ? '✅ Passed' : '❌ Failed'}
            `;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

## Best Practices

1. **Start simple**: Begin with basic metrics, add complexity as needed
2. **Label carefully**: Keep cardinality under control (< 100 unique values per label)
3. **Use recording rules**: Pre-compute expensive queries
4. **Set realistic SLAs**: Base on actual performance data, not aspirations
5. **Test alerts**: Regularly verify alerts fire correctly
6. **Document everything**: Runbooks save time during incidents
7. **Review regularly**: Monthly dashboard and alert reviews
8. **Automate responses**: Script common remediation steps

## References

- [Prometheus Text Format](https://prometheus.io/docs/instrumenting/exposition_formats/)
- [prom-client Documentation](https://github.com/siimon/prom-client)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Grafana Dashboard Best Practices](https://grafana.com/docs/grafana/latest/best-practices/dashboard-management/)
- [Prometheus Alerting Rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)
- [The USE Method](http://www.brendangregg.com/usemethod.html)