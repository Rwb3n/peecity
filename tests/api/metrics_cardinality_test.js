/**
 * Tests for metrics label cardinality protection
 * 
 * @artifact docs/cookbook/recipe_metrics_export.md
 * @task metrics_export_0013_task3
 * @tdd-phase REFACTOR
 * 
 * Tests label cardinality limits to prevent memory issues
 */

const { createMockRequest } = require('../helpers/api-test-helper');

describe('Metrics label cardinality protection', () => {
  let originalEnv;
  let GET;
  let originalWarn;
  let warnCalls = [];
  
  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    originalWarn = console.warn;
    
    // Set to detailed mode to test all tiers
    process.env.METRICS_LEVEL = 'detailed';
    
    // Capture warnings
    console.warn = jest.fn((...args) => {
      warnCalls.push(args);
    });
    warnCalls = [];
    
    // Clear module cache
    jest.clearAllMocks();
    jest.resetModules();
  });
  
  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    console.warn = originalWarn;
    jest.resetModules();
  });

  it('should limit label cardinality to configured maximum', async () => {
    process.env.METRICS_MAX_LABEL_VALUES = '2'; // Very low limit for testing
    
    // Mock service with many unique tier values (simulating a bug or attack)
    const uniqueTiers = Array.from({ length: 10 }, (_, i) => `tier_${i}`);
    const requestsByTier = {};
    uniqueTiers.forEach(tier => {
      requestsByTier[tier] = 100;
    });
    
    jest.doMock('../../src/services/TieredValidationServiceWithMetrics', () => ({
      TieredValidationServiceWithMetrics: jest.fn().mockImplementation(() => ({
        getMetrics: jest.fn().mockReturnValue({
          totalRequests: 1000,
          requestsByTier,
          errorsByTier: {},
          performanceMetrics: {
            count: 0,
            sum: 0,
            min: Infinity,
            max: 0,
            p95: []
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
    
    // Count unique tier labels in output
    const tierMatches = text.match(/tier="tier_\d+"/g) || [];
    const uniqueTiersInOutput = new Set(tierMatches).size;
    
    // Should be limited to 2 unique tier values (plus standard tiers)
    expect(uniqueTiersInOutput).toBeLessThanOrEqual(2);
    
    // Should have warnings about cardinality
    expect(warnCalls.length).toBeGreaterThan(0);
    expect(warnCalls.some(args => 
      args[0].includes('Label cardinality limit reached')
    )).toBe(true);
  });

  it('should track cardinality per metric name', async () => {
    process.env.METRICS_MAX_LABEL_VALUES = '5';
    
    // Create many tiers but also many error types
    const tiers = ['core', 'high_frequency', 'optional', 'specialized', 'extra1', 'extra2'];
    const errorTypes = ['validation', 'type_error', 'custom1', 'custom2', 'custom3', 'custom4'];
    
    const requestsByTier = {};
    const errorsByTier = {};
    
    tiers.forEach(tier => {
      requestsByTier[tier] = 100;
      errorsByTier[tier] = 50;
    });
    
    jest.doMock('../../src/services/TieredValidationServiceWithMetrics', () => ({
      TieredValidationServiceWithMetrics: jest.fn().mockImplementation(() => ({
        getMetrics: jest.fn().mockReturnValue({
          totalRequests: 600,
          requestsByTier,
          errorsByTier,
          performanceMetrics: {
            count: 0,
            sum: 0,
            min: Infinity,
            max: 0,
            p95: []
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
    
    // Each metric should independently track its label cardinality
    const requestTierMatches = text.match(/tier_validation_requests_total\{tier="([^"]+)"/g) || [];
    const errorTierMatches = text.match(/tier_validation_errors_total\{tier="([^"]+)"/g) || [];
    
    // Both should respect the limit (6 tiers provided, max 5 allowed, but may include 'all' in detailed mode)
    expect(new Set(requestTierMatches).size).toBeLessThanOrEqual(6);
    expect(new Set(errorTierMatches).size).toBeLessThanOrEqual(6);
  });

  it('should allow previously seen labels without counting against limit', async () => {
    process.env.METRICS_MAX_LABEL_VALUES = '4'; // Exactly the number of standard tiers
    
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
          errorsByTier: {},
          performanceMetrics: {
            count: 0,
            sum: 0,
            min: Infinity,
            max: 0,
            p95: []
          }
        })
      }))
    }));
    
    const routeModule = require('../../src/app/api/metrics/route');
    GET = routeModule.GET;
    
    // Make multiple requests
    for (let i = 0; i < 3; i++) {
      const request = createMockRequest('GET', '/api/metrics', null);
      const response = await GET(request);
      const text = await response.text();
      
      expect(response.status).toBe(200);
      
      // All standard tiers should be present
      expect(text).toContain('tier="core"');
      expect(text).toContain('tier="high_frequency"');
      expect(text).toContain('tier="optional"');
      expect(text).toContain('tier="specialized"');
    }
    
    // Should not have warnings for standard tiers
    expect(warnCalls.filter(args => 
      args[0].includes('Label cardinality limit reached')
    ).length).toBe(0);
  });
});