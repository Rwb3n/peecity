/**
 * File-based Toilet Data Provider
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * 
 * Implementation of ToiletDataProvider that reads data from GeoJSON files.
 * Provides caching and error handling for filesystem-based toilet data access.
 */

import fs from 'fs';
import { ToiletFeature } from '../types/geojson';
import { CachedToiletDataProvider } from '../interfaces/toiletDataProvider';
import { createAgentLogger } from '../utils/logger';

/**
 * Configuration for file-based toilet data provider
 */
export interface FileToiletDataConfig {
  filePath: string;
  cacheValidityMs?: number;
  encoding?: BufferEncoding;
}

/**
 * File-based toilet data provider with caching
 */
export class FileToiletDataProvider implements CachedToiletDataProvider {
  private readonly config: Required<FileToiletDataConfig>;
  private readonly logger = createAgentLogger('file-toilet-data-provider');
  
  private cachedData: ToiletFeature[] | null = null;
  private lastLoaded: Date | null = null;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(config: FileToiletDataConfig) {
    this.config = {
      cacheValidityMs: 60000, // 1 minute default
      encoding: 'utf8',
      ...config
    };
  }

  /**
   * Load all toilet features from file
   * @returns Promise of toilet features array
   * @throws Error if file cannot be read or parsed
   */
  async loadToilets(): Promise<ToiletFeature[]> {
    // Check cache first
    if (this.isCacheValid() && this.cachedData) {
      this.cacheHits++;
      this.logger.debug('cache_hit', 'Toilet data loaded from cache', {
        featureCount: this.cachedData.length,
        lastLoaded: this.lastLoaded?.toISOString()
      });
      return this.cachedData;
    }

    // Cache miss - load from file
    this.cacheMisses++;
    
    try {
      const fileContent = await fs.promises.readFile(this.config.filePath, {
        encoding: this.config.encoding
      });
      
      const geoJsonData = JSON.parse(fileContent);
      
      if (geoJsonData.type !== 'FeatureCollection') {
        throw new Error('Invalid GeoJSON: expected FeatureCollection');
      }
      
      if (!Array.isArray(geoJsonData.features)) {
        throw new Error('Invalid GeoJSON: features must be an array');
      }

      // Cache the data
      this.cachedData = geoJsonData.features;
      this.lastLoaded = new Date();

      this.logger.info('data_loaded', 'Toilet data loaded from file', {
        filePath: this.config.filePath,
        featureCount: this.cachedData.length,
        fileSize: fileContent.length
      });

      return this.cachedData;

    } catch (error) {
      this.logger.error('data_load_error', 'Failed to load toilet data from file', {
        filePath: this.config.filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Check if toilet data file is available
   * @returns Promise of availability status
   */
  async isDataAvailable(): Promise<boolean> {
    try {
      await fs.promises.access(this.config.filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get data source metadata
   * @returns Promise of metadata object
   */
  async getMetadata(): Promise<{
    lastModified?: Date;
    featureCount?: number;
    source: string;
  }> {
    try {
      const stats = await fs.promises.stat(this.config.filePath);
      const featureCount = this.cachedData?.length;
      
      return {
        lastModified: stats.mtime,
        featureCount,
        source: `file://${this.config.filePath}`
      };
    } catch (error) {
      this.logger.warn('metadata_error', 'Failed to get file metadata', {
        filePath: this.config.filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        source: `file://${this.config.filePath}`
      };
    }
  }

  /**
   * Clear cached data
   */
  async clearCache(): Promise<void> {
    this.cachedData = null;
    this.lastLoaded = null;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    
    this.logger.debug('cache_cleared', 'Toilet data cache cleared');
  }

  /**
   * Get cache statistics
   * @returns Cache stats object
   */
  async getCacheStats(): Promise<{
    isValid: boolean;
    lastLoaded?: Date;
    cacheHits: number;
    cacheMisses: number;
  }> {
    return {
      isValid: this.isCacheValid(),
      lastLoaded: this.lastLoaded || undefined,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses
    };
  }

  /**
   * Check if cache is valid
   * @returns True if cache is still valid
   */
  isCacheValid(): boolean {
    if (!this.lastLoaded || !this.cachedData) {
      return false;
    }
    
    const cacheAge = Date.now() - this.lastLoaded.getTime();
    return cacheAge < this.config.cacheValidityMs;
  }

  /**
   * Get the configured file path
   * @returns File path
   */
  getFilePath(): string {
    return this.config.filePath;
  }

  /**
   * Get cache validity duration in milliseconds
   * @returns Cache validity duration
   */
  getCacheValidityMs(): number {
    return this.config.cacheValidityMs;
  }
}

/**
 * Create a file-based toilet data provider
 * @param config Provider configuration
 * @returns FileToiletDataProvider instance
 */
export function createFileToiletDataProvider(config: FileToiletDataConfig): FileToiletDataProvider {
  return new FileToiletDataProvider(config);
}