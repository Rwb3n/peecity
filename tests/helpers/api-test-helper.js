/**
 * API Test Helper for Next.js App Router
 * 
 * @doc refs docs/engineering-spec.md#testing
 * 
 * Helper functions for testing Next.js API routes in the App Router structure.
 * Provides utilities to simulate HTTP requests to API endpoints.
 * 
 * Uses mock-based approach to avoid NextRequest compatibility issues in Jest.
 */

const { NextResponse } = require('next/server');

/**
 * Create a mock NextRequest for testing that mimics NextRequest interface
 * without using the actual NextRequest constructor to avoid Jest compatibility issues
 */
function createMockRequest(method, url, body, headers = {}) {
  const fullUrl = new URL(url, 'http://localhost:3000');
  
  // Create a mock object that implements the NextRequest interface
  // without inheriting from NextRequest to avoid Jest compatibility issues
  const mockRequest = {
    method,
    url: fullUrl.toString(),
    nextUrl: fullUrl,
    headers: new Map(Object.entries({
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'test-agent',
      ...headers
    })),
    
    // Mock the text() method
    text: async () => {
      if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        return typeof body === 'string' ? body : JSON.stringify(body);
      }
      return '';
    },
    
    // Mock the json() method
    json: async () => {
      if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        return typeof body === 'string' ? JSON.parse(body) : body;
      }
      return {};
    },
    
    // Mock headers.get() method
    get headers() {
      return {
        get: (key) => {
          const map = this._headersMap;
          return map.get(key.toLowerCase());
        },
        entries: () => this._headersMap.entries(),
        forEach: (callback) => this._headersMap.forEach(callback),
        has: (key) => this._headersMap.has(key.toLowerCase()),
        keys: () => this._headersMap.keys(),
        values: () => this._headersMap.values()
      };
    },
    
    // Internal headers storage
    _headersMap: new Map(Object.entries({
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'test-agent',
      ...headers
    }).map(([k, v]) => [k.toLowerCase(), v]))
  };
  
  return mockRequest;
}

/**
 * Call an API route handler and return the response
 */
async function callApiRoute(handler, method, body, headers = {}) {
  const url = 'http://localhost:3000/api/suggest';
  const request = createMockRequest(
    method, 
    url, 
    typeof body === 'string' ? body : JSON.stringify(body),
    headers
  );

  try {
    const response = await handler(request);
    
    // Extract response data
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = responseText;
    }

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseData
    };
  } catch (error) {
    console.error('API route error:', error);
    throw error;
  }
}

module.exports = {
  createMockRequest,
  callApiRoute
};