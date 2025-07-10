/**
 * Overpass Utility Test Suite
 * 
 * @doc refs docs/architecture-spec.md#ingest-agent
 * Tests for the extracted Overpass API utility with retry logic and caching
 */

const nock = require('nock');
const { 
  queryOverpass, 
  getPerformanceMetrics, 
  clearCache, 
  benchmarkQuery,
  TOILET_QUERIES 
} = require('../../src/utils/overpass.ts');

describe('Overpass Utility', () => {
  beforeEach(() => {
    // Clear cache and nock interceptors before each test
    clearCache();
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Basic Query Functionality', () => {
    it('should execute a successful query', async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: [
          {
            type: "node",
            id: 123456,
            lat: 51.5074,
            lon: -0.1278,
            tags: {
              amenity: "toilets",
              name: "Test Toilets"
            }
          }
        ]
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .matchHeader('user-agent', /.*/)
        .reply(200, mockResponse);

      const result = await queryOverpass(TOILET_QUERIES.LONDON);
      
      expect(result).toEqual(mockResponse);
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].tags.amenity).toBe('toilets');
    });

    it('should handle custom configuration', async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: []
      };

      nock('https://custom-overpass.example.com')
        .post('/api/custom')
        .reply(200, mockResponse);

      const customConfig = {
        apiUrl: 'https://custom-overpass.example.com/api/custom',
        retryAttempts: 1,
        timeoutMs: 5000
      };

      const result = await queryOverpass('test query', customConfig);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on 429 rate limit errors', async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: []
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(429, 'Rate limited')
        .post('/api/interpreter')
        .reply(200, mockResponse);

      const result = await queryOverpass('test query', { retryAttempts: 2 });
      expect(result).toEqual(mockResponse);
    });

    it('should retry on 5xx server errors', async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: []
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(500, 'Internal server error')
        .post('/api/interpreter')
        .reply(200, mockResponse);

      const result = await queryOverpass('test query', { retryAttempts: 2 });
      expect(result).toEqual(mockResponse);
    });

    it('should fail after maximum retry attempts', async () => {
      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(429, 'Rate limited')
        .post('/api/interpreter')
        .reply(429, 'Rate limited')
        .post('/api/interpreter')
        .reply(429, 'Rate limited');

      await expect(
        queryOverpass('test query', { retryAttempts: 3 })
      ).rejects.toThrow('429');
    });

    it('should not retry on 4xx client errors (except 429)', async () => {
      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(400, 'Bad request');

      await expect(
        queryOverpass('test query', { retryAttempts: 3 })
      ).rejects.toThrow('400');
    });
  });

  describe('Caching Functionality', () => {
    it('should cache successful responses', async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: [{ type: "node", id: 123 }]
      };

      // First request should hit the API
      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .matchHeader('user-agent', /.*/)
        .reply(200, mockResponse);

      const result1 = await queryOverpass('test query', { enableCache: true });
      expect(result1).toEqual(mockResponse);

      // Second request should use cache (no new nock needed)
      const result2 = await queryOverpass('test query', { enableCache: true });
      expect(result2).toEqual(mockResponse);

      // Verify cache is being used
      const metrics = getPerformanceMetrics();
      expect(metrics.cacheSize).toBe(1);
    });

    it('should respect cache expiry', async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: []
      };

      // First request
      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .matchHeader('user-agent', /.*/)
        .reply(200, mockResponse);

      await queryOverpass('test query', { 
        enableCache: true, 
        cacheExpiryMs: 100 // 100ms expiry
      });

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second request should hit API again due to expiry
      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .matchHeader('user-agent', /.*/)
        .reply(200, mockResponse);

      const result = await queryOverpass('test query', { enableCache: true });
      expect(result).toEqual(mockResponse);
    });

    it('should allow disabling cache', async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: []
      };

      // Both requests should hit the API
      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, mockResponse)
        .post('/api/interpreter')
        .reply(200, mockResponse);

      await queryOverpass('test query', { enableCache: false });
      await queryOverpass('test query', { enableCache: false });

      const metrics = getPerformanceMetrics();
      expect(metrics.cacheSize).toBe(0);
    });
  });

  describe('Predefined Queries', () => {
    it('should have London toilet query', () => {
      expect(TOILET_QUERIES.LONDON).toContain('Greater London');
      expect(TOILET_QUERIES.LONDON).toContain('amenity');
      expect(TOILET_QUERIES.LONDON).toContain('toilets');
    });

    it('should generate borough-specific queries', () => {
      const boroughQuery = TOILET_QUERIES.BOROUGH('Westminster');
      expect(boroughQuery).toContain('Westminster');
      expect(boroughQuery).toContain('admin_level"="8');
    });

    it('should generate radius queries around a point', () => {
      const radiusQuery = TOILET_QUERIES.AROUND_POINT(51.5074, -0.1278, 1000);
      expect(radiusQuery).toContain('around:1000,51.5074,-0.1278');
    });
  });

  describe('Performance Benchmarking', () => {
    it('should benchmark query performance', async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: [
          { type: "node", id: 1 },
          { type: "node", id: 2 }
        ]
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .matchHeader('user-agent', /.*/)
        .reply(200, mockResponse);

      const benchmark = await benchmarkQuery('test query');
      
      expect(benchmark.duration).toBeGreaterThan(0);
      expect(benchmark.cached).toBe(false);
      expect(benchmark.elements).toBe(2);
    });

    it('should detect cached responses in benchmark', async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: []
      };

      // Prime the cache
      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .matchHeader('user-agent', /.*/)
        .reply(200, mockResponse);

      await queryOverpass('test query', { enableCache: true });

      // Benchmark should detect cached response
      const benchmark = await benchmarkQuery('test query', { enableCache: true });
      expect(benchmark.cached).toBe(true);
      expect(benchmark.duration).toBeLessThan(50); // Should be very fast from cache
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON responses', async () => {
      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, 'invalid json');

      await expect(
        queryOverpass('test query')
      ).rejects.toThrow('Invalid JSON response');
    });

    it('should handle network timeouts', async () => {
      const http = require('http');
      let server; let port;
      await new Promise(res => {
        server = http.createServer((req, res2) => {
          setTimeout(() => {
            res2.writeHead(200, { 'Content-Type': 'application/json' });
            res2.end('{}');
          }, 150);
        }).listen(0, () => { port = server.address().port; res(); });
      });
      const url = `http://localhost:${port}`;
      await expect(queryOverpass('out:json;', { apiUrl: url, timeoutMs: 50, retryAttempts: 1, enableCache: false })).rejects.toThrow('timeout');
      await new Promise(r => server.close(r));
    });

    it('should handle connection errors', async () => {
      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .matchHeader('user-agent', /.*/)
        .replyWithError({ code: 'ECONNREFUSED', message: 'ECONNREFUSED' });

      await expect(
        queryOverpass('test query', { retryAttempts: 1, retryDelayMs: 100 })
      ).rejects.toThrow('ECONNREFUSED');
    }, 10000);
  });

  describe('Utility Functions', () => {
    it('should provide performance metrics', () => {
      const metrics = getPerformanceMetrics();
      expect(metrics).toHaveProperty('cacheSize');
      expect(metrics).toHaveProperty('cacheEnabled');
      expect(typeof metrics.cacheSize).toBe('number');
      expect(typeof metrics.cacheEnabled).toBe('boolean');
    });

    it('should clear cache when requested', async () => {
      const mockResponse = { elements: [] };
      
      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .matchHeader('user-agent', /.*/)
        .reply(200, mockResponse);

      await queryOverpass('test query', { enableCache: true });
      expect(getPerformanceMetrics().cacheSize).toBe(1);

      clearCache();
      expect(getPerformanceMetrics().cacheSize).toBe(0);
    });
  });
});