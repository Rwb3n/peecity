/**
 * Duplicate Detection Service
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * 
 * Service for detecting duplicate toilet suggestions using spatial analysis.
 * Uses dependency injection for data access to improve testability and maintainability.
 */

import { findNearestToilet } from '../utils/geospatial';
import { getDuplicateDetectionConfig } from '../utils/config';
import { createAgentLogger } from '../utils/logger';
import { ErrorFactory } from '../utils/errors';
import { CachedToiletDataProvider } from '../interfaces/toiletDataProvider';
import { SuggestionValidation } from '../types/suggestions';

const logger = createAgentLogger('duplicate-service');

export interface DuplicateCheckRequest {
  lat: number;
  lng: number;
  validation: SuggestionValidation;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  distance: number;
  nearestToiletId: string | null;
  validation: SuggestionValidation;
  error?: any;
}

/**
 * Duplicate detection service class
 */
export class DuplicateService {
  private readonly dataProvider: CachedToiletDataProvider;

  constructor(dataProvider: CachedToiletDataProvider) {
    this.dataProvider = dataProvider;
  }

  /**
   * Load existing toilets data using data provider
   * @returns Array of toilet features
   */
  private async loadExistingToilets(): Promise<any[]> {
    try {
      return await this.dataProvider.loadToilets();
    } catch (error) {
      logger.error('toilets_load_error', 'Failed to load toilet data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Return empty array to continue processing
      return [];
    }
  }

  /**
   * Check if a suggestion is a duplicate of existing toilets
   * @param request Duplicate check request
   * @returns Duplicate check result
   */
  async checkDuplicate(request: DuplicateCheckRequest): Promise<DuplicateCheckResult> {
    try {
      const duplicateConfig = getDuplicateDetectionConfig();
      const existingToilets = await this.loadExistingToilets();
      
      if (existingToilets.length === 0) {
        logger.warn('duplicate_check', 'No existing toilets data for duplicate check');
        
        return {
          isDuplicate: false,
          distance: Infinity,
          nearestToiletId: null,
          validation: {
            ...request.validation,
            warnings: [
              ...request.validation.warnings,
              { field: 'data', message: 'No existing toilet data available for duplicate check', code: 'no_data' }
            ]
          }
        };
      }

      const nearest = findNearestToilet(
        request.lat,
        request.lng,
        existingToilets
      );

      const isDuplicate = nearest.distance <= duplicateConfig.thresholdMeters;
      
      logger.debug('duplicate_check', 'Duplicate check completed', {
        isDuplicate,
        distance: nearest.distance,
        threshold: duplicateConfig.thresholdMeters,
        nearestToiletId: nearest.toilet?.properties?.id,
        toiletCount: existingToilets.length
      });

      if (isDuplicate) {
        return {
          isDuplicate: true,
          distance: nearest.distance,
          nearestToiletId: nearest.toilet?.properties?.id || null,
          validation: {
            ...request.validation,
            isDuplicate: true,
            duplicateDistance: nearest.distance,
            nearestToiletId: nearest.toilet?.properties?.id
          },
          error: ErrorFactory.duplicate(
            nearest.distance,
            nearest.toilet?.properties?.id || null,
            duplicateConfig.thresholdMeters
          )
        };
      }

      return {
        isDuplicate: false,
        distance: nearest.distance,
        nearestToiletId: nearest.toilet?.properties?.id || null,
        validation: {
          ...request.validation,
          isDuplicate: false,
          nearestDistance: nearest.distance,
          nearestToiletId: nearest.toilet?.properties?.id
        }
      };

    } catch (error) {
      logger.error('duplicate_check', 'Error during duplicate detection', {
        error: error instanceof Error ? error.message : 'Unknown error',
        lat: request.lat,
        lng: request.lng
      });

      return {
        isDuplicate: false,
        distance: Infinity,
        nearestToiletId: null,
        validation: {
          ...request.validation,
          warnings: [
            ...request.validation.warnings,
            { field: 'duplicate_check', message: 'Unable to verify duplicate status', code: 'check_failed' }
          ]
        }
      };
    }
  }

  /**
   * Clear the data provider cache
   */
  async clearCache(): Promise<void> {
    await this.dataProvider.clearCache();
    logger.debug('cache_cleared', 'Duplicate detection cache cleared');
  }

  /**
   * Get cache statistics from data provider
   */
  async getCacheStats(): Promise<{
    isValid: boolean;
    lastLoaded?: Date;
    cacheHits: number;
    cacheMisses: number;
  }> {
    return await this.dataProvider.getCacheStats();
  }

  /**
   * Get data provider metadata
   */
  async getDataMetadata(): Promise<{
    lastModified?: Date;
    featureCount?: number;
    source: string;
  }> {
    return await this.dataProvider.getMetadata();
  }
}

// Create default instance with file-based data provider
import { createFileToiletDataProvider } from '../providers/fileToiletDataProvider';
import { getFilePathsConfig } from '../utils/config';

const config = getFilePathsConfig();
const defaultDataProvider = createFileToiletDataProvider({
  filePath: config.toiletsData,
  cacheValidityMs: 60000 // 1 minute cache
});

/**
 * Create singleton duplicate service instance with default data provider
 */
export const duplicateService = new DuplicateService(defaultDataProvider);