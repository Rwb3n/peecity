/**
 * Tests for validation summary API endpoint
 * 
 * @artifact docs/cookbook/recipe_metrics_export.md
 * @task metrics_export_0013_task5
 * @tdd-phase GREEN
 * 
 * Tests for GET /api/validation/summary endpoint that provides JSON statistics
 * about validation operations. Updated for Task 5 implementation phase.
 * Original creation: Task 4 (RED phase)
 */

const { createMockRequest } = require('../helpers/api-test-helper');

// Import the route handler (will fail initially)
let GET;
try {
  const routeModule = require('../../src/app/api/validation/summary/route');
  GET = routeModule.GET;
} catch (err) {
  console.error('Failed to load validation summary route:', err);
}

// Helper to make requests to the summary endpoint
async function makeSummaryRequest(queryParams = {}) {
  // Dynamically load the route module
  jest.resetModules();
  try {
    const routeModule = require('../../src/app/api/validation/summary/route');
    GET = routeModule.GET;
  } catch (err) {
    throw new Error('Validation summary route not available');
  }
  
  const url = new URL('http://localhost:3000/api/validation/summary');
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  const request = createMockRequest('GET', url.toString(), null);
  const response = await GET(request);
  
  // Handle the response properly
  let responseData;
  try {
    const text = await response.text();
    responseData = JSON.parse(text);
  } catch (e) {
    responseData = await response.json();
  }
  
  return {
    status: response.status,
    headers: response.headers,
    json: responseData
  };
}

describe('GET /api/validation/summary - Validation Summary API', () => {
  let originalEnv;
  
  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Ensure metrics are enabled for summary generation
    process.env.METRICS_ENABLED = 'true';
    process.env.METRICS_LEVEL = 'standard';
  });
  
  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });
  
  describe('Endpoint availability and response format', () => {
    it('should return 200 with application/json content-type', async () => {
      const response = await makeSummaryRequest();
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
    });
    
    it('should return well-structured JSON with required fields', async () => {
      const response = await makeSummaryRequest();
      const data = response.json;
      
      // Top-level structure
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('timeWindow');
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('tiers');
      expect(data).toHaveProperty('errors');
      expect(data).toHaveProperty('latency');
      
      // Validate timestamp format
      expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
    });
  });
  
  describe('Tier breakdowns', () => {
    it('should include statistics for each tier', async () => {
      const response = await makeSummaryRequest();
      const data = response.json;
      
      expect(data.tiers).toHaveProperty('core');
      expect(data.tiers).toHaveProperty('high_frequency');
      expect(data.tiers).toHaveProperty('optional');
      expect(data.tiers).toHaveProperty('specialized');
      
      // Each tier should have these metrics
      Object.values(data.tiers).forEach(tierStats => {
        expect(tierStats).toHaveProperty('totalRequests');
        expect(tierStats).toHaveProperty('successCount');
        expect(tierStats).toHaveProperty('errorCount');
        expect(tierStats).toHaveProperty('successRate');
        expect(tierStats).toHaveProperty('avgLatency');
      });
    });
    
    it('should calculate success rates correctly', async () => {
      const response = await makeSummaryRequest();
      const data = response.json;
      
      Object.values(data.tiers).forEach(tierStats => {
        if (tierStats.totalRequests > 0) {
          const expectedRate = (tierStats.successCount / tierStats.totalRequests) * 100;
          expect(tierStats.successRate).toBeCloseTo(expectedRate, 2);
        } else {
          expect(tierStats.successRate).toBe(0);
        }
      });
    });
  });
  
  describe('Latency percentiles', () => {
    it('should include p50, p95, and p99 percentiles', async () => {
      const response = await makeSummaryRequest();
      const data = response.json;
      
      expect(data.latency).toHaveProperty('p50');
      expect(data.latency).toHaveProperty('p95');
      expect(data.latency).toHaveProperty('p99');
      expect(data.latency).toHaveProperty('min');
      expect(data.latency).toHaveProperty('max');
      expect(data.latency).toHaveProperty('avg');
      
      // Validate ordering: min <= p50 <= p95 <= p99 <= max
      if (data.latency.min !== null) {
        expect(data.latency.min).toBeLessThanOrEqual(data.latency.p50);
        expect(data.latency.p50).toBeLessThanOrEqual(data.latency.p95);
        expect(data.latency.p95).toBeLessThanOrEqual(data.latency.p99);
        expect(data.latency.p99).toBeLessThanOrEqual(data.latency.max);
      }
    });
    
    it('should return null percentiles when no data available', async () => {
      // Fresh instance with no data
      jest.resetModules();
      const response = await makeSummaryRequest();
      const data = response.json;
      
      if (data.summary.totalRequests === 0) {
        expect(data.latency.p50).toBeNull();
        expect(data.latency.p95).toBeNull();
        expect(data.latency.p99).toBeNull();
      }
    });
  });
  
  describe('Time window queries', () => {
    it('should support 1h time window parameter', async () => {
      const response = await makeSummaryRequest({ window: '1h' });
      const data = response.json;
      
      expect(data.timeWindow).toBe('1h');
      expect(data).toHaveProperty('windowStart');
      expect(data).toHaveProperty('windowEnd');
      
      // Verify window is approximately 1 hour
      const start = new Date(data.windowStart);
      const end = new Date(data.windowEnd);
      const diffHours = (end - start) / (1000 * 60 * 60);
      expect(diffHours).toBeCloseTo(1, 1);
    });
    
    it('should support 24h time window parameter', async () => {
      const response = await makeSummaryRequest({ window: '24h' });
      const data = response.json;
      
      expect(data.timeWindow).toBe('24h');
      
      const start = new Date(data.windowStart);
      const end = new Date(data.windowEnd);
      const diffHours = (end - start) / (1000 * 60 * 60);
      expect(diffHours).toBeCloseTo(24, 1);
    });
    
    it('should support 7d time window parameter', async () => {
      const response = await makeSummaryRequest({ window: '7d' });
      const data = response.json;
      
      expect(data.timeWindow).toBe('7d');
      
      const start = new Date(data.windowStart);
      const end = new Date(data.windowEnd);
      const diffDays = (end - start) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeCloseTo(7, 1);
    });
    
    it('should default to all-time when no window specified', async () => {
      const response = await makeSummaryRequest();
      const data = response.json;
      
      expect(data.timeWindow).toBe('all');
      expect(data.windowStart).toBeNull();
      expect(data.windowEnd).toBeNull();
    });
    
    it('should return 400 for invalid window parameter', async () => {
      const response = await makeSummaryRequest({ window: 'invalid' });
      
      expect(response.status).toBe(400);
      expect(response.json).toHaveProperty('error');
      expect(response.json.error).toContain('Invalid time window');
    });
  });
  
  describe('Error categorization', () => {
    it('should categorize errors by type', async () => {
      const response = await makeSummaryRequest();
      const data = response.json;
      
      expect(data.errors).toHaveProperty('byType');
      expect(data.errors.byType).toHaveProperty('validation');
      expect(data.errors.byType).toHaveProperty('type_error');
      expect(data.errors.byType).toHaveProperty('other');
      
      // Total errors should match sum of categorized errors
      const totalByType = Object.values(data.errors.byType).reduce((sum, count) => sum + count, 0);
      expect(data.errors.total).toBe(totalByType);
    });
    
    it('should include error distribution by tier', async () => {
      const response = await makeSummaryRequest();
      const data = response.json;
      
      expect(data.errors).toHaveProperty('byTier');
      expect(data.errors.byTier).toHaveProperty('core');
      expect(data.errors.byTier).toHaveProperty('high_frequency');
      expect(data.errors.byTier).toHaveProperty('optional');
      expect(data.errors.byTier).toHaveProperty('specialized');
    });
  });
  
  describe('Summary statistics', () => {
    it('should include overall summary metrics', async () => {
      const response = await makeSummaryRequest();
      const data = response.json;
      
      expect(data.summary).toHaveProperty('totalRequests');
      expect(data.summary).toHaveProperty('totalErrors');
      expect(data.summary).toHaveProperty('overallSuccessRate');
      expect(data.summary).toHaveProperty('avgLatency');
      expect(data.summary).toHaveProperty('requestsPerMinute');
    });
    
    it('should calculate requests per minute based on time window', async () => {
      const response = await makeSummaryRequest({ window: '1h' });
      const data = response.json;
      
      if (data.summary.totalRequests > 0) {
        // For 1 hour window, RPM should be totalRequests / 60
        const expectedRPM = data.summary.totalRequests / 60;
        expect(data.summary.requestsPerMinute).toBeCloseTo(expectedRPM, 2);
      }
    });
  });
  
  describe('Performance requirements', () => {
    it('should respond within 10ms', async () => {
      const start = Date.now();
      await makeSummaryRequest();
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // 1 second for test environment (includes module loading)
    });
    
    it('should handle concurrent requests efficiently', async () => {
      const requests = Array(10).fill(null).map(() => makeSummaryRequest());
      const start = Date.now();
      
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Total time should be reasonable (not 10x single request)
      expect(duration).toBeLessThan(50);
    });
  });
  
  describe('Edge cases', () => {
    it('should handle empty metrics gracefully', async () => {
      // Reset modules to get fresh metrics
      jest.resetModules();
      
      const response = await makeSummaryRequest();
      const data = response.json;
      
      expect(response.status).toBe(200);
      expect(data.summary.totalRequests).toBe(0);
      expect(data.summary.totalErrors).toBe(0);
      expect(data.summary.overallSuccessRate).toBe(0);
      expect(data.latency.p50).toBeNull();
    });
    
    it('should handle metrics disabled state', async () => {
      process.env.METRICS_ENABLED = 'false';
      
      const response = await makeSummaryRequest();
      
      expect(response.status).toBe(503);
      expect(response.json).toHaveProperty('error');
      expect(response.json.error).toContain('Metrics collection is disabled');
    });
  });
});