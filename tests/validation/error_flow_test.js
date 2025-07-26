/**
 * Error Flow Tests for Schema Validation
 * 
 * @epic schema_documentation_completion_epic
 * @task schema_documentation_task3
 * @tdd-phase GREEN
 * 
 * Tests error propagation and handling across schema validation components.
 * Validates that errors flow correctly through the system and are properly formatted.
 */

const { 
  validateSchema, 
  validateGeoJsonToilet, 
  validateOverpassQuery, 
  validateServiceResponse,
  createSchemaValidationError 
} = require('../../src/lib/validation/schemas');
const { ErrorFactory, ErrorCode } = require('../../src/lib/validation/errors');

describe('Schema Validation Error Flow Tests', () => {
  describe('Error Creation and Propagation', () => {
    test('should create proper schema validation error structure', () => {
      const schemaType = 'testSchema';
      const errors = ['Field "lat" is required', 'Field "lng" must be a number'];
      const testData = { invalid: 'data' };

      const error = createSchemaValidationError(schemaType, errors, testData);

      expect(error).toBeDefined();
      expect(error.code).toBe(ErrorCode.SCHEMA_VALIDATION_FAILED);
      expect(error.message).toBe('Schema validation failed for testSchema');
      expect(error.details).toContain('Field "lat" is required');
      expect(error.details).toContain('Field "lng" must be a number');
      expect(error.details).toContain(JSON.stringify(testData));
    });

    test('should create schema validation error without data', () => {
      const schemaType = 'emptySchema';
      const errors = ['Validation failed'];

      const error = createSchemaValidationError(schemaType, errors);

      expect(error.code).toBe(ErrorCode.SCHEMA_VALIDATION_FAILED);
      expect(error.message).toBe('Schema validation failed for emptySchema');
      expect(error.details).toContain('Validation failed');
      expect(error.details).not.toContain('Data:');
    });

    test('should handle empty error array gracefully', () => {
      const schemaType = 'noErrorsSchema';
      const errors = [];

      const error = createSchemaValidationError(schemaType, errors);

      expect(error.code).toBe(ErrorCode.SCHEMA_VALIDATION_FAILED);
      expect(error.message).toBe('Schema validation failed for noErrorsSchema');
      expect(error.details).toBeDefined();
    });
  });

  describe('Error Factory Integration', () => {
    test('should use ErrorFactory.schemaValidation correctly', () => {
      const schemaType = 'factoryTest';
      const errors = ['Factory error test'];
      const data = { test: 'data' };

      const directError = ErrorFactory.schemaValidation(schemaType, errors, data);
      const wrapperError = createSchemaValidationError(schemaType, errors, data);

      expect(directError.code).toBe(wrapperError.code);
      expect(directError.message).toBe(wrapperError.message);
      expect(directError.details).toBe(wrapperError.details);
    });

    test('should maintain error hierarchy with AppError', () => {
      const error = createSchemaValidationError('hierarchyTest', ['Test error']);

      expect(error.name).toBe('AppError');
      expect(error.isOperational).toBe(true);
      expect(error.statusCode).toBe(400); // BAD_REQUEST
    });
  });

  describe('Schema Loading Error Flow', () => {
    test('should handle missing schema file gracefully', () => {
      const nonExistentSchema = 'nonExistentSchema_' + Date.now();

      expect(() => {
        validateSchema({ test: 'data' }, nonExistentSchema);
      }).toThrow();

      try {
        validateSchema({ test: 'data' }, nonExistentSchema);
      } catch (error) {
        expect(error.code).toBe(ErrorCode.SCHEMA_VALIDATION_FAILED);
        expect(error.message).toContain('Schema validation failed for');
        expect(error.message).toContain(nonExistentSchema);
      }
    });

    test('should handle malformed schema file', () => {
      // This test would require creating a malformed schema file
      // For now, we'll test the error path by mocking fs.readFileSync
      const originalConsoleWarn = console.warn;
      const warnings = [];
      console.warn = (message) => warnings.push(message);

      try {
        // Mock fs to return invalid JSON
        const fs = require('fs');
        const originalReadFileSync = fs.readFileSync;
        fs.readFileSync = jest.fn(() => '{ invalid json }');

        expect(() => {
          validateSchema({ test: 'data' }, 'malformedSchema');
        }).toThrow();

        // Restore fs
        fs.readFileSync = originalReadFileSync;
      } finally {
        console.warn = originalConsoleWarn;
      }
    });
  });

  describe('Validation Error Flow', () => {
    test('should propagate GeoJSON validation errors correctly', () => {
      const invalidGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: 'invalid' // Should be array
            },
            properties: {}
          }
        ]
      };

      const result = validateGeoJsonToilet(invalidGeoJSON);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('coordinates');
    });

    test('should propagate Overpass query validation errors correctly', () => {
      const invalidOverpassResponse = {
        version: 'invalid', // Should be number
        elements: 'not-array' // Should be array
        // Missing generator field
      };

      const result = validateOverpassQuery(invalidOverpassResponse);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Should contain multiple error messages
      const errorString = result.errors.join(' ');
      expect(errorString).toContain('version');
    });

    test('should propagate service response validation errors correctly', () => {
      const invalidServiceResponse = {
        isValid: 'not-boolean', // Should be boolean
        data: 123, // Valid data can be anything
        validation: 'not-object' // Should be object or undefined
      };

      const result = validateServiceResponse(invalidServiceResponse);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('isValid');
    });
  });

  describe('Performance Error Handling', () => {
    test('should log performance warnings without throwing', () => {
      const originalConsoleWarn = console.warn;
      const warnings = [];
      console.warn = (message) => warnings.push(message);

      try {
        // Create a large data structure that might cause slow validation
        const largeValidData = {
          type: 'FeatureCollection',
          features: Array.from({ length: 100 }, (_, i) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0.1 + i * 0.001, 51.5 + i * 0.001]
            },
            properties: {
              id: `toilet_${i}`,
              name: `Test Toilet ${i}`,
              lat: 51.5 + i * 0.001,
              lng: 0.1 + i * 0.001,
              hours: '24/7',
              accessible: true,
              fee: 0
            }
          }))
        };

        const result = validateGeoJsonToilet(largeValidData);

        // Validation should succeed
        expect(result.isValid).toBe(true);

        // Check if performance warning was logged (if validation took > 2ms)
        const performanceWarnings = warnings.filter(w => 
          w.includes('Schema validation exceeded 2ms target')
        );
        
        // Don't assert presence of warning since it depends on system performance
        // Just verify that if present, it contains the correct information
        performanceWarnings.forEach(warning => {
          expect(warning).toContain('geoJsonToilet');
          expect(warning).toMatch(/\d+\.\d+ms/);
        });

      } finally {
        console.warn = originalConsoleWarn;
      }
    });

    test('should handle validation errors without performance impact', () => {
      const invalidData = { completely: 'wrong', structure: true };

      const start = performance.now();
      const result = validateGeoJsonToilet(invalidData);
      const duration = performance.now() - start;

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      
      // Error handling should be fast
      expect(duration).toBeLessThan(10); // 10ms buffer for error handling
    });
  });

  describe('Error Recovery and Graceful Degradation', () => {
    test('should recover from schema compilation errors', () => {
      // Mock AJV to throw during compilation
      const Ajv = require('ajv');
      const originalCompile = Ajv.prototype.compile;

      Ajv.prototype.compile = jest.fn(() => {
        throw new Error('Mock compilation error');
      });

      try {
        expect(() => {
          validateSchema({ test: 'data' }, 'geoJsonToilet');
        }).toThrow();

        try {
          validateSchema({ test: 'data' }, 'geoJsonToilet');
        } catch (error) {
          expect(error.code).toBe(ErrorCode.SCHEMA_VALIDATION_FAILED);
          expect(error.message).toContain('geoJsonToilet');
        }
      } finally {
        // Restore original compile method
        Ajv.prototype.compile = originalCompile;
      }
    });

    test('should handle unknown validation errors gracefully', () => {
      const result = validateSchema(null, 'geoJsonToilet');

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data).toBe(null);
    });

    test('should maintain error context throughout flow', () => {
      const testData = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [0, 51] },
          properties: { id: 'test' }
        }]
      };

      const result = validateGeoJsonToilet(testData);

      if (!result.isValid) {
        // Errors should reference the actual data structure
        result.errors.forEach(error => {
          expect(typeof error).toBe('string');
          expect(error.length).toBeGreaterThan(0);
        });
      }

      expect(result).toHaveProperty('data');
      expect(result.data).toBe(testData);
    });
  });

  describe('Cross-Schema Error Consistency', () => {
    test('should maintain consistent error format across schemas', () => {
      const testCases = [
        {
          validator: validateGeoJsonToilet,
          invalidData: { type: 'invalid' },
          schemaName: 'geoJsonToilet'
        },
        {
          validator: validateOverpassQuery,
          invalidData: { version: 'invalid' },
          schemaName: 'overpassQuery'
        },
        {
          validator: validateServiceResponse,
          invalidData: { isValid: 'invalid' },
          schemaName: 'serviceResponse'
        }
      ];

      testCases.forEach(({ validator, invalidData, schemaName }) => {
        const result = validator(invalidData);

        expect(result).toHaveProperty('isValid');
        expect(result.isValid).toBe(false);
        expect(result).toHaveProperty('errors');
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result).toHaveProperty('data');
        expect(result.data).toBe(invalidData);
      });
    });

    test('should create consistent error objects across schemas', () => {
      const testCases = [
        { schemaType: 'geoJsonToilet', errors: ['GeoJSON error'] },
        { schemaType: 'overpassQuery', errors: ['Overpass error'] },
        { schemaType: 'serviceResponse', errors: ['Service error'] }
      ];

      testCases.forEach(({ schemaType, errors }) => {
        const error = createSchemaValidationError(schemaType, errors);

        expect(error.code).toBe(ErrorCode.SCHEMA_VALIDATION_FAILED);
        expect(error.message).toBe(`Schema validation failed for ${schemaType}`);
        expect(error.details).toContain(errors[0]);
        expect(error.isOperational).toBe(true);
        expect(error.statusCode).toBe(400);
      });
    });
  });
});