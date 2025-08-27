/**
 * Geospatial Library Barrel Export
 * 
 * @artifact docs/architecture-spec.md#suggest-agent
 * @epic foundation_consolidation_epic
 * @task foundation_consolidation_task3
 * @tdd-phase GREEN
 * 
 * Centralized exports for all geospatial utilities.
 * Enables clean imports: import { calculateDistance } from '@/lib/geospatial'
 */

// Coordinate utilities
export {
  calculateDistance,
  isWithinLondonBounds,
  toRadians,
  toDegrees,
  formatCoordinates,
  validateCoordinates
} from './coordinates';

// Spatial indexing utilities
export {
  createSpatialIndex,
  findNearestToilet,
  clearSpatialIndexCache,
  getSpatialIndexCacheStats
} from './spatial';

// Overpass API utilities
export {
  queryOverpass,
  TOILET_QUERIES,
  getPerformanceMetrics,
  clearCache,
  benchmarkQuery,
  type OverpassConfig,
  type CacheEntry
} from './overpass';