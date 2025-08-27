/**
 * Overpass Query Schema Validation Tests
 * 
 * @epic schema_documentation_completion_epic
 * @task schema_documentation_task2
 * @tdd-phase GREEN
 * 
 * Comprehensive test coverage for Overpass API query data validation.
 */

const {
  validateOverpassQuery,
  clearSchemaCache,
  benchmarkSchemaValidation
} = require('../../src/lib/validation/schemas');

describe('Overpass Query Schema Validation', () => {
  beforeEach(() => {
    clearSchemaCache();
  });

  describe('Valid OverpassResponse Validation', () => {
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
            fee: 'no'
          }
        },
        {
          type: 'way',
          id: 789012,
          center: {
            lat: 51.5074,
            lon: -0.1278
          },
          tags: {
            amenity: 'toilets',
            building: 'yes'
          }
        }
      ]
    };

    test('should validate correct overpass response', () => {
      const result = validateOverpassQuery(validOverpassResponse);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual(validOverpassResponse);
    });

    test('should validate response with relation elements', () => {
      const responseWithRelation = {
        version: 0.7,
        generator: 'Overpass API test',
        elements: [
          {
            type: 'relation',
            id: 345678,
            tags: {
              type: 'multipolygon',
              amenity: 'toilets'
            }
          }
        ]
      };

      const result = validateOverpassQuery(responseWithRelation);
      expect(result.isValid).toBe(true);
    });

    test('should validate empty response', () => {
      const emptyResponse = {
        version: 0.7,
        generator: 'Overpass API test',
        elements: []
      };

      const result = validateOverpassQuery(emptyResponse);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Valid IngestConfig Validation', () => {
    const validIngestConfig = {
      overpassApiUrl: 'https://overpass-api.de/api/interpreter',
      outputFile: 'toilets.geojson',
      retryAttempts: 3,
      retryDelayMs: 2000,
      timeoutMs: 30000
    };

    test('should validate correct ingest config', () => {
      const result = validateOverpassQuery(validIngestConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('should validate config with minimum values', () => {
      const minimalConfig = {
        overpassApiUrl: 'http://localhost:3000/api',
        outputFile: 'test.json',
        retryAttempts: 0,
        retryDelayMs: 100,
        timeoutMs: 1000
      };

      const result = validateOverpassQuery(minimalConfig);
      expect(result.isValid).toBe(true);
    });

    test('should validate config with maximum values', () => {
      const maximalConfig = {
        overpassApiUrl: 'https://overpass-api.example.com/interpreter',
        outputFile: 'very-long-filename.geojson',
        retryAttempts: 10,
        retryDelayMs: 60000,
        timeoutMs: 300000
      };

      const result = validateOverpassQuery(maximalConfig);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Valid RequestOptions Validation', () => {
    const validRequestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'CityPee/1.0'
      },
      body: 'data=[out:json];(node[amenity=toilets](bbox););out;'
    };

    test('should validate correct request options', () => {
      const result = validateOverpassQuery(validRequestOptions);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('should validate GET request without body', () => {
      const getRequest = {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      };

      const result = validateOverpassQuery(getRequest);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Invalid Data Validation', () => {
    test('should reject overpass response with missing required fields', () => {
      const incompleteResponse = {
        version: 0.7,
        // Missing generator and elements
      };

      const result = validateOverpassQuery(incompleteResponse);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.some(error => error.includes('required'))).toBe(true);
    });

    test('should reject invalid element type', () => {
      const invalidElementType = {
        version: 0.7,
        generator: 'test',
        elements: [
          {
            type: 'invalid-type', // Should be node, way, or relation
            id: 123,
            lat: 51.5074,
            lon: -0.1278
          }
        ]
      };

      const result = validateOverpassQuery(invalidElementType);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('enum'))).toBe(true);
    });

    test('should reject node without coordinates', () => {
      const nodeWithoutCoords = {
        version: 0.7,
        generator: 'test',
        elements: [
          {
            type: 'node',
            id: 123
            // Missing required lat/lon for node type
          }
        ]
      };

      const result = validateOverpassQuery(nodeWithoutCoords);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should reject invalid coordinates', () => {
      const invalidCoords = {
        version: 0.7,
        generator: 'test',
        elements: [
          {
            type: 'node',
            id: 123,
            lat: 100, // Invalid latitude (> 90)
            lon: 200  // Invalid longitude (> 180)
          }
        ]
      };

      const result = validateOverpassQuery(invalidCoords);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('maximum'))).toBe(true);
    });

    test('should reject invalid ingest config URL', () => {
      const invalidUrl = {
        overpassApiUrl: 'not-a-url',
        outputFile: 'test.json',
        retryAttempts: 3,
        retryDelayMs: 2000,
        timeoutMs: 30000
      };

      const result = validateOverpassQuery(invalidUrl);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('format'))).toBe(true);
    });

    test('should reject config with out-of-range values', () => {
      const outOfRange = {
        overpassApiUrl: 'https://example.com',
        outputFile: 'test.json',
        retryAttempts: 15, // > maximum of 10
        retryDelayMs: 100000, // > maximum of 60000
        timeoutMs: 500000 // > maximum of 300000
      };

      const result = validateOverpassQuery(outOfRange);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('maximum'))).toBe(true);
    });

    test('should reject invalid HTTP method', () => {
      const invalidMethod = {
        method: 'PUT', // Should be GET or POST
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const result = validateOverpassQuery(invalidMethod);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('enum'))).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    const testResponse = {
      version: 0.7,
      generator: 'Performance Test',
      elements: [
        {
          type: 'node',
          id: 123,
          lat: 51.5074,
          lon: -0.1278,
          tags: { amenity: 'toilets' }
        }
      ]
    };

    test('should validate within performance target', () => {
      const start = performance.now();
      const result = validateOverpassQuery(testResponse);
      const duration = performance.now() - start;

      expect(result.isValid).toBe(true);
      expect(duration).toBeLessThan(5); // < 5ms target
    });

    test('should benchmark validation performance', () => {
      const benchmark = benchmarkSchemaValidation(testResponse, 'overpassQuery', 100);
      
      expect(benchmark.averageMs).toBeLessThan(5);
      expect(benchmark.minMs).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null input', () => {
      const result = validateOverpassQuery(null);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should handle undefined input', () => {
      const result = validateOverpassQuery(undefined);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should handle empty object', () => {
      const result = validateOverpassQuery({});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should validate element with empty tags', () => {
      const emptyTags = {
        version: 0.7,
        generator: 'test',
        elements: [
          {
            type: 'node',
            id: 123,
            lat: 51.5074,
            lon: -0.1278,
            tags: {}
          }
        ]
      };

      const result = validateOverpassQuery(emptyTags);
      expect(result.isValid).toBe(true);
    });

    test('should validate element without tags', () => {
      const noTags = {
        version: 0.7,
        generator: 'test',
        elements: [
          {
            type: 'node',
            id: 123,
            lat: 51.5074,
            lon: -0.1278
          }
        ]
      };

      const result = validateOverpassQuery(noTags);
      expect(result.isValid).toBe(true);
    });
  });
});