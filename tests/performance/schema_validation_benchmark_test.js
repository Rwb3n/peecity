/**
 * Schema Validation Performance Benchmarks
 * 
 * @epic schema_documentation_completion_epic
 * @task schema_documentation_task3
 * @tdd-phase GREEN
 * 
 * Performance benchmarking tests for schema validation components.
 * Validates that schema validation meets performance targets (< 2ms per validation).
 */

const { 
  validateSchema,
  validateGeoJsonToilet, 
  validateOverpassQuery, 
  validateServiceResponse,
  benchmarkSchemaValidation,
  clearSchemaCache,
  getSchemaCacheStats
} = require('../../src/lib/validation/schemas');

describe('Schema Validation Performance Benchmarks', () => {
  beforeEach(() => {
    clearSchemaCache();
  });

  describe('Individual Schema Performance', () => {
    test('should validate GeoJSON toilet data within performance target', () => {
      const validGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [-0.1278, 51.5074]
            },
            properties: {
              id: 'test_toilet_1',
              name: 'Test Public Toilet',
              hours: '24/7',
              accessible: true,
              fee: 0,
              source: 'test',
              last_verified_at: '2024-01-01T00:00:00Z',
              verified_by: 'test'
            }
          }
        ]
      };

      // Warm up
      validateGeoJsonToilet(validGeoJSON);

      // Benchmark
      const iterations = 100;
      const durations = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const result = validateGeoJsonToilet(validGeoJSON);
        const duration = performance.now() - start;

        expect(result.isValid).toBe(true);
        durations.push(duration);
      }

      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const p95Duration = durations.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];

      // Performance targets (< 2ms as per skeptic recommendation)
      expect(averageDuration).toBeLessThan(2);
      expect(p95Duration).toBeLessThan(5); // Allow buffer for P95
      expect(maxDuration).toBeLessThan(10); // Maximum reasonable time

      console.log(`GeoJSON validation performance: avg=${averageDuration.toFixed(3)}ms, p95=${p95Duration.toFixed(3)}ms, max=${maxDuration.toFixed(3)}ms`);
    });

    test('should validate Overpass query data within performance target', () => {
      const validOverpassQuery = {
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
              name: 'Test Toilet'
            }
          }
        ]
      };

      // Warm up
      validateOverpassQuery(validOverpassQuery);

      // Benchmark
      const iterations = 100;
      const durations = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const result = validateOverpassQuery(validOverpassQuery);
        const duration = performance.now() - start;

        expect(result.isValid).toBe(true);
        durations.push(duration);
      }

      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const p95Duration = durations.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];

      // Performance targets
      expect(averageDuration).toBeLessThan(2);
      expect(p95Duration).toBeLessThan(5);
      expect(maxDuration).toBeLessThan(10);

      console.log(`Overpass validation performance: avg=${averageDuration.toFixed(3)}ms, p95=${p95Duration.toFixed(3)}ms, max=${maxDuration.toFixed(3)}ms`);
    });

    test('should validate service response data within performance target', () => {
      const validServiceResponse = {
        isValid: true,
        data: {
          lat: 51.5074,
          lng: -0.1278,
          name: 'Test Toilet'
        },
        sanitizedData: {
          lat: 51.5074,
          lng: -0.1278,
          name: 'Test Toilet'
        },
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          isDuplicate: false
        },
        suggestionId: 'test_123'
      };

      // Warm up
      validateServiceResponse(validServiceResponse);

      // Benchmark
      const iterations = 100;
      const durations = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const result = validateServiceResponse(validServiceResponse);
        const duration = performance.now() - start;

        expect(result.isValid).toBe(true);
        durations.push(duration);
      }

      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const p95Duration = durations.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];

      // Performance targets
      expect(averageDuration).toBeLessThan(2);
      expect(p95Duration).toBeLessThan(5);
      expect(maxDuration).toBeLessThan(10);

      console.log(`Service response validation performance: avg=${averageDuration.toFixed(3)}ms, p95=${p95Duration.toFixed(3)}ms, max=${maxDuration.toFixed(3)}ms`);
    });
  });

  describe('Cache Performance Impact', () => {
    test('should show performance improvement with schema caching', () => {
      const testData = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [0, 51] },
          properties: { 
            id: 'cache_test', 
            name: 'Cache Test', 
            hours: '24/7',
            accessible: true,
            fee: 0,
            source: 'test',
            last_verified_at: '2024-01-01T00:00:00Z',
            verified_by: 'test'
          }
        }]
      };

      // Cold cache measurement
      clearSchemaCache();
      const coldStart = performance.now();
      const coldResult = validateGeoJsonToilet(testData);
      const coldDuration = performance.now() - coldStart;

      expect(coldResult.isValid).toBe(true);

      // Warm cache measurements
      const warmDurations = [];
      for (let i = 0; i < 10; i++) {
        const warmStart = performance.now();
        const warmResult = validateGeoJsonToilet(testData);
        const warmDuration = performance.now() - warmStart;

        expect(warmResult.isValid).toBe(true);
        warmDurations.push(warmDuration);
      }

      const avgWarmDuration = warmDurations.reduce((a, b) => a + b, 0) / warmDurations.length;

      // Warm cache should be faster than or equal to cold cache
      expect(avgWarmDuration).toBeLessThanOrEqual(coldDuration * 1.2); // Allow 20% variance

      // Cache statistics should show schema is cached
      const cacheStats = getSchemaCacheStats();
      expect(cacheStats.size).toBeGreaterThan(0);
      expect(cacheStats.schemas).toContain('geoJsonToilet');

      console.log(`Cache impact: cold=${coldDuration.toFixed(3)}ms, warm_avg=${avgWarmDuration.toFixed(3)}ms`);
    });

    test('should maintain cache across multiple schema types', () => {
      const geoJsonData = {
        type: 'FeatureCollection',
        features: []
      };

      const overpassData = {
        version: 0.7,
        generator: 'test',
        elements: []
      };

      const serviceData = {
        isValid: true,
        validation: { 
          isValid: true,
          errors: [], 
          warnings: [],
          isDuplicate: false
        }
      };

      // Load all schemas into cache
      validateGeoJsonToilet(geoJsonData);
      validateOverpassQuery(overpassData);
      validateServiceResponse(serviceData);

      const cacheStats = getSchemaCacheStats();
      expect(cacheStats.size).toBe(3);
      expect(cacheStats.schemas).toContain('geoJsonToilet');
      expect(cacheStats.schemas).toContain('overpassQuery');
      expect(cacheStats.schemas).toContain('serviceResponse');

      // All subsequent validations should use cached schemas
      const iterations = 20;
      const allDurations = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        validateGeoJsonToilet(geoJsonData);
        validateOverpassQuery(overpassData);
        validateServiceResponse(serviceData);
        const duration = performance.now() - start;
        allDurations.push(duration);
      }

      const avgDuration = allDurations.reduce((a, b) => a + b, 0) / allDurations.length;

      // Combined validation should still be fast
      expect(avgDuration).toBeLessThan(10); // 10ms for 3 schema validations

      console.log(`Multi-schema cache performance: avg=${avgDuration.toFixed(3)}ms for 3 validations`);
    });
  });

  describe('Benchmark Function Performance', () => {
    test('should execute benchmark function efficiently', () => {
      const testData = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [0, 51] },
          properties: { 
            id: 'benchmark_test',
            name: 'Benchmark Test',
            hours: '24/7',
            accessible: true,
            fee: 0,
            source: 'test',
            last_verified_at: '2024-01-01T00:00:00Z',
            verified_by: 'test'
          }
        }]
      };

      const benchmarkStart = performance.now();
      const benchmarkResult = benchmarkSchemaValidation(testData, 'geoJsonToilet', 50);
      const benchmarkDuration = performance.now() - benchmarkStart;

      expect(benchmarkResult).toHaveProperty('averageMs');
      expect(benchmarkResult).toHaveProperty('minMs');
      expect(benchmarkResult).toHaveProperty('maxMs');

      expect(benchmarkResult.averageMs).toBeGreaterThan(0);
      expect(benchmarkResult.minMs).toBeGreaterThan(0);
      expect(benchmarkResult.maxMs).toBeGreaterThan(0);
      expect(benchmarkResult.minMs).toBeLessThanOrEqual(benchmarkResult.averageMs);
      expect(benchmarkResult.averageMs).toBeLessThanOrEqual(benchmarkResult.maxMs);

      // Individual validations should meet performance target
      expect(benchmarkResult.averageMs).toBeLessThan(2);

      // Benchmark overhead should be reasonable
      expect(benchmarkDuration).toBeLessThan(1000); // 1 second for 50 iterations

      console.log(`Benchmark function results: avg=${benchmarkResult.averageMs.toFixed(3)}ms, min=${benchmarkResult.minMs.toFixed(3)}ms, max=${benchmarkResult.maxMs.toFixed(3)}ms`);
    });
  });

  describe('Large Data Performance', () => {
    test('should handle large GeoJSON datasets efficiently', () => {
      const largeGeoJSON = {
        type: 'FeatureCollection',
        features: Array.from({ length: 50 }, (_, i) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0.1 + i * 0.001, 51.5 + i * 0.001]
          },
          properties: {
            id: `toilet_${i}`,
            name: `Test Toilet ${i}`,
            hours: '24/7',
            accessible: i % 2 === 0,
            fee: i % 3,
            source: 'test',
            last_verified_at: '2024-01-01T00:00:00Z',
            verified_by: 'test'
          }
        }))
      };

      const iterations = 10;
      const durations = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const result = validateGeoJsonToilet(largeGeoJSON);
        const duration = performance.now() - start;

        expect(result.isValid).toBe(true);
        durations.push(duration);
      }

      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      // Large data should still validate reasonably quickly
      expect(averageDuration).toBeLessThan(10); // Allow more time for large datasets
      expect(maxDuration).toBeLessThan(20);

      console.log(`Large dataset performance (50 features): avg=${averageDuration.toFixed(3)}ms, max=${maxDuration.toFixed(3)}ms`);
    });

    test('should handle large Overpass responses efficiently', () => {
      const largeOverpassResponse = {
        version: 0.7,
        generator: 'Large test',
        elements: Array.from({ length: 100 }, (_, i) => ({
          type: 'node',
          id: i + 1,
          lat: 51.5 + (i * 0.001),
          lon: -0.1 + (i * 0.001),
          tags: {
            amenity: 'toilets',
            name: `Toilet ${i + 1}`,
            access: i % 2 === 0 ? 'public' : 'customers',
            wheelchair: i % 3 === 0 ? 'yes' : 'no'
          }
        }))
      };

      const iterations = 10;
      const durations = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const result = validateOverpassQuery(largeOverpassResponse);
        const duration = performance.now() - start;

        expect(result.isValid).toBe(true);
        durations.push(duration);
      }

      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      // Large Overpass responses should validate efficiently
      expect(averageDuration).toBeLessThan(15); // Allow more time for 100 elements
      expect(maxDuration).toBeLessThan(25);

      console.log(`Large Overpass response performance (100 elements): avg=${averageDuration.toFixed(3)}ms, max=${maxDuration.toFixed(3)}ms`);
    });
  });

  describe('Error Validation Performance', () => {
    test('should handle validation errors efficiently', () => {
      const invalidData = {
        type: 'InvalidType',
        features: 'not-an-array',
        invalidField: 123
      };

      const iterations = 50;
      const durations = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const result = validateGeoJsonToilet(invalidData);
        const duration = performance.now() - start;

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        durations.push(duration);
      }

      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      // Error validation should also be fast
      expect(averageDuration).toBeLessThan(3); // Slightly higher tolerance for error cases
      expect(maxDuration).toBeLessThan(8);

      console.log(`Error validation performance: avg=${averageDuration.toFixed(3)}ms, max=${maxDuration.toFixed(3)}ms`);
    });
  });

  describe('Concurrent Validation Performance', () => {
    test('should handle concurrent validations efficiently', async () => {
      const testData = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [0, 51] },
          properties: { 
            id: 'concurrent_test',
            name: 'Concurrent Test',
            hours: '24/7',
            accessible: true,
            fee: 0,
            source: 'test',
            last_verified_at: '2024-01-01T00:00:00Z',
            verified_by: 'test'
          }
        }]
      };

      const concurrentValidations = 20;
      const promises = [];

      const start = performance.now();

      for (let i = 0; i < concurrentValidations; i++) {
        promises.push(Promise.resolve().then(() => {
          const validationStart = performance.now();
          const result = validateGeoJsonToilet(testData);
          const validationDuration = performance.now() - validationStart;
          
          expect(result.isValid).toBe(true);
          return validationDuration;
        }));
      }

      const durations = await Promise.all(promises);
      const totalDuration = performance.now() - start;

      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      // Individual validations should still be fast
      expect(averageDuration).toBeLessThan(3);
      expect(maxDuration).toBeLessThan(10);

      // Total time should be reasonable (not serialized)
      expect(totalDuration).toBeLessThan(100); // 100ms for 20 concurrent validations

      console.log(`Concurrent validation performance: avg=${averageDuration.toFixed(3)}ms, max=${maxDuration.toFixed(3)}ms, total=${totalDuration.toFixed(3)}ms`);
    });
  });
});