/**
 * @fileoverview Enhanced Test Utilities Index
 * Centralized exports for all enhanced testing utilities with comprehensive documentation
 */

// Performance and caching utilities
export {
  TestDataCache,
  TestPerformanceMonitor,
  TestMemoryManager,
  testDataCache,
  performanceMonitor,
  memoryManager,
  getToiletData,
  createDataSubset
} from './performance-helpers';

// Canvas and DOM mocking utilities
export {
  OptimizedCanvasRenderingContext2D,
  OptimizedHTMLCanvasElement,
  OptimizedImage,
  installOptimizedCanvasMocks
} from './canvas-mock';

// React-Leaflet testing utilities
export {
  LEAFLET_CONFIG,
  LeafletUtils,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  MarkerClusterGroup,
  Leaflet
} from './react-leaflet-utils';

// Test data factories and scenarios
export {
  TEST_DATA_CONFIG,
  createToiletFeature,
  createToiletFeatures,
  MockCallbacks,
  TestScenarios,
  DataValidators,
  generateRealisticCoordinates,
  generateToiletProperties
} from './test-data-factories';

/**
 * Quick setup utilities for common testing scenarios
 * Provides one-line setup for typical MapView testing needs
 */
export const QuickSetup = {
  /**
   * Setup for basic MapView component testing
   * @param {object} options - Setup options
   * @returns {object} Test setup with toilets and mocks
   */
  basicMapView: async (options = {}) => {
    const { TestScenarios } = await import('./test-data-factories');
    return await TestScenarios.single(options);
  },

  /**
   * Setup for performance testing with large datasets
   * @param {string} size - Dataset size ('small', 'medium', 'large')
   * @returns {object} Performance test setup
   */
  performanceTest: async (size = 'medium') => {
    const { TestScenarios } = await import('./test-data-factories');
    return TestScenarios.performance(size);
  },

  /**
   * Setup for real data integration testing
   * @param {string} subset - Data subset type
   * @returns {object} Real data test setup
   */
  realDataTest: async (subset = 'small') => {
    const { TestScenarios } = await import('./test-data-factories');
    return await TestScenarios.realData(subset);
  },

  /**
   * Setup enhanced environment with all optimizations
   * @returns {object} Environment setup result
   */
  enhancedEnvironment: () => {
    const { installOptimizedCanvasMocks } = require('./canvas-mock');
    const { performanceMonitor } = require('./performance-helpers');
    
    performanceMonitor.start('environment-setup');
    installOptimizedCanvasMocks();
    performanceMonitor.end('environment-setup');
    
    return {
      setupTime: performanceMonitor.getStats('environment-setup'),
      canvasSupport: true,
      performanceMonitoring: true
    };
  }
};

/**
 * Testing best practices and utilities
 */
export const TestingBestPractices = {
  /**
   * Recommended test structure for MapView components
   */
  testStructure: {
    describe: 'MapView Component Testing Structure',
    sections: [
      'Basic Rendering - Test component mounts and renders correctly',
      'Data Loading - Test with empty, small, and large datasets',
      'User Interactions - Test marker clicks, popup interactions',
      'Performance - Test rendering time and memory usage',
      'Accessibility - Test keyboard navigation and screen reader support',
      'Responsive Design - Test mobile and desktop layouts',
      'Error Handling - Test error states and loading states'
    ]
  },

  /**
   * Performance testing guidelines
   */
  performanceGuidelines: {
    renderTime: {
      excellent: '< 100ms',
      good: '< 500ms',
      acceptable: '< 1000ms',
      poor: '> 1000ms'
    },
    memoryUsage: {
      small: '< 10MB',
      medium: '< 50MB',
      large: '< 100MB',
      excessive: '> 100MB'
    },
    testDataSizes: {
      unit: '< 10 items',
      integration: '10-100 items',
      performance: '100-1000 items',
      stress: '> 1000 items'
    }
  },

  /**
   * Common testing patterns and anti-patterns
   */
  patterns: {
    good: [
      'Use realistic test data that matches production data structure',
      'Test user workflows end-to-end rather than isolated functions',
      'Include performance assertions for rendering and interactions',
      'Test both success and error scenarios',
      'Use proper cleanup to prevent memory leaks between tests'
    ],
    avoid: [
      'Over-mocking that hides real integration issues',
      'Testing implementation details instead of user behavior',
      'Ignoring performance implications of test setup',
      'Using unrealistic test data that doesnt match production',
      'Skipping accessibility and responsive design testing'
    ]
  }
};

/**
 * Utility function to validate test environment setup
 * @returns {object} Environment validation result
 */
export const validateTestEnvironment = () => {
  const validation = {
    canvasSupport: !!global.HTMLCanvasElement,
    imageSupport: !!global.Image,
    performanceAPI: !!global.performance,
    testingLibrary: false,
    reactLeaflet: false,
    jest: !!global.jest
  };

  try {
    require('@testing-library/react');
    validation.testingLibrary = true;
  } catch (e) {
    // Testing library not available
  }

  try {
    require('react-leaflet');
    validation.reactLeaflet = true;
  } catch (e) {
    // React-Leaflet not available (expected in test environment)
  }

  const allCritical = validation.canvasSupport && 
                     validation.imageSupport && 
                     validation.performanceAPI && 
                     validation.jest;

  return {
    ...validation,
    ready: allCritical,
    recommendations: allCritical ? [] : [
      !validation.canvasSupport && 'Install canvas support for map rendering',
      !validation.imageSupport && 'Install image support for marker icons',
      !validation.performanceAPI && 'Install performance API for monitoring',
      !validation.jest && 'Jest testing framework required'
    ].filter(Boolean)
  };
};

/**
 * Documentation and usage examples
 */
export const Documentation = {
  quickStart: `
    // Quick start example for MapView testing
    import { QuickSetup, TestScenarios } from '@/tests/utils';

    describe('MapView Component', () => {
      it('renders with toilet data', async () => {
        const { toilets, mocks } = await QuickSetup.basicMapView();
        render(<MapView toilets={toilets} {...mocks} />);
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });
    });
  `,

  performanceTesting: `
    // Performance testing example
    import { QuickSetup, performanceMonitor } from '@/tests/utils';

    it('renders large dataset within performance threshold', async () => {
      const { toilets, mocks } = await QuickSetup.performanceTest('large');
      
      performanceMonitor.start('render-time');
      render(<MapView toilets={toilets} {...mocks} />);
      const renderTime = performanceMonitor.end('render-time');
      
      expect(renderTime).toBeLessThan(1000); // 1 second threshold
    });
  `,

  realDataIntegration: `
    // Real data integration testing
    import { QuickSetup, DataValidators } from '@/tests/utils';

    it('works with real toilet data', async () => {
      const { toilets, mocks } = await QuickSetup.realDataTest('medium');
      
      // Validate data structure
      const validation = DataValidators.validateToiletFeatures(toilets);
      expect(validation.valid).toBe(true);
      
      render(<MapView toilets={toilets} {...mocks} />);
      expect(screen.getAllByTestId('marker')).toHaveLength(toilets.length);
    });
  `
};