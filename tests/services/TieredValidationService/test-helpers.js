/**
 * Test Helpers for TieredValidationService
 * 
 * Shared mock configurations and utilities
 */

/**
 * Create a valid mock tier configuration that matches the schema
 */
function createMockTierConfig(overrides = {}) {
  const baseConfig = {
    version: '1.0.0',
    generated_at: '2025-07-06T21:44:19.341Z',
    source: 'data/osm_properties_analysis.json',
    tiers: {
      core: {
        description: 'Essential properties that directly impact user decisions',
        ui_behavior: 'Always visible',
        validation_requirement: 'Required, strict validation',
        strict_validation: true,
        required: true
      },
      high_frequency: {
        description: 'Common properties that enhance user experience',
        ui_behavior: 'Visible by default in v2',
        validation_requirement: 'Strict validation when provided',
        strict_validation: true,
        required: false
      },
      optional: {
        description: 'Advanced properties for power users',
        ui_behavior: 'Hidden behind advanced toggle',
        validation_requirement: 'Validated if provided',
        strict_validation: false,
        required: false
      },
      specialized: {
        description: 'Edge case properties for data completeness',
        ui_behavior: 'Not shown in UI',
        validation_requirement: 'Basic type checking only',
        strict_validation: false,
        required: false
      }
    },
    properties: {
      // Core properties
      lat: { 
        tier: 'core', 
        frequency: 1042,
        validationType: 'number', 
        synthetic: true,
        description: 'Latitude coordinate (not an OSM property)'
      },
      lng: { 
        tier: 'core', 
        frequency: 1042,
        validationType: 'number', 
        synthetic: true,
        description: 'Longitude coordinate (not an OSM property)'
      },
      '@id': { 
        tier: 'core', 
        frequency: 1042, 
        validationType: 'string' 
      },
      amenity: { 
        tier: 'core', 
        frequency: 1042, 
        validationType: 'enum' 
      },
      wheelchair: { 
        tier: 'core', 
        frequency: 800, 
        validationType: 'enum' 
      },
      access: { 
        tier: 'core', 
        frequency: 700, 
        validationType: 'enum' 
      },
      opening_hours: { 
        tier: 'core', 
        frequency: 600, 
        validationType: 'string' 
      },
      fee: { 
        tier: 'core', 
        frequency: 500, 
        validationType: 'boolean' 
      },
      // High-frequency properties
      male: { 
        tier: 'high_frequency', 
        frequency: 300, 
        validationType: 'boolean' 
      },
      female: { 
        tier: 'high_frequency', 
        frequency: 300, 
        validationType: 'boolean' 
      },
      unisex: { 
        tier: 'high_frequency', 
        frequency: 200, 
        validationType: 'boolean' 
      },
      changing_table: { 
        tier: 'high_frequency', 
        frequency: 150, 
        validationType: 'boolean' 
      },
      'payment:contactless': { 
        tier: 'high_frequency', 
        frequency: 100, 
        validationType: 'boolean' 
      },
      name: { 
        tier: 'high_frequency', 
        frequency: 250, 
        validationType: 'string' 
      },
      // Optional properties
      operator: { 
        tier: 'optional', 
        frequency: 50, 
        validationType: 'string' 
      },
      source: { 
        tier: 'optional', 
        frequency: 40, 
        validationType: 'string' 
      },
      // Specialized properties
      'addr:street': { 
        tier: 'specialized', 
        frequency: 10, 
        validationType: 'string' 
      },
      'survey:date': { 
        tier: 'specialized', 
        frequency: 5, 
        validationType: 'string' 
      },
      'wikidata': { 
        tier: 'specialized', 
        frequency: 3, 
        validationType: 'string' 
      },
      // v1 API compatibility fields (specialized tier)
      'accessible': {
        tier: 'specialized',
        frequency: 100,
        validationType: 'boolean'
      },
      'hours': {
        tier: 'specialized', 
        frequency: 100,
        validationType: 'string'
      },
      'charge': {
        tier: 'specialized',
        frequency: 50,
        validationType: 'string'
      },
      'payment_contactless': {
        tier: 'specialized',
        frequency: 50,
        validationType: 'boolean'
      }
    }
  };

  // Deep merge overrides
  return deepMerge(baseConfig, overrides);
}

/**
 * Deep merge helper
 */
function deepMerge(target, source) {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

module.exports = {
  createMockTierConfig
};