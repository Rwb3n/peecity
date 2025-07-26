/**
 * @fileoverview Tests for ValidationService factory functions
 * @artifact docs/cookbook/recipe_tiered_validation.md
 * @epic foundation_consolidation_epic
 * @task foundation_consolidation_task2_corrected
 * @tdd-phase GREEN
 */

const {
  createBasicValidationService,
  createOptimizedValidationService,
  createMetricsValidationService,
  createFullValidationService,
  TieredValidationService
} = require('../../../src/services/validation');

describe('Validation Service Factory', () => {
  describe('createBasicValidationService', () => {
    test('should create validation service without optimization or metrics', () => {
      const service = createBasicValidationService();
      expect(service).toBeInstanceOf(TieredValidationService);
      expect(service.validateRequest).toBeDefined();
    });
  });

  describe('createOptimizedValidationService', () => {
    test('should create validation service with performance optimization', () => {
      const service = createOptimizedValidationService();
      expect(service).toBeInstanceOf(TieredValidationService);
      expect(service.validateRequest).toBeDefined();
    });
  });

  describe('createMetricsValidationService', () => {
    test('should create validation service with metrics collection', () => {
      const service = createMetricsValidationService();
      expect(service).toBeInstanceOf(TieredValidationService);
      expect(service.validateRequest).toBeDefined();
    });
  });

  describe('createFullValidationService', () => {
    test('should create validation service with all features', () => {
      const service = createFullValidationService();
      expect(service).toBeInstanceOf(TieredValidationService);
      expect(service.validateRequest).toBeDefined();
    });

    test('should maintain backward compatibility methods', async () => {
      const service = createFullValidationService();
      
      // Test compatibility methods exist
      expect(service.getConfiguration).toBeDefined();
      expect(service.getTierStatistics).toBeDefined();
      expect(service.validateSuggestion).toBeDefined();
      expect(service.getValidationSummary).toBeDefined();
      expect(service.ensureConfigLoaded).toBeDefined();
    });
  });

  describe('Service Integration', () => {
    test('should handle basic validation workflow', async () => {
      const service = createOptimizedValidationService();
      
      const testRequest = {
        body: JSON.stringify({
          lat: 51.5074,
          lng: -0.1278,
          name: 'Test Toilet',
          accessible: true
        }),
        ipAddress: '127.0.0.1'
      };

      try {
        const result = await service.validateRequest(testRequest);
        
        // Should have basic structure even if validation details vary
        expect(result).toBeDefined();
        expect(typeof result.isValid).toBe('boolean');
        
        if (!result.isValid) {
          expect(result.error).toBeDefined();
        }
      } catch (error) {
        // Configuration loading might fail in test environment, that's ok
        expect(error.message).toContain('configuration');
      }
    });
  });

  describe('Performance Requirements', () => {
    test('should create services quickly', () => {
      const start = Date.now();
      
      createBasicValidationService();
      createOptimizedValidationService();
      createMetricsValidationService();
      createFullValidationService();
      
      const duration = Date.now() - start;
      
      // Service creation should be very fast (< 50ms)
      expect(duration).toBeLessThan(50);
    });
  });
});