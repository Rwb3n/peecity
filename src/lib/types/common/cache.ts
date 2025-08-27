/**
 * Cache Types
 * 
 * @artifact docs/analysis/type-system-organization-analysis.md
 * @epic architecture_optimization_epic
 * @task architecture_optimization_task2
 * @tdd-phase GREEN
 * 
 * Generic caching interfaces for various caching implementations.
 * Provides type-safe cache patterns across the application.
 * 
 * Sources for migration:
 * - src/utils/cache.ts: CacheEntry<T> (generic version)
 * 
 * Note: Will be renamed to GenericCacheEntry<T> to avoid conflict with
 * the non-generic CacheEntry in src/lib/geospatial/overpass.ts
 */

// ============================================================================
// Generic Cache Types
// ============================================================================

/**
 * Generic cache entry with TTL support
 * Note: Renamed from CacheEntry<T> to avoid conflict with lib/geospatial/overpass.ts
 */
export interface GenericCacheEntry<T> {
  value: T;
  etag: string;
  expiresAt: number;
}