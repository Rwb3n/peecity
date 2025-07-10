/**
 * Error path tests for metrics endpoint
 * 
 * @artifact docs/cookbook/recipe_metrics_export.md
 * @task metrics_export_0013_task2
 * @tdd-phase GREEN
 * 
 * Tests error handling to achieve 90%+ coverage
 */

const { createMockRequest } = require('../helpers/api-test-helper');

describe('Metrics endpoint error paths', () => {
  let GET;
  let originalConsoleError;
  
  beforeEach(() => {
    // Suppress console.error for cleaner test output
    originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
    jest.resetModules();
  });
  
  afterEach(() => {
    console.error = originalConsoleError;
    jest.resetModules();
  });

  it('should return 500 when metrics service throws', async () => {
    // Mock the service to throw an error
    jest.doMock('../../src/services/TieredValidationServiceWithMetrics', () => {
      return {
        TieredValidationServiceWithMetrics: jest.fn().mockImplementation(() => ({
          getMetrics: jest.fn().mockImplementation(() => {
            throw new Error('Service unavailable');
          })
        }))
      };
    });
    
    // Import route after mocking
    const routeModule = require('../../src/app/api/metrics/route');
    GET = routeModule.GET;
    
    const request = createMockRequest('GET', '/api/metrics', null);
    const response = await GET(request);
    const text = await response.text();
    
    expect(response.status).toBe(500);
    expect(text).toContain('Error generating metrics');
    expect(console.error).toHaveBeenCalledWith('Error generating metrics:', expect.any(Error));
  });

  it('should handle edge case with zero metrics', async () => {
    // Mock service to return all zeros
    jest.doMock('../../src/services/TieredValidationServiceWithMetrics', () => {
      return {
        TieredValidationServiceWithMetrics: jest.fn().mockImplementation(() => ({
          getMetrics: jest.fn().mockReturnValue({
            totalRequests: 0,
            requestsByTier: {
              core: 0,
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
              count: 0,
              sum: 0,
              min: Infinity,
              max: 0,
              p95: []
            }
          })
        }))
      };
    });
    
    const routeModule = require('../../src/app/api/metrics/route');
    GET = routeModule.GET;
    
    const request = createMockRequest('GET', '/api/metrics', null);
    const response = await GET(request);
    const text = await response.text();
    
    expect(response.status).toBe(200);
    // Should still have metric definitions even with zero values
    expect(text).toContain('tier_validation_requests_total');
    expect(text).toContain('tier_validation_errors_total');
    expect(text).toContain('tier_validation_duration_seconds');
  });

  it('should handle metrics with only errors, no requests', async () => {
    // Edge case: errors but no successful requests
    jest.doMock('../../src/services/TieredValidationServiceWithMetrics', () => {
      return {
        TieredValidationServiceWithMetrics: jest.fn().mockImplementation(() => ({
          getMetrics: jest.fn().mockReturnValue({
            totalRequests: 50,
            requestsByTier: {
              core: 0,
              high_frequency: 0,
              optional: 0,
              specialized: 0
            },
            errorsByTier: {
              core: 50,
              high_frequency: 0,
              optional: 0,
              specialized: 0
            },
            performanceMetrics: {
              count: 50,
              sum: 500,
              min: 5,
              max: 20,
              p95: [8, 9, 10, 11, 12]
            }
          })
        }))
      };
    });
    
    const routeModule = require('../../src/app/api/metrics/route');
    GET = routeModule.GET;
    
    const request = createMockRequest('GET', '/api/metrics', null);
    const response = await GET(request);
    const text = await response.text();
    
    expect(response.status).toBe(200);
    // Should have error metrics
    expect(text).toMatch(/tier_validation_errors_total\{tier="core",error_type="validation"\}\s+35/);
    expect(text).toMatch(/tier_validation_errors_total\{tier="core",error_type="type_error"\}\s+15/);
  });
});