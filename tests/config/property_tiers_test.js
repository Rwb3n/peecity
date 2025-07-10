/*
 * property_tiers_test.js
 * ------------------------------------------------------------
 * 📄 Description  : Validates property tier configuration structure
 *                   and completeness for 120 OSM properties
 *
 * 📝 References   : feedback.txt (prioritization framework)
 *                   data/osm_properties_analysis.json (property list)
 *                   docs/reference/property-prioritization.md (framework)
 *
 * 🧩 Artifact Annotation:
 *   @doc refs docs/reference/property-prioritization.md#tier-system
 */

const fs = require('fs');
const path = require('path');

// Test paths
const CONFIG_PATH = path.join(__dirname, '../../src/config/suggestPropertyTiers.json');
const OSM_ANALYSIS_PATH = path.join(__dirname, '../../data/osm_properties_analysis.json');

// Valid validation types
const VALID_VALIDATION_TYPES = ['string', 'boolean', 'enum', 'monetary', 'date', 'number'];

describe('Property Tier Configuration', () => {
  let osmProperties;
  let osmPropertyCount;
  let tierConfig;

  beforeAll(() => {
    // Load OSM property analysis data
    const osmData = fs.readFileSync(OSM_ANALYSIS_PATH, 'utf8');
    const osmAnalysis = JSON.parse(osmData);
    osmProperties = osmAnalysis.properties;
    osmPropertyCount = osmAnalysis.totalProperties;
  });

  describe('Configuration File Structure', () => {
    it('should have suggestPropertyTiers.json configuration file', () => {
      expect(fs.existsSync(CONFIG_PATH)).toBe(true);
    });

    it('should be valid JSON', () => {
      const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
      expect(() => {
        tierConfig = JSON.parse(configData);
      }).not.toThrow();
    });

    it('should have required top-level structure', () => {
      expect(tierConfig).toHaveProperty('version');
      expect(tierConfig).toHaveProperty('generated_at');
      expect(tierConfig).toHaveProperty('source');
      expect(tierConfig).toHaveProperty('tiers');
      expect(tierConfig).toHaveProperty('properties');
    });

    it('should define all four tiers', () => {
      expect(tierConfig.tiers).toHaveProperty('core');
      expect(tierConfig.tiers).toHaveProperty('high_frequency');
      expect(tierConfig.tiers).toHaveProperty('optional');
      expect(tierConfig.tiers).toHaveProperty('specialized');
    });
  });

  describe('Property Coverage', () => {
    it('should include all OSM properties from analysis', () => {
      const configPropertyNames = Object.keys(tierConfig.properties);
      // Config includes lat/lng which aren't in OSM data
      expect(configPropertyNames.length).toBe(osmPropertyCount + 2);
      
      // Verify each OSM property is present
      Object.keys(osmProperties).forEach(propName => {
        expect(configPropertyNames).toContain(propName);
      });
      
      // Verify lat/lng are also present
      expect(configPropertyNames).toContain('lat');
      expect(configPropertyNames).toContain('lng');
    });

    it('should have required fields for each property', () => {
      Object.entries(tierConfig.properties).forEach(([propName, propConfig]) => {
        // Required fields
        expect(propConfig).toHaveProperty('tier');
        expect(propConfig).toHaveProperty('frequency');
        expect(propConfig).toHaveProperty('validationType');
        
        // Tier must be one of the four defined tiers
        expect(['core', 'high_frequency', 'optional', 'specialized']).toContain(propConfig.tier);
        
        // Frequency must be a positive integer
        expect(typeof propConfig.frequency).toBe('number');
        expect(propConfig.frequency).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(propConfig.frequency)).toBe(true);
        
        // Validation type must be from allowed set
        expect(VALID_VALIDATION_TYPES).toContain(propConfig.validationType);
        
        // If synthetic property, should have additional metadata
        if (propConfig.synthetic) {
          expect(propConfig).toHaveProperty('description');
          expect(typeof propConfig.description).toBe('string');
        }
      });
    });
  });

  describe('Tier Distribution', () => {
    it('should have properties distributed across all tiers', () => {
      const tierCounts = {};
      Object.values(tierConfig.properties).forEach(prop => {
        tierCounts[prop.tier] = (tierCounts[prop.tier] || 0) + 1;
      });
      
      // Verify all tiers exist and have properties
      expect(tierCounts.core).toBeGreaterThan(0);
      expect(tierCounts.high_frequency).toBeGreaterThan(0);
      expect(tierCounts.optional).toBeGreaterThan(0);
      expect(tierCounts.specialized).toBeGreaterThan(0);
      
      // Core should be small (essential properties only)
      expect(tierCounts.core).toBeLessThanOrEqual(10);
      
      // Specialized should be the largest tier
      const tierValues = Object.values(tierCounts);
      const maxTier = Math.max(...tierValues);
      expect(tierCounts.specialized).toBe(maxTier);
    });

    it('should have correct total distribution matching OSM property count', () => {
      const tierCounts = {
        core: 0,
        high_frequency: 0,
        optional: 0,
        specialized: 0
      };
      
      Object.values(tierConfig.properties).forEach(propConfig => {
        tierCounts[propConfig.tier]++;
      });
      
      const total = Object.values(tierCounts).reduce((sum, count) => sum + count, 0);
      // Total includes lat/lng
      expect(total).toBe(osmPropertyCount + 2);
      
      // Verify all tiers are represented
      expect(Object.keys(tierCounts).sort()).toEqual(['core', 'high_frequency', 'optional', 'specialized']);
    });
  });

  describe('Core Properties Validation', () => {
    it('should include essential v1 properties in core tier', () => {
      const expectedCoreProperties = [
        'lat',
        'lng', 
        '@id',
        'amenity',
        'wheelchair',
        'access',
        'opening_hours',
        'fee'
      ];
      
      expectedCoreProperties.forEach(propName => {
        expect(tierConfig.properties[propName]).toBeDefined();
        expect(tierConfig.properties[propName].tier).toBe('core');
      });
    });
  });

  describe('Tier Definitions', () => {
    it('should have proper tier metadata', () => {
      const tiers = ['core', 'high_frequency', 'optional', 'specialized'];
      
      tiers.forEach(tierName => {
        const tier = tierConfig.tiers[tierName];
        
        // Required metadata fields
        expect(tier).toHaveProperty('description');
        expect(tier).toHaveProperty('ui_behavior');
        expect(tier).toHaveProperty('validation_requirement');
        
        // Validate string fields are non-empty
        expect(tier.description.length).toBeGreaterThan(0);
        expect(tier.ui_behavior.length).toBeGreaterThan(0);
        expect(tier.validation_requirement.length).toBeGreaterThan(0);
      });
    });
    
    it('should have tier-specific validation strictness', () => {
      // Core tier should have strict validation
      expect(tierConfig.tiers.core).toHaveProperty('strict_validation', true);
      expect(tierConfig.tiers.core).toHaveProperty('required', true);
      
      // High frequency should have moderate strictness
      expect(tierConfig.tiers.high_frequency).toHaveProperty('strict_validation', true);
      expect(tierConfig.tiers.high_frequency).toHaveProperty('required', false);
      
      // Optional and specialized should be flexible
      expect(tierConfig.tiers.optional).toHaveProperty('strict_validation', false);
      expect(tierConfig.tiers.specialized).toHaveProperty('strict_validation', false);
    });
  });
});