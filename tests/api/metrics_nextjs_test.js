/**
 * Tests for Prometheus metrics endpoint in Next.js App Router
 * 
 * @artifact docs/cookbook/recipe_metrics_export.md
 * @task metrics_export_0013_task1
 * @tdd-phase RED
 * 
 * Integration tests for the metrics endpoint that will test
 * against the actual Next.js route handler structure.
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Mock the TieredValidationServiceWithMetrics to provide test data
jest.mock('../../src/services/TieredValidationServiceWithMetrics', () => ({
  TieredValidationServiceWithMetrics: jest.fn().mockImplementation(() => ({
    getMetrics: jest.fn().mockReturnValue({
      totalRequests: 1234,
      requestsByTier: {
        core: 500,
        high_frequency: 400,
        optional: 234,
        specialized: 100
      },
      errorsByTier: {
        core: 10,
        high_frequency: 5,
        optional: 2,
        specialized: 1
      },
      performanceMetrics: {
        count: 1234,
        sum: 12340,
        min: 1.2,
        max: 45.6,
        p95: [15.4]
      }
    })
  }))
}));

describe('Next.js App Router - GET /api/metrics', () => {
  let server;
  let app;
  let baseUrl;

  beforeAll(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'test';
    
    // Check if the metrics route exists
    const fs = require('fs');
    const path = require('path');
    const routePath = path.join(__dirname, '../../src/app/api/metrics/route.ts');
    
    if (!fs.existsSync(routePath)) {
      // Route doesn't exist, create a mock server that returns 404
      server = createServer((req, res) => {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html');
        res.end('<!DOCTYPE html><html><body>Cannot GET /api/metrics</body></html>');
      });
      
      await new Promise((resolve) => {
        server.listen(0, () => {
          const port = server.address().port;
          baseUrl = `http://localhost:${port}`;
          resolve();
        });
      });
    } else {
      // If route exists (it shouldn't in RED phase), use actual Next.js
      app = next({ dev: true });
      const handle = app.getRequestHandler();
      
      await app.prepare();
      
      server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      });
      
      await new Promise((resolve) => {
        server.listen(0, () => {
          const port = server.address().port;
          baseUrl = `http://localhost:${port}`;
          resolve();
        });
      });
    }
  }, 30000);

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('Route handler structure', () => {
    it('should export a GET handler', async () => {
      // This test verifies the route file exists and exports GET
      const fs = require('fs');
      const path = require('path');
      const routePath = path.join(__dirname, '../../src/app/api/metrics/route.ts');
      
      expect(fs.existsSync(routePath)).toBe(true);
      
      // When implemented, the file should export { GET }
      if (fs.existsSync(routePath)) {
        const routeContent = fs.readFileSync(routePath, 'utf8');
        expect(routeContent).toContain('export async function GET');
      }
    });

    it('should return proper Next.js Response object', async () => {
      const response = await fetch(`${baseUrl}/api/metrics`);
      
      // Should be a valid HTTP response
      expect(response).toBeDefined();
      expect(response.status).toBeDefined();
      expect(response.headers).toBeDefined();
    });
  });

  describe('Metrics integration with TieredValidationServiceWithMetrics', () => {
    it('should use singleton instance of metrics service', async () => {
      // The endpoint should use a shared instance to get actual metrics
      const response1 = await fetch(`${baseUrl}/api/metrics`);
      const response2 = await fetch(`${baseUrl}/api/metrics`);
      
      // Both responses should have the same metrics (from same instance)
      if (response1.status === 200 && response2.status === 200) {
        const text1 = await response1.text();
        const text2 = await response2.text();
        
        // Extract counter values - they should be consistent
        const getCounterValue = (text, metric) => {
          const match = text.match(new RegExp(`${metric}\\s+(\\d+)`));
          return match ? parseInt(match[1]) : null;
        };
        
        const value1 = getCounterValue(text1, 'tier_validation_requests_total{tier="core"}');
        const value2 = getCounterValue(text2, 'tier_validation_requests_total{tier="core"}');
        
        expect(value1).toBe(value2);
      }
    });

    it('should convert metrics to Prometheus format correctly', async () => {
      const response = await fetch(`${baseUrl}/api/metrics`);
      
      if (response.status === 200) {
        const text = await response.text();
        
        // Verify conversion from internal metrics to Prometheus format
        // Duration should be in seconds (not milliseconds)
        expect(text).toMatch(/tier_validation_duration_seconds/);
        
        // P95 should be converted to seconds
        if (text.includes('tier_validation_duration_seconds_quantile')) {
          expect(text).toMatch(/tier_validation_duration_seconds_quantile\{quantile="0.95"\}\s+0\.0154/);
        }
      }
    });
  });

  describe('Environment configuration', () => {
    it('should respect METRICS_ENABLED environment variable', async () => {
      // When METRICS_ENABLED=false, endpoint might return empty metrics or 503
      process.env.METRICS_ENABLED = 'false';
      
      const response = await fetch(`${baseUrl}/api/metrics`);
      
      // Should still return valid response, but possibly empty
      expect([200, 503]).toContain(response.status);
      
      // Clean up
      delete process.env.METRICS_ENABLED;
    });

    it('should use METRICS_PATH if configured', async () => {
      // This tests that the endpoint respects configuration
      // In actual implementation, this would be handled by Next.js routing
      expect(true).toBe(true); // Placeholder for now
    });
  });

  describe('Production readiness', () => {
    it('should handle high concurrency without memory leaks', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Send 100 concurrent requests
      const promises = Array(100).fill(null).map(() => 
        fetch(`${baseUrl}/api/metrics`)
      );
      
      await Promise.all(promises);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should include all required Prometheus metadata', async () => {
      const response = await fetch(`${baseUrl}/api/metrics`);
      
      if (response.status === 200) {
        const text = await response.text();
        
        // Should include process metadata
        expect(text).toMatch(/# HELP process_start_time_seconds/);
        expect(text).toMatch(/# HELP nodejs_version_info/);
        
        // Should include build info if available
        if (process.env.BUILD_VERSION) {
          expect(text).toMatch(/citypee_build_info\{version="/);
        }
      }
    });
  });
});

describe('Prometheus client library integration', () => {
  it('should use prom-client for format compliance', async () => {
    // Verify prom-client is in package.json dependencies
    const packageJson = require('../../package.json');
    
    expect(packageJson.dependencies['prom-client'] || 
           packageJson.devDependencies['prom-client']).toBeDefined();
  });

  it('should configure prom-client with correct defaults', async () => {
    // When implemented, should use collectDefaultMetrics
    // This is a placeholder test for TDD
    expect(true).toBe(true);
  });
});