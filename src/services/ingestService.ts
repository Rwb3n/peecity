/**
 * Ingest Service - Pure Data Processing
 * 
 * @doc refs docs/architecture-spec.md#ingest-agent
 * 
 * Pure data processing service for OSM toilet data ingestion.
 * Handles data fetching, normalization, and transformation without CLI concerns.
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  IngestConfig, 
  OverpassElement, 
  ToiletFeature, 
  ToiletCollection,
  OverpassResponse
} from '../types/geojson';
import { queryOverpass, TOILET_QUERIES } from '../utils/overpass';
import { createAgentLogger } from '../utils/logger';

const logger = createAgentLogger('ingest-service');

export interface IngestOptions {
  overpassApiUrl?: string;
  outputFile?: string;
  retryAttempts?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  userAgent?: string;
  enableCache?: boolean;
  cacheExpiryMs?: number;
}

export interface IngestResult {
  success: boolean;
  featuresCount: number;
  outputFile: string;
  generatedAt: string;
  error?: string;
}

/**
 * Pure ingest service class
 */
export class IngestService {
  private config: Required<IngestOptions>;

  constructor(options: IngestOptions = {}) {
    this.config = {
      overpassApiUrl: options.overpassApiUrl || process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter',
      outputFile: options.outputFile || path.join(process.cwd(), 'data', 'toilets.geojson'),
      retryAttempts: options.retryAttempts || 3,
      retryDelayMs: options.retryDelayMs || 1000,
      timeoutMs: options.timeoutMs || 30000,
      userAgent: options.userAgent || 'CityPee/1.0 (https://github.com/example/citypee)',
      enableCache: options.enableCache !== undefined ? options.enableCache : process.env.NODE_ENV !== 'test',
      cacheExpiryMs: options.cacheExpiryMs || 300000 // 5 minutes
    };
  }

  /**
   * Normalize OSM element to internal GeoJSON schema
   * @param element OSM element from Overpass API
   * @returns Normalized toilet feature or null if invalid
   */
  public normalizeToiletData(element: OverpassElement): ToiletFeature | null {
    const tags = element.tags || {};
    
    // Extract coordinates - handle nodes, ways, and relations
    let lat: number, lon: number;
    if (element.lat !== undefined && element.lon !== undefined) {
      // Node
      lat = element.lat;
      lon = element.lon;
    } else if (element.center) {
      // Way or relation with center
      lat = element.center.lat;
      lon = element.center.lon;
    } else {
      // Skip elements without coordinates
      logger.debug('normalize_skip', 'Skipping element without coordinates', { 
        id: element.id, 
        type: element.type 
      });
      return null;
    }

    // Parse opening hours
    let hours = '24/7'; // Default assumption
    if (tags.opening_hours) {
      hours = tags.opening_hours;
    }

    // Parse accessibility
    let accessible = false;
    if (tags.wheelchair === 'yes' || tags['toilets:wheelchair'] === 'yes') {
      accessible = true;
    }

    // Parse fee information
    let fee = 0; // Default to free
    if (tags.fee === 'yes' || tags['toilets:fee'] === 'yes') {
      fee = 50; // 50p default fee if not specified
    }
    if (tags['charge'] && !isNaN(Number(tags['charge']))) {
      fee = Number(tags['charge']) * 100; // Convert to pence
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lon, lat]
      },
      properties: {
        id: `osm_${element.type}_${element.id}`,
        name: tags.name || 'Public Toilets',
        hours: hours,
        accessible: accessible,
        fee: fee,
        source: 'osm',
        last_verified_at: new Date().toISOString(),
        verified_by: 'ingest-agent'
      }
    };
  }

  /**
   * Fetch data from Overpass API
   * @returns Overpass API response
   */
  private async fetchOverpassData(): Promise<OverpassResponse> {
    logger.info('fetch_start', 'Starting OSM data fetch', {
      apiUrl: this.config.overpassApiUrl,
      cacheEnabled: this.config.enableCache
    });
    
    const data = await queryOverpass(TOILET_QUERIES.LONDON, {
      apiUrl: this.config.overpassApiUrl,
      retryAttempts: this.config.retryAttempts,
      retryDelayMs: this.config.retryDelayMs,
      timeoutMs: this.config.timeoutMs,
      userAgent: this.config.userAgent,
      enableCache: this.config.enableCache,
      cacheExpiryMs: this.config.cacheExpiryMs
    });

    logger.info('fetch_complete', 'OSM data fetch completed', {
      elementCount: data.elements ? data.elements.length : 0
    });
    
    return data;
  }

  /**
   * Ensure output directory exists
   * @param filePath Path to the output file
   */
  private ensureOutputDirectory(filePath: string): void {
    const outputDir = path.dirname(filePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      logger.info('directory_created', 'Created output directory', { path: outputDir });
    }
  }

  /**
   * Process and normalize raw OSM data
   * @param overpassData Raw data from Overpass API
   * @returns Normalized GeoJSON collection
   */
  private processOverpassData(overpassData: OverpassResponse): ToiletCollection {
    logger.info('process_start', 'Starting data normalization', {
      elementCount: overpassData.elements?.length || 0
    });

    const features = overpassData.elements
      ?.map(element => this.normalizeToiletData(element))
      .filter((feature): feature is ToiletFeature => feature !== null) || [];

    const geoJson: ToiletCollection = {
      type: 'FeatureCollection',
      features: features,
      metadata: {
        generated_at: new Date().toISOString(),
        generated_by: 'ingest-agent',
        source: 'openstreetmap',
        count: features.length
      }
    };

    logger.info('process_complete', 'Data normalization completed', {
      featuresCount: features.length,
      filteredCount: (overpassData.elements?.length || 0) - features.length
    });

    return geoJson;
  }

  /**
   * Write GeoJSON data to file
   * @param geoJson Processed GeoJSON data
   * @param outputFile Output file path
   */
  private writeGeoJSON(geoJson: ToiletCollection, outputFile: string): void {
    this.ensureOutputDirectory(outputFile);
    
    logger.info('write_start', 'Writing GeoJSON to file', {
      path: outputFile,
      featuresCount: geoJson.features.length
    });

    fs.writeFileSync(outputFile, JSON.stringify(geoJson, null, 2));
    
    logger.info('write_complete', 'GeoJSON file written successfully', {
      path: outputFile,
      size: fs.statSync(outputFile).size
    });
  }

  /**
   * Run the complete ingest process
   * @returns Ingest result with success status and metadata
   */
  async ingest(): Promise<IngestResult> {
    const startTime = Date.now();
    
    try {
      logger.info('ingest_start', 'Starting ingest process', {
        outputFile: this.config.outputFile,
        config: {
          retryAttempts: this.config.retryAttempts,
          timeoutMs: this.config.timeoutMs,
          cacheEnabled: this.config.enableCache
        }
      });

      // Fetch data from Overpass API
      const overpassData = await this.fetchOverpassData();
      
      // Process and normalize data
      const geoJson = this.processOverpassData(overpassData);
      
      // Write to output file
      this.writeGeoJSON(geoJson, this.config.outputFile);
      
      const duration = Date.now() - startTime;
      const result: IngestResult = {
        success: true,
        featuresCount: geoJson.features.length,
        outputFile: this.config.outputFile,
        generatedAt: geoJson.metadata.generated_at
      };

      logger.info('ingest_success', 'Ingest process completed successfully', {
        ...result,
        durationMs: duration
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('ingest_failed', 'Ingest process failed', {
        error: errorMessage,
        durationMs: duration,
        outputFile: this.config.outputFile
      });

      return {
        success: false,
        featuresCount: 0,
        outputFile: this.config.outputFile,
        generatedAt: new Date().toISOString(),
        error: errorMessage
      };
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<IngestOptions> {
    return { ...this.config };
  }

  /**
   * Refresh data (alias for ingest method for monitor-agent compatibility)
   * @returns Ingest result with success status and metadata
   */
  async refresh(): Promise<IngestResult> {
    logger.info('refresh_start', 'Starting data refresh via monitor-agent');
    return await this.ingest();
  }
}

/**
 * Create singleton ingest service instance
 */
export const ingestService = new IngestService();