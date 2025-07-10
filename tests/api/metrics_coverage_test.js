/**
 * Additional tests to improve metrics endpoint coverage
 * 
 * @artifact docs/cookbook/recipe_metrics_export.md
 * @task metrics_export_0013_task2
 * @tdd-phase GREEN
 * 
 * Tests edge cases to achieve 90%+ coverage requirement
 */

const { createMockRequest } = require('../helpers/api-test-helper');

// Mock the validation service to return data with errors
jest.mock('../../src/services/TieredValidationServiceWithMetrics', () => {
  return {
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
          core: 20,
          high_frequency: 15,
          optional: 10,
          specialized: 5
        },
        performanceMetrics: {
          count: 1000,
          sum: 15000,
          min: 5,
          max: 100,
          p95: [10, 15, 20, 25, 30, 35, 40]
        }
      })
    }))
  };
});

describe('Metrics endpoint coverage tests', () => {
  let GET;
  let originalEnv;
  
  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Set to detailed mode to include all tiers for coverage testing
    process.env.METRICS_LEVEL = 'detailed';
    
    // Clear module cache to ensure mock is applied
    jest.clearAllMocks();
    jest.resetModules();
    
    // Re-import the route handler with mocked service
    const routeModule = require('../../src/app/api/metrics/route');
    GET = routeModule.GET;
  });
  
  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  it('should handle metrics with errors in all tiers', async () => {
    const request = createMockRequest('GET', '/api/metrics', null);
    const response = await GET(request);
    const text = await response.text();
    
    expect(response.status).toBe(200);
    
    // Verify error metrics are present for all tiers
    expect(text).toMatch(/tier_validation_errors_total\{tier="core",error_type="validation"\}\s+14/);
    expect(text).toMatch(/tier_validation_errors_total\{tier="core",error_type="type_error"\}\s+6/);
    expect(text).toMatch(/tier_validation_errors_total\{tier="high_frequency",error_type="validation"\}\s+10/);
    expect(text).toMatch(/tier_validation_errors_total\{tier="optional",error_type="validation"\}\s+7/);
    expect(text).toMatch(/tier_validation_errors_total\{tier="specialized",error_type="validation"\}\s+3/);
  });

  it('should handle duration histogram with multiple samples', async () => {
    const request = createMockRequest('GET', '/api/metrics', null);
    const response = await GET(request);
    const text = await response.text();
    
    // Verify histogram buckets are populated
    expect(text).toMatch(/tier_validation_duration_seconds_bucket/);
    expect(text).toMatch(/tier_validation_duration_seconds_sum/);
    expect(text).toMatch(/tier_validation_duration_seconds_count/);
    
    // Should have samples distributed across tiers
    const bucketLines = text.split('\n').filter(line => 
      line.includes('tier_validation_duration_seconds_bucket')
    );
    expect(bucketLines.length).toBeGreaterThan(0);
  });

  it('should include build info with environment variables', async () => {
    process.env.BUILD_VERSION = 'test-coverage-1.0.0';
    
    const request = createMockRequest('GET', '/api/metrics', null);
    const response = await GET(request);
    const text = await response.text();
    
    expect(text).toContain('citypee_build_info{version="test-coverage-1.0.0"');
    
    delete process.env.BUILD_VERSION;
  });

  it('should handle aggregate metrics for overall duration', async () => {
    const request = createMockRequest('GET', '/api/metrics', null);
    const response = await GET(request);
    const text = await response.text();
    
    // Should have 'all' tier for aggregate metrics
    expect(text).toMatch(/tier_validation_duration_seconds.*tier="all"/);
  });
});

// Reset mocks after all tests
afterAll(() => {
  jest.restoreAllMocks();
});