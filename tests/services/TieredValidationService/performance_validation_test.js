/**
 * TieredValidationService Performance Tests
 * 
 * @doc refs docs/cookbook/recipe_tiered_validation.md
 * @doc refs docs/adr/ADR-002-property-tiering.md
 * 
 * Performance benchmarks for tier-based validation
 * NOTE: These tests are skipped during Red phase as the service doesn't exist yet
 */

const fs = require('fs').promises;
const { performance } = require('perf_hooks');

// This import will fail initially (Red phase)
let TieredValidationService;
try {
  TieredValidationService = require('../../../src/services/TieredValidationService').TieredValidationService;
} catch (error) {
  // Expected during Red phase
}

// Skip performance tests during Red phase - they're meaningless without implementation
describe.skip('TieredValidationService - Performance Benchmarks', () => {
  let service;
  let mockTierConfig;
  
  beforeEach(async () => {
    // Create a realistic configuration with all 120 properties
    mockTierConfig = {
      version: '1.0.0',
      tiers: {
        core: { strict_validation: true, required: true },
        high_frequency: { strict_validation: true, required: false },
        optional: { strict_validation: false, required: false },
        specialized: { strict_validation: false, required: false }
      },
      properties: {}
    };

    // Add 8 core properties
    const coreProps = ['lat', 'lng', '@id', 'amenity', 'wheelchair', 'access', 'opening_hours', 'fee'];
    coreProps.forEach(prop => {
      mockTierConfig.properties[prop] = { 
        tier: 'core', 
        validationType: prop === 'lat' || prop === 'lng' ? 'number' : 
                       prop === 'fee' ? 'boolean' : 'string'
      };
    });

    // Add 16 high-frequency properties
    for (let i = 0; i < 16; i++) {
      mockTierConfig.properties[`high_freq_${i}`] = { 
        tier: 'high_frequency', 
        validationType: i % 2 === 0 ? 'boolean' : 'string' 
      };
    }

    // Add 17 optional properties
    for (let i = 0; i < 17; i++) {
      mockTierConfig.properties[`optional_${i}`] = { 
        tier: 'optional', 
        validationType: 'string' 
      };
    }

    // Add 79 specialized properties
    for (let i = 0; i < 79; i++) {
      mockTierConfig.properties[`specialized_${i}`] = { 
        tier: 'specialized', 
        validationType: 'string' 
      };
    }

    jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockTierConfig));
    
    service = new TieredValidationService();
    await service.initialize();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Validation Performance', () => {
    it('should validate minimal properties within 5ms (p95)', async () => {
      const minimalData = {
        lat: 51.5074,
        lng: -0.1278,
        '@id': 'node/123',
        amenity: 'toilets',
        wheelchair: 'yes',
        access: 'yes',
        opening_hours: '24/7',
        fee: false
      };
      
      const times = [];
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        await service.validateRequest({ 
          body: JSON.stringify(minimalData), 
          ipAddress: '127.0.0.1' 
        });
        const end = performance.now();
        times.push(end - start);
      }
      
      times.sort((a, b) => a - b);
      const p95 = times[Math.floor(times.length * 0.95)];
      const median = times[Math.floor(times.length * 0.5)];
      
      console.log(`Minimal validation - p50: ${median.toFixed(2)}ms, p95: ${p95.toFixed(2)}ms`);
      
      // Environment-aware thresholds
      const threshold = process.env.CI ? 10 : 5;
      expect(p95).toBeLessThan(threshold);
    });

    it('should validate all 120 properties within 5ms (p95)', async () => {
      // Create data with all 120 properties
      const fullData = {
        lat: 51.5074,
        lng: -0.1278
      };
      
      // Add all properties from mock config
      Object.entries(mockTierConfig.properties).forEach(([key, config]) => {
        if (!fullData[key]) {
          switch (config.validationType) {
            case 'boolean':
              fullData[key] = true;
              break;
            case 'number':
              fullData[key] = 1;
              break;
            default:
              fullData[key] = 'test value';
          }
        }
      });
      
      const times = [];
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        await service.validateRequest({ 
          body: JSON.stringify(fullData), 
          ipAddress: '127.0.0.1' 
        });
        const end = performance.now();
        times.push(end - start);
      }
      
      times.sort((a, b) => a - b);
      const p95 = times[Math.floor(times.length * 0.95)];
      const median = times[Math.floor(times.length * 0.5)];
      
      console.log(`Full validation (120 props) - p50: ${median.toFixed(2)}ms, p95: ${p95.toFixed(2)}ms`);
      
      // Environment-aware thresholds
      const threshold = process.env.CI ? 10 : 5;
      expect(p95).toBeLessThan(threshold);
    });

    it('should show linear scaling with property count', async () => {
      const testCases = [
        { count: 10, data: {} },
        { count: 50, data: {} },
        { count: 100, data: {} },
        { count: 120, data: {} }
      ];

      // Prepare test data for each case
      testCases.forEach(testCase => {
        testCase.data = { lat: 51.5074, lng: -0.1278 };
        let propCount = 2;
        
        Object.entries(mockTierConfig.properties).forEach(([key, config]) => {
          if (propCount < testCase.count && !testCase.data[key]) {
            testCase.data[key] = config.validationType === 'boolean' ? true : 'value';
            propCount++;
          }
        });
      });

      const results = [];
      
      for (const testCase of testCases) {
        const times = [];
        for (let i = 0; i < 50; i++) {
          const start = performance.now();
          await service.validateRequest({ 
            body: JSON.stringify(testCase.data), 
            ipAddress: '127.0.0.1' 
          });
          const end = performance.now();
          times.push(end - start);
        }
        
        times.sort((a, b) => a - b);
        const median = times[Math.floor(times.length * 0.5)];
        
        results.push({
          propertyCount: testCase.count,
          medianTime: median
        });
      }
      
      console.log('Scaling analysis:', results);
      
      // Check that performance scales reasonably (not exponential)
      const ratio = results[3].medianTime / results[0].medianTime;
      expect(ratio).toBeLessThan(5); // Should not be more than 5x slower for 12x properties
    });
  });

  describe('Configuration Caching', () => {
    it('should cache configuration effectively', async () => {
      const start = performance.now();
      await service.initialize();
      const firstLoad = performance.now() - start;
      
      const cacheStart = performance.now();
      await service.initialize();
      const cachedLoad = performance.now() - cacheStart;
      
      console.log(`First load: ${firstLoad.toFixed(2)}ms, Cached load: ${cachedLoad.toFixed(2)}ms`);
      
      expect(cachedLoad).toBeLessThan(firstLoad * 0.1); // Cached should be 10x faster
    });

    it('should not impact validation performance after caching', async () => {
      const data = { lat: 51.5074, lng: -0.1278 };
      
      // Warm up cache
      await service.validateRequest({ 
        body: JSON.stringify(data), 
        ipAddress: '127.0.0.1' 
      });
      
      // Measure post-cache performance
      const times = [];
      for (let i = 0; i < 50; i++) {
        const start = performance.now();
        await service.validateRequest({ 
          body: JSON.stringify(data), 
          ipAddress: '127.0.0.1' 
        });
        const end = performance.now();
        times.push(end - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      
      console.log(`Average validation time (cached): ${avgTime.toFixed(2)}ms`);
      
      expect(avgTime).toBeLessThan(2); // Should be very fast with cache
    });
  });
});