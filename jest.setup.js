import '@testing-library/jest-dom';

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

// Polyfill Response.json for Jest environment (not available in Node.js < 18.12)
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
      
      // Create a mock response that can be read multiple times for testing
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

// Add performance polyfill for Node.js environment
if (typeof global.performance === 'undefined') {
  global.performance = {
    getEntriesByName: () => []
  };
}

// Mock getComputedStyle for CSS testing
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = function(element) {
  const computedStyle = originalGetComputedStyle(element);
  
  // Return mock values for common CSS properties to avoid NaN issues
  return {
    ...computedStyle,
    height: '44px',
    width: '44px',
    paddingTop: '8px',
    paddingBottom: '8px',
    paddingLeft: '16px',
    paddingRight: '16px',
    fontSize: '14px',
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    // Preserve other computed style properties
    getPropertyValue: (prop) => {
      switch(prop) {
        case 'height': return '44px';
        case 'width': return '44px';
        case 'padding-top': return '8px';
        case 'padding-bottom': return '8px';
        case 'padding-left': return '16px';
        case 'padding-right': return '16px';
        case 'font-size': return '14px';
        case 'border-top-width': return '1px';
        case 'border-bottom-width': return '1px';
        case 'border-left-width': return '1px';
        case 'border-right-width': return '1px';
        default: return computedStyle.getPropertyValue(prop);
      }
    }
  };
};