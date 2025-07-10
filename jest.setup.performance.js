// Performance polyfill for Node.js environment
// This must run before any modules are imported to ensure it's available

if (typeof globalThis.performance === 'undefined') {
  globalThis.performance = {
    getEntriesByName: () => [],
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    clearMarks: () => {},
    clearMeasures: () => {}
  };
}

// Also set on global for compatibility
if (typeof global.performance === 'undefined') {
  global.performance = globalThis.performance;
}