/**
 * Toilet Data Provider Interface
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * 
 * Abstraction for toilet data access to support dependency injection
 * and better testability. Breaks filesystem dependency from business logic.
 */

import { ToiletFeature } from '../types/geojson';

/**
 * Interface for accessing toilet data
 */
export interface ToiletDataProvider {
  /**
   * Load all toilet features
   * @returns Promise of toilet features array
   * @throws Error if data cannot be loaded
   */
  loadToilets(): Promise<ToiletFeature[]>;

  /**
   * Check if toilet data is available
   * @returns Promise of availability status
   */
  isDataAvailable(): Promise<boolean>;

  /**
   * Get data source metadata
   * @returns Promise of metadata object
   */
  getMetadata(): Promise<{
    lastModified?: Date;
    featureCount?: number;
    source: string;
  }>;
}

/**
 * Cache-aware toilet data provider with time-based invalidation
 */
export interface CachedToiletDataProvider extends ToiletDataProvider {
  /**
   * Clear any cached data
   */
  clearCache(): Promise<void>;

  /**
   * Get cache statistics
   * @returns Cache stats object
   */
  getCacheStats(): Promise<{
    isValid: boolean;
    lastLoaded?: Date;
    cacheHits: number;
    cacheMisses: number;
  }>;

  /**
   * Check if cache is valid
   * @returns True if cache is still valid
   */
  isCacheValid(): boolean;
}