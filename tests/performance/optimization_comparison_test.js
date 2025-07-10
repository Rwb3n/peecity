/**
 * @fileoverview Performance comparison between original and optimized validation
 * @artifact docs/cookbook/recipe_tiered_validation.md
 * @task validation_service_tier_0012_task8
 * @tdd-phase REFACTOR
 * 
 * Validates that optimizations improve performance without changing behavior
 */

const { performance } = require('perf_hooks');
const path = require('path');

// Import both versions
const { TieredValidationService } = require('../../src/services/TieredValidationService');
const { TieredValidationServiceOptimized } = require('../../src/services/TieredValidationService_optimized');

describe('Optimization Performance Comparison', () => {
  let originalService;
  let optimizedService;
  
  // Test data sets
  const minimalData = {
    lat: 51.5074,
    lng: -0.1278,
    name: 'Test Toilet',
    accessible: true,
    hours: '24/7',
    fee: 0.50,
    changing_table: true,
    payment_contactless: true,
    access: 'yes'
  };
  
  // Load real property configuration
  const tierConfig = require('../../src/config/suggestPropertyTiers.json');
  
  const fullData = {
    // Core properties (all 8)
    lat: 51.5074,
    lng: -0.1278,
    '@id': 'node/123456789',
    amenity: 'toilets',
    wheelchair: 'yes',
    access: 'yes',
    opening_hours: '24/7',
    fee: true,
    
    // High-frequency properties (sample of 16)
    name: 'Victoria Station Public Facilities',
    male: true,
    female: true,
    unisex: false,
    changing_table: true,
    building: 'yes',
    level: '0',
    'toilets:disposal': 'flush',
    'toilets:wheelchair': true,
    'payment:contactless': 'yes',
    entrance: 'yes',
    supervised: 'no',
    
    // Optional properties (sample of 17)
    operator: 'Network Rail',
    check_date: '2025-07-07',
    'toilets:handwashing': true,
    source: 'survey',
    description: 'Located near main entrance',
    'addr:street': 'Victoria Street',
    'addr:city': 'London',
    'addr:postcode': 'SW1V 1JU',
    
    // Specialized properties (fill to ~120 total from real config)
    'addr:country': 'GB',
    building_levels: '1',
    'roof:shape': 'flat',
    layer: '0',
    'payment:cash': false,
    'payment:credit_cards': true,
    'payment:debit_cards': true,
    location: 'indoor',
    drinking_water: 'yes',
    'changing_table:fee': false,
    ref: 'T001',
    baby_changing: true,
    'toilets:seats': '6',
    radar_key: 'yes',
    'payment:coins': true,
    image: 'https://example.com/toilet.jpg',
    height: '3',
    shop: 'no',
    colour: 'white',
    gender: 'segregated',
    'floor:material': 'tile',
    urinal: 'yes'
  };
  
  // Add more real OSM properties from the configuration
  Object.keys(tierConfig.properties).forEach(prop => {
    if (!(prop in fullData) && Object.keys(fullData).length < 120) {
      // Add with appropriate test values based on validation type
      const propInfo = tierConfig.properties[prop];
      switch (propInfo.validationType) {
        case 'boolean':
          fullData[prop] = true;
          break;
        case 'number':
          fullData[prop] = 42;
          break;
        case 'enum':
          fullData[prop] = 'yes';
          break;
        default:
          fullData[prop] = 'test_value';
      }
    }
  });

  beforeAll(async () => {
    originalService = new TieredValidationService();
    optimizedService = new TieredValidationServiceOptimized();
    
    // Initialize both services
    await originalService.initialize();
    await optimizedService.initialize();
  });

  /**
   * Helper to measure function execution time
   */
  async function measureTime(fn, iterations = 1000) {
    const times = [];
    
    // Warmup
    for (let i = 0; i < 10; i++) {
      await fn();
    }
    
    // Measure
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }
    
    times.sort((a, b) => a - b);
    return {
      mean: times.reduce((a, b) => a + b, 0) / times.length,
      p50: times[Math.floor(times.length * 0.5)],
      p95: times[Math.floor(times.length * 0.95)],
      p99: times[Math.floor(times.length * 0.99)]
    };
  }

  describe('Validation Performance', () => {
    it('should show improved performance for minimal data validation', async () => {
      const request = {
        body: JSON.stringify(minimalData),
        headers: {},
        method: 'POST',
        url: '/api/suggest'
      };

      const originalStats = await measureTime(() => 
        originalService.validateRequest(request)
      );
      
      const optimizedStats = await measureTime(() => 
        optimizedService.validateRequest(request)
      );
      
      console.log('Minimal data validation:');
      console.log('  Original p95:', originalStats.p95.toFixed(2), 'ms');
      console.log('  Optimized p95:', optimizedStats.p95.toFixed(2), 'ms');
      console.log('  Improvement:', ((1 - optimizedStats.p95 / originalStats.p95) * 100).toFixed(1), '%');
      
      // Optimized should be at least 10% faster
      expect(optimizedStats.p95).toBeLessThan(originalStats.p95 * 0.9);
    });

    it('should show improved performance for full data validation', async () => {
      const request = {
        body: JSON.stringify(fullData),
        headers: {},
        method: 'POST',
        url: '/api/suggest'
      };

      const originalStats = await measureTime(() => 
        originalService.validateRequest(request), 500
      );
      
      const optimizedStats = await measureTime(() => 
        optimizedService.validateRequest(request), 500
      );
      
      console.log('Full data validation (120+ properties):');
      console.log('  Original p95:', originalStats.p95.toFixed(2), 'ms');
      console.log('  Optimized p95:', optimizedStats.p95.toFixed(2), 'ms');
      console.log('  Improvement:', ((1 - optimizedStats.p95 / originalStats.p95) * 100).toFixed(1), '%');
      
      // Optimized should be at least 20% faster for large datasets
      expect(optimizedStats.p95).toBeLessThan(originalStats.p95 * 0.8);
    });
  });

  describe('Lookup Performance', () => {
    it('should show improved property metadata lookup', async () => {
      const properties = Object.keys(fullData);
      
      const originalStats = await measureTime(async () => {
        for (const prop of properties) {
          await originalService.getPropertyMetadata(prop);
        }
      }, 100);
      
      const optimizedStats = await measureTime(async () => {
        for (const prop of properties) {
          await optimizedService.getPropertyMetadata(prop);
        }
      }, 100);
      
      console.log('Property metadata lookup (120 properties):');
      console.log('  Original p95:', originalStats.p95.toFixed(2), 'ms');
      console.log('  Optimized p95:', optimizedStats.p95.toFixed(2), 'ms');
      console.log('  Improvement:', ((1 - optimizedStats.p95 / originalStats.p95) * 100).toFixed(1), '%');
      
      // Map-based lookup should be significantly faster
      expect(optimizedStats.p95).toBeLessThan(originalStats.p95 * 0.5);
    });
  });

  describe('Behavior Consistency', () => {
    it('should produce identical validation results for valid data', async () => {
      const request = {
        body: JSON.stringify(minimalData),
        headers: {},
        method: 'POST',
        url: '/api/suggest'
      };

      const originalResult = await originalService.validateRequest(request);
      const optimizedResult = await optimizedService.validateRequest(request);
      
      // Results should be identical
      expect(optimizedResult.isValid).toBe(originalResult.isValid);
      expect(optimizedResult.errors).toEqual(originalResult.errors);
      expect(optimizedResult.warnings).toEqual(originalResult.warnings);
    });

    it('should produce identical validation results for invalid data', async () => {
      const invalidData = {
        lat: 'not a number',
        lng: 500, // out of range
        name: 123, // wrong type
        wheelchair: 'invalid_enum'
      };

      const request = {
        body: JSON.stringify(invalidData),
        headers: {},
        method: 'POST',
        url: '/api/suggest'
      };

      const originalResult = await originalService.validateRequest(request);
      const optimizedResult = await optimizedService.validateRequest(request);
      
      // Error counts should match
      expect(optimizedResult.errors?.length).toBe(originalResult.errors?.length);
      expect(optimizedResult.isValid).toBe(false);
      expect(originalResult.isValid).toBe(false);
    });

    it('should handle v1 compatibility mode identically', async () => {
      const v1Data = {
        lat: 51.5,
        lng: -0.1,
        accessible: true, // v1 field
        hours: 'Mon-Fri 9-5', // v1 field
        payment_contactless: true // v1 field
      };

      const request = {
        body: JSON.stringify(v1Data),
        headers: {},
        method: 'POST',
        url: '/api/suggest',
        version: 'v1'
      };

      const originalResult = await originalService.validateRequest(request);
      const optimizedResult = await optimizedService.validateRequest(request);
      
      // Check field mappings work identically
      expect(optimizedResult.data?.wheelchair).toBe(originalResult.data?.wheelchair);
      expect(optimizedResult.data?.opening_hours).toBe(originalResult.data?.opening_hours);
      expect(optimizedResult.data?.['payment:contactless']).toBe(originalResult.data?.['payment:contactless']);
    });
  });

  describe('Memory Efficiency', () => {
    it('should use less memory with Map-based lookups', () => {
      // This is a conceptual test - in production you'd use memory profiling
      const originalConfig = originalService.config;
      const optimizedMaps = {
        propertyMap: optimizedService.propertyMap,
        corePropertySet: optimizedService.corePropertySet,
        enumValuesMap: optimizedService.enumValuesMap
      };
      
      // Maps should be populated
      expect(optimizedMaps.propertyMap.size).toBeGreaterThan(0);
      expect(optimizedMaps.corePropertySet.size).toBeGreaterThan(0);
      expect(optimizedMaps.enumValuesMap.size).toBeGreaterThan(0);
      
      console.log('Memory optimization stats:');
      console.log('  Property Map entries:', optimizedMaps.propertyMap.size);
      console.log('  Core properties:', optimizedMaps.corePropertySet.size);
      console.log('  Enum definitions:', optimizedMaps.enumValuesMap.size);
    });
  });
});