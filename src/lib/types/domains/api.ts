/**
 * API Domain Types
 * 
 * @artifact docs/analysis/type-system-organization-analysis.md
 * @epic architecture_optimization_epic
 * @task architecture_optimization_task2
 * @tdd-phase GREEN
 * 
 * External API integration types for Overpass and other services.
 * Centralizes all API request/response type definitions.
 * 
 * Sources for migration:
 * - src/types/geojson.ts: OverpassElement, OverpassResponse, IngestConfig, RequestOptions
 * 
 * Note: All 8 types from geojson.ts will be properly categorized between
 * this file (API-related) and toilet.ts (domain-specific).
 */

// ============================================================================
// Overpass API Types
// ============================================================================

/**
 * Overpass API element representation
 */
export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
}

/**
 * Overpass API response structure
 */
export interface OverpassResponse {
  version: number;
  generator: string;
  elements: OverpassElement[];
}

// ============================================================================
// HTTP Request Types
// ============================================================================

/**
 * HTTP request options
 */
export interface RequestOptions {
  method: string;
  headers: Record<string, string>;
  body?: string;
}

// ============================================================================
// Agent Configuration Types
// ============================================================================

/**
 * Ingest agent configuration
 */
export interface IngestConfig {
  overpassApiUrl: string;
  outputFile: string;
  retryAttempts: number;
  retryDelayMs: number;
  timeoutMs: number;
}