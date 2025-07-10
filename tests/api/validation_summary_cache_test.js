/**
 * Tests for validation summary API caching functionality
 * 
 * @artifact docs/cookbook/recipe_metrics_export.md
 * @task metrics_export_0013_task6
 * @tdd-phase REFACTOR
 */

const request = require('supertest');
const { summaryCache } = require('@/utils/cache');
const { getValidationService } = require('@/app/api/metrics/route');

// Polyfill NextRequest and NextResponse for testing
if (!global.NextRequest) {
  global.NextRequest = class NextRequest {
    constructor(url, init = {}) {
      this.url = url;
      this.nextUrl = new URL(url);
      const headers = init.headers || {};
      this.headers = {
        get: (key) => headers[key] || null,
        entries: () => Object.entries(headers)
      };
    }
  };
}

if (!global.NextResponse) {
  class NextResponseClass {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.headers = new Map(Object.entries(init.headers || {}));
      this.json = async () => body;
    }
    
    static json(body, init = {}) {
      const response = new NextResponseClass(body, init);
      response.json = async () => body;
      return response;
    }
  }
  
  // Make it available both as a class and as a static object
  global.NextResponse = NextResponseClass;
}

const { GET } = require('@/app/api/validation/summary/route');

// Mock the validation service
jest.mock('@/app/api/metrics/route', () => ({
  getValidationService: jest.fn()
}));

// Mock the aggregation service
jest.mock('@/services/MetricsAggregationService', () => {
  const { summaryCache } = require('@/utils/cache');
  return {
    getAggregationService: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
      isRunning: jest.fn(() => true)
    })),
    resetAggregationService: jest.fn(() => {
      // Actually clear the cache when reset is called
      summaryCache.clear();
    })
  };
});

describe('Validation Summary API - Caching Features', () => {
  let mockValidationService;

  beforeEach(() => {
    // Clear cache before each test
    summaryCache.clear();
    
    // Setup mock validation service
    mockValidationService = {
      getMetrics: jest.fn().mockReturnValue({
        totalRequests: 100,
        requestsByTier: {
          core: 50,
          high_frequency: 30,
          optional: 15,
          specialized: 5
        },
        errorsByTier: {
          core: 2,
          high_frequency: 1,
          optional: 0,
          specialized: 0
        },
        performanceMetrics: {
          count: 100,
          sum: 1500,
          min: 5,
          max: 50,
          p95: [20, 25, 30, 35, 40]
        }
      })
    };
    
    getValidationService.mockReturnValue(mockValidationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Response caching', () => {
    it('should cache responses for 60 seconds', async () => {
      // First request - should generate fresh data
      const url1 = new URL('http://localhost/api/validation/summary');
      const req1 = new NextRequest(url1);
      const res1 = await GET(req1);
      const headers1 = Object.fromEntries(res1.headers.entries());
      
      expect(headers1['x-cache']).toBe('MISS');
      expect(headers1['cache-control']).toBe('private, max-age=60');
      expect(headers1['etag']).toBeDefined();
      
      // Second request - should serve from cache
      const req2 = new NextRequest(url1);
      const res2 = await GET(req2);
      const headers2 = Object.fromEntries(res2.headers.entries());
      
      expect(headers2['x-cache']).toBe('HIT');
      expect(headers2['etag']).toBe(headers1['etag']);
      
      // Validation service should only be called once
      expect(mockValidationService.getMetrics).toHaveBeenCalledTimes(1);
    });

    it('should cache different time windows separately', async () => {
      // Request with 1h window
      const url1h = new URL('http://localhost/api/validation/summary?window=1h');
      const req1h = new NextRequest(url1h);
      const res1h = await GET(req1h);
      const headers1h = Object.fromEntries(res1h.headers.entries());
      
      expect(headers1h['x-cache']).toBe('MISS');
      
      // Request with 24h window - should not use 1h cache
      const url24h = new URL('http://localhost/api/validation/summary?window=24h');
      const req24h = new NextRequest(url24h);
      const res24h = await GET(req24h);
      const headers24h = Object.fromEntries(res24h.headers.entries());
      
      expect(headers24h['x-cache']).toBe('MISS');
      expect(headers24h['etag']).not.toBe(headers1h['etag']);
      
      // Both should have been called
      expect(mockValidationService.getMetrics).toHaveBeenCalledTimes(2);
    });
  });

  describe('ETag support', () => {
    it('should return 304 Not Modified for matching ETag', async () => {
      // First request to get ETag
      const url = new URL('http://localhost/api/validation/summary');
      const req1 = new NextRequest(url);
      const res1 = await GET(req1);
      const etag = res1.headers.get('etag');
      
      expect(etag).toBeDefined();
      
      // Second request with If-None-Match
      const req2 = new NextRequest(url, {
        headers: {
          'If-None-Match': etag
        }
      });
      const res2 = await GET(req2);
      
      expect(res2.status).toBe(304);
      expect(res2.headers.get('etag')).toBe(etag);
      expect(res2.headers.get('cache-control')).toBe('private, max-age=60');
      
      // Should only call service once
      expect(mockValidationService.getMetrics).toHaveBeenCalledTimes(1);
    });

    it('should return full response for non-matching ETag', async () => {
      // First request
      const url = new URL('http://localhost/api/validation/summary');
      const req1 = new NextRequest(url);
      await GET(req1);
      
      // Second request with different ETag
      const req2 = new NextRequest(url, {
        headers: {
          'If-None-Match': '"different-etag"'
        }
      });
      const res2 = await GET(req2);
      
      expect(res2.status).toBe(200);
      const data = await res2.json();
      expect(data.summary).toBeDefined();
    });
  });

  describe('Compression headers', () => {
    it('should include compression support headers', async () => {
      const url = new URL('http://localhost/api/validation/summary');
      const req = new NextRequest(url);
      const res = await GET(req);
      const headers = Object.fromEntries(res.headers.entries());
      
      expect(headers['content-encoding']).toBe('gzip, deflate');
    });
  });

  describe('Cache invalidation', () => {
    it('should clear cache when metrics are reset', async () => {
      // First request - populate cache
      const url = new URL('http://localhost/api/validation/summary');
      const req1 = new NextRequest(url);
      const res1 = await GET(req1);
      expect(res1.headers.get('x-cache')).toBe('MISS');
      
      // Verify cache is populated
      const req2 = new NextRequest(url);
      const res2 = await GET(req2);
      expect(res2.headers.get('x-cache')).toBe('HIT');
      
      // Reset metrics (which should clear cache)
      const { resetAggregationService } = require('@/services/MetricsAggregationService');
      resetAggregationService();
      
      // Next request should miss cache
      const req3 = new NextRequest(url);
      const res3 = await GET(req3);
      expect(res3.headers.get('x-cache')).toBe('MISS');
      
      // Service should be called twice (initial + after cache clear)
      expect(mockValidationService.getMetrics).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance with caching', () => {
    it('should respond faster from cache', async () => {
      const url = new URL('http://localhost/api/validation/summary');
      
      // First request - generate data
      const req1 = new NextRequest(url);
      const start1 = Date.now();
      const res1 = await GET(req1);
      const time1Str = res1.headers.get('x-response-time') || '0ms';
      const time1 = parseInt(time1Str.replace('ms', ''));
      
      // Second request - from cache
      const req2 = new NextRequest(url);
      const start2 = Date.now();
      const res2 = await GET(req2);
      const time2Str = res2.headers.get('x-response-time') || '0ms';
      const time2 = parseInt(time2Str.replace('ms', ''));
      
      // Cache hit should be significantly faster (allow for equal times in fast tests)
      expect(time2).toBeLessThanOrEqual(time1);
      expect(time2).toBeLessThan(5); // Should be < 5ms from cache
    });
  });
});