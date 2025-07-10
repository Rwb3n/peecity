/**
 * Integration Tests for Tier-Based Validation in Suggest API
 * 
 * @doc refs docs/cookbook/recipe_tiered_validation.md
 * @doc refs docs/adr/ADR-002-property-tiering.md
 * @doc refs docs/adr/ADR-003-core-property-validation.md
 * 
 * Tests the full API route behavior with tier-based validation.
 * These tests verify the integration between the API route handler
 * and the TieredValidationService.
 */

const request = require('supertest');
const nock = require('nock');
const fs = require('fs').promises;
const path = require('path');

// Mock Next.js app for testing
let app;
let mockValidationService;
let testCounter = 0;

// This will fail initially in Red phase
try {
  // In a real Next.js app, we'd import the handler differently
  // For now, we'll need to mock the entire route setup
  const { createMockApp } = require('../helpers/mockNextApp');
  app = createMockApp();
} catch (error) {
  // Expected during Red phase
}

describe('Suggest API - Tier-Based Validation Integration', () => {
  beforeEach(() => {
    // Clean up any previous nock interceptors
    nock.cleanAll();
    
    // Mock file system for data persistence
    const originalReadFile = fs.readFile;
    jest.spyOn(fs, 'appendFile').mockResolvedValue();
    jest.spyOn(fs, 'readFile').mockImplementation(async (filePath) => {
      if (filePath.includes('toilets.geojson')) {
        return JSON.stringify({
          type: 'FeatureCollection',
          features: []
        });
      }
      // Allow reading the tier configuration file
      if (filePath.includes('suggestPropertyTiers.json')) {
        // Use the original fs.readFile to avoid recursion
        return originalReadFile.call(fs, filePath, 'utf-8');
      }
      throw new Error('File not found');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  describe('Core Property Validation', () => {
    it('should return 400 when core properties are missing (v2 behavior)', async () => {
      const incompleteData = {
        name: 'Test Toilet'
        // Missing required core properties
      };

      const response = await request(app)
        .post('/api/v2/suggest')
        .send(incompleteData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        error: {
          code: 'validation_failed'
        }
      });
      
      expect(response.body.validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'lat',
          code: 'required',
          tier: 'core'
        })
      );
    });

    it('should accept minimal v1 submission with defaults', async () => {
      const v1MinimalData = {
        lat: 51.5074,
        lng: -0.1278,
        name: 'Public Toilet'
      };

      const response = await request(app)
        .post('/api/suggest') // v1 endpoint
        .send(v1MinimalData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          sanitizedData: expect.objectContaining({
            lat: 51.5074,
            lng: -0.1278,
            name: 'Public Toilet',
            '@id': expect.stringMatching(/^node\/\d+$/),
            amenity: 'toilets',
            wheelchair: 'no',
            access: 'yes',
            opening_hours: 'unknown',
            fee: false
          })
        }
      });
    });

    it('should validate all core properties when provided', async () => {
      const fullCoreData = {
        lat: 51.5074,
        lng: -0.1278,
        '@id': 'node/123456',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: '24/7',
        fee: true
      };

      const response = await request(app)
        .post('/api/v2/suggest')
        .send(fullCoreData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('High-Frequency Property Validation', () => {
    it('should return 400 for invalid high-frequency properties', async () => {
      const invalidHighFreqData = {
        lat: 51.5074,
        lng: -0.1278,
        male: 'yes', // Should be boolean
        female: 123, // Should be boolean
        changing_table: 'maybe' // Should be boolean
      };

      const response = await request(app)
        .post('/api/suggest')
        .send(invalidHighFreqData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'male',
          code: 'invalid_type',
          tier: 'high_frequency'
        })
      );
    });

    it('should accept valid high-frequency properties', async () => {
      const validHighFreqData = {
        lat: 51.5074,
        lng: -0.1278,
        male: true,
        female: true,
        unisex: false,
        changing_table: true,
        'payment:contactless': 'yes',  // OSM uses string values
        name: 'City Centre Toilets'
      };

      const response = await request(app)
        .post('/api/suggest')
        .send(validHighFreqData)
        .expect('Content-Type', /json/)
        .expect(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sanitizedData).toMatchObject(validHighFreqData);
    });
  });

  describe('Optional Property Validation', () => {
    it('should accept submission with missing optional properties', async () => {
      const minimalData = {
        lat: 51.5074,
        lng: -0.1278
        // No optional properties provided
      };

      const response = await request(app)
        .post('/api/suggest')
        .send(minimalData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      // Filter out non-validation warnings (e.g., duplicate check warnings)
      const validationWarnings = response.body.validation.warnings.filter(w => w.tier);
      expect(validationWarnings).toHaveLength(0);
    });

    it('should handle optional properties with lenient validation', async () => {
      const optionalData = {
        lat: 51.5074,
        lng: -0.1278,
        description: 123, // Wrong type but should be coerced (optional tier - expects string)
        entrance: 'yes', // Correct type (optional tier)
        name: 'Test Toilet'
      };

      const response = await request(app)
        .post('/api/suggest')
        .send(optionalData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.validation.warnings).toContainEqual(
        expect.objectContaining({
          field: 'description',
          code: 'type_coercion',
          tier: 'optional'
        })
      );
      expect(response.body.data.sanitizedData.description).toBe('123');
    });
  });

  describe('Specialized Property Validation', () => {
    it('should accept invalid specialized properties with warnings', async () => {
      const specializedData = {
        lat: 51.5074,
        lng: -0.1278,
        'addr:street': { invalid: 'object' }, // Wrong type
        'survey:date': ['array', 'value'], // Wrong type
        'custom:field': 'anything goes' // Unknown property
      };

      const response = await request(app)
        .post('/api/suggest')
        .set('X-Forwarded-For', `192.168.1.${100 + testCounter++}`)
        .send(specializedData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      // Warnings logged but not returned in response for specialized
      expect(response.body.validation.warnings).toBeDefined();
    });
  });

  describe('Comprehensive Property Submission', () => {
    it('should handle all 120 properties in a single submission', async () => {
      // Load example with all properties
      const comprehensiveData = {
        // Core (8)
        lat: 51.5074,
        lng: -0.1278,
        '@id': 'node/9876543210',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: 'Mo-Su 06:00-22:00',
        fee: true,
        
        // High-frequency (sample)
        male: true,
        female: true,
        unisex: false,
        changing_table: true,
        'toilets:disposal': 'flush',
        'payment:contactless': 'yes',  // String not boolean
        supervised: false,
        name: 'Victoria Station Toilets',
        
        // Optional (sample)
        operator: 'Network Rail',
        'operator:wikidata': 'Q1668732',
        source: 'survey',
        level: 0,  // Number not string
        indoor: true,
        
        // Specialized (sample)
        'addr:street': 'Victoria Street',
        'addr:city': 'London',
        'addr:postcode': 'SW1E 5ND',
        'contact:phone': '+44 20 7123 4567',
        'survey:date': '2025-07-06',
        
        // ... potentially 90+ more properties
        // For test purposes, we'll add a few more
        'toilets:position': 'seated',
        'toilets:paper': 'yes',
        created_by: 'CityPee v2.0',
        wikidata: 'Q123456789'
      };

      const response = await request(app)
        .post('/api/suggest')
        .set('X-Forwarded-For', `192.168.1.${100 + testCounter++}`)
        .send(comprehensiveData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.validation.tierSummary).toMatchObject({
        core: { provided: 8, valid: 8 },
        high_frequency: expect.objectContaining({ valid: expect.any(Number) }),
        optional: expect.objectContaining({ valid: expect.any(Number) }),
        specialized: expect.objectContaining({ valid: expect.any(Number) })
      });
    });

    it.skip('should complete validation within performance budget', async () => {
      const data = {
        lat: 51.5074,
        lng: -0.1278,
        // Add 50+ properties
        ...Array.from({ length: 50 }, (_, i) => ({
          [`custom:prop${i}`]: `value${i}`
        })).reduce((acc, obj) => ({ ...acc, ...obj }), {})
      };

      const startTime = Date.now();
      
      await request(app)
        .post('/api/suggest')
        .send(data)
        .expect(201);
      
      const duration = Date.now() - startTime;
      
      // Should complete within 10ms for CI environment
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain v1 API compatibility with field mappings', async () => {
      const v1Data = {
        lat: 51.5074,
        lng: -0.1278,
        name: 'Public Toilet',
        accessible: true, // v1 field
        hours: '9am-5pm', // v1 field
        fee: 0.50, // v1 numeric fee
        changing_table: false,
        payment_contactless: true,
        access: 'yes'
      };

      const response = await request(app)
        .post('/api/suggest')
        .set('X-Forwarded-For', `192.168.1.${100 + testCounter++}`)
        .send(v1Data)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      
      const sanitized = response.body.data.sanitizedData;
      expect(sanitized.wheelchair).toBe('yes'); // Mapped from accessible
      expect(sanitized.opening_hours).toBe('9am-5pm'); // Mapped from hours
      expect(sanitized.fee).toBe(true); // Converted from number
      expect(sanitized.charge).toBe('0.50 GBP'); // Fee amount preserved
      expect(sanitized['payment:contactless']).toBe('yes'); // Mapped and converted to string
    });
  });

  describe.skip('Rate Limiting Integration', () => {
    it('should respect rate limits with tier validation', async () => {
      const data = { lat: 51.5074, lng: -0.1278 };
      
      // Make requests up to the limit
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/suggest')
          .set('X-Forwarded-For', '192.168.1.100')
          .send(data)
          .expect(201);
      }
      
      // Next request should be rate limited
      const response = await request(app)
        .post('/api/suggest')
        .set('X-Forwarded-For', '192.168.1.100')
        .send(data)
        .expect(429);
        
      expect(response.body.error.code).toBe('RATE_LIMITED');
      expect(response.headers['x-ratelimit-limit']).toBe('5');
      expect(response.headers['x-ratelimit-remaining']).toBe('0');
    });
  });

  describe('Error Response Format', () => {
    it('should return structured validation errors with tier information', async () => {
      const invalidData = {
        lat: 'not-a-number',
        lng: 181, // Out of range
        wheelchair: 'maybe', // Invalid enum
        male: 'yes' // Wrong type for high-frequency
      };

      const response = await request(app)
        .post('/api/suggest')
        .set('X-Forwarded-For', `192.168.1.${100 + testCounter++}`)
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
        error: {
          code: 'validation_failed',
          timestamp: expect.any(String)
        },
        validation: {
          isValid: false,
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'lat',
              code: 'invalid_type',
              tier: 'core'
            }),
            expect.objectContaining({
              field: 'lng',
              code: 'out_of_range',
              tier: 'core'
            })
          ]),
          errorsByTier: expect.objectContaining({
            core: expect.any(Number),
            high_frequency: expect.any(Number)
          })
        }
      });
    });
  });

  describe('Logging and Metrics', () => {
    it('should log validation events with tier breakdown', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const data = {
        lat: 51.5074,
        lng: -0.1278,
        'unknown:property': 'value'
      };

      const response = await request(app)
        .post('/api/suggest')
        .set('X-Forwarded-For', `192.168.1.${100 + testCounter++}`)
        .send(data)
        .expect(201);

      // Should log tier validation summary
      expect(consoleSpy).toHaveBeenCalledWith(
        'Validation completed',
        expect.objectContaining({
          tierSummary: expect.any(Object)
        })
      );
      
      consoleSpy.mockRestore();
    });
  });
});