/**
 * TieredValidationService Core Property Tests
 * 
 * @doc refs docs/cookbook/recipe_tiered_validation.md
 * @doc refs docs/adr/ADR-002-property-tiering.md
 * 
 * Tests validation of core tier properties (required, strict validation)
 */

const fs = require('fs').promises;
const path = require('path');
const { createMockTierConfig } = require('./test-helpers');

// This import will fail initially (Red phase)
let TieredValidationService;
try {
  TieredValidationService = require('../../../src/services/TieredValidationService').TieredValidationService;
} catch (error) {
  // Expected during Red phase
}

describe('TieredValidationService - Core Property Validation', () => {
  let service;
  let mockTierConfig;
  
  beforeEach(async () => {
    // Use helper to create valid mock configuration with only core properties
    mockTierConfig = createMockTierConfig({
      properties: {
        lat: { tier: 'core', frequency: 1042, validationType: 'number', synthetic: true },
        lng: { tier: 'core', frequency: 1042, validationType: 'number', synthetic: true },
        '@id': { tier: 'core', frequency: 1042, validationType: 'string' },
        amenity: { tier: 'core', frequency: 1042, validationType: 'enum' },
        wheelchair: { tier: 'core', frequency: 800, validationType: 'enum' },
        access: { tier: 'core', frequency: 700, validationType: 'enum' },
        opening_hours: { tier: 'core', frequency: 600, validationType: 'string' },
        fee: { tier: 'core', frequency: 500, validationType: 'boolean' }
      }
    });

    jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockTierConfig));
    
    service = new TieredValidationService();
    await service.initialize();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Required Properties', () => {
    it('should require all core properties', async () => {
      const data = {
        // Missing lat, lng, and other core properties
        name: 'Test Toilet'
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(data), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.isValid).toBe(false);
      expect(result.error.statusCode).toBe(400);
      expect(result.validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'lat',
          code: 'required',
          tier: 'core'
        })
      );
      expect(result.validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'lng',
          code: 'required',
          tier: 'core'
        })
      );
    });

    it('should accept partial data with defaults for v1 compatibility', async () => {
      const partialData = {
        lat: 51.5074,
        lng: -0.1278
        // Missing other required core properties - will get defaults
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(partialData), 
        ipAddress: '127.0.0.1' 
      });
      
      // Should be valid due to v1 compatibility defaults
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData).toMatchObject({
        lat: 51.5074,
        lng: -0.1278,
        '@id': expect.stringMatching(/^node\/\d+$/),
        amenity: 'toilets',
        wheelchair: 'no',
        access: 'yes',
        opening_hours: 'unknown',
        fee: false
      });
    });
  });

  describe('Type Validation', () => {
    it('should strictly validate core property types', async () => {
      const data = {
        lat: 'not-a-number', // Should be number
        lng: 51.5074,
        '@id': 'node/123',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: '24/7',
        fee: 'yes' // Should be boolean
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(data), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.isValid).toBe(false);
      expect(result.validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'lat',
          code: 'invalid_type',
          message: expect.stringContaining('must be a number'),
          tier: 'core'
        })
      );
      expect(result.validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'fee',
          code: 'invalid_type',
          message: expect.stringContaining('must be a boolean'),
          tier: 'core'
        })
      );
    });

    it('should validate coordinate ranges', async () => {
      const data = {
        lat: 91, // Out of range
        lng: -181, // Out of range
        '@id': 'node/123',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: '24/7',
        fee: false
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(data), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.isValid).toBe(false);
      expect(result.validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'lat',
          code: 'out_of_range',
          message: expect.stringContaining('between -90 and 90')
        })
      );
      expect(result.validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'lng',
          code: 'out_of_range',
          message: expect.stringContaining('between -180 and 180')
        })
      );
    });
  });

  describe('Enum Validation', () => {
    it('should validate core enum values strictly', async () => {
      const data = {
        lat: 51.5074,
        lng: -0.1278,
        '@id': 'node/123',
        amenity: 'restaurant', // Should be 'toilets'
        wheelchair: 'maybe', // Should be yes/no/limited
        access: 'public', // Should be yes/private/customers
        opening_hours: '24/7',
        fee: false
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(data), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.isValid).toBe(false);
      expect(result.validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'amenity',
          code: 'invalid_enum',
          message: expect.stringContaining('must be one of: ["toilets"]'),
          tier: 'core'
        })
      );
      expect(result.validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'wheelchair',
          code: 'invalid_enum',
          tier: 'core'
        })
      );
      expect(result.validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'access',
          code: 'invalid_enum',
          tier: 'core'
        })
      );
    });
  });

  describe('Valid Core Submission', () => {
    it('should accept valid core properties', async () => {
      const validData = {
        lat: 51.5074,
        lng: -0.1278,
        '@id': 'node/123456',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: 'Mo-Fr 09:00-17:00',
        fee: true
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(validData), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.isValid).toBe(true);
      expect(result.validation.errors).toHaveLength(0);
      expect(result.sanitizedData).toMatchObject(validData);
    });
  });
});