/**
 * Suggestion Types for User-Submitted Toilet Locations
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * 
 * Type definitions for validating and processing user-submitted toilet suggestions.
 * These types ensure data quality and consistent processing throughout the suggestion pipeline.
 */

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

/**
 * Suggestion validation result
 */
export interface SuggestionValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  isDuplicate: boolean;
  duplicateDistance?: number;     // Distance to nearest existing toilet (meters)
  nearestToiletId?: string;       // ID of nearest existing toilet
}

/**
 * Validation error details
 */
export interface ValidationError {
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

/**
 * Suggestion log entry format
 */
export interface SuggestionLogEntry {
  timestamp: string;
  suggestionId: string;
  action: 'submitted' | 'validated' | 'approved' | 'rejected';
  data: ProcessedSuggestion | Partial<ProcessedSuggestion>;
  result?: SuggestionValidation;
  apiVersion?: 'v1' | 'v2'; // Track which API version was used
}

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