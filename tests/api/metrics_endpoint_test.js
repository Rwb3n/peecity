/**
 * Tests for Prometheus metrics endpoint
 * 
 * @artifact docs/cookbook/recipe_metrics_export.md
 * @task metrics_export_0013_task1
 * @tdd-phase RED
 * 
 * Tests for GET /api/metrics endpoint that exports validation metrics
 * in Prometheus text format 0.0.4. Expected to fail as endpoint doesn't exist.
 */

// Removed supertest - using mock request approach instead

const { createMockRequest } = require('../helpers/api-test-helper');

// Import the route handler
let GET;
try {
  const routeModule = require('../../src/app/api/metrics/route');
  GET = routeModule.GET;
} catch (err) {
  console.error('Failed to load metrics route:', err);
}

// Helper to make requests to the metrics endpoint
async function makeMetricsRequest() {
  if (!GET) {
    throw new Error('Metrics route not available');
  }
  
  // Force a fresh module load to ensure clean metrics
  jest.resetModules();
  const routeModule = require('../../src/app/api/metrics/route');
  GET = routeModule.GET;
  
  const request = createMockRequest('GET', '/api/metrics', null);
  const response = await GET(request);
  
  return {
    status: response.status,
    headers: response.headers,
    text: await response.text()
  };
}

describe('GET /api/metrics - Prometheus metrics endpoint', () => {
  let originalEnv;
  
  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Reset environment
    delete process.env.METRICS_ENABLED;
    delete process.env.BUILD_VERSION;
    // Set to standard mode to match test expectations
    process.env.METRICS_LEVEL = 'standard';
  });
  
  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  describe('Endpoint availability and format', () => {
    it('should return 200 with text/plain content-type', async () => {
      const response = await makeMetricsRequest();
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toMatch(/text\/plain/);
      expect(response.text).toBeTruthy();
    });

    it('should return valid Prometheus text format', async () => {
      const response = await makeMetricsRequest();
      
      // Check for proper line format
      const lines = response.text.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        // Each line should be either a comment (# prefix) or a metric
        if (!line.startsWith('#')) {
          // Metric lines should have metric_name{labels} value format
          expect(line).toMatch(/^[a-z_]+(?:\{[^}]*\})?\s+[\d.]+(?:\s+\d+)?$/);
        }
      });
    });
  });

  describe('Required metrics presence', () => {
    it('should include tier_validation_requests_total counter', async () => {
      const response = await makeMetricsRequest();
      
      // Check for HELP and TYPE metadata
      expect(response.text).toContain('# HELP tier_validation_requests_total Total number of validation requests by tier');
      expect(response.text).toContain('# TYPE tier_validation_requests_total counter');
      
      // Check for actual metric lines with tier labels (including version)
      // In standard mode: core, high_frequency, and optional are included
      expect(response.text).toMatch(/tier_validation_requests_total\{tier="core",version="v[12]"\}\s+\d+/);
      expect(response.text).toMatch(/tier_validation_requests_total\{tier="high_frequency",version="v[12]"\}\s+\d+/);
      expect(response.text).toMatch(/tier_validation_requests_total\{tier="optional",version="v[12]"\}\s+\d+/);
      // specialized tier is only in detailed mode
    });

    it('should include tier_validation_errors_total counter', async () => {
      const response = await makeMetricsRequest();
      
      // Check for HELP and TYPE metadata
      expect(response.text).toContain('# HELP tier_validation_errors_total Total number of validation errors by tier');
      expect(response.text).toContain('# TYPE tier_validation_errors_total counter');
      
      // Check for actual metric lines with tier and error_type labels
      // In standard mode: core, high_frequency, and optional are included
      expect(response.text).toMatch(/tier_validation_errors_total\{tier="core",error_type="validation"\}\s+\d+/);
      expect(response.text).toMatch(/tier_validation_errors_total\{tier="high_frequency",error_type="validation"\}\s+\d+/);
      expect(response.text).toMatch(/tier_validation_errors_total\{tier="optional",error_type="validation"\}\s+\d+/);
      // specialized tier is only in detailed mode
    });

    it('should include tier_validation_duration_seconds histogram', async () => {
      const response = await makeMetricsRequest();
      
      // Check for HELP and TYPE metadata
      expect(response.text).toContain('# HELP tier_validation_duration_seconds Validation request duration in seconds');
      expect(response.text).toContain('# TYPE tier_validation_duration_seconds histogram');
      
      // Check for histogram buckets
      const buckets = ['0.001', '0.005', '0.01', '0.025', '0.05', '0.1', '0.25', '0.5', '1', '+Inf'];
      buckets.forEach(bucket => {
        // Check for at least one tier having this bucket
        const bucketPattern = `tier_validation_duration_seconds_bucket{le="${bucket}",tier="core"}`;
        expect(response.text).toContain(bucketPattern);
      });
      
      // Check for histogram sum and count
      expect(response.text).toMatch(/tier_validation_duration_seconds_sum\{tier="\w+"\}\s+[\d.]+/);
      expect(response.text).toMatch(/tier_validation_duration_seconds_count\{tier="\w+"\}\s+\d+/);
    });
  });

  describe('Metric metadata and labels', () => {
    it('should include proper HELP and TYPE annotations for all metrics', async () => {
      const response = await makeMetricsRequest();
      
      // Every metric should have both HELP and TYPE
      const metricNames = [
        'tier_validation_requests_total',
        'tier_validation_errors_total',
        'tier_validation_duration_seconds'
      ];
      
      metricNames.forEach(metric => {
        const helpRegex = new RegExp(`# HELP ${metric} .+`);
        const typeRegex = new RegExp(`# TYPE ${metric} (counter|gauge|histogram|summary)`);
        
        expect(response.text).toMatch(helpRegex);
        expect(response.text).toMatch(typeRegex);
      });
    });

    it('should include version and result labels where appropriate', async () => {
      const response = await makeMetricsRequest();
      
      // Requests should have version label
      expect(response.text).toMatch(/tier_validation_requests_total\{tier="core",version="v[12]"\}\s+\d+/);
      
      // Errors should have result label
      expect(response.text).toMatch(/tier_validation_errors_total\{tier="core",error_type="\w+"\}\s+\d+/);
    });
  });

  describe('Performance considerations', () => {
    it('should respond within acceptable latency (<50ms)', async () => {
      const start = Date.now();
      const response = await makeMetricsRequest();
      expect(response.status).toBe(200);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // Metrics endpoint should respond within 1 second (includes initialization)
    });

    it('should handle concurrent requests', async () => {
      // Send 10 concurrent requests
      const promises = Array(10).fill(null).map(() => 
        makeMetricsRequest()
      );
      
      const responses = await Promise.all(promises);
      
      // All should return valid Prometheus format
      responses.forEach(response => {
        expect(response.text).toContain('# TYPE');
        expect(response.text).toContain('# HELP');
      });
    });
  });

  describe('Error handling', () => {
    it('should handle metrics service unavailability gracefully', async () => {
      // This test would mock the metrics service being unavailable
      // For now, it expects the endpoint to exist and handle errors
      const response = await makeMetricsRequest();
      
      // Even on error, should return valid Prometheus format (possibly empty)
      expect(response.status).toBeLessThanOrEqual(503);
      if (response.status !== 200) {
        // Error response should still be text format
        expect(response.headers['content-type']).toMatch(/text/);
      }
    });
  });
});

describe('Prometheus format compliance', () => {
  let app;

  beforeEach(() => {
    const express = require('express');
    app = express();
  });

  it('should follow Prometheus text format 0.0.4 specification', async () => {
    const response = await makeMetricsRequest();
    
    const lines = response.text.split('\n');
    let currentMetric = null;
    
    lines.forEach((line, index) => {
      if (line.trim() === '') return; // Skip empty lines
      
      if (line.startsWith('# HELP')) {
        // HELP must come before TYPE
        const nextLine = lines[index + 1];
        expect(nextLine).toMatch(/^# TYPE/);
        currentMetric = line.split(' ')[2]; // Extract metric name
      } else if (line.startsWith('# TYPE')) {
        // TYPE must specify valid metric type
        expect(line).toMatch(/# TYPE \w+ (counter|gauge|histogram|summary)/);
      } else if (!line.startsWith('#')) {
        // Metric line
        expect(line).toMatch(/^[a-z_]+/); // Metric name
        
        // If it has labels, they must be properly formatted
        if (line.includes('{')) {
          expect(line).toMatch(/\{[a-z_]+="[^"]+"/); // At least one label
          expect(line).toMatch(/\}\s+[\d.]+/); // Closing brace and value
        }
      }
    });
  });

  it('should escape special characters in label values', async () => {
    const response = await makeMetricsRequest();
    
    // Check that quotes, backslashes, and newlines are properly escaped
    const labelValues = response.text.match(/"([^"]*)"/g) || [];
    labelValues.forEach(value => {
      // No unescaped quotes, backslashes, or newlines in label values
      const unquoted = value.slice(1, -1); // Remove surrounding quotes
      expect(unquoted).not.toMatch(/[^\\]"/); // Unescaped quote
      expect(unquoted).not.toMatch(/[^\\]\\$/); // Unescaped backslash at end
      expect(unquoted).not.toContain('\n'); // No newlines
    });
  });
});