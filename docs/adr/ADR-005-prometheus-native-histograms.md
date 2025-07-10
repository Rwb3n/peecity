---
title: "ADR-005: Prometheus Native Histograms Adoption"
description: "Architecture decision record explaining the rationale for adopting Prometheus native histograms for validation performance monitoring"
category: "adr"
last_updated: "2025-07-09"
author: "Platform Engineering Team"
version: "1.0.0"
status: "draft"
tags: ["adr", "prometheus", "native-histograms", "performance", "monitoring", "validation"]
---

# ADR-005: Prometheus Native Histograms Adoption

**Status**: PROPOSED  
**Date**: 2025-07-09  
**Deciders**: Platform Engineering Team, DevOps Team

## Context

The CityPee validation service currently uses traditional Prometheus histogram metrics for performance monitoring. With the tier-based validation system processing up to 120 OpenStreetMap properties per request, we need more precise latency measurements and better bucket distribution to accurately monitor validation performance across different tiers.

### Current State

Our existing histogram implementation uses fixed bucket boundaries:
- Default buckets: `[0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0, +Inf]`
- These buckets don't align well with our validation performance targets:
  - Core tier: p95 < 15ms (local), p95 < 20ms (CI)
  - High-frequency tier: p95 < 20ms (local), p95 < 25ms (CI)
  - Optional tier: p95 < 25ms (local), p95 < 30ms (CI)

### Problem Statement

1. **Bucket Misalignment**: Current buckets concentrate on seconds while validation latency targets are in milliseconds
2. **Storage Overhead**: Each histogram creates multiple time series (one per bucket)
3. **Quantile Accuracy**: Fixed buckets limit precision for p95/p99 calculations
4. **Dashboard Complexity**: Grafana queries require complex bucket manipulation
5. **Cardinality Explosion**: Multiple tiers × endpoints × buckets create high cardinality

## Decision

We will adopt Prometheus native histograms for validation performance monitoring, replacing traditional histogram buckets with exponential bucket distribution and improved quantile accuracy.

### Rationale

Native histograms provide several benefits that align with our validation performance monitoring requirements:

1. **Automatic Bucket Selection**: Exponential buckets automatically adjust to actual latency distribution
2. **Improved Accuracy**: Higher resolution for percentile calculations (p95, p99)
3. **Reduced Cardinality**: Single metric instead of multiple bucket series
4. **Better Compression**: Native histogram format reduces storage overhead
5. **Future-Proof**: Aligns with Prometheus 2.40+ evolution

### Design Changes

```javascript
// Current implementation
const validationDuration = new client.Histogram({
  name: 'tier_validation_duration_seconds',
  help: 'Duration of tier validation requests',
  labelNames: ['tier', 'version', 'endpoint'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0]
});

// New native histogram implementation
const validationDuration = new client.Histogram({
  name: 'tier_validation_duration_seconds',
  help: 'Duration of tier validation requests',
  labelNames: ['tier', 'version', 'endpoint'],
  nativeHistogram: true,
  buckets: client.exponentialBuckets(0.001, 2, 20) // 1ms to ~1048s exponential
});
```

## Consequences

### Positive Consequences

- **Enhanced Accuracy**: Better quantile calculations for tier-based performance monitoring
- **Reduced Storage**: Native format reduces metric cardinality and storage requirements
- **Improved Dashboards**: Simplified Grafana queries with native histogram functions
- **Better Alerting**: More precise threshold detection for validation performance SLAs
- **Future Compatibility**: Aligns with Prometheus ecosystem evolution

### Negative Consequences

- **Prometheus Version Requirement**: Requires Prometheus 2.40+ for full native histogram support
- **Dashboard Migration**: Existing Grafana dashboards need updates for native histogram queries
- **Monitoring Tool Compatibility**: Some monitoring tools may not support native histograms yet
- **Learning Curve**: Team needs to understand native histogram concepts and query syntax

## Implementation

### Phase 1: Service Updates

1. **Update Validation Service Metrics**
   ```javascript
   // src/services/TieredValidationServiceWithMetrics.ts
   const validationDuration = new client.Histogram({
     name: 'tier_validation_duration_seconds',
     help: 'Duration of tier validation requests by tier',
     labelNames: ['tier', 'version', 'endpoint'],
     nativeHistogram: true,
     buckets: client.exponentialBuckets(0.001, 2, 20)
   });
   ```

2. **Preserve Backward Compatibility**
   - Maintain both traditional and native histograms during transition
   - Use feature flags to control which metrics are exposed
   - Gradual migration approach to minimize disruption

### Phase 2: Dashboard Updates

1. **Update Grafana Dashboards**
   ```promql
   # Old query
   histogram_quantile(0.95, tier_validation_duration_seconds_bucket{tier="core"})
   
   # New native histogram query
   histogram_quantile(0.95, tier_validation_duration_seconds{tier="core"})
   ```

2. **Create New Validation Performance Panels**
   - Native histogram heatmap visualization
   - Improved latency distribution charts
   - Tier-specific performance monitoring

### Phase 3: Implementation Plan

1. **Week 1**: Update validation service metrics with native histograms
2. **Week 2**: Deploy to staging environment and validate metrics collection
3. **Week 3**: Update Grafana dashboards with native histogram queries
4. **Week 4**: Production deployment with monitoring and rollback procedures

### Phase 4: Dashboard Updates

The implementation plan includes comprehensive dashboard updates to leverage native histogram capabilities:

1. **Performance Heatmaps**: Native histogram heatmap panels showing latency distribution
2. **Quantile Charts**: Improved p95/p99 tracking with higher accuracy
3. **Tier Comparison**: Side-by-side validation performance across tiers
4. **Alerting Rules**: Updated alerting thresholds based on native histogram data

## Alternatives Considered

### Alternative 1: Custom Bucket Configuration

Keep traditional histograms but optimize bucket boundaries for validation latency:
- **Pros**: No Prometheus version requirement, familiar tooling
- **Cons**: Still suffers from cardinality issues, limited quantile accuracy
- **Why Rejected**: Doesn't address fundamental limitations of fixed buckets

### Alternative 2: Summary Metrics

Replace histograms with Prometheus summary metrics:
- **Pros**: Built-in quantile calculation, lower cardinality
- **Cons**: Client-side quantile calculation, no histogram visualization
- **Why Rejected**: Summaries don't provide the detailed distribution needed for performance analysis

### Alternative 3: Custom Metrics Solution

Implement custom metrics collection with external time-series database:
- **Pros**: Full control over metrics format and storage
- **Cons**: Additional infrastructure complexity, maintenance overhead
- **Why Rejected**: Increases system complexity without significant benefits over native histograms

### Alternative 4: OpenTelemetry Histograms

Adopt OpenTelemetry histogram format:
- **Pros**: Vendor-neutral, supports multiple backends
- **Cons**: Additional abstraction layer, limited Prometheus integration
- **Why Rejected**: Prometheus native histograms provide better integration with existing monitoring stack

## References

### Internal Documentation

- [Validation Performance Monitoring Runbook](../runbooks/performance-monitoring.md)
- [Prometheus Exporter Best Practices](../cookbook/recipe_prometheus_exporter.md)  
- [ADR-004: Validation Performance and Caching Strategy](./ADR-004-validation-performance-caching.md)
- [Tiered Validation Implementation Guide](../cookbook/recipe_tiered_validation.md)

### External Resources

- [Prometheus Native Histograms](https://prometheus.io/docs/practices/histograms/#native-histograms)
- [Native Histogram Specification](https://github.com/prometheus/proposals/blob/main/proposals/2021-06-07_native-histograms.md)
- [Grafana Native Histogram Support](https://grafana.com/docs/grafana/latest/fundamentals/timeseries/#native-histograms)
- [prom-client Native Histogram API](https://github.com/siimon/prom-client#native-histograms)

### Performance Context

This ADR builds upon the performance requirements established in ADR-004 and addresses the specific needs of the tier-based validation system for accurate latency measurement and monitoring.