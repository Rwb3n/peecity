/**
 * TieredValidationService Backward Compatibility Tests
 * 
 * @doc refs docs/cookbook/recipe_tiered_validation.md
 * @doc refs docs/adr/ADR-002-property-tiering.md
 * 
 * Tests v1 API compatibility and field mapping
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

describe('TieredValidationService - Backward Compatibility', () => {
  let service;
  let mockTierConfig;
  
  beforeEach(async () => {
    // Use helper to create valid mock configuration
    mockTierConfig = createMockTierConfig();

    jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockTierConfig));
    
    service = new TieredValidationService();
    await service.initialize();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('ValidationService Interface', () => {
    it('should maintain ValidationService interface compatibility', () => {
      expect(service).toHaveProperty('validateRequest');
      expect(typeof service.validateRequest).toBe('function');
    });

    it('should return ValidationResult structure', async () => {
      const data = {
        lat: 51.5074,
        lng: -0.1278,
        name: 'Test'
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(data), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('sanitizedData');
      expect(result).toHaveProperty('validation');
      expect(result).toHaveProperty('suggestionId');
    });
  });

  describe('v1 API Field Mapping', () => {
    it('should handle v1 API minimal submissions', async () => {
      const v1Data = {
        lat: 51.5074,
        lng: -0.1278,
        name: 'Public Toilet',
        accessible: true,
        hours: '9am-5pm',
        fee: 0.50,
        changing_table: false,
        payment_contactless: true,
        access: 'yes'
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(v1Data), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData).toMatchObject({
        lat: 51.5074,
        lng: -0.1278,
        name: 'Public Toilet',
        accessible: true
      });
    });

    it('should map v1 field names to OSM properties', async () => {
      const v1Data = {
        lat: 51.5074,
        lng: -0.1278,
        accessible: true, // Should map to wheelchair
        hours: '24/7', // Should map to opening_hours
        payment_contactless: true // Should map to payment:contactless
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(v1Data), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.sanitizedData).toHaveProperty('wheelchair', 'yes');
      expect(result.sanitizedData).toHaveProperty('opening_hours', '24/7');
      expect(result.sanitizedData).toHaveProperty('payment:contactless', true);
    });

    it('should handle v1 boolean to OSM string mapping', async () => {
      const v1Data = {
        lat: 51.5074,
        lng: -0.1278,
        accessible: false // Should map to wheelchair: 'no'
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(v1Data), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.sanitizedData.wheelchair).toBe('no');
    });

    it('should handle v1 fee as number', async () => {
      const v1Data = {
        lat: 51.5074,
        lng: -0.1278,
        fee: 0.50 // v1 uses number for fee amount
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(v1Data), 
        ipAddress: '127.0.0.1' 
      });
      
      // Should convert to boolean for core fee property
      expect(result.sanitizedData.fee).toBe(true);
      // And store amount in charge property
      expect(result.sanitizedData.charge).toBe('0.50 GBP');
    });
  });

  describe('v1 Response Format', () => {
    it('should maintain v1 error response format', async () => {
      const invalidData = {
        lat: 'invalid',
        lng: -0.1278
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(invalidData), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.isValid).toBe(false);
      expect(result.error).toHaveProperty('statusCode');
      expect(result.error).toHaveProperty('type');
      expect(result.error).toHaveProperty('message');
      expect(result.error).toHaveProperty('details');
    });

    it('should include v1 validation error structure', async () => {
      const invalidData = {
        lat: 91, // Out of range
        lng: -0.1278
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(invalidData), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.validation.errors[0]).toHaveProperty('field');
      expect(result.validation.errors[0]).toHaveProperty('message');
      expect(result.validation.errors[0]).toHaveProperty('code');
    });
  });

  describe('Gradual v2 Migration', () => {
    it('should accept mixed v1/v2 properties', async () => {
      const mixedData = {
        // v1 properties
        lat: 51.5074,
        lng: -0.1278,
        accessible: true,
        hours: '24/7',
        // v2 properties
        male: true,
        female: false,
        wheelchair: 'limited', // Direct OSM property
        'toilets:disposal': 'flush'
      };
      
      const result = await service.validateRequest({ 
        body: JSON.stringify(mixedData), 
        ipAddress: '127.0.0.1' 
      });
      
      expect(result.isValid).toBe(true);
      // v1 mapping should not override direct OSM property
      expect(result.sanitizedData.wheelchair).toBe('limited');
      expect(result.sanitizedData.opening_hours).toBe('24/7');
    });
  });
});