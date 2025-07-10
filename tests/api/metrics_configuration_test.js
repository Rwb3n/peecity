/**
 * Tests for metrics endpoint configuration features
 * 
 * @artifact docs/cookbook/recipe_metrics_export.md
 * @task metrics_export_0013_task3
 * @tdd-phase REFACTOR
 * 
 * Tests the refactored metrics endpoint with:
 * - Configurable collection levels
 * - Label cardinality protection
 * - Sampling rates
 * - Zero-allocation fast path
 */

const { createMockRequest } = require('../helpers/api-test-helper');

describe('Metrics endpoint configuration', () => {
  let originalEnv;
  let GET;
  
  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clear module cache
    jest.clearAllMocks();
    jest.resetModules();
  });
  
  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    jest.resetModules();
  });

  describe('Zero-allocation fast path', () => {
    it('should return minimal response when metrics disabled', async () => {
      process.env.METRICS_ENABLED = 'false';
      
      const routeModule = require('../../src/app/api/metrics/route');
      GET = routeModule.GET;
      
      const request = createMockRequest('GET', '/api/metrics', null);
      const response = await GET(request);
      const text = await response.text();
      
      expect(response.status).toBe(200);
      expect(text).toBe('# Metrics collection disabled\n');
      expect(response.headers.get('X-Metrics-Level')).toBe('disabled');
    });
  });

  describe('Metrics collection levels', () => {
    it('should only include core tier in basic level', async () => {
      process.env.METRICS_LEVEL = 'basic';
      
      // Mock service with multi-tier data
      jest.doMock('../../src/services/TieredValidationServiceWithMetrics', () => ({
        TieredValidationServiceWithMetrics: jest.fn().mockImplementation(() => ({
          getMetrics: jest.fn().mockReturnValue({
            totalRequests: 1000,
            requestsByTier: {
              core: 400,
              high_frequency: 300,
              optional: 200,
              specialized: 100
            },
            errorsByTier: {
              core: 10,
              high_frequency: 5,
              optional: 3,
              specialized: 2
            },
            performanceMetrics: {
              count: 1000,
              sum: 10000,
              min: 5,
              max: 50,
              p95: [10, 20, 30]
            }
          })
        }))
      }));
      
      const routeModule = require('../../src/app/api/metrics/route');
      GET = routeModule.GET;
      
      const request = createMockRequest('GET', '/api/metrics', null);
      const response = await GET(request);
      const text = await response.text();
      
      expect(response.status).toBe(200);
      expect(response.headers.get('X-Metrics-Level')).toBe('basic');
      
      // Should only have core tier metrics
      expect(text).toContain('tier="core"');
      expect(text).not.toContain('tier="high_frequency"');
      expect(text).not.toContain('tier="optional"');
      expect(text).not.toContain('tier="specialized"');
      
      // Should have basic histogram buckets
      expect(text).toContain('le="0.01"');
      expect(text).toContain('le="1"');
      expect(text).not.toContain('le="0.001"'); // Not in basic buckets
    });

    it('should include core, high_frequency, optional in standard level', async () => {
      process.env.METRICS_LEVEL = 'standard';
      
      jest.doMock('../../src/services/TieredValidationServiceWithMetrics', () => ({
        TieredValidationServiceWithMetrics: jest.fn().mockImplementation(() => ({
          getMetrics: jest.fn().mockReturnValue({
            totalRequests: 1000,
            requestsByTier: {
              core: 400,
              high_frequency: 300,
              optional: 200,
              specialized: 100
            },
            errorsByTier: {
              core: 0,
              high_frequency: 0,
              optional: 0,
              specialized: 0
            },
            performanceMetrics: {
              count: 1000,
              sum: 10000,
              min: 5,
              max: 50,
              p95: [10, 15, 20]
            }
          })
        }))
      }));
      
      const routeModule = require('../../src/app/api/metrics/route');
      GET = routeModule.GET;
      
      const request = createMockRequest('GET', '/api/metrics', null);
      const response = await GET(request);
      const text = await response.text();
      
      expect(response.status).toBe(200);
      expect(response.headers.get('X-Metrics-Level')).toBe('standard');
      
      // Should have these tiers
      expect(text).toContain('tier="core"');
      expect(text).toContain('tier="high_frequency"');
      expect(text).toContain('tier="optional"');
      expect(text).not.toContain('tier="specialized"');
      
      // Should not have 'all' aggregate
      expect(text).not.toContain('tier="all"');
    });

    it('should include all tiers and aggregates in detailed level', async () => {
      process.env.METRICS_LEVEL = 'detailed';
      
      jest.doMock('../../src/services/TieredValidationServiceWithMetrics', () => ({
        TieredValidationServiceWithMetrics: jest.fn().mockImplementation(() => ({
          getMetrics: jest.fn().mockReturnValue({
            totalRequests: 1000,
            requestsByTier: {
              core: 400,
              high_frequency: 300,
              optional: 200,
              specialized: 100
            },
            errorsByTier: {
              core: 0,
              high_frequency: 0,
              optional: 0,
              specialized: 0
            },
            performanceMetrics: {
              count: 1000,
              sum: 10000,
              min: 5,
              max: 50,
              p95: [10, 15, 20]
            }
          })
        }))
      }));
      
      const routeModule = require('../../src/app/api/metrics/route');
      GET = routeModule.GET;
      
      const request = createMockRequest('GET', '/api/metrics', null);
      const response = await GET(request);
      const text = await response.text();
      
      expect(response.status).toBe(200);
      expect(response.headers.get('X-Metrics-Level')).toBe('detailed');
      
      // Should have all tiers
      expect(text).toContain('tier="core"');
      expect(text).toContain('tier="high_frequency"');
      expect(text).toContain('tier="optional"');
      expect(text).toContain('tier="specialized"');
      expect(text).toContain('tier="all"'); // Aggregate metrics
      
      // Should have detailed histogram buckets
      expect(text).toContain('le="0.0005"');
      expect(text).toContain('le="5"');
    });
  });

  describe('Sampling configuration', () => {
    it('should apply sampling rate to request metrics', async () => {
      process.env.METRICS_SAMPLING_RATE = '0.1'; // 10% sampling
      
      jest.doMock('../../src/services/TieredValidationServiceWithMetrics', () => ({
        TieredValidationServiceWithMetrics: jest.fn().mockImplementation(() => ({
          getMetrics: jest.fn().mockReturnValue({
            totalRequests: 10000,
            requestsByTier: {
              core: 10000,
              high_frequency: 0,
              optional: 0,
              specialized: 0
            },
            errorsByTier: {
              core: 0,
              high_frequency: 0,
              optional: 0,
              specialized: 0
            },
            performanceMetrics: {
              count: 10000,
              sum: 100000,
              min: 5,
              max: 50,
              p95: new Array(100).fill(10) // 100 samples
            }
          })
        }))
      }));
      
      const routeModule = require('../../src/app/api/metrics/route');
      GET = routeModule.GET;
      
      const request = createMockRequest('GET', '/api/metrics', null);
      const response = await GET(request);
      const text = await response.text();
      
      expect(response.status).toBe(200);
      
      // With 10% sampling, 10000 requests should be reported as ~1000
      const match = text.match(/tier_validation_requests_total\{tier="core",version="v1"\}\s+(\d+)/);
      expect(match).toBeTruthy();
      const v1Count = parseInt(match[1]);
      expect(v1Count).toBeLessThan(500); // ~400 with 10% sampling
      expect(v1Count).toBeGreaterThan(300);
    });
  });

  describe('Memory monitoring', () => {
    it('should include memory metrics', async () => {
      const routeModule = require('../../src/app/api/metrics/route');
      GET = routeModule.GET;
      
      const request = createMockRequest('GET', '/api/metrics', null);
      const response = await GET(request);
      const text = await response.text();
      
      expect(response.status).toBe(200);
      
      // Check memory metrics
      expect(text).toContain('nodejs_memory_heap_used_bytes');
      expect(text).toContain('nodejs_memory_heap_total_bytes');
      expect(text).toContain('nodejs_memory_external_bytes');
      
      // Check memory header
      const memoryHeader = response.headers.get('X-Metrics-Memory-MB');
      expect(memoryHeader).toBeTruthy();
      const memoryMB = parseFloat(memoryHeader);
      expect(memoryMB).toBeGreaterThan(0);
      expect(memoryMB).toBeLessThan(500); // Reasonable upper bound
    });
  });

  describe('Configuration metadata', () => {
    it('should expose configuration as metrics', async () => {
      process.env.METRICS_LEVEL = 'standard';
      process.env.METRICS_SAMPLING_RATE = '0.5';
      process.env.METRICS_MAX_LABEL_VALUES = '50';
      
      const routeModule = require('../../src/app/api/metrics/route');
      GET = routeModule.GET;
      
      const request = createMockRequest('GET', '/api/metrics', null);
      const response = await GET(request);
      const text = await response.text();
      
      expect(response.status).toBe(200);
      
      // Check configuration metric
      expect(text).toContain('citypee_metrics_config{level="standard",sampling_rate="0.5",max_labels="50"}');
      expect(text).toContain('citypee_build_info');
      expect(text).toContain('metrics_level="standard"');
    });
  });
});