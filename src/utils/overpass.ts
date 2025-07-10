/**
 * Overpass API Utility
 * 
 * @doc refs docs/architecture-spec.md#ingest-agent
 * @doc refs docs/engineering-spec.md#timeout-handling
 * 
 * Reusable utility for querying the Overpass API with retry logic, caching,
 * and performance optimization. Extracted from ingest-agent for reusability.
 */

import * as https from 'https';
import * as http from 'http';
import { OverpassResponse, RequestOptions } from '../types/geojson';
import { makeRequest, sleep, DEFAULT_USER_AGENT } from './http';

export interface OverpassConfig {
  apiUrl: string;
  retryAttempts: number;
  retryDelayMs: number;
  timeoutMs: number;
  userAgent?: string;
  enableCache?: boolean;
  cacheExpiryMs?: number;
}

export interface CacheEntry {
  data: OverpassResponse;
  timestamp: number;
  expiresAt: number;
}

/**
 * In-memory cache for Overpass API responses
 */
class OverpassCache {
  private cache = new Map<string, CacheEntry>();

  set(query: string, data: OverpassResponse, expiryMs: number): void {
    const now = Date.now();
    this.cache.set(query, {
      data,
      timestamp: now,
      expiresAt: now + expiryMs
    });
  }

  get(query: string): OverpassResponse | null {
    const entry = this.cache.get(query);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(query);
      return null;
    }
    
    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Default configuration for Overpass API client
 */
const DEFAULT_CONFIG: OverpassConfig = {
  apiUrl: 'https://overpass-api.de/api/interpreter',
  retryAttempts: 3,
  retryDelayMs: 1000,
  timeoutMs: 30000,
  userAgent: DEFAULT_USER_AGENT,
  enableCache: true,
  cacheExpiryMs: 300000 // 5 minutes
};

// Global cache instance
const cache = new OverpassCache();

/**
 * Execute Overpass query with retry logic and caching
 */
export async function queryOverpass(
  query: string, 
  config: Partial<OverpassConfig> = {}
): Promise<OverpassResponse> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Check cache first
  if (finalConfig.enableCache) {
    const cachedResult = cache.get(query);
    if (cachedResult) {
      return cachedResult;
    }
  }
  
  return executeQueryWithRetry(query, finalConfig, 0);
}

/**
 * Execute query with retry logic
 */
async function executeQueryWithRetry(
  query: string,
  config: OverpassConfig,
  retryCount: number
): Promise<OverpassResponse> {
  try {
    const startTime = Date.now();
    
    const data = await makeRequest(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': config.userAgent || DEFAULT_USER_AGENT
      },
      body: query
    }, config.timeoutMs);

    const duration = Date.now() - startTime;
    
    // Cache successful response
    if (config.enableCache && config.cacheExpiryMs) {
      cache.set(query, data, config.cacheExpiryMs);
    }
    
    return data;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if we should retry
    const shouldRetry = retryCount < config.retryAttempts - 1 && 
                       (errorMessage.includes('429') || 
                        errorMessage.includes('5') || 
                        errorMessage.includes('timeout') ||
                        errorMessage.includes('ECONNRESET') ||
                        errorMessage.includes('ENOTFOUND') ||
                        errorMessage.includes('EHOSTUNREACH') ||
                        errorMessage.includes('ECONNREFUSED'));
    
    if (shouldRetry) {
      const delay = config.retryDelayMs * Math.pow(2, retryCount); // Exponential backoff
      await sleep(delay);
      return executeQueryWithRetry(query, config, retryCount + 1);
    } else {
      throw error;
    }
  }
}

/**
 * Get performance metrics for the last query
 */
export function getPerformanceMetrics(): {
  cacheSize: number;
  cacheEnabled: boolean;
} {
  return {
    cacheSize: cache.size(),
    cacheEnabled: DEFAULT_CONFIG.enableCache || false
  };
}

/**
 * Clear the cache manually
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Common Overpass queries for toilet data
 */
export const TOILET_QUERIES = {
  LONDON: `
[out:json][timeout:180];
area["name"="Greater London"]["boundary"="administrative"]->.london;
(
  node["amenity"="toilets"](area.london);
  way["amenity"="toilets"](area.london);
  relation["amenity"="toilets"](area.london);
);
out center tags;
`,

  BOROUGH: (boroughName: string) => `
[out:json][timeout:30];
(
  area["name"="${boroughName}"]["admin_level"="8"];
)->.searchArea;
(
  node["amenity"="toilets"](area.searchArea);
  way["amenity"="toilets"](area.searchArea);
  relation["amenity"="toilets"](area.searchArea);
);
out center meta;
`,

  AROUND_POINT: (lat: number, lon: number, radiusMeters: number) => `
[out:json][timeout:30];
(
  node["amenity"="toilets"](around:${radiusMeters},${lat},${lon});
  way["amenity"="toilets"](around:${radiusMeters},${lat},${lon});
  relation["amenity"="toilets"](around:${radiusMeters},${lat},${lon});
);
out center meta;
`
};

/**
 * Benchmark the performance of a query
 */
export async function benchmarkQuery(
  query: string,
  config: Partial<OverpassConfig> = {}
): Promise<{
  duration: number;
  cached: boolean;
  elements: number;
}> {
  const startTime = Date.now();
  const wasInCache = config.enableCache !== false && cache.get(query) !== null;
  
  const result = await queryOverpass(query, config);
  
  const duration = Date.now() - startTime;
  
  return {
    duration,
    cached: wasInCache,
    elements: result.elements.length
  };
}