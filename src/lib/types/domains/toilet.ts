/**
 * Toilet Domain Types
 * 
 * @artifact docs/analysis/type-system-organization-analysis.md
 * @epic architecture_optimization_epic
 * @task architecture_optimization_task2
 * @tdd-phase GREEN
 * 
 * Consolidated toilet-related types from scattered locations.
 * Provides unified type definitions for toilet data structures,
 * suggestions, and GeoJSON representations.
 * 
 * Sources for migration:
 * - src/types/suggestions.ts: ToiletSuggestion, ProcessedSuggestion, SuggestionValidation,
 *   SuggestionResponse, SuggestionLogEntry, SuggestionConfig, RateLimitInfo
 * - src/types/geojson.ts: Point, ToiletProperties, ToiletFeature, ToiletCollection
 */

// ============================================================================
// Core Toilet Types
// ============================================================================

/**
 * User submission payload for new toilet suggestions
 */
export interface ToiletSuggestion {
  lat: number;                    // Latitude (-90 to 90)
  lng: number;                    // Longitude (-180 to 180) 
  name?: string;                  // Optional toilet name
  hours?: string;                 // Opening hours (e.g., "24/7", "Mon-Fri 9-17")
  accessible?: boolean;           // Wheelchair accessibility
  fee?: number;                   // Fee amount (0 for free)
  description?: string;           // Additional details from user
  submitter_email?: string;       // Optional contact for follow-up
}

/**
 * Validated suggestion with metadata
 */
export interface ProcessedSuggestion extends ToiletSuggestion {
  id: string;                     // Unique suggestion ID
  submitted_at: string;           // ISO timestamp
  status: 'pending' | 'approved' | 'rejected';
  ip_address?: string;            // For rate limiting
  user_agent?: string;            // Browser info
  validation_notes?: string;      // Internal validation comments
}

// ============================================================================
// GeoJSON Types
// ============================================================================

/**
 * Standard GeoJSON geometry types
 */
export interface Point {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * CityPee-specific toilet properties
 */
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

/**
 * GeoJSON Feature for toilet data
 */
export interface ToiletFeature {
  type: 'Feature';
  geometry: Point;
  properties: ToiletProperties;
}

/**
 * Complete GeoJSON FeatureCollection
 */
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

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Suggestion validation result
 */
export interface SuggestionValidation {
  isValid: boolean;
  errors: SuggestionValidationError[];
  warnings: ValidationWarning[];
  isDuplicate: boolean;
  duplicateDistance?: number;     // Distance to nearest existing toilet (meters)
  nearestToiletId?: string;       // ID of nearest existing toilet
}

/**
 * Suggestion validation error details
 * Note: Renamed from ValidationError to avoid conflict with lib/validation/errors.ts
 */
export interface SuggestionValidationError {
  field: string;
  message: string;
  code: 'required' | 'invalid_format' | 'out_of_range' | 'invalid_type';
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: 'unusual_value' | 'incomplete_data' | 'formatting_issue';
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * API response for suggestion submission
 */
export interface SuggestionResponse {
  success: boolean;
  suggestionId?: string;
  message: string;
  validation?: SuggestionValidation;
  error?: {
    code: string;
    details: string;
  };
}

// ============================================================================
// Logging Types
// ============================================================================

/**
 * Suggestion log entry format
 */
export interface SuggestionLogEntry {
  timestamp: string;
  suggestionId: string;
  action: 'submitted' | 'validated' | 'approved' | 'rejected';
  data: ProcessedSuggestion | Partial<ProcessedSuggestion>;
  result?: SuggestionValidation;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Rate limiting information
 */
export interface RateLimitInfo {
  ip: string;
  submissions: number;
  windowStart: string;
  windowDuration: number;        // Duration in milliseconds
  maxSubmissions: number;
}

/**
 * Suggestion configuration
 */
export interface SuggestionConfig {
  maxSubmissionsPerHour: number;
  duplicateThresholdMeters: number;
  requiredFields: (keyof ToiletSuggestion)[];
  logFilePath: string;
  enableEmailNotifications: boolean;
}