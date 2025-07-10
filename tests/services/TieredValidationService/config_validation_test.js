/**
 * TieredValidationService Configuration Tests
 * 
 * @doc refs docs/cookbook/recipe_tiered_validation.md
 * @doc refs docs/adr/ADR-002-property-tiering.md
 * 
 * Tests configuration loading, caching, and schema validation
 */

const fs = require('fs').promises;
const path = require('path');
const Ajv = require('ajv');
const propertyTiersSchema = require('../../../schemas/propertyTiers.schema.json');
const { createMockTierConfig } = require('./test-helpers');

// Dynamic config path with environment variable support
const CONFIG_PATH = process.env.TIER_CONFIG || 
  path.join(__dirname, '../../../src/config/suggestPropertyTiers.json');

// This import will fail initially (Red phase) - TieredValidationService doesn't exist yet
let TieredValidationService;
try {
  TieredValidationService = require('../../../src/services/TieredValidationService').TieredValidationService;
} catch (error) {
  // Expected during Red phase
}

describe('TieredValidationService - Configuration', () => {
  let service;
  let mockTierConfig;
  const ajv = new Ajv();
  
  beforeEach(() => {
    // Use helper to create valid mock configuration
    mockTierConfig = createMockTierConfig();

    // Mock fs.readFile to return our test configuration
    jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockTierConfig));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Configuration Loading', () => {
    it('should load tier configuration from file on initialization', async () => {
      service = new TieredValidationService();
      await service.initialize();
      
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('suggestPropertyTiers.json'),
        'utf-8'
      );
    });

    it('should use environment variable for config path if set', async () => {
      const customPath = '/custom/path/tiers.json';
      process.env.TIER_CONFIG = customPath;
      
      service = new TieredValidationService();
      await service.initialize();
      
      expect(fs.readFile).toHaveBeenCalledWith(customPath, 'utf-8');
      
      delete process.env.TIER_CONFIG;
    });

    it('should cache configuration after first load', async () => {
      service = new TieredValidationService();
      await service.initialize();
      await service.initialize(); // Second call
      
      expect(fs.readFile).toHaveBeenCalledTimes(1); // Only loaded once
    });

    it('should handle configuration loading errors gracefully', async () => {
      jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('File not found'));
      
      service = new TieredValidationService();
      await expect(service.initialize()).rejects.toThrow('Failed to load tier configuration');
    });
  });

  describe('Configuration Schema Validation', () => {
    it('should validate loaded configuration against schema', async () => {
      service = new TieredValidationService();
      await service.initialize();
      
      const config = await service.getConfiguration();
      const valid = ajv.validate(propertyTiersSchema, config);
      
      expect(valid).toBe(true);
      if (!valid) {
        console.error('Schema validation errors:', ajv.errors);
      }
    });

    it('should reject invalid configuration', async () => {
      const invalidConfig = {
        version: '1.0.0',
        tiers: {}, // Missing required tier definitions
        properties: {}
      };
      
      jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(invalidConfig));
      
      service = new TieredValidationService();
      await expect(service.initialize()).rejects.toThrow('Invalid tier configuration');
    });
  });

  describe('Synthetic Property Handling', () => {
    beforeEach(async () => {
      service = new TieredValidationService();
      await service.initialize();
    });

    it('should identify synthetic properties correctly', async () => {
      const latMetadata = await service.getPropertyMetadata('lat');
      const lngMetadata = await service.getPropertyMetadata('lng');
      const idMetadata = await service.getPropertyMetadata('@id');
      
      expect(latMetadata.synthetic).toBe(true);
      expect(lngMetadata.synthetic).toBe(true);
      expect(idMetadata.synthetic).toBeUndefined(); // Not synthetic
    });

    it('should handle synthetic property frequency correctly', async () => {
      const latMetadata = await service.getPropertyMetadata('lat');
      
      expect(latMetadata).toEqual(
        expect.objectContaining({
          tier: 'core',
          synthetic: true,
          frequency: 1042, // Should have frequency even though synthetic
          description: expect.stringContaining('not an OSM property')
        })
      );
    });

    it('should not count synthetic properties in OSM property statistics', async () => {
      const stats = await service.getTierStatistics();
      
      expect(stats.core.syntheticCount).toBe(2); // lat and lng
      expect(stats.core.totalCount).toBeGreaterThanOrEqual(4); // Including synthetic
      expect(stats.core.osmPropertyCount).toBe(stats.core.totalCount - stats.core.syntheticCount);
    });
  });
});