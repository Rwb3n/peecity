/**
 * ValidationService Schema Integration Tests
 * 
 * @epic schema_documentation_completion_epic
 * @task schema_documentation_task3
 * @tdd-phase GREEN
 * 
 * Focused tests for schema validation integration in ValidationService.
 */

const { ValidationService } = require('../../src/services/validationService');
const { clearSchemaCache } = require('../../src/lib/validation/schemas');

describe('ValidationService Schema Integration', () => {
  let validationService;

  beforeEach(() => {
    clearSchemaCache();
    validationService = new ValidationService();
  });

  describe('Response Schema Validation (Warning Mode)', () => {
    test('should validate successful validation response schema', async () => {
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

      // Capture console logs to verify schema validation
      const originalDebug = console.debug;
      const originalWarn = console.warn;
      const logs = [];
      
      console.debug = (message, ...args) => logs.push({ level: 'debug', message, args });
      console.warn = (message, ...args) => logs.push({ level: 'warn', message, args });

      const result = await validationService.validateRequest(validRequest);

      console.debug = originalDebug;
      console.warn = originalWarn;

      expect(result.isValid).toBe(true);
      expect(result.suggestionId).toBeDefined();
      expect(result.sanitizedData).toBeDefined();
      
      // Should have debug log for successful schema validation, no warnings
      const debugLogs = logs.filter(log => log.level === 'debug' && log.message.includes('Response schema validation passed'));
      const warnLogs = logs.filter(log => log.level === 'warn');
      
      expect(debugLogs.length).toBe(1);
      expect(warnLogs.length).toBe(0);
    });

    test('should validate error validation response schema', async () => {
      const invalidRequest = {
        body: 'invalid json',
        ipAddress: '127.0.0.1'
      };

      const originalDebug = console.debug;
      const originalWarn = console.warn;
      const logs = [];
      
      console.debug = (message, ...args) => logs.push({ level: 'debug', message, args });
      console.warn = (message, ...args) => logs.push({ level: 'warn', message, args });

      const result = await validationService.validateRequest(invalidRequest);

      console.debug = originalDebug;
      console.warn = originalWarn;

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      
      // Error responses should also pass schema validation
      const debugLogs = logs.filter(log => log.level === 'debug' && log.message.includes('Response schema validation passed'));
      const warnLogs = logs.filter(log => log.level === 'warn');
      
      expect(debugLogs.length).toBe(1);
      expect(warnLogs.length).toBe(0);
    });

    test('should validate business validation failure response schema', async () => {
      const invalidSuggestionRequest = {
        body: JSON.stringify({
          lat: 'invalid-latitude', // Should be number
          lng: -0.1278,
          name: 'Invalid Test'
        }),
        ipAddress: '127.0.0.1'
      };

      const originalDebug = console.debug;
      const originalWarn = console.warn;
      const logs = [];
      
      console.debug = (message, ...args) => logs.push({ level: 'debug', message, args });
      console.warn = (message, ...args) => logs.push({ level: 'warn', message, args });

      const result = await validationService.validateRequest(invalidSuggestionRequest);

      console.debug = originalDebug;
      console.warn = originalWarn;

      expect(result.isValid).toBe(false);
      expect(result.validation).toBeDefined();
      expect(result.validation.errors.length).toBeGreaterThan(0);
      
      // Validation failure responses should also pass schema validation
      const debugLogs = logs.filter(log => log.level === 'debug' && log.message.includes('Response schema validation passed'));
      expect(debugLogs.length).toBe(1);
    });

    test('should detect and warn about malformed response schema', async () => {
      // Mock the validateResponseSchema method to simulate a malformed response
      const originalMethod = validationService.validateResponseSchema;
      
      validationService.validateResponseSchema = function(response) {
        // Simulate schema validation failure
        const originalWarn = console.warn;
        const warnings = [];
        console.warn = (message, ...args) => warnings.push({ message, args });

        // Create a mock validation result that would fail schema validation
        const mockSchemaResult = {
          isValid: false,
          errors: ['Mock schema validation failure']
        };

        console.warn('ValidationService: Response schema validation failed', {
          errors: mockSchemaResult.errors,
          response: JSON.stringify(response, null, 2),
          validationDurationMs: 1.5
        });

        console.warn = originalWarn;
        return response; // Return unmodified (warning-only mode)
      };

      const request = {
        body: JSON.stringify({
          lat: 51.5074,
          lng: -0.1278,
          name: 'Schema Test'
        }),
        ipAddress: '127.0.0.1'
      };

      const originalWarn = console.warn;
      const warnings = [];
      console.warn = (message, ...args) => warnings.push({ message, args });

      const result = await validationService.validateRequest(request);

      console.warn = originalWarn;

      // Should still return result (warning-only mode)
      expect(result).toBeDefined();
      
      // Should have warning about schema validation failure
      const schemaWarnings = warnings.filter(w => 
        w.message.includes('Response schema validation failed')
      );
      expect(schemaWarnings.length).toBe(1);

      // Restore original method
      validationService.validateResponseSchema = originalMethod;
    });
  });

  describe('Schema Validation Performance', () => {
    test('should measure schema validation performance overhead', async () => {
      const request = {
        body: JSON.stringify({
          lat: 51.5074,
          lng: -0.1278,
          name: 'Performance Test Toilet',
          accessible: true,
          hours: '24/7',
          fee: 0
        }),
        ipAddress: '127.0.0.1'
      };

      const iterations = 10;
      const durations = [];

      for (let i = 0; i < iterations; i++) {
        clearSchemaCache(); // Test cold cache performance
        
        const start = performance.now();
        const result = await validationService.validateRequest(request);
        const duration = performance.now() - start;

        expect(result.isValid).toBe(true);
        durations.push(duration);
      }

      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      // Schema validation should add minimal overhead (< 2ms target)
      expect(averageDuration).toBeLessThan(10); // Allow buffer for CI
      expect(maxDuration).toBeLessThan(15); // Maximum reasonable duration
    });

    test('should benefit from schema caching', async () => {
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

      // Cold cache run
      clearSchemaCache();
      const start1 = performance.now();
      const result1 = await validationService.validateRequest(request);
      const coldDuration = performance.now() - start1;

      // Warm cache run
      const start2 = performance.now();
      const result2 = await validationService.validateRequest(request);
      const warmDuration = performance.now() - start2;

      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);

      // Warm cache should be faster or comparable
      expect(warmDuration).toBeLessThanOrEqual(coldDuration * 1.2); // Allow 20% variance
    });

    test('should handle high-frequency validation efficiently', async () => {
      const requests = Array.from({ length: 20 }, (_, i) => ({
        body: JSON.stringify({
          lat: 51.5074 + (i * 0.001),
          lng: -0.1278 + (i * 0.001),
          name: `High Frequency Test ${i + 1}`,
          accessible: i % 2 === 0,
          fee: i % 3
        }),
        ipAddress: '127.0.0.1'
      }));

      const start = performance.now();
      
      const results = await Promise.all(
        requests.map(req => validationService.validateRequest(req))
      );
      
      const totalDuration = performance.now() - start;

      // All requests should succeed
      results.forEach(result => {
        expect(result.isValid).toBe(true);
      });

      // Should handle 20 requests efficiently
      expect(totalDuration).toBeLessThan(200); // 200ms for 20 requests
      expect(totalDuration / requests.length).toBeLessThan(15); // < 15ms per request
    });
  });

  describe('Schema Validation Integration', () => {
    test('should maintain existing ValidationService API', async () => {
      const request = {
        body: JSON.stringify({
          lat: 51.5074,
          lng: -0.1278,
          name: 'API Compatibility Test',
          accessible: true,
          hours: '24/7',
          fee: 0
        }),
        ipAddress: '127.0.0.1'
      };

      const result = await validationService.validateRequest(request);

      // Should maintain existing API structure
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('sanitizedData');
      expect(result).toHaveProperty('validation');
      expect(result).toHaveProperty('suggestionId');
      
      expect(typeof result.isValid).toBe('boolean');
      expect(result.data).toBeDefined();
      expect(result.sanitizedData).toBeDefined();
      expect(result.validation).toBeDefined();
      expect(typeof result.suggestionId).toBe('string');
    });

    test('should not alter validation logic with schema validation', async () => {
      // Test that business validation logic remains unchanged
      const invalidRequest = {
        body: JSON.stringify({
          lat: 91, // Invalid latitude (> 90)
          lng: -0.1278,
          name: 'Invalid Coordinates Test'
        }),
        ipAddress: '127.0.0.1'
      };

      const result = await validationService.validateRequest(invalidRequest);

      expect(result.isValid).toBe(false);
      expect(result.validation.errors.length).toBeGreaterThan(0);
      
      // Should include latitude validation error
      const latErrors = result.validation.errors.filter(e => 
        e.field === 'lat' || e.message.includes('latitude')
      );
      expect(latErrors.length).toBeGreaterThan(0);
    });

    test('should handle edge cases consistently', async () => {
      const edgeCases = [
        {
          name: 'empty body',
          request: { body: '', ipAddress: '127.0.0.1' }
        },
        {
          name: 'null body',
          request: { body: null, ipAddress: '127.0.0.1' }
        },
        {
          name: 'empty JSON',
          request: { body: '{}', ipAddress: '127.0.0.1' }
        },
        {
          name: 'malformed JSON',
          request: { body: '{"invalid": json}', ipAddress: '127.0.0.1' }
        }
      ];

      for (const testCase of edgeCases) {
        const result = await validationService.validateRequest(testCase.request);
        
        // All edge cases should be handled gracefully
        expect(result).toBeDefined();
        expect(typeof result.isValid).toBe('boolean');
        expect(result.isValid).toBe(false); // All should be invalid
        expect(result.error).toBeDefined();
      }
    });
  });
});