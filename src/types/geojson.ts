/**
 * TypeScript interfaces for CityPee GeoJSON schema
 * 
 * @doc refs docs/architecture-spec.md#ingest-agent
 */

// Standard GeoJSON geometry types
export interface Point {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// CityPee-specific toilet properties
export interface ToiletProperties {
  id: string;
  name: string;
  hours: string;
  accessible: boolean;
  fee: number;
  source: string;
  last_verified_at: string;
  verified_by: string;
}

// GeoJSON Feature for toilet data
export interface ToiletFeature {
  type: 'Feature';
  geometry: Point;
  properties: ToiletProperties;
}

// Complete GeoJSON FeatureCollection
export interface ToiletCollection {
  type: 'FeatureCollection';
  features: ToiletFeature[];
  metadata?: {
    generated_at: string;
    generated_by: string;
    source: string;
    count: number;
  };
}

// Overpass API response types
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

export interface OverpassResponse {
  version: number;
  generator: string;
  elements: OverpassElement[];
}

// Agent configuration types
export interface IngestConfig {
  overpassApiUrl: string;
  outputFile: string;
  retryAttempts: number;
  retryDelayMs: number;
  timeoutMs: number;
}

// HTTP request options
export interface RequestOptions {
  method: string;
  headers: Record<string, string>;
  body?: string;
}