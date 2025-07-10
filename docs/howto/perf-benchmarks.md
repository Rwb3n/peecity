---
title: "Performance Benchmarking Guide"
description: "Performance benchmarking methodology, hardware context, and threshold justifications for CityPee validation system"
category: howto
version: "1.0.0"
last_updated: "2025-07-09"
---

# Performance Benchmarking Guide

This guide documents the performance benchmarking methodology, hardware context, and threshold justifications for the CityPee validation system.

## Overview

The CityPee API uses tier-based validation for OpenStreetMap properties. Performance is critical for API responsiveness, with targets of:
- **Local Development**: p95 < 5ms
- **CI Environment**: p95 < 10ms

## Hardware Context

### Local Development Environment (Baseline)
- **CPU**: Modern multi-core processor (8+ cores recommended)
- **RAM**: 16GB+ recommended
- **Node.js**: v20.11.1 LTS or higher
- **OS**: Linux/macOS/WSL2
- **Typical p95**: 0.002ms for no-op validation (harness overhead)

### CI Environment (GitHub Actions)
- **CPU**: 2-core x86-64 processor (shared virtualized)
- **RAM**: 7GB
- **Node.js**: v20.x (matrix tested)
- **OS**: Ubuntu-latest
- **Expected overhead**: 2x slower than local development

## Benchmarking Methodology

### Test Structure
```javascript
// Located in: tests/performance/validation_benchmark_test.js
// Run with: npm test -- tests/performance/validation_benchmark_test.js
```

### Key Design Decisions

1. **Warmup Iterations**: 10 iterations before measurement
   - Allows JIT compilation to optimize hot paths
   - Ensures consistent performance measurements

2. **Measurement Iterations**: 500 iterations (increased from 100)
   - Provides stable p95 calculations
   - Runtime cost negligible (<1 second total)

3. **Percentile-based Metrics**: Using p95 instead of mean/max
   - Resilient to outliers and GC pauses
   - Industry standard for latency SLAs

4. **Environment Detection**:
   ```javascript
   const isCI = process.env.CI === 'true' || process.env.NODE_ENV === 'ci';
   const thresholds = isCI ? THRESHOLDS.ci : THRESHOLDS.local;
   ```

## Performance Targets Justification

### 5ms Local Target
- **Rationale**: Next.js API best practices suggest <10ms for simple endpoints
- **Breakdown**:
  - Validation: <5ms (our target)
  - Network overhead: ~20ms
  - Database queries: ~15ms
  - Serialization: ~10ms
  - **Total API response**: <50ms target

### 10ms CI Target
- **Rationale**: 2x multiplier for virtualization overhead
- **Factors**:
  - Shared CPU resources
  - Lower clock speeds
  - Virtualization layer
  - Container overhead

## Test Scenarios

### 1. Minimal Property Validation
- **Properties**: 9 (v1 API backward compatibility)
- **Target**: p95 < 5ms local
- **Purpose**: Baseline performance for simple submissions

### 2. Full Property Validation
- **Properties**: 120 (all OpenStreetMap properties)
- **Target**: p95 < 5ms local
- **Purpose**: Worst-case scenario performance

### 3. Configuration Loading
- **Operation**: Initial config load from disk
- **Target**: p95 < 10ms local
- **Purpose**: Startup performance impact

### 4. Caching Effectiveness
- **Metric**: Cold vs cached performance ratio
- **Target**: >5x speedup when cached
- **Purpose**: Verify caching implementation

## Running Benchmarks

### Quick Test
```bash
# Run performance benchmarks
npm test -- tests/performance/validation_benchmark_test.js

# Run with specific reporter
npm test -- tests/performance/validation_benchmark_test.js --verbose
```

### Harness Verification
```bash
# Test benchmark harness with no-op validator
node tests/performance/test-harness-check.js
```

### Selective Performance Tests
```bash
# Run only @performance tagged tests
npm test -- --testNamePattern="@performance"
```

## Interpreting Results

### Sample Output
```
Minimal validation stats: {
  mean: 2.34ms,
  p50: 2.12ms,
  p95: 4.87ms,  // ✅ Under 5ms threshold
  p99: 6.23ms
}
```

### Red Flags
- p95 > threshold: Performance regression
- High p99/p95 ratio: Inconsistent performance
- Caching speedup < 3x: Cache ineffective
- Scaling > O(n): Algorithmic issues

## Optimization Strategies

### If Targets Not Met

1. **Profile First**
   ```bash
   node --prof tests/performance/validation_benchmark_test.js
   node --prof-process isolate-*.log
   ```

2. **Common Optimizations**
   - Implement property map caching
   - Use early-exit for core property failures
   - Batch validation operations
   - Lazy-load optional validators

3. **Trade-off Documentation**
   - If caching required: Document in ADR-004
   - If async needed: Document latency impact
   - If complexity added: Document maintenance cost

## Continuous Monitoring

### CI Integration
```yaml
# .github/workflows/perf.yml
- name: Run Performance Tests
  run: npm test -- tests/performance --coverage=false
  env:
    CI: true
```

### Baseline Tracking
- Store baseline metrics in `benchmarks/baseline.json`
- Compare PR performance against baseline
- Alert on >10% regression

## Troubleshooting

### Common Issues

1. **Flaky Tests**
   - Increase iteration count
   - Add GC before measurements
   - Use dedicated performance machine

2. **CI Timeouts**
   - Reduce iteration count for CI
   - Skip cold-start tests in CI
   - Use matrix strategy for parallel runs

3. **Local vs CI Discrepancy**
   - Check Node.js versions match
   - Verify same test data used
   - Consider CPU governor settings

## Future Considerations

- **Benchmark Dashboard**: Track performance over time
- **Automated Regression Detection**: Fail PRs on performance regression
- **Production Metrics**: Real-world p95/p99 monitoring
- **Load Testing**: Beyond single-request benchmarks

## References

- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Jest Performance Testing](https://jestjs.io/docs/timer-mocks)
- [ADR-003: Core Property Validation](../adr/ADR-003-core-property-validation.md)
- [Tier Validation Implementation](../cookbook/recipe_tiered_validation.md)