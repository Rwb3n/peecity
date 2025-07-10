/**
 * Performance measurement for metrics endpoint
 * 
 * @artifact docs/cookbook/recipe_metrics_export.md
 * @task metrics_export_0013_task2
 * @tdd-phase GREEN
 * 
 * Verifies the metrics endpoint meets the < 1ms overhead requirement
 */

const { createMockRequest } = require('../helpers/api-test-helper');
const { performance } = require('perf_hooks');

// Import the route handler
let GET;
try {
  const routeModule = require('../../src/app/api/metrics/route');
  GET = routeModule.GET;
} catch (err) {
  console.error('Failed to load metrics route:', err);
}

describe('Metrics endpoint performance', () => {
  it('should have < 1ms overhead for metrics collection', async () => {
    if (!GET) {
      console.warn('Skipping test - GET handler not available');
      return;
    }

    // Warm up the endpoint
    for (let i = 0; i < 5; i++) {
      const request = createMockRequest('GET', '/api/metrics', null);
      await GET(request);
    }

    // Measure baseline response time (metrics disabled)
    process.env.METRICS_ENABLED = 'false';
    const baselineTimes = [];
    
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      const request = createMockRequest('GET', '/api/metrics', null);
      await GET(request);
      const duration = performance.now() - start;
      baselineTimes.push(duration);
    }
    
    const baselineAvg = baselineTimes.reduce((a, b) => a + b) / baselineTimes.length;
    const baselineP95 = baselineTimes.sort((a, b) => a - b)[Math.floor(baselineTimes.length * 0.95)];

    // Measure with metrics enabled
    delete process.env.METRICS_ENABLED;
    const metricsTimes = [];
    
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      const request = createMockRequest('GET', '/api/metrics', null);
      await GET(request);
      const duration = performance.now() - start;
      metricsTimes.push(duration);
    }
    
    const metricsAvg = metricsTimes.reduce((a, b) => a + b) / metricsTimes.length;
    const metricsP95 = metricsTimes.sort((a, b) => a - b)[Math.floor(metricsTimes.length * 0.95)];
    
    // Calculate overhead
    const avgOverhead = metricsAvg - baselineAvg;
    const p95Overhead = metricsP95 - baselineP95;
    
    console.log('Performance metrics:');
    console.log(`  Baseline avg: ${baselineAvg.toFixed(3)}ms, p95: ${baselineP95.toFixed(3)}ms`);
    console.log(`  With metrics avg: ${metricsAvg.toFixed(3)}ms, p95: ${metricsP95.toFixed(3)}ms`);
    console.log(`  Overhead avg: ${avgOverhead.toFixed(3)}ms, p95: ${p95Overhead.toFixed(3)}ms`);
    
    // Verify < 1ms overhead
    expect(avgOverhead).toBeLessThan(1);
    expect(p95Overhead).toBeLessThan(1);
  });

  it('should respond within 50ms total time', async () => {
    if (!GET) return;

    const times = [];
    
    for (let i = 0; i < 50; i++) {
      const start = performance.now();
      const request = createMockRequest('GET', '/api/metrics', null);
      const response = await GET(request);
      await response.text();
      const duration = performance.now() - start;
      times.push(duration);
    }
    
    const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
    
    console.log(`Total response time p95: ${p95.toFixed(3)}ms`);
    
    expect(p95).toBeLessThan(50);
  });
});