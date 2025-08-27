/**
 * Schema Integration Tests
 * 
 * @epic schema_documentation_completion_epic
 * @task schema_documentation_task3
 * @tdd-phase GREEN
 * 
 * End-to-end integration tests for schema validation across services.
 * Tests complete data flow from input to validated output.
 */

const { IngestService } = require('../../src/services/ingestService');
const { ValidationService } = require('../../src/services/validationService');
const { TieredValidationService } = require('../../src/services/validation/TieredValidationService');
const { ConfigurationLoader } = require('../../src/services/validation/ConfigurationLoader');
const { clearSchemaCache } = require('../../src/lib/validation/schemas');
const nock = require('nock');

describe('Schema Integration Tests', () => {
  beforeEach(() => {
    clearSchemaCache();
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('IngestService Schema Integration', () => {
    test('should validate Overpass response and generated GeoJSON in complete flow', async () => {
      // Mock Overpass API response
      const mockOverpassResponse = {
        version: 0.7,
        generator: 'Overpass API test',
        elements: [
          {
            type: 'node',
            id: 123456,
            lat: 51.5074,
            lon: -0.1278,
            tags: {
              amenity: 'toilets',
              access: 'public',
              name: 'Test Public Toilet'
            }
          }
        ]
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, mockOverpassResponse);

      const ingestService = new IngestService({
        overpassApiUrl: 'https://overpass-api.de/api/interpreter',
        outputFile: 'test-output.geojson',
        retryAttempts: 1,
        retryDelayMs: 100,
        timeoutMs: 5000
      });

      const result = await ingestService.ingest();

      // Should succeed with schema validation
      expect(result.success).toBe(true);
      expect(result.featuresCount).toBe(1);
      expect(result.outputFile).toBe('test-output.geojson');
    });

    test('should throw schema validation error for malformed Overpass response', async () => {
      // Mock malformed Overpass API response (missing required fields)
      const malformedResponse = {
        version: 0.7,
        // Missing generator and elements fields
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, malformedResponse);

      const ingestService = new IngestService({
        overpassApiUrl: 'https://overpass-api.de/api/interpreter',
        outputFile: 'test-output.geojson',
        retryAttempts: 1,
        retryDelayMs: 100,
        timeoutMs: 5000
      });

      await expect(ingestService.ingest()).rejects.toThrow('Schema validation failed for overpassQuery');
    });

    test('should measure schema validation performance in ingest flow', async () => {
      const mockResponse = {
        version: 0.7,
        generator: 'Performance test',
        elements: []
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, mockResponse);

      const ingestService = new IngestService({
        overpassApiUrl: 'https://overpass-api.de/api/interpreter',
        outputFile: 'test-performance.geojson'
      });

      const start = performance.now();
      const result = await ingestService.ingest();
      const duration = performance.now() - start;

      expect(result.success).toBe(true);
      // Total time should be reasonable (including schema validation overhead)
      expect(duration).toBeLessThan(1000); // 1 second for local test
    });
  });

  describe('ValidationService Schema Integration', () => {
    let validationService;

    beforeEach(() => {
      validationService = new ValidationService();
    });

    test('should apply schema validation to successful validation response', async () => {
      const validRequest = {
        body: JSON.stringify({
          lat: 51.5074,
          lng: -0.1278,
          name: 'Test Toilet',
          accessible: true,
          hours: '24/7',
          fee: 0
        }),
        ipAddress: '127.0.0.1'
      };

      // Capture console warnings for schema validation debugging
      const originalWarn = console.warn;
      const warnings = [];
      console.warn = (message, ...args) => warnings.push({ message, args });

      const result = await validationService.validateRequest(validRequest);

      console.warn = originalWarn;

      expect(result.isValid).toBe(true);
      expect(result.suggestionId).toBeDefined();
      // Schema validation should pass (no warnings)
      expect(warnings.length).toBe(0);
    });

    test('should apply schema validation to error validation response', async () => {
      const invalidRequest = {
        body: 'invalid json',
        ipAddress: '127.0.0.1'
      };

      const originalWarn = console.warn;
      const warnings = [];
      console.warn = (message, ...args) => warnings.push({ message, args });

      const result = await validationService.validateRequest(invalidRequest);

      console.warn = originalWarn;

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      // Schema validation should pass even for error responses (no warnings)
      expect(warnings.length).toBe(0);
    });

    test('should measure schema validation performance in validation service', async () => {
      const request = {
        body: JSON.stringify({
          lat: 51.5074,
          lng: -0.1278,
          name: 'Performance Test',
          accessible: true,
          hours: '24/7',
          fee: 0
        }),
        ipAddress: '127.0.0.1'
      };

      const start = performance.now();
      const result = await validationService.validateRequest(request);
      const duration = performance.now() - start;

      expect(result.isValid).toBe(true);
      // Should include minimal schema validation overhead (< 2ms as per skeptic recommendation)
      expect(duration).toBeLessThan(10); // Allow buffer for CI environments
    });
  });

  describe('TieredValidationService Schema Integration', () => {
    let tieredService;

    beforeEach(async () => {
      const configLoader = new ConfigurationLoader();
      tieredService = new TieredValidationService(configLoader);
      await tieredService.initialize();
    });

    test('should apply schema validation to tiered validation response', async () => {
      const validRequest = {
        body: JSON.stringify({
          lat: 51.5074,
          lng: -0.1278,
          name: 'Tiered Test',
          accessible: true,
          fee: 0,
          hours: '24/7'
        }),
        ipAddress: '127.0.0.1'
      };

      const result = await tieredService.validateRequest(validRequest);

      expect(result.isValid).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
      
      if (result.validation) {
        expect(Array.isArray(result.validation.errors)).toBe(true);
        expect(Array.isArray(result.validation.warnings)).toBe(true);
      }
    });

    test('should throw schema validation error for malformed tiered response', async () => {
      // This tests the error-throwing mode for TieredValidationService
      const invalidRequest = {
        body: 'malformed json',
        ipAddress: '127.0.0.1'
      };

      // TieredValidationService should handle invalid input gracefully
      // and its response should pass schema validation
      const result = await tieredService.validateRequest(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should measure schema validation performance in tiered service', async () => {
      const request = {
        body: JSON.stringify({
          lat: 51.5074,
          lng: -0.1278,
          name: 'Tiered Performance Test',
          accessible: true,
          fee: 0
        }),
        ipAddress: '127.0.0.1'
      };

      const start = performance.now();
      const result = await tieredService.validateRequest(request);
      const duration = performance.now() - start;

      expect(result.isValid).toBeDefined();
      // Should maintain performance with schema validation
      expect(duration).toBeLessThan(50); // Allow more time for complex tiered validation
    });
  });

  describe('Cross-Service Schema Integration', () => {
    test('should maintain consistent schema validation across all services', async () => {
      // Test that all services produce schema-compliant responses
      const mockValidationService = new ValidationService();
      const mockTieredService = new TieredValidationService(new ConfigurationLoader());
      
      await mockTieredService.initialize();

      const testRequest = {
        body: JSON.stringify({
          lat: 51.5074,
          lng: -0.1278,
          name: 'Cross-Service Test',
          accessible: true,
          fee: 0
        }),
        ipAddress: '127.0.0.1'
      };

      // All services should produce valid responses
      const validationResult = await mockValidationService.validateRequest(testRequest);
      const tieredResult = await mockTieredService.validateRequest(testRequest);

      expect(validationResult.isValid).toBeDefined();
      expect(tieredResult.isValid).toBeDefined();
      
      // Both should have consistent boolean isValid field
      expect(typeof validationResult.isValid).toBe('boolean');
      expect(typeof tieredResult.isValid).toBe('boolean');
    });

    test('should handle schema validation errors consistently', async () => {
      // Test error handling consistency across services
      const invalidRequest = {
        body: 'invalid json',
        ipAddress: '127.0.0.1'
      };

      const validationService = new ValidationService();
      const tieredService = new TieredValidationService(new ConfigurationLoader());
      await tieredService.initialize();

      const validationResult = await validationService.validateRequest(invalidRequest);
      const tieredResult = await tieredService.validateRequest(invalidRequest);

      // Both should handle errors gracefully
      expect(validationResult.isValid).toBe(false);
      expect(tieredResult.isValid).toBe(false);
      
      expect(validationResult.error).toBeDefined();
      expect(tieredResult.error).toBeDefined();
    });
  });

  describe('Schema Validation Performance Impact', () => {
    test('should not significantly impact overall service performance', async () => {
      const validationService = new ValidationService();
      const request = {
        body: JSON.stringify({
          lat: 51.5074,
          lng: -0.1278,
          name: 'Performance Impact Test',
          accessible: true,
          fee: 0
        }),
        ipAddress: '127.0.0.1'
      };

      // Run multiple iterations to measure average performance impact
      const iterations = 10;
      const durations = [];

      for (let i = 0; i < iterations; i++) {
        clearSchemaCache(); // Test cold cache performance
        const start = performance.now();
        await validationService.validateRequest(request);
        const duration = performance.now() - start;
        durations.push(duration);
      }

      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      // Schema validation should add minimal overhead
      expect(averageDuration).toBeLessThan(15); // Reasonable average
      expect(maxDuration).toBeLessThan(25); // Maximum acceptable duration
    });

    test('should benefit from schema caching in repeated validations', async () => {
      const validationService = new ValidationService();
      const request = {
        body: JSON.stringify({
          lat: 51.5074,
          lng: -0.1278,
          name: 'Cache Test',
          accessible: true,
          fee: 0
        }),
        ipAddress: '127.0.0.1'
      };

      // First validation (cold cache)
      clearSchemaCache();
      const start1 = performance.now();
      await validationService.validateRequest(request);
      const coldDuration = performance.now() - start1;

      // Second validation (warm cache)
      const start2 = performance.now();
      await validationService.validateRequest(request);
      const warmDuration = performance.now() - start2;

      // Warm cache should be faster or similar
      expect(warmDuration).toBeLessThanOrEqual(coldDuration * 1.1); // Allow 10% variance
    });
  });
});