/**
 * @fileoverview Tests for optimized TieredValidationService
 * @artifact docs/cookbook/recipe_tiered_validation.md
 * @task validation_service_tier_0012_task8
 * @tdd-phase REFACTOR
 */

const { TieredValidationServiceOptimized } = require('../../src/services/TieredValidationService_optimized');
const tierConfig = require('../../src/config/suggestPropertyTiers.json');

describe('TieredValidationService - Optimized', () => {
  let service;

  beforeEach(() => {
    service = new TieredValidationServiceOptimized();
  });

  describe('Configuration Loading', () => {
    test('should load tier configuration', async () => {
      await service.ensureConfigLoaded();
      const info = service.getPropertyInfo('lat');
      expect(info).toBeDefined();
      expect(info.tier).toBe('core');
    });

    test('should cache configuration after first load', async () => {
      const start = process.hrtime.bigint();
      await service.ensureConfigLoaded();
      const firstLoad = Number(process.hrtime.bigint() - start) / 1e6;

      const start2 = process.hrtime.bigint();
      await service.ensureConfigLoaded();
      const secondLoad = Number(process.hrtime.bigint() - start2) / 1e6;

      expect(secondLoad).toBeLessThan(firstLoad * 0.1);
    });
  });

  describe('Property Metadata Lookup', () => {
    test('should efficiently look up property metadata', async () => {
      await service.ensureConfigLoaded();
      
      // Test all property lookups
      Object.keys(tierConfig.properties).forEach(prop => {
        const info = service.getPropertyInfo(prop);
        expect(info).toBeDefined();
        expect(info.tier).toBeDefined();
      });
    });
  });

  describe('Validation', () => {
    test('should validate minimal properties', async () => {
      const body = JSON.stringify({
        lat: 51.5074,
        lng: -0.1278,
        name: 'Test Toilet',
        accessible: true,
        hours: '24/7',
        fee: 0.50,
        changing_table: true,
        payment_contactless: true,
        access: 'yes'
      });

      const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
      expect(result.isValid).toBe(true);
      expect(result.validation.errors).toHaveLength(0);
    });

    test('should validate with tier summary', async () => {
      const body = JSON.stringify({
        lat: 51.5074,
        lng: -0.1278,
        name: 'Test Toilet',
        accessible: true,
        hours: '24/7',
        fee: 0.50,
        changing_table: true,
        payment_contactless: true,
        access: 'yes',
        male: 'yes',
        female: 'yes'
      });

      const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
      expect(result.isValid).toBe(true);
      expect(result.validation.tierSummary).toBeDefined();
      expect(result.validation.tierSummary.core.provided).toBeGreaterThan(0);
    });

    test('should handle invalid data', async () => {
      const body = JSON.stringify({
        lat: 'invalid',
        lng: -0.1278,
        name: 'Test Toilet'
      });

      const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
      expect(result.isValid).toBe(false);
      expect(result.validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Characteristics', () => {
    test('should maintain Maps for O(1) lookups', () => {
      expect(service.propertyMap).toBeInstanceOf(Map);
      expect(service.corePropertySet).toBeInstanceOf(Set);
      expect(service.enumValuesMap).toBeInstanceOf(Map);
    });
  });
});