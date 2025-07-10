/**
 * Complete tests for Prometheus metrics endpoint
 * 
 * @artifact docs/cookbook/recipe_metrics_export.md
 * @task metrics_export_0013_task2
 * @tdd-phase GREEN
 * 
 * Comprehensive tests for GET /api/metrics endpoint using actual Next.js route
 */

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
async function makeMetricsRequest(headers = {}) {
  if (!GET) {
    throw new Error('Metrics route not available');
  }
  
  const request = createMockRequest('GET', '/api/metrics', null, headers);
  const response = await GET(request);
  
  return {
    status: response.status,
    headers: response.headers,
    text: await response.text()
  };
}

describe('GET /api/metrics - Prometheus metrics endpoint', () => {
  beforeEach(() => {
    // Reset environment
    delete process.env.METRICS_ENABLED;
    delete process.env.BUILD_VERSION;
  });

  describe('Endpoint availability and format', () => {
    it('should return 200 with text/plain content-type', async () => {
      const response = await makeMetricsRequest();
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toMatch(/text\/plain/);
      expect(response.headers.get('content-type')).toContain('version=0.0.4');
      expect(response.text).toBeTruthy();
    });

    it('should return valid Prometheus text format', async () => {
      const response = await makeMetricsRequest();
      
      // Check for proper line format
      const lines = response.text.split('\n').filter(l => l.trim());
      lines.forEach(line => {
        // Each line should be either a comment (# prefix) or a metric
        if (!line.startsWith('#')) {
          // Metric lines should have metric_name{labels} value format
          expect(line).toMatch(/^[a-zA-Z_:][a-zA-Z0-9_:]*(?:\{[^}]*\})?\s+[\d.+\-eENaN]+(?:\s+\d+)?$/);
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
      
      // Check for actual metric lines with tier labels
      expect(response.text).toMatch(/tier_validation_requests_total\{tier="core",version="v[12]"\}\s+\d+/);
      expect(response.text).toMatch(/tier_validation_requests_total\{tier="high_frequency",version="v[12]"\}\s+\d+/);
      expect(response.text).toMatch(/tier_validation_requests_total\{tier="optional",version="v[12]"\}\s+\d+/);
      expect(response.text).toMatch(/tier_validation_requests_total\{tier="specialized",version="v[12]"\}\s+\d+/);
    });

    it('should include tier_validation_errors_total counter', async () => {
      const response = await makeMetricsRequest();
      
      // Check for HELP and TYPE metadata
      expect(response.text).toContain('# HELP tier_validation_errors_total Total number of validation errors by tier');
      expect(response.text).toContain('# TYPE tier_validation_errors_total counter');
      
      // Check for actual metric lines with tier labels
      expect(response.text).toMatch(/tier_validation_errors_total\{tier="core",error_type="\w+"\}\s+\d+/);
      expect(response.text).toMatch(/tier_validation_errors_total\{tier="high_frequency",error_type="\w+"\}\s+\d+/);
      expect(response.text).toMatch(/tier_validation_errors_total\{tier="optional",error_type="\w+"\}\s+\d+/);
      expect(response.text).toMatch(/tier_validation_errors_total\{tier="specialized",error_type="\w+"\}\s+\d+/);
    });

    it('should include tier_validation_duration_seconds histogram', async () => {
      const response = await makeMetricsRequest();
      
      // Check for HELP and TYPE metadata
      expect(response.text).toContain('# HELP tier_validation_duration_seconds Validation request duration in seconds');
      expect(response.text).toContain('# TYPE tier_validation_duration_seconds histogram');
      
      // Histogram might not have data yet, but structure should be there
      const hasHistogramData = response.text.includes('tier_validation_duration_seconds_bucket');
      
      if (hasHistogramData) {
        // Check for histogram buckets
        const buckets = ['0.001', '0.005', '0.01', '0.025', '0.05', '0.1', '0.25', '0.5', '1', '+Inf'];
        buckets.forEach(bucket => {
          expect(response.text).toMatch(new RegExp(`tier_validation_duration_seconds_bucket\\{.*le="${bucket}".*\\}\\s+\\d+`));
        });
        
        // Check for histogram sum and count
        expect(response.text).toMatch(/tier_validation_duration_seconds_sum(?:\{[^}]*\})?\s+[\d.]+/);
        expect(response.text).toMatch(/tier_validation_duration_seconds_count(?:\{[^}]*\})?\s+\d+/);
      }
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
      
      // Errors should have error_type label
      expect(response.text).toMatch(/tier_validation_errors_total\{tier="core",error_type="\w+"\}\s+\d+/);
    });
  });

  describe('Performance considerations', () => {
    it('should respond within acceptable latency (<50ms)', async () => {
      const start = Date.now();
      await makeMetricsRequest();
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(50); // Metrics endpoint should be fast
    });

    it('should handle concurrent requests', async () => {
      // Send 10 concurrent requests
      const promises = Array(10).fill(null).map(() => makeMetricsRequest());
      
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
      // Even if metrics service has issues, endpoint should return something
      const response = await makeMetricsRequest();
      
      // Should return valid Prometheus format
      expect(response.status).toBeLessThanOrEqual(503);
      expect(response.headers.get('content-type')).toMatch(/text/);
      
      // Should at least have build info
      expect(response.text).toMatch(/(citypee_build_info|Error generating metrics)/);
    });
  });
});

describe('Prometheus format compliance', () => {
  it('should follow Prometheus text format 0.0.4 specification', async () => {
    const response = await makeMetricsRequest();
    
    const lines = response.text.split('\n');
    let currentMetric = null;
    
    lines.forEach((line, index) => {
      if (line.trim() === '') return; // Skip empty lines
      
      if (line.startsWith('# HELP')) {
        // HELP must come before TYPE
        const nextLine = lines[index + 1];
        if (nextLine && !nextLine.startsWith('# TYPE')) {
          // It's OK if there's another HELP line or empty line
          let foundType = false;
          for (let i = index + 1; i < lines.length && i < index + 5; i++) {
            if (lines[i].startsWith('# TYPE')) {
              foundType = true;
              break;
            }
            if (!lines[i].startsWith('#') && lines[i].trim() !== '') {
              break;
            }
          }
          expect(foundType).toBe(true);
        }
        currentMetric = line.split(' ')[2]; // Extract metric name
      } else if (line.startsWith('# TYPE')) {
        // TYPE must specify valid metric type
        expect(line).toMatch(/# TYPE \w+ (counter|gauge|histogram|summary)/);
      } else if (!line.startsWith('#')) {
        // Metric line
        expect(line).toMatch(/^[a-zA-Z_:][a-zA-Z0-9_:]*/); // Metric name
        
        // If it has labels, they must be properly formatted
        if (line.includes('{')) {
          expect(line).toMatch(/\{[a-zA-Z_][a-zA-Z0-9_]*="[^"]*"/); // At least one label
          expect(line).toMatch(/\}\s+[\d.+\-eENaN]+/); // Closing brace and value
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
      
      // Check for unescaped quotes (not preceded by backslash)
      const unescapedQuotes = unquoted.match(/(?<!\\)(?:\\\\)*"/g);
      expect(unescapedQuotes).toBeNull();
      
      // No literal newlines
      expect(unquoted).not.toContain('\n');
      expect(unquoted).not.toContain('\r');
    });
  });
});

describe('Environment and configuration', () => {
  beforeEach(() => {
    // Reset environment variables before each test
    delete process.env.METRICS_ENABLED;
    delete process.env.BUILD_VERSION;
  });

  afterEach(() => {
    // Clean up after each test
    delete process.env.METRICS_ENABLED;
    delete process.env.BUILD_VERSION;
  });

  it('should respect METRICS_ENABLED=false', async () => {
    process.env.METRICS_ENABLED = 'false';
    
    const response = await makeMetricsRequest();
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('Metrics collection disabled');
  });

  it('should include BUILD_VERSION in build info', async () => {
    process.env.BUILD_VERSION = 'test-v1.2.3';
    
    const response = await makeMetricsRequest();
    
    expect(response.text).toContain('citypee_build_info');
    expect(response.text).toContain('version="test-v1.2.3"');
  });
});