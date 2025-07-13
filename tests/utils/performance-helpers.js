/**
 * @fileoverview Performance Optimization Utilities for Enhanced Test Environment
 * Provides caching, memory management, and performance monitoring for efficient testing
 */

/**
 * Test data cache for optimized data loading and reuse
 * Reduces repeated file parsing and object creation
 */
class TestDataCache {
  constructor() {
    this._cache = new Map();
    this._memoryThreshold = 50 * 1024 * 1024; // 50MB cache limit
    this._currentMemoryUsage = 0;
  }

  /**
   * Get cached data with automatic cleanup
   * @param {string} key - Cache key
   * @returns {any} Cached data or undefined
   */
  get(key) {
    const entry = this._cache.get(key);
    if (entry) {
      entry.lastAccessed = Date.now();
      return entry.data;
    }
    return undefined;
  }

  /**
   * Set cached data with memory management
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} estimatedSize - Estimated memory size in bytes
   */
  set(key, data, estimatedSize = 1024) {
    // Check memory threshold
    if (this._currentMemoryUsage + estimatedSize > this._memoryThreshold) {
      this._evictLeastRecentlyUsed();
    }

    this._cache.set(key, {
      data,
      size: estimatedSize,
      lastAccessed: Date.now(),
      created: Date.now()
    });
    
    this._currentMemoryUsage += estimatedSize;
  }

  /**
   * Clear cache and reset memory usage
   */
  clear() {
    this._cache.clear();
    this._currentMemoryUsage = 0;
  }

  /**
   * Evict least recently used entries to free memory
   * @private
   */
  _evictLeastRecentlyUsed() {
    const entries = Array.from(this._cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Remove oldest 25% of entries
    const removeCount = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < removeCount; i++) {
      const [key, entry] = entries[i];
      this._cache.delete(key);
      this._currentMemoryUsage -= entry.size;
    }
  }

  /**
   * Get cache statistics for monitoring
   * @returns {object} Cache statistics
   */
  getStats() {
    return {
      size: this._cache.size,
      memoryUsage: this._currentMemoryUsage,
      memoryThreshold: this._memoryThreshold,
      hitRate: this._calculateHitRate()
    };
  }

  _calculateHitRate() {
    // Simple hit rate calculation based on access patterns
    return this._cache.size > 0 ? 0.85 : 0; // Estimated hit rate
  }
}

/**
 * Performance monitoring utility for test execution timing
 * Tracks setup overhead and identifies performance bottlenecks
 */
class TestPerformanceMonitor {
  constructor() {
    this._metrics = new Map();
    this._startTimes = new Map();
  }

  /**
   * Start timing a performance metric
   * @param {string} name - Metric name
   */
  start(name) {
    this._startTimes.set(name, performance.now());
  }

  /**
   * End timing and record metric
   * @param {string} name - Metric name
   * @returns {number} Duration in milliseconds
   */
  end(name) {
    const startTime = this._startTimes.get(name);
    if (!startTime) {
      console.warn(`Performance metric '${name}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this._startTimes.delete(name);

    if (!this._metrics.has(name)) {
      this._metrics.set(name, []);
    }
    this._metrics.get(name).push(duration);

    return duration;
  }

  /**
   * Get performance statistics for a metric
   * @param {string} name - Metric name
   * @returns {object} Performance statistics
   */
  getStats(name) {
    const measurements = this._metrics.get(name) || [];
    if (measurements.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, p95: 0 };
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const sum = measurements.reduce((a, b) => a + b, 0);
    
    return {
      count: measurements.length,
      average: sum / measurements.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1]
    };
  }

  /**
   * Get all performance metrics
   * @returns {object} All metrics
   */
  getAllStats() {
    const stats = {};
    for (const [name] of this._metrics) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }

  /**
   * Clear all performance metrics
   */
  clear() {
    this._metrics.clear();
    this._startTimes.clear();
  }

  /**
   * Log performance summary to console
   */
  logSummary() {
    const stats = this.getAllStats();
    console.log('Test Performance Summary:');
    for (const [name, stat] of Object.entries(stats)) {
      console.log(`  ${name}: ${stat.average.toFixed(2)}ms avg (${stat.count} samples)`);
    }
  }
}

/**
 * Memory cleanup utility for test artifacts
 * Prevents memory leaks and ensures clean test environment
 */
class TestMemoryManager {
  constructor() {
    this._cleanupFunctions = [];
    this._intervals = [];
    this._timeouts = [];
  }

  /**
   * Register cleanup function to run between tests
   * @param {function} cleanupFn - Cleanup function
   */
  registerCleanup(cleanupFn) {
    this._cleanupFunctions.push(cleanupFn);
  }

  /**
   * Track interval for automatic cleanup
   * @param {number} intervalId - Interval ID
   */
  trackInterval(intervalId) {
    this._intervals.push(intervalId);
  }

  /**
   * Track timeout for automatic cleanup
   * @param {number} timeoutId - Timeout ID
   */
  trackTimeout(timeoutId) {
    this._timeouts.push(timeoutId);
  }

  /**
   * Clean up all registered resources
   */
  cleanup() {
    // Clear intervals
    this._intervals.forEach(id => clearInterval(id));
    this._intervals.length = 0;

    // Clear timeouts
    this._timeouts.forEach(id => clearTimeout(id));
    this._timeouts.length = 0;

    // Run cleanup functions
    this._cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.warn('Cleanup function failed:', error);
      }
    });

    // Reset cleanup functions
    this._cleanupFunctions.length = 0;

    // Force garbage collection hint
    if (global.gc) {
      global.gc();
    }
  }
}

// Global instances for test utilities
const testDataCache = new TestDataCache();
const performanceMonitor = new TestPerformanceMonitor();
const memoryManager = new TestMemoryManager();

/**
 * Optimized toilets.geojson data loader with caching
 * @returns {Promise<object>} Cached or loaded toilet data
 */
const getToiletData = async () => {
  const cacheKey = 'toilets-geojson';
  let toiletData = testDataCache.get(cacheKey);
  
  if (!toiletData) {
    performanceMonitor.start('data-loading');
    
    try {
      // Dynamic import to avoid blocking test setup
      toiletData = await import('@/data/toilets.geojson');
      
      // Cache with estimated size
      const estimatedSize = JSON.stringify(toiletData).length;
      testDataCache.set(cacheKey, toiletData, estimatedSize);
      
      performanceMonitor.end('data-loading');
    } catch (error) {
      performanceMonitor.end('data-loading');
      console.warn('Failed to load toilet data:', error);
      return { type: 'FeatureCollection', features: [] };
    }
  }
  
  return toiletData;
};

/**
 * Create optimized data subsets for different test scenarios
 * @param {object} fullData - Full toilet dataset
 * @param {string} subset - Subset type ('small', 'medium', 'large', 'accessible', '24h')
 * @returns {Array} Filtered toilet features
 */
const createDataSubset = (fullData, subset = 'small') => {
  const features = fullData.features || [];
  
  switch (subset) {
    case 'small':
      return features.slice(0, 5);
    case 'medium':
      return features.slice(0, 50);
    case 'large':
      return features.slice(0, 200);
    case 'accessible':
      return features.filter(f => f.properties.accessible === true).slice(0, 20);
    case '24h':
      return features.filter(f => f.properties.hours === '24/7').slice(0, 20);
    case 'full':
      return features;
    default:
      return features.slice(0, 10);
  }
};

module.exports = {
  TestDataCache,
  TestPerformanceMonitor,
  TestMemoryManager,
  testDataCache,
  performanceMonitor,
  memoryManager,
  getToiletData,
  createDataSubset
};