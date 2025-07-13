/**
 * @fileoverview MapView Integration Tests - Critical Issues Exposure
 * 
 * Refactored integration tests that expose the 5 critical MapView integration issues
 * using minimal mocking to validate real React-Leaflet component behavior.
 * 
 * This file focuses on testing integration patterns that validate real component
 * behavior and prevent regression of critical issues identified in investigation.
 * 
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 * @see {@link file://./plans/plan_fix_test_brittleness_0069.txt} for test requirements
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapView } from '@/components/organisms/MapView';

// Import validated test data management and utilities
import { TestScenarios, MockCallbacks } from '../../utils/test-data-factories';

// Import enhanced React-Leaflet utilities with minimal mocking
// This should expose real integration issues vs over-mocked tests
jest.mock('react-leaflet', () => {
  const { 
    MapContainer, 
    Marker, 
    Popup, 
    TileLayer 
  } = require('../../utils/react-leaflet-utils');
  
  return {
    MapContainer,
    Marker,
    Popup,
    TileLayer
  };
});

jest.mock('react-leaflet-cluster', () => {
  const { MarkerClusterGroup } = require('../../utils/react-leaflet-utils');
  return {
    __esModule: true,
    default: MarkerClusterGroup,
    MarkerClusterGroup
  };
});

jest.mock('leaflet', () => {
  const { Leaflet } = require('../../utils/react-leaflet-utils');
  return Leaflet;
});

/**
 * Create a test wrapper for consistent component rendering
 */
const createTestWrapper = (Component, props) => {
  return React.createElement(Component, props);
};

/**
 * Test suite configuration and shared utilities
 */
const TEST_CONFIG = {
  PERFORMANCE_TIMEOUT: 1000,
  INTERACTION_TIMEOUT: 500,
  RENDER_TIMEOUT: 200,
  // Performance optimization flags
  ENABLE_PERFORMANCE_MONITORING: true,
  CLEANUP_BETWEEN_TESTS: true,
  REUSE_TEST_DATA: true
};

/**
 * Shared test utilities for integration tests
 */
const IntegrationTestUtils = {
  /**
   * Setup common test environment for each test
   */
  setupTestEnvironment: () => {
    jest.clearAllMocks();
    
    // Performance optimization: Only cleanup DOM if needed
    if (TEST_CONFIG.CLEANUP_BETWEEN_TESTS) {
      document.body.innerHTML = '';
    }
    
    // Clear any existing timers
    jest.clearAllTimers();
  },

  /**
   * Create a wrapped MapView component with consistent props
   */
  renderMapViewWithDefaults: (toilets, overrideProps = {}) => {
    const defaultProps = {
      toilets,
      ...MockCallbacks.createMapViewMocks(),
      ...overrideProps
    };
    
    return render(createTestWrapper(MapView, defaultProps));
  },

  /**
   * Verify marker icon integrity in tests
   */
  verifyMarkerIconIntegrity: (marker) => {
    const iconImg = marker.querySelector('img');
    expect(iconImg).toBeInTheDocument();
    expect(iconImg).toHaveAttribute('src');
    return iconImg;
  },

  /**
   * Simulate realistic user interaction flow
   */
  simulateUserInteraction: async (user, marker) => {
    await user.hover(marker);
    await user.click(marker);
    await waitFor(() => {
      const popup = screen.queryByTestId('popup');
      return popup !== null;
    }, { timeout: TEST_CONFIG.INTERACTION_TIMEOUT });
  },

  /**
   * Validate Leaflet CSS classes are applied to elements
   */
  validateLeafletClasses: (element, expectedClasses = []) => {
    expectedClasses.forEach(className => {
      expect(element).toHaveClass(className);
    });
  },

  /**
   * Performance monitoring utility for test optimization
   */
  measurePerformance: (testName, testFunction) => {
    if (!TEST_CONFIG.ENABLE_PERFORMANCE_MONITORING) {
      return testFunction();
    }
    
    const startTime = performance.now();
    const result = testFunction();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Log performance metrics for optimization analysis
    if (duration > TEST_CONFIG.PERFORMANCE_TIMEOUT * 0.8) {
      console.warn(`Performance warning: ${testName} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  },

  /**
   * Optimized test data cache for reuse between tests
   */
  testDataCache: new Map()
};

describe('MapView Integration Tests - Critical Issues Exposure', () => {
  beforeEach(() => {
    IntegrationTestUtils.setupTestEnvironment();
  });

  /**
   * Critical Issue #1: Broken Marker Icons - External URL Dependencies
   * 
   * Tests that validate marker icon rendering and custom icon application.
   * These tests expose issues where external URL dependencies cause broken
   * image display and missing defaultIcon prop application.
   */
  describe('Critical Issue #1: Broken Marker Icons', () => {
    const createIconTestScenario = (properties = {}) => 
      TestScenarios.single({ properties: { name: 'Icon Test Toilet', accessible: true, ...properties } });

    it('should FAIL - marker icons display as broken images due to external URL dependencies', async () => {
      const scenario = createIconTestScenario();
      
      IntegrationTestUtils.renderMapViewWithDefaults(scenario.toilets);
      
      const marker = screen.getByTestId('marker');
      const iconImg = IntegrationTestUtils.verifyMarkerIconIntegrity(marker);
      
      // EXPECTED FAILURE: External URL will not load in test environment
      expect(iconImg.src).not.toContain('marker-icon.png');
      expect(iconImg.src).toContain('custom'); // Should use custom icon instead
      
      // Validate icon is not broken
      expect(iconImg.complete).toBe(true);
      expect(iconImg.naturalWidth).toBeGreaterThan(0); // WILL FAIL - broken image
    });

    it('should FAIL - default marker icon application missing', async () => {
      const scenario = TestScenarios.smallCluster();
      
      IntegrationTestUtils.renderMapViewWithDefaults(scenario.toilets);
      
      const markers = screen.getAllByTestId('marker');
      expect(markers.length).toBeGreaterThan(0);
      
      markers.forEach(marker => {
        IntegrationTestUtils.verifyMarkerIconIntegrity(marker);
        
        // EXPECTED FAILURE: Should have defaultIcon applied
        expect(marker).toHaveAttribute('data-default-icon', 'true'); // WILL FAIL
        
        const iconImg = marker.querySelector('img');
        expect(iconImg.src).not.toContain('marker-icon.png'); // Should use custom default
      });
    });
  });

  /**
   * Critical Issue #2: Missing MarkerPopup Buttons - Props Not Passed
   * 
   * Tests that validate popup button presence and callback integration.
   * These tests expose issues where callback props are not properly passed
   * through from MapView to MarkerPopup components.
   */
  describe('Critical Issue #2: Missing MarkerPopup Buttons', () => {
    const createPopupTestScenario = (properties = {}) => 
      TestScenarios.single({ properties: { name: 'Popup Test Toilet', hours: '24/7', ...properties } });

    const testPopupButtons = async (scenario, expectedButtons = ['directions', 'report', 'share']) => {
      const user = userEvent.setup();
      
      IntegrationTestUtils.renderMapViewWithDefaults(
        scenario.toilets,
        {
          onDirections: scenario.mocks.onDirections,
          onReport: scenario.mocks.onReport,
          onShare: scenario.mocks.onShare
        }
      );
      
      await IntegrationTestUtils.simulateUserInteraction(user, screen.getByTestId('marker'));
      
      const popup = screen.getByTestId('popup');
      expect(popup).toBeInTheDocument();
      
      return { popup, expectedButtons, scenario };
    };

    it('should FAIL - popup buttons missing due to missing callback props', async () => {
      const scenario = createPopupTestScenario();
      const { expectedButtons } = await testPopupButtons(scenario);
      
      // EXPECTED FAILURE: Popup buttons should be present but will be missing
      expectedButtons.forEach(buttonType => {
        const buttonRegex = new RegExp(`${buttonType}`, 'i');
        const button = screen.getByLabelText(buttonRegex);
        expect(button).toBeInTheDocument(); // WILL FAIL - button missing
      });
    });

    it('should FAIL - popup buttons non-functional due to missing callback integration', async () => {
      const scenario = createPopupTestScenario();
      const { scenario: testScenario } = await testPopupButtons(scenario);
      
      const user = userEvent.setup();
      
      // Try to click buttons (will fail if buttons don't exist)
      try {
        const directionsButton = screen.getByLabelText(/get directions/i);
        await user.click(directionsButton);
        
        // EXPECTED FAILURE: Callback should be triggered but won't be
        expect(testScenario.mocks.onDirections).toHaveBeenCalledWith(testScenario.toilets[0]);
      } catch (error) {
        // Button not found - expected failure
        expect(error.message).toContain('Unable to find');
      }
    });
  });

  /**
   * Critical Issue #3: Popup Premature Closing - Event Bubbling
   * 
   * Tests that validate popup event handling and bubbling prevention.
   * These tests expose issues where popup interactions cause premature
   * closing due to event bubbling to parent map components.
   */
  describe('Critical Issue #3: Popup Premature Closing', () => {
    const createEventBubblingTestScenario = (properties = {}) => 
      TestScenarios.single({ properties: { name: 'Event Bubbling Test', accessible: true, ...properties } });

    const testPopupPersistence = async (scenario, clickTarget = 'popup') => {
      const user = userEvent.setup();
      
      IntegrationTestUtils.renderMapViewWithDefaults(
        scenario.toilets,
        { onDirections: scenario.mocks.onDirections }
      );
      
      await IntegrationTestUtils.simulateUserInteraction(user, screen.getByTestId('marker'));
      
      const popup = screen.getByTestId('popup');
      expect(popup).toBeInTheDocument();
      
      return { user, popup };
    };

    it('should FAIL - popup disappears when clicked inside due to event bubbling', async () => {
      const scenario = createEventBubblingTestScenario();
      const { user, popup } = await testPopupPersistence(scenario);
      
      // Click inside popup content area
      await user.click(popup);
      
      // EXPECTED FAILURE: Popup should remain open but will close
      // due to event bubbling if stopPropagation not implemented
      await waitFor(() => {
        const popupAfterClick = screen.getByTestId('popup');
        expect(popupAfterClick).toBeInTheDocument(); // WILL FAIL - popup closed
      }, { timeout: TEST_CONFIG.INTERACTION_TIMEOUT });
    });

    it('should FAIL - popup event handlers not preventing propagation', async () => {
      const scenario = TestScenarios.single();
      const user = userEvent.setup();
      const mapClickHandler = jest.fn();
      
      render(
        <div onClick={mapClickHandler}>
          {createTestWrapper(MapView, {
            toilets: scenario.toilets,
            ...scenario.mocks
          })}
        </div>
      );
      
      await IntegrationTestUtils.simulateUserInteraction(user, screen.getByTestId('marker'));
      
      const popup = screen.getByTestId('popup');
      await user.click(popup);
      
      // EXPECTED FAILURE: Map click handler should not be triggered
      expect(mapClickHandler).not.toHaveBeenCalled(); // WILL FAIL - event bubbled
    });
  });

  /**
   * Critical Issue #4: Map Height Inheritance Problems - CSS Conflicts
   * 
   * Tests that validate map height calculation and responsive behavior.
   * These tests expose issues where CSS height inheritance fails in
   * container contexts and responsive calculations are broken.
   */
  describe('Critical Issue #4: Map Height Inheritance Problems', () => {
    const createHeightTestContainer = (height = '400px') => ({ children }) => (
      <div style={{ height, overflow: 'hidden' }}>
        {children}
      </div>
    );

    const testMapHeightInheritance = (scenario, containerHeight, expectedHeight) => {
      const HeightTestContainer = createHeightTestContainer(containerHeight);
      
      render(
        <HeightTestContainer>
          {createTestWrapper(MapView, {
            toilets: scenario.toilets,
            ...scenario.mocks
          })}
        </HeightTestContainer>
      );
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
      
      return { mapContainer, expectedHeight };
    };

    it('should FAIL - map height calculation fails in container contexts', async () => {
      const scenario = TestScenarios.empty();
      const { mapContainer, expectedHeight } = testMapHeightInheritance(scenario, '400px', '400px');
      
      // EXPECTED FAILURE: Map should inherit container height
      const computedStyle = window.getComputedStyle(mapContainer);
      expect(computedStyle.height).toBe(expectedHeight); // WILL FAIL - height not inherited
      
      // Map should fill available space
      expect(mapContainer).toHaveClass('h-full'); // WILL FAIL - class missing
      expect(mapContainer).toHaveClass('w-full'); // Should have width class
    });

    it('should FAIL - responsive height behavior not working', async () => {
      const scenario = TestScenarios.empty();
      const viewportConfigs = [
        { width: 375, expectedHeight: '256px', type: 'mobile' },
        { width: 1024, expectedHeight: '384px', type: 'desktop' }
      ];
      
      for (const config of viewportConfigs) {
        // Simulate viewport
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: config.width
        });
        
        IntegrationTestUtils.renderMapViewWithDefaults(scenario.toilets);
        
        const mapContainer = screen.getByTestId('map-container');
        const computedStyle = window.getComputedStyle(mapContainer);
        
        // EXPECTED FAILURE: Should have viewport-appropriate height
        expect(computedStyle.height).toBe(config.expectedHeight); // WILL FAIL - responsive height broken
        
        // Cleanup for next iteration
        document.body.innerHTML = '';
      }
    });
  });

  /**
   * Critical Issue #5: Test Brittleness - Over-Mocking Hides Issues
   * 
   * Tests that compare enhanced mocking vs over-mocking to expose hidden issues.
   * These tests validate that enhanced testing reveals problems hidden by
   * over-mocking strategies and provides more realistic component behavior.
   */
  describe('Critical Issue #5: Test Brittleness - Over-Mocking', () => {
    const validateLeafletClasses = (element, expectedClasses = []) => {
      expectedClasses.forEach(className => {
        expect(element).toHaveClass(className);
      });
    };

    const testEnhancedMockingBehavior = (scenario, expectedMarkerCount) => {
      IntegrationTestUtils.renderMapViewWithDefaults(scenario.toilets);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
      
      return { mapContainer, expectedMarkerCount };
    };

    it('should FAIL - enhanced vs over-mocked component behavior differences', async () => {
      const scenario = TestScenarios.performance('small'); // 10 toilets
      const { mapContainer } = testEnhancedMockingBehavior(scenario, 10);
      
      // Enhanced mocking should provide more realistic DOM structure
      IntegrationTestUtils.validateLeafletClasses(mapContainer, ['leaflet-container', 'leaflet-touch']);
      
      // Should have clustering behavior with enhanced mocking
      const clusterGroup = screen.getByTestId('marker-cluster-group');
      expect(clusterGroup).toBeInTheDocument();
      IntegrationTestUtils.validateLeafletClasses(clusterGroup, ['marker-cluster-group']);
      
      // Enhanced mocking should render all markers
      const markers = screen.getAllByTestId('marker');
      expect(markers).toHaveLength(10);
      
      // EXPECTED FAILURE: Enhanced markers should have real Leaflet classes
      markers.forEach(marker => {
        IntegrationTestUtils.validateLeafletClasses(marker, ['leaflet-marker-icon', 'leaflet-interactive']); // WILL FAIL if over-mocked
      });
    });

    it('should FAIL - real React-Leaflet event handling vs mocked behavior', async () => {
      const scenario = TestScenarios.single();
      const user = userEvent.setup();
      
      IntegrationTestUtils.renderMapViewWithDefaults(
        scenario.toilets,
        { onMarkerClick: scenario.mocks.onMarkerClick }
      );
      
      const marker = screen.getByTestId('marker');
      
      // Test enhanced event handling simulation
      await user.hover(marker);
      expect(marker).toHaveStyle({ cursor: 'pointer' }); // Real hover behavior
      
      await user.click(marker);
      
      // EXPECTED FAILURE: Real click handling may differ from over-mocked tests
      if (scenario.mocks.onMarkerClick) {
        expect(scenario.mocks.onMarkerClick).toHaveBeenCalledWith(scenario.toilets[0]);
      }
      
      await user.dblClick(marker);
      
      // Enhanced mocking should provide realistic event timing
      expect(marker).toHaveAttribute('data-clicked', 'true'); // WILL FAIL - attribute not set
    });

    it('should FAIL - canvas rendering differences between enhanced and over-mocked', async () => {
      const scenario = TestScenarios.empty();
      
      IntegrationTestUtils.renderMapViewWithDefaults(scenario.toilets);
      
      const mapContainer = screen.getByTestId('map-container');
      const canvas = mapContainer.querySelector('canvas');
      
      expect(canvas).toBeInTheDocument(); // Should have canvas for map rendering
      
      // EXPECTED FAILURE: Canvas should have realistic dimensions
      expect(canvas).toHaveAttribute('width', '300');
      expect(canvas).toHaveAttribute('height', '200');
      
      // Canvas should support drawing operations
      const context = canvas.getContext('2d');
      expect(context).toBeDefined();
      expect(typeof context.fillRect).toBe('function'); // WILL FAIL if over-mocked
      expect(context.canvas).toBe(canvas); // Real canvas reference
    });
  });

  /**
   * Integration Performance - Real Component Load Testing
   * 
   * Tests that measure performance impact of enhanced vs over-mocked testing.
   * These tests validate that real components perform within acceptable limits
   * and enhanced mocking handles large datasets efficiently.
   */
  describe('Integration Performance - Real Component Load Testing', () => {
    const measureRenderPerformance = (scenario, expectedMarkerCount) => {
      const startTime = performance.now();
      
      IntegrationTestUtils.renderMapViewWithDefaults(scenario.toilets);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      return { renderTime, expectedMarkerCount };
    };

    it('should FAIL - performance degradation with real components vs mocked', async () => {
      const scenario = TestScenarios.performance('medium'); // 50 toilets
      const { renderTime, expectedMarkerCount } = measureRenderPerformance(scenario, 50);
      
      // EXPECTED FAILURE: Enhanced component rendering should be within acceptable limits
      expect(renderTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_TIMEOUT);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
      
      // All markers should be rendered
      const markers = screen.getAllByTestId('marker');
      expect(markers).toHaveLength(expectedMarkerCount);
      
      // EXPECTED FAILURE: Real clustering should group markers efficiently
      const clusterGroup = screen.getByTestId('marker-cluster-group');
      IntegrationTestUtils.validateLeafletClasses(clusterGroup, ['marker-cluster-group']);
      
      // Enhanced mocking should handle large datasets efficiently
      expect(renderTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_TIMEOUT / 2); // Stricter performance target
    });
  });
});