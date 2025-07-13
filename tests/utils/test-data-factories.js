/**
 * @fileoverview Test Data Factories and Management for MapView Testing
 * Provides clean, maintainable test data generation with proper TypeScript support
 */

import { getToiletData, createDataSubset } from './performance-helpers';

/**
 * Test data factory configuration
 * Centralizes all test data generation parameters
 */
const TEST_DATA_CONFIG = {
  defaultCoordinates: [-0.1278, 51.5074], // London center
  boundingBox: {
    north: 51.6,
    south: 51.4,
    east: 0.1,
    west: -0.3
  },
  sampleSizes: {
    tiny: 3,
    small: 10,
    medium: 50,
    large: 200
  },
  commonHours: ['24/7', 'Dawn to Dusk', '6:00-22:00', '8:00-18:00'],
  commonNames: [
    'Public Toilets',
    'WC',
    'Restroom',
    'Public Convenience',
    'Toilet Block'
  ]
};

/**
 * Generate realistic coordinates within London bounds
 * @param {object} center - Center coordinates {lat, lng}
 * @param {number} radius - Radius in degrees (approximately)
 * @returns {Array} [lng, lat] coordinates in GeoJSON format
 */
const generateRealisticCoordinates = (center = null, radius = 0.01) => {
  const baseCenter = center || {
    lat: TEST_DATA_CONFIG.defaultCoordinates[1],
    lng: TEST_DATA_CONFIG.defaultCoordinates[0]
  };
  
  // Generate random offset within radius
  const offsetLat = (Math.random() - 0.5) * 2 * radius;
  const offsetLng = (Math.random() - 0.5) * 2 * radius;
  
  const lat = baseCenter.lat + offsetLat;
  const lng = baseCenter.lng + offsetLng;
  
  // Ensure coordinates are within London bounds
  const boundedLat = Math.max(
    TEST_DATA_CONFIG.boundingBox.south,
    Math.min(TEST_DATA_CONFIG.boundingBox.north, lat)
  );
  const boundedLng = Math.max(
    TEST_DATA_CONFIG.boundingBox.west,
    Math.min(TEST_DATA_CONFIG.boundingBox.east, lng)
  );
  
  return [boundedLng, boundedLat]; // GeoJSON format: [lng, lat]
};

/**
 * Generate realistic toilet properties
 * @param {object} overrides - Property overrides
 * @returns {object} Toilet properties object
 */
const generateToiletProperties = (overrides = {}) => {
  const baseProperties = {
    id: `test-toilet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: TEST_DATA_CONFIG.commonNames[Math.floor(Math.random() * TEST_DATA_CONFIG.commonNames.length)],
    hours: TEST_DATA_CONFIG.commonHours[Math.floor(Math.random() * TEST_DATA_CONFIG.commonHours.length)],
    accessible: Math.random() > 0.5,
    fee: Math.random() > 0.8 ? parseFloat((Math.random() * 0.5).toFixed(2)) : 0,
    source: 'test',
    last_verified_at: new Date().toISOString(),
    verified_by: 'test-factory'
  };
  
  return { ...baseProperties, ...overrides };
};

/**
 * Create a single toilet feature with realistic data
 * @param {object} options - Generation options
 * @returns {object} ToiletFeature object
 */
const createToiletFeature = (options = {}) => {
  const {
    coordinates = null,
    properties = {},
    center = null,
    radius = 0.01
  } = options;
  
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: coordinates || generateRealisticCoordinates(center, radius)
    },
    properties: generateToiletProperties(properties)
  };
};

/**
 * Create multiple toilet features with consistent properties
 * @param {number} count - Number of features to create
 * @param {object} options - Generation options
 * @returns {Array} Array of ToiletFeature objects
 */
const createToiletFeatures = (count, options = {}) => {
  const features = [];
  const {
    center = null,
    radius = 0.01,
    properties = {},
    distribution = 'random'
  } = options;
  
  for (let i = 0; i < count; i++) {
    let featureOptions = { center, radius, properties };
    
    // Apply distribution patterns
    if (distribution === 'cluster') {
      // Cluster around center with smaller radius
      featureOptions.radius = radius * 0.3;
    } else if (distribution === 'grid') {
      // Arrange in rough grid pattern
      const gridSize = Math.ceil(Math.sqrt(count));
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      featureOptions.center = {
        lat: (center?.lat || TEST_DATA_CONFIG.defaultCoordinates[1]) + (row - gridSize/2) * radius,
        lng: (center?.lng || TEST_DATA_CONFIG.defaultCoordinates[0]) + (col - gridSize/2) * radius
      };
      featureOptions.radius = radius * 0.1;
    }
    
    // Add unique properties for each feature
    const uniqueProperties = {
      ...properties,
      id: `${properties.id || 'test-toilet'}-${i}`,
      name: `${properties.name || 'Test Toilet'} ${i + 1}`
    };
    
    features.push(createToiletFeature({
      ...featureOptions,
      properties: uniqueProperties
    }));
  }
  
  return features;
};

/**
 * Mock callback function generators for consistent testing
 */
const MockCallbacks = {
  /**
   * Create a mock function with predefined behavior
   * @param {string} type - Type of callback
   * @param {object} options - Mock options
   * @returns {Function} Mock function
   */
  create: (type, options = {}) => {
    const mockFn = jest.fn();
    
    switch (type) {
      case 'onMarkerClick':
        mockFn.mockImplementation((toilet) => {
          console.log(`Mock marker click: ${toilet.properties?.id}`);
        });
        break;
        
      case 'onDirections':
        mockFn.mockImplementation((toilet) => {
          console.log(`Mock directions request: ${toilet.name}`);
        });
        break;
        
      case 'onReport':
        mockFn.mockImplementation((toiletId) => {
          console.log(`Mock report: ${toiletId}`);
        });
        break;
        
      case 'onSearch':
        mockFn.mockImplementation((query) => {
          console.log(`Mock search: ${query}`);
        });
        break;
        
      case 'async':
        mockFn.mockImplementation(async (...args) => {
          await new Promise(resolve => setTimeout(resolve, options.delay || 10));
          return options.returnValue || 'mock-result';
        });
        break;
        
      default:
        mockFn.mockImplementation(() => {
          console.log(`Mock ${type} called`);
        });
    }
    
    return mockFn;
  },
  
  /**
   * Create a set of common callback mocks for MapView testing
   * @returns {object} Object containing common mock callbacks
   */
  createMapViewMocks: () => ({
    onMarkerClick: MockCallbacks.create('onMarkerClick'),
    onDirections: MockCallbacks.create('onDirections'),
    onReport: MockCallbacks.create('onReport'),
    onShare: MockCallbacks.create('onShare'),
    onSearch: MockCallbacks.create('onSearch'),
    onLocationRequest: MockCallbacks.create('onLocationRequest'),
    onPopupClose: MockCallbacks.create('onPopupClose'),
    onCenterChange: MockCallbacks.create('onCenterChange'),
    onZoomChange: MockCallbacks.create('onZoomChange'),
    onLocationFound: MockCallbacks.create('onLocationFound')
  })
};

/**
 * Predefined test scenarios for common testing patterns
 */
const TestScenarios = {
  /**
   * Empty map scenario
   */
  empty: () => ({
    toilets: [],
    mocks: MockCallbacks.createMapViewMocks(),
    description: 'Empty map with no toilets'
  }),
  
  /**
   * Single toilet scenario
   */
  single: (options = {}) => ({
    toilets: [createToiletFeature(options)],
    mocks: MockCallbacks.createMapViewMocks(),
    description: 'Map with single toilet marker'
  }),
  
  /**
   * Small cluster scenario
   */
  smallCluster: (options = {}) => ({
    toilets: createToiletFeatures(TEST_DATA_CONFIG.sampleSizes.tiny, {
      distribution: 'cluster',
      ...options
    }),
    mocks: MockCallbacks.createMapViewMocks(),
    description: 'Map with small cluster of toilets'
  }),
  
  /**
   * Performance testing scenario
   */
  performance: (size = 'medium', options = {}) => ({
    toilets: createToiletFeatures(TEST_DATA_CONFIG.sampleSizes[size] || 50, options),
    mocks: MockCallbacks.createMapViewMocks(),
    description: `Performance test with ${size} dataset`
  }),
  
  /**
   * Accessibility focused scenario
   */
  accessibility: (options = {}) => ({
    toilets: createToiletFeatures(10, {
      properties: { accessible: true, ...options.properties },
      ...options
    }),
    mocks: MockCallbacks.createMapViewMocks(),
    description: 'Map with accessible toilets only'
  }),
  
  /**
   * 24/7 facilities scenario
   */
  alwaysOpen: (options = {}) => ({
    toilets: createToiletFeatures(8, {
      properties: { hours: '24/7', ...options.properties },
      ...options
    }),
    mocks: MockCallbacks.createMapViewMocks(),
    description: 'Map with 24/7 toilet facilities'
  }),
  
  /**
   * Real data scenario using cached toilet data
   */
  realData: async (subset = 'small') => {
    const toiletData = await getToiletData();
    const features = createDataSubset(toiletData, subset);
    
    return {
      toilets: features,
      mocks: MockCallbacks.createMapViewMocks(),
      description: `Map with real toilet data (${subset} subset)`
    };
  }
};

/**
 * Data validation utilities for test assertions
 */
const DataValidators = {
  /**
   * Validate toilet feature structure
   * @param {object} feature - Toilet feature to validate
   * @returns {boolean} True if valid
   */
  isValidToiletFeature: (feature) => {
    return (
      feature &&
      feature.type === 'Feature' &&
      feature.geometry &&
      feature.geometry.type === 'Point' &&
      Array.isArray(feature.geometry.coordinates) &&
      feature.geometry.coordinates.length === 2 &&
      feature.properties &&
      typeof feature.properties.id === 'string' &&
      typeof feature.properties.name === 'string' &&
      typeof feature.properties.hours === 'string' &&
      typeof feature.properties.accessible === 'boolean' &&
      typeof feature.properties.fee === 'number'
    );
  },
  
  /**
   * Validate array of toilet features
   * @param {Array} features - Array of features to validate
   * @returns {object} Validation result
   */
  validateToiletFeatures: (features) => {
    if (!Array.isArray(features)) {
      return { valid: false, error: 'Features must be an array' };
    }
    
    const invalidFeatures = features.filter(f => !DataValidators.isValidToiletFeature(f));
    
    return {
      valid: invalidFeatures.length === 0,
      count: features.length,
      invalidCount: invalidFeatures.length,
      invalidFeatures: invalidFeatures.slice(0, 5), // First 5 invalid features
      error: invalidFeatures.length > 0 ? `${invalidFeatures.length} invalid features found` : null
    };
  }
};

export {
  TEST_DATA_CONFIG,
  createToiletFeature,
  createToiletFeatures,
  MockCallbacks,
  TestScenarios,
  DataValidators,
  generateRealisticCoordinates,
  generateToiletProperties
};