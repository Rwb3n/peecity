/**
 * Enhanced Jest setup for React-Leaflet integration testing
 * Optimized for performance, maintainability, and reliability
 */

import '@testing-library/jest-dom';

// Import optimized utilities
const { installOptimizedCanvasMocks } = require('./tests/utils/canvas-mock');
const { performanceMonitor, memoryManager } = require('./tests/utils/performance-helpers');

// Start setup performance monitoring
performanceMonitor.start('jest-setup');

// Add Jest globals for component tests
global.jest = jest;

// Add TextEncoder/TextDecoder polyfills for nock
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Set test environment
process.env.NODE_ENV = 'test';

// JSDOM polyfills for browser APIs
require('whatwg-fetch');           // installs window.fetch, Request, Response, Headers
require('web-streams-polyfill');   // ReadableStream / WritableStream
global.MessagePort = require('worker_threads').MessagePort;

// Install optimized canvas mocking system
installOptimizedCanvasMocks();

// Enhanced CSS and Animation Support
const setupEnhancedCSS = () => {
  const originalGetComputedStyle = window.getComputedStyle;
  
  /**
   * Enhanced getComputedStyle mock with performance optimizations
   * @param {Element} element - DOM element
   * @returns {CSSStyleDeclaration} Enhanced computed style
   */
  window.getComputedStyle = function(element) {
    const computedStyle = originalGetComputedStyle(element);
    
    // Optimized height calculation for MapView components
    const getMapHeight = () => {
      if (element.className?.includes('map-container-height')) {
        // Check for mobile vs desktop responsive height
        const isSmallScreen = window.innerWidth <= 640;
        return isSmallScreen ? '256px' : '384px';
      }
      return '44px'; // Default fallback
    };
    
    // Pre-computed style values for performance
    const enhancedStyle = {
      ...computedStyle,
      height: getMapHeight(),
      width: element.className?.includes('w-full') ? '100%' : '44px',
      paddingTop: '8px',
      paddingBottom: '8px',
      paddingLeft: '16px',
      paddingRight: '16px',
      fontSize: '14px',
      borderTopWidth: '1px',
      borderBottomWidth: '1px',
      borderLeftWidth: '1px',
      borderRightWidth: '1px',
      transform: element.className?.includes('scale-') ? 'scale(1.1)' : 'none',
      transition: element.className?.includes('transition-') ? 'all 0.2s ease' : 'none'
    };
    
    // Optimized property value function with caching
    enhancedStyle.getPropertyValue = (prop) => {
      if (enhancedStyle.hasOwnProperty(prop)) {
        return enhancedStyle[prop];
      }
      return computedStyle.getPropertyValue ? computedStyle.getPropertyValue(prop) : '';
    };
    
    return enhancedStyle;
  };
};

// Setup responsive window properties
const setupResponsiveWindow = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
  });
};

// Setup enhanced performance object
const setupPerformanceAPI = () => {
  if (typeof global.performance === 'undefined') {
    global.performance = {
      now: () => Date.now(),
      mark: () => {},
      measure: () => {},
      getEntriesByName: () => [],
      getEntriesByType: () => [],
      clearMarks: () => {},
      clearMeasures: () => {},
    };
  }
};

// Execute CSS and window setup
setupEnhancedCSS();
setupResponsiveWindow();
setupPerformanceAPI();

// Polyfill Response.json for Jest environment
if (!global.Response.json) {
  global.Response.json = function(object, init) {
    return new Response(JSON.stringify(object), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...((init && init.headers) || {})
      }
    });
  };
}

// Add NextResponse polyfill for test environment
if (!global.NextResponse) {
  global.NextResponse = {
    json: function(object, init) {
      const body = JSON.stringify(object);
      const statusCode = (init && init.status) || 200;
      const headers = new Headers({
        'content-type': 'application/json',
        ...((init && init.headers) || {})
      });
      
      return {
        status: statusCode,
        headers,
        text: async () => body,
        json: async () => object,
        ok: statusCode >= 200 && statusCode < 300,
        statusText: getStatusText(statusCode)
      };
    }
  };
}

// Helper function for status text
function getStatusText(status) {
  const statusTexts = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized', 
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    429: 'Too Many Requests',
    500: 'Internal Server Error'
  };
  return statusTexts[status] || 'Unknown';
}

// Mock ResizeObserver for React-Leaflet components
global.ResizeObserver = class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock MutationObserver for DOM changes
global.MutationObserver = class MockMutationObserver {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
};

// Mock requestAnimationFrame for animations
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 16); // ~60fps
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Setup global cleanup and monitoring
const setupGlobalCleanup = () => {
  // Register global cleanup for memory management
  memoryManager.registerCleanup(() => {
    // Clear any global state or caches
    if (global.gc) {
      global.gc();
    }
  });
  
  // Setup test teardown hooks
  beforeEach(() => {
    performanceMonitor.start('test-execution');
  });
  
  afterEach(() => {
    performanceMonitor.end('test-execution');
    memoryManager.cleanup();
  });
  
  afterAll(() => {
    if (process.env.JEST_PERFORMANCE_LOG === 'true') {
      performanceMonitor.logSummary();
    }
  });
};

// Console configuration for clean test output
const setupConsoleFilters = () => {
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0];
    if (typeof message === 'string') {
      // Suppress common React-Leaflet testing warnings
      if (message.includes('Warning: ReactDOM.render is no longer supported') ||
          message.includes('Warning: Each child in a list should have a unique') ||
          message.includes('Leaflet') ||
          message.includes('canvas')) {
        return;
      }
    }
    originalConsoleWarn(...args);
  };
};

// Execute global setup
setupGlobalCleanup();
setupConsoleFilters();

// End setup performance monitoring
performanceMonitor.end('jest-setup');