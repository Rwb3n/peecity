/**
 * @fileoverview Comprehensive tests for optimized TieredValidationService
 * @artifact docs/cookbook/recipe_tiered_validation.md
 * @task validation_service_tier_0012_task8
 * @tdd-phase REFACTOR
 * 
 * Tests for 100% code coverage - Enhanced with negative cases and edge scenarios
 */

const { TieredValidationServiceOptimized } = require('../../src/services/TieredValidationService_optimized');
const tierConfig = require('../../src/config/suggestPropertyTiers.json');
const path = require('path');
const fs = require('fs').promises;

describe('TieredValidationService - Optimized (100% Coverage)', () => {
  let service;

  beforeEach(() => {
    service = new TieredValidationServiceOptimized();
  });

  describe('Configuration Loading', () => {
    test('should load and validate tier configuration', async () => {
      await service.ensureConfigLoaded();
      const config = await service.getConfiguration();
      expect(config).toBeDefined();
      expect(config.version).toBeDefined();
      expect(config.properties).toBeDefined();
    });

    test('should handle missing configuration file', async () => {
      // Mock fs.readFile to throw error
      const originalReadFile = fs.readFile;
      fs.readFile = jest.fn().mockRejectedValue(new Error('File not found'));
      
      await expect(service.ensureConfigLoaded()).rejects.toThrow('File not found');
      
      fs.readFile = originalReadFile;
    });

    test('should handle invalid JSON in configuration', async () => {
      const originalReadFile = fs.readFile;
      fs.readFile = jest.fn().mockResolvedValue('invalid json');
      
      await expect(service.ensureConfigLoaded()).rejects.toThrow();
      
      fs.readFile = originalReadFile;
    });

    test('should handle invalid schema in configuration', async () => {
      const originalReadFile = fs.readFile;
      fs.readFile = jest.fn().mockResolvedValue(JSON.stringify({
        // Missing required fields
        properties: {}
      }));
      
      await expect(service.ensureConfigLoaded()).rejects.toThrow('Failed to load tier configuration');
      
      fs.readFile = originalReadFile;
    });
  });

  describe('Request Validation', () => {
    test('should handle missing request body', async () => {
      const result = await service.validateRequest({ body: '', ipAddress: '127.0.0.1' });
      expect(result.isValid).toBe(false);
      expect(result.error.type).toBe('MISSING_BODY');
    });

    test('should handle invalid JSON body', async () => {
      const result = await service.validateRequest({ body: 'invalid json', ipAddress: '127.0.0.1' });
      expect(result.isValid).toBe(false);
      expect(result.error.type).toBe('INVALID_JSON');
    });

    test('should handle v2 strict mode', async () => {
      const body = JSON.stringify({
        lat: 51.5074,
        lng: -0.1278,
        // Missing other core properties
      });

      const result = await service.validateRequest({ 
        body, 
        ipAddress: '127.0.0.1',
        version: 'v2'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.validation.errors.some(e => e.code === 'required')).toBe(true);
    });

    test('should apply v1 defaults for missing core properties', async () => {
      const body = JSON.stringify({
        lat: 51.5074,
        lng: -0.1278,
        name: 'Test'
      });

      const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData.amenity).toBe('toilets');
      expect(result.sanitizedData.wheelchair).toBe('no');
      expect(result.sanitizedData.access).toBe('yes');
    });
  });

  describe('Property Validation', () => {
    beforeEach(async () => {
      await service.ensureConfigLoaded();
    });

    test('should validate number properties with range checks', async () => {
      const body = JSON.stringify({
        lat: 91, // Out of range
        lng: -181, // Out of range
        name: 'Test',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: '24/7',
        fee: 'no'
      });

      const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
      
      expect(result.isValid).toBe(false);
      expect(result.validation.errors.some(e => 
        e.field === 'lat' && e.code === 'out_of_range'
      )).toBe(true);
      expect(result.validation.errors.some(e => 
        e.field === 'lng' && e.code === 'out_of_range'
      )).toBe(true);
    });

    test('should validate boolean properties', async () => {
      const body = JSON.stringify({
        lat: 51.5,
        lng: -0.1,
        name: 'Test',
        amenity: 'toilets',
        wheelchair: 'invalid', // Should be boolean
        access: 'yes',
        opening_hours: '24/7',
        fee: 'no'
      });

      const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
      
      expect(result.validation.errors.some(e => 
        e.field === 'wheelchair' && e.code === 'invalid_type'
      )).toBe(true);
    });

    test('should validate string properties', async () => {
      const body = JSON.stringify({
        lat: 51.5,
        lng: -0.1,
        name: 123, // Should be string
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: '24/7',
        fee: 'no'
      });

      const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
      
      expect(result.validation.errors.some(e => 
        e.field === 'name' && e.code === 'invalid_type'
      )).toBe(true);
    });

    test('should validate enum properties', async () => {
      const body = JSON.stringify({
        lat: 51.5,
        lng: -0.1,
        name: 'Test',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'invalid', // Not in enum
        opening_hours: '24/7',
        fee: 'no'
      });

      const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
      
      expect(result.validation.errors.some(e => 
        e.field === 'access' && e.code === 'invalid_enum'
      )).toBe(true);
    });

    test('should validate monetary properties', async () => {
      const body = JSON.stringify({
        lat: 51.5,
        lng: -0.1,
        name: 'Test',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: '24/7',
        fee: [], // Invalid type for monetary
        charge: '£0.50' // Valid monetary string
      });

      const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
      
      expect(result.validation.errors.some(e => 
        e.field === 'fee' && e.code === 'invalid_type'
      )).toBe(true);
    });
  });

  describe('Optional and Specialized Properties', () => {
    beforeEach(async () => {
      await service.ensureConfigLoaded();
    });

    test('should apply lenient validation to optional properties', async () => {
      const body = JSON.stringify({
        lat: 51.5,
        lng: -0.1,
        name: 'Test',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: '24/7',
        fee: 'no',
        operator: 123 // Optional property - type coercion warning
      });

      const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
      
      expect(result.isValid).toBe(true);
      expect(result.validation.warnings.some(w => 
        w.field === 'operator' && w.code === 'type_coercion'
      )).toBe(true);
    });

    test('should handle specialized properties with basic validation', async () => {
      const body = JSON.stringify({
        lat: 51.5,
        lng: -0.1,
        name: 'Test',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: '24/7',
        fee: 'no',
        'payment:coins': 123 // Specialized - type mismatch warning
      });

      const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
      
      expect(result.isValid).toBe(true);
      expect(result.validation.warnings.some(w => 
        w.field === 'payment:coins' && w.code === 'type_mismatch'
      )).toBe(true);
    });
  });

  describe('Data Sanitization', () => {
    beforeEach(async () => {
      await service.ensureConfigLoaded();
    });

    test('should trim string values', async () => {
      const body = JSON.stringify({
        lat: 51.5,
        lng: -0.1,
        name: '  Test Name  ',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: '24/7',
        fee: 'no'
      });

      const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
      
      expect(result.sanitizedData.name).toBe('Test Name');
    });

    test('should skip empty strings for non-core properties', async () => {
      const body = JSON.stringify({
        lat: 51.5,
        lng: -0.1,
        name: 'Test',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: '24/7',
        fee: 'no',
        operator: '   ' // Empty after trim
      });

      const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
      
      expect(result.sanitizedData.operator).toBeUndefined();
    });

    test('should skip null/undefined for non-core properties', async () => {
      const body = JSON.stringify({
        lat: 51.5,
        lng: -0.1,
        name: 'Test',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: '24/7',
        fee: 'no',
        operator: null,
        website: undefined
      });

      const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
      
      expect(result.sanitizedData.operator).toBeUndefined();
      expect(result.sanitizedData.website).toBeUndefined();
    });

    test('should coerce types for optional properties', async () => {
      const body = JSON.stringify({
        lat: 51.5,
        lng: -0.1,
        name: 'Test',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: '24/7',
        fee: 'no',
        description: 123 // Should be coerced to string
      });

      const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
      
      expect(result.sanitizedData.description).toBe('123');
    });
  });

  describe('Performance Methods', () => {
    test('should use getPropertyInfo for efficient lookups', async () => {
      await service.ensureConfigLoaded();
      
      const info = await service.getPropertyInfo('lat');
      expect(info).toEqual({
        tier: 'core',
        frequency: expect.any(Number),
        validationType: 'number',
        synthetic: true
      });
      
      const unknownInfo = await service.getPropertyInfo('unknown_prop');
      expect(unknownInfo).toBeUndefined();
    });

    test('should provide validateSuggestion method', async () => {
      const data = {
        lat: 51.5,
        lng: -0.1,
        name: 'Test',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: '24/7',
        fee: 'no'
      };

      const result = await service.validateSuggestion(data);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Tier Summary Generation', () => {
    beforeEach(async () => {
      await service.ensureConfigLoaded();
    });

    test('should generate comprehensive tier summary', async () => {
      const body = JSON.stringify({
        lat: 51.5,
        lng: -0.1,
        name: 'Test',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: '24/7',
        fee: 'no',
        // High frequency
        male: 'yes',
        female: 'yes',
        // Optional
        operator: 'Council',
        // Specialized
        'payment:coins': 'yes'
      });

      const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
      
      expect(result.validation.tierSummary).toEqual({
        core: { provided: 8, required: 8, valid: 8 },
        high_frequency: { provided: 2, required: 0, valid: 2 },
        optional: { provided: 1, required: 0, valid: 1 },
        specialized: { provided: 1, required: 0, valid: 1 }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle validation errors gracefully', async () => {
      const body = JSON.stringify({
        lat: 'invalid',
        lng: 'invalid',
        name: null,
        amenity: 123,
        wheelchair: 'invalid',
        access: 'invalid',
        opening_hours: false,
        fee: []
      });

      const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
      
      expect(result.isValid).toBe(false);
      expect(result.validation.errors.length).toBeGreaterThan(5);
      expect(result.error.type).toBe('VALIDATION_ERROR');
    });
  });

  describe('Edge Cases for 100% Coverage', () => {
    beforeEach(async () => {
      await service.ensureConfigLoaded();
    });

    describe('V1 Field Mapping Edge Cases', () => {
      test('should handle v1 payment_contactless boolean to string mapping', async () => {
        const body = JSON.stringify({
          lat: 51.5,
          lng: -0.1,
          name: 'Test',
          payment_contactless: false // Should map to payment:contactless: 'no'
        });

        const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
        expect(result.isValid).toBe(true);
        expect(result.data['payment:contactless']).toBe('no');
      });

      test('should handle accessible boolean without existing wheelchair field', async () => {
        const body = JSON.stringify({
          lat: 51.5,
          lng: -0.1,
          name: 'Test',
          accessible: false // Should map to wheelchair: 'no'
        });

        const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
        expect(result.isValid).toBe(true);
        expect(result.data.wheelchair).toBe('no');
      });

      test('should handle fee as positive number conversion', async () => {
        const body = JSON.stringify({
          lat: 51.5,
          lng: -0.1,
          name: 'Test',
          fee: 1.50 // Should convert to fee: true, charge: '1.50 GBP'
        });

        const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
        expect(result.isValid).toBe(true);
        expect(result.data.fee).toBe(true);
        expect(result.data.charge).toBe('1.50 GBP');
      });

      test('should handle fee as zero (no charge)', async () => {
        const body = JSON.stringify({
          lat: 51.5,
          lng: -0.1,
          name: 'Test',
          fee: 0 // Should convert to fee: false, no charge field
        });

        const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
        expect(result.isValid).toBe(true);
        expect(result.data.fee).toBe(false);
        expect(result.data.charge).toBeUndefined();
      });
    });

    describe('V1 Default Handling Edge Cases', () => {
      test('should not override existing accessible field with default wheelchair', async () => {
        const body = JSON.stringify({
          lat: 51.5,
          lng: -0.1,
          name: 'Test',
          accessible: true // Should not get wheelchair: 'no' default
        });

        const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
        expect(result.isValid).toBe(true);
        expect(result.data.wheelchair).toBe('yes'); // From accessible mapping
      });

      test('should not override existing hours field with default opening_hours', async () => {
        const body = JSON.stringify({
          lat: 51.5,
          lng: -0.1,
          name: 'Test',
          hours: '9-17' // Should not get opening_hours: 'unknown' default
        });

        const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
        expect(result.isValid).toBe(true);
        expect(result.data.opening_hours).toBe('9-17'); // From hours mapping
      });

      test('should not override existing fee field with default', async () => {
        const body = JSON.stringify({
          lat: 51.5,
          lng: -0.1,
          name: 'Test',
          fee: 0.50 // Should not get fee: false default
        });

        const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
        expect(result.isValid).toBe(true);
        expect(result.data.fee).toBe(true); // From fee mapping conversion
      });
    });

    describe('Unknown Property Handling', () => {
      test('should handle unknown properties in specialized tier', async () => {
        const body = JSON.stringify({
          lat: 51.5,
          lng: -0.1,
          name: 'Test',
          amenity: 'toilets',
          wheelchair: 'yes',
          access: 'yes',
          opening_hours: '24/7',
          fee: false,
          'unknown:field1': 'value1',
          'custom:property': 123,
          'experimental:feature': true
        });

        const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
        expect(result.isValid).toBe(true);
        
        // Should auto-create specialized tier summary
        expect(result.validation.tierSummary.specialized).toBeDefined();
        expect(result.validation.tierSummary.specialized.provided).toBe(3);
        expect(result.validation.tierSummary.specialized.valid).toBe(3);
      });
    });

    describe('Early Exit Scenarios', () => {
      test('should early exit on strict core validation with multiple errors', async () => {
        // This should trigger early exit due to core validation failure
        const body = JSON.stringify({
          lat: 'invalid', // Core error
          lng: 'invalid', // Core error
          amenity: 'invalid', // Core error
          // These should not be processed due to early exit:
          name: 'Test',
          male: 'yes',
          female: 'yes',
          operator: 'Council'
        });

        const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
        expect(result.isValid).toBe(false);
        
        // Should have core errors
        const coreErrors = result.validation.errors.filter(e => e.tier === 'core');
        expect(coreErrors.length).toBeGreaterThan(0);
      });
    });

    describe('Miscellaneous Edge Cases', () => {
      test('should handle getTierStatistics method', async () => {
        const stats = await service.getTierStatistics();
        expect(stats).toBeDefined();
        expect(stats.core).toBeDefined();
        expect(stats.core.totalCount).toBeGreaterThan(0);
        expect(stats.core.syntheticCount).toBeGreaterThan(0);
      });

      test('should handle getConfiguration method', async () => {
        const config = await service.getConfiguration();
        expect(config).toBeDefined();
        expect(config.version).toBeDefined();
        expect(config.properties).toBeDefined();
        expect(config.tiers).toBeDefined();
      });

      test('should handle getPropertyMetadata method', async () => {
        const metadata = await service.getPropertyMetadata('lat');
        expect(metadata).toBeDefined();
        expect(metadata.tier).toBe('core');
        expect(metadata.validationType).toBe('number');

        const unknownMetadata = await service.getPropertyMetadata('unknown_field');
        expect(unknownMetadata).toBeUndefined();
      });

      test('should handle validateSuggestion with invalid JSON data', async () => {
        await expect(service.validateSuggestion('invalid json')).rejects.toThrow();
      });

      test('should handle validation without initialization (should auto-initialize)', async () => {
        const newService = new TieredValidationServiceOptimized();
        // Don't call ensureConfigLoaded()
        
        const data = {
          lat: 51.5,
          lng: -0.1,
          name: 'Test'
        };

        const result = await newService.validateSuggestion(data);
        expect(result.isValid).toBe(true);
      });
    });

    describe('High-Frequency Property Edge Cases', () => {
      test('should handle all high-frequency property types', async () => {
        const body = JSON.stringify({
          lat: 51.5,
          lng: -0.1,
          '@id': 'node/123',
          amenity: 'toilets',
          wheelchair: 'yes',
          access: 'yes',
          opening_hours: '24/7',
          fee: false,
          // Test various high-frequency properties
          name: 'Valid Name',
          male: 'yes',
          female: 'no',
          unisex: 'yes',
          'toilets:disposal': 'flush',
          operator: 'City Council',
          level: 0,
          indoor: 'yes'
        });

        const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
        expect(result.isValid).toBe(true);
        expect(result.validation.tierSummary.high_frequency.provided).toBeGreaterThan(0);
        expect(result.validation.tierSummary.high_frequency.valid).toBeGreaterThan(0);
      });

      test('should reject invalid high-frequency property types', async () => {
        const body = JSON.stringify({
          lat: 51.5,
          lng: -0.1,
          '@id': 'node/123',
          amenity: 'toilets',
          wheelchair: 'yes',
          access: 'yes',
          opening_hours: '24/7',
          fee: false,
          // Invalid high-frequency properties
          name: 123, // Should be string
          level: 'ground' // Should be number
        });

        const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
        expect(result.isValid).toBe(false);
        
        const highFreqErrors = result.validation.errors.filter(e => e.tier === 'high_frequency');
        expect(highFreqErrors.length).toBeGreaterThan(0);
      });
    });

    describe('Optional Property Coercion Edge Cases', () => {
      test('should handle all optional property validation types', async () => {
        const body = JSON.stringify({
          lat: 51.5,
          lng: -0.1,
          '@id': 'node/123',
          amenity: 'toilets',
          wheelchair: 'yes',
          access: 'yes',
          opening_hours: '24/7',
          fee: false,
          // Optional properties that should trigger coercion warnings
          description: 123, // Number to string
          'addr:street': true, // Boolean to string
          'addr:city': ['London'], // Array to string
          'addr:postcode': null // Null to string
        });

        const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
        expect(result.isValid).toBe(true);
        
        // Should have type coercion warnings
        const coercionWarnings = result.validation.warnings.filter(w => w.code === 'type_coercion');
        expect(coercionWarnings.length).toBeGreaterThan(0);
        
        // Check sanitized data has coerced values
        expect(typeof result.sanitizedData.description).toBe('string');
        expect(result.sanitizedData.description).toBe('123');
      });
    });

    describe('Specialized Property Edge Cases', () => {
      test('should handle specialized property type mismatches', async () => {
        const body = JSON.stringify({
          lat: 51.5,
          lng: -0.1,
          '@id': 'node/123',
          amenity: 'toilets',
          wheelchair: 'yes',
          access: 'yes',
          opening_hours: '24/7',
          fee: false,
          // Specialized properties with type mismatches
          'payment:coins': 123, // Should be string, generates warning
          'payment:cards': true, // Should be string, generates warning
          'building:levels': 'many' // Should be number, generates warning
        });

        const result = await service.validateRequest({ body, ipAddress: '127.0.0.1' });
        expect(result.isValid).toBe(true);
        
        // Should have type mismatch warnings
        const mismatchWarnings = result.validation.warnings.filter(w => w.code === 'type_mismatch');
        expect(mismatchWarnings.length).toBeGreaterThan(0);
      });
    });
  });
});