/**
 * IngestService Schema Integration Tests
 * 
 * @epic schema_documentation_completion_epic
 * @task schema_documentation_task3
 * @tdd-phase GREEN
 * 
 * Focused tests for schema validation integration in IngestService.
 */

const { IngestService } = require('../../src/services/ingestService');
const { clearSchemaCache } = require('../../src/lib/validation/schemas');
const nock = require('nock');
const fs = require('fs');
const path = require('path');

describe('IngestService Schema Integration', () => {
  beforeEach(() => {
    clearSchemaCache();
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
    // Clean up test files
    const testFiles = ['test-schema-output.geojson', 'test-invalid-output.geojson'];
    testFiles.forEach(file => {
      try {
        fs.unlinkSync(file);
      } catch (error) {
        // File doesn't exist, ignore
      }
    });
  });

  describe('Overpass Response Schema Validation', () => {
    test('should validate correct Overpass API response structure', async () => {
      const validOverpassResponse = {
        version: 0.7,
        generator: 'Overpass API 0.7.59.8',
        elements: [
          {
            type: 'node',
            id: 123456,
            lat: 51.5074,
            lon: -0.1278,
            tags: {
              amenity: 'toilets',
              access: 'public',
              name: 'Valid Test Toilet'
            }
          }
        ]
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, validOverpassResponse);

      const ingestService = new IngestService({
        overpassApiUrl: 'https://overpass-api.de/api/interpreter',
        outputFile: 'test-schema-output.geojson'
      });

      const result = await ingestService.ingest();
      expect(result.success).toBe(true);
    });

    test('should reject Overpass response missing required fields', async () => {
      const invalidResponse = {
        version: 0.7,
        // Missing generator and elements
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, invalidResponse);

      const ingestService = new IngestService({
        overpassApiUrl: 'https://overpass-api.de/api/interpreter',
        outputFile: 'test-invalid-output.geojson'
      });

      await expect(ingestService.ingest()).rejects.toThrow(/Schema validation failed for overpassQuery/);
    });

    test('should validate Overpass response with different element types', async () => {
      const mixedElementsResponse = {
        version: 0.7,
        generator: 'Test generator',
        elements: [
          {
            type: 'node',
            id: 1,
            lat: 51.5074,
            lon: -0.1278,
            tags: { amenity: 'toilets' }
          },
          {
            type: 'way',
            id: 2,
            center: { lat: 51.5074, lon: -0.1278 },
            tags: { amenity: 'toilets', building: 'yes' }
          },
          {
            type: 'relation',
            id: 3,
            tags: { type: 'multipolygon', amenity: 'toilets' }
          }
        ]
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, mixedElementsResponse);

      const ingestService = new IngestService({
        overpassApiUrl: 'https://overpass-api.de/api/interpreter',
        outputFile: 'test-schema-output.geojson'
      });

      const result = await ingestService.ingest();
      expect(result.success).toBe(true);
      expect(result.featuresCount).toBe(2); // Only node and way should be processed
    });

    test('should measure Overpass response validation performance', async () => {
      const performanceResponse = {
        version: 0.7,
        generator: 'Performance test',
        elements: Array.from({ length: 100 }, (_, i) => ({
          type: 'node',
          id: i + 1,
          lat: 51.5074 + (Math.random() - 0.5) * 0.01,
          lon: -0.1278 + (Math.random() - 0.5) * 0.01,
          tags: { amenity: 'toilets', name: `Toilet ${i + 1}` }
        }))
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, performanceResponse);

      const ingestService = new IngestService({
        overpassApiUrl: 'https://overpass-api.de/api/interpreter',
        outputFile: 'test-schema-output.geojson'
      });

      const start = performance.now();
      const result = await ingestService.ingest();
      const duration = performance.now() - start;

      expect(result.success).toBe(true);
      expect(result.featuresCount).toBe(100);
      // Schema validation should not significantly impact performance
      expect(duration).toBeLessThan(500); // 500ms for 100 elements
    });
  });

  describe('GeoJSON Output Schema Validation', () => {
    test('should validate generated GeoJSON structure', async () => {
      const mockResponse = {
        version: 0.7,
        generator: 'Test',
        elements: [
          {
            type: 'node',
            id: 123,
            lat: 51.5074,
            lon: -0.1278,
            tags: {
              amenity: 'toilets',
              name: 'GeoJSON Test Toilet',
              wheelchair: 'yes',
              fee: 'no'
            }
          }
        ]
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, mockResponse);

      const ingestService = new IngestService({
        overpassApiUrl: 'https://overpass-api.de/api/interpreter',
        outputFile: 'test-schema-output.geojson'
      });

      const result = await ingestService.ingest();
      
      expect(result.success).toBe(true);
      
      // Verify the generated file structure
      const generatedData = JSON.parse(fs.readFileSync('test-schema-output.geojson', 'utf8'));
      
      expect(generatedData.type).toBe('FeatureCollection');
      expect(Array.isArray(generatedData.features)).toBe(true);
      expect(generatedData.features.length).toBe(1);
      
      const feature = generatedData.features[0];
      expect(feature.type).toBe('Feature');
      expect(feature.geometry.type).toBe('Point');
      expect(Array.isArray(feature.geometry.coordinates)).toBe(true);
      expect(feature.properties.id).toBeDefined();
      expect(feature.properties.name).toBeDefined();
    });

    test('should handle empty Overpass response', async () => {
      const emptyResponse = {
        version: 0.7,
        generator: 'Empty test',
        elements: []
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, emptyResponse);

      const ingestService = new IngestService({
        overpassApiUrl: 'https://overpass-api.de/api/interpreter',
        outputFile: 'test-schema-output.geojson'
      });

      const result = await ingestService.ingest();
      
      expect(result.success).toBe(true);
      expect(result.featuresCount).toBe(0);
      
      const generatedData = JSON.parse(fs.readFileSync('test-schema-output.geojson', 'utf8'));
      expect(generatedData.type).toBe('FeatureCollection');
      expect(generatedData.features).toEqual([]);
    });

    test('should measure GeoJSON validation performance', async () => {
      const largeResponse = {
        version: 0.7,
        generator: 'Large test',
        elements: Array.from({ length: 50 }, (_, i) => ({
          type: 'node',
          id: i + 1000,
          lat: 51.5074 + (i * 0.001),
          lon: -0.1278 + (i * 0.001),
          tags: {
            amenity: 'toilets',
            name: `Performance Test Toilet ${i + 1}`,
            wheelchair: i % 2 === 0 ? 'yes' : 'no',
            fee: i % 3 === 0 ? 'yes' : 'no'
          }
        }))
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, largeResponse);

      const ingestService = new IngestService({
        overpassApiUrl: 'https://overpass-api.de/api/interpreter',
        outputFile: 'test-schema-output.geojson'
      });

      const start = performance.now();
      const result = await ingestService.ingest();
      const duration = performance.now() - start;

      expect(result.success).toBe(true);
      expect(result.featuresCount).toBe(50);
      // GeoJSON schema validation should be fast
      expect(duration).toBeLessThan(300); // 300ms for 50 features
    });
  });

  describe('Schema Validation Error Handling', () => {
    test('should provide detailed error information for invalid Overpass response', async () => {
      const invalidResponse = {
        version: 'invalid-version', // Should be number
        generator: 123, // Should be string
        elements: 'not-an-array' // Should be array
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, invalidResponse);

      const ingestService = new IngestService({
        overpassApiUrl: 'https://overpass-api.de/api/interpreter',
        outputFile: 'test-invalid-output.geojson'
      });

      try {
        await ingestService.ingest();
        fail('Should have thrown schema validation error');
      } catch (error) {
        expect(error.message).toContain('Schema validation failed for overpassQuery');
        // Error should contain validation details
        expect(error.details || error.message).toBeTruthy();
      }
    });

    test('should handle schema validation errors gracefully', async () => {
      const validResponse = {
        version: 0.7,
        generator: 'Test',
        elements: []
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, validResponse);

      // Mock schema validation to fail
      const originalValidateOverpassQuery = require('../../src/lib/validation/schemas').validateOverpassQuery;
      const mockValidateOverpassQuery = jest.fn(() => ({
        isValid: false,
        errors: ['Mock schema validation error']
      }));

      // Temporarily replace the validation function
      const schemas = require('../../src/lib/validation/schemas');
      schemas.validateOverpassQuery = mockValidateOverpassQuery;

      const ingestService = new IngestService({
        overpassApiUrl: 'https://overpass-api.de/api/interpreter',
        outputFile: 'test-invalid-output.geojson'
      });

      try {
        await ingestService.ingest();
        fail('Should have thrown schema validation error');
      } catch (error) {
        expect(mockValidateOverpassQuery).toHaveBeenCalled();
        expect(error.message).toContain('Schema validation failed');
      } finally {
        // Restore original function
        schemas.validateOverpassQuery = originalValidateOverpassQuery;
      }
    });
  });

  describe('Performance Benchmarking', () => {
    test('should benchmark schema validation overhead', async () => {
      const benchmarkResponse = {
        version: 0.7,
        generator: 'Benchmark test',
        elements: [
          {
            type: 'node',
            id: 999,
            lat: 51.5074,
            lon: -0.1278,
            tags: { amenity: 'toilets', name: 'Benchmark Toilet' }
          }
        ]
      };

      // Test multiple runs to get average performance
      const runs = 5;
      const durations = [];

      for (let i = 0; i < runs; i++) {
        clearSchemaCache(); // Test cold cache performance
        
        nock('https://overpass-api.de')
          .post('/api/interpreter')
          .reply(200, benchmarkResponse);

        const ingestService = new IngestService({
          overpassApiUrl: 'https://overpass-api.de/api/interpreter',
          outputFile: `test-benchmark-${i}.geojson`
        });

        const start = performance.now();
        const result = await ingestService.ingest();
        const duration = performance.now() - start;

        expect(result.success).toBe(true);
        durations.push(duration);

        // Clean up
        try {
          fs.unlinkSync(`test-benchmark-${i}.geojson`);
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      // Schema validation should not significantly impact performance
      expect(averageDuration).toBeLessThan(100); // 100ms average
      expect(maxDuration).toBeLessThan(150); // 150ms maximum
    });
  });
});