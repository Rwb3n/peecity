/**
 * TieredValidationService Tier-Specific Tests
 * 
 * @doc refs docs/cookbook/recipe_tiered_validation.md
 * @doc refs docs/adr/ADR-002-property-tiering.md
 * 
 * Tests validation for high-frequency, optional, and specialized tiers
 */

const fs = require('fs').promises;
const { createMockTierConfig } = require('./test-helpers');

// This import will fail initially (Red phase)
let TieredValidationService;
try {
  TieredValidationService = require('../../../src/services/TieredValidationService').TieredValidationService;
} catch (error) {
  // Expected during Red phase
}

describe('TieredValidationService - Tier-Specific Validation', () => {
  let service;
  let mockTierConfig;
  let validCoreData;
  
  beforeEach(async () => {
    // Valid core data to use as base
    validCoreData = {
      lat: 51.5074,
      lng: -0.1278,
      '@id': 'node/123',
      amenity: 'toilets',
      wheelchair: 'yes',
      access: 'yes',
      opening_hours: '24/7',
      fee: false
    };

    // Use helper to create valid mock configuration
    mockTierConfig = createMockTierConfig();

    jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockTierConfig));
    
    service = new TieredValidationService();
    await service.initialize();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('High-Frequency Property Validation', () => {
    it('should not require high-frequency properties', async () => {
      // Only core properties, no high-frequency
      const result = await service.validateRequest({ 
        body: JSON.stringify(validCoreData), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.isValid).toBe(true);
      expect(result.validation.warnings).toHaveLength(0);
    });

    it('should strictly validate high-frequency properties when provided', async () => {
      const data = {
        ...validCoreData,
        male: 'yes', // Should be boolean
        female: true,
        changing_table: 123 // Should be boolean
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(data), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.isValid).toBe(false);
      expect(result.validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'male',
          code: 'invalid_type',
          tier: 'high_frequency'
        })
      );
      expect(result.validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'changing_table',
          code: 'invalid_type',
          tier: 'high_frequency'
        })
      );
    });

    it('should accept valid high-frequency properties', async () => {
      const data = {
        ...validCoreData,
        male: true,
        female: true,
        unisex: false,
        changing_table: true,
        'payment:contactless': true
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(data), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData).toMatchObject(data);
    });
  });

  describe('Optional Property Validation', () => {
    it('should accept missing optional properties', async () => {
      const result = await service.validateRequest({ 
        body: JSON.stringify(validCoreData), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.isValid).toBe(true);
    });

    it('should validate optional properties leniently when provided', async () => {
      const data = {
        ...validCoreData,
        operator: '', // Empty string should be acceptable
        source: 12345, // Wrong type but should only warn
        name: 'Valid Name'
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(data), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.isValid).toBe(true);
      expect(result.validation.warnings).toContainEqual(
        expect.objectContaining({
          field: 'source',
          code: 'type_coercion',
          message: expect.stringContaining('coerced to string'),
          tier: 'optional'
        })
      );
      // Coerced value should be in sanitized data
      expect(result.sanitizedData.source).toBe('12345');
    });

    it('should handle empty optional strings gracefully', async () => {
      const data = {
        ...validCoreData,
        operator: '',
        name: '   ', // Whitespace only
        source: null // Null value
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(data), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.isValid).toBe(true);
      // Empty strings should be excluded from sanitized data
      expect(result.sanitizedData).not.toHaveProperty('operator');
      expect(result.sanitizedData).not.toHaveProperty('name');
      expect(result.sanitizedData).not.toHaveProperty('source');
    });
  });

  describe('Specialized Property Validation', () => {
    it('should accept specialized properties with basic type checking only', async () => {
      const data = {
        ...validCoreData,
        'addr:street': 123, // Wrong type but should be accepted with warning
        'survey:date': true, // Wrong type but should be accepted with warning
        'unknown:property': 'anything' // Unknown property should be accepted
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(data), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.isValid).toBe(true);
      expect(result.validation.warnings).toContainEqual(
        expect.objectContaining({
          field: 'addr:street',
          code: 'type_mismatch',
          tier: 'specialized'
        })
      );
    });

    it('should log warnings for invalid specialized properties', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const data = {
        ...validCoreData,
        'survey:date': { complex: 'object' }
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(data), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.isValid).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Specialized property validation warning'),
        expect.objectContaining({ field: 'survey:date' })
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should accept unknown properties as specialized tier', async () => {
      const data = {
        ...validCoreData,
        'custom:field': 'value',
        'new:property': 42,
        'future:extension': true
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(data), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData).toMatchObject(data);
    });
  });

  describe('Validation Summary', () => {
    it('should include tier breakdown in validation results', async () => {
      const data = {
        ...validCoreData,
        male: true,
        female: false,
        operator: 'City Council',
        'addr:street': 'High Street'
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(data), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.validation.tierSummary).toEqual({
        core: { provided: 8, required: 8, valid: 8 },
        high_frequency: { provided: 2, required: 0, valid: 2 },
        optional: { provided: 1, required: 0, valid: 1 },
        specialized: { provided: 1, required: 0, valid: 1 }
      });
    });

    it('should report validation errors by tier', async () => {
      const data = {
        lat: 'invalid',
        lng: -0.1278,
        male: 'yes', // Should be boolean
        operator: true // Wrong type but lenient
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(data), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.validation.errorsByTier).toEqual({
        core: 1, // Invalid lat only (other core fields get defaults)
        high_frequency: 1, // Invalid male
        optional: 0,
        specialized: 0
      });
    });
  });
});