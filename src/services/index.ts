/**
 * Services Index
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * @epic foundation_consolidation_epic
 * @task foundation_consolidation_task2_corrected
 * 
 * Centralized export for all business logic services.
 * Provides clean separation between API routes and business logic.
 * 
 * Updated to use composition-based validation services.
 */

// New composition-based validation services (PRIMARY)
export {
  createBasicValidationService,
  createOptimizedValidationService,
  createMetricsValidationService,
  createFullValidationService,
  createCustomValidationService,
  TieredValidationService as ValidationService,
  ValidationMetricsCollector,
  MapBasedPerformanceOptimizer
} from './validation';

// Other services (unchanged)
export { DuplicateService, duplicateService } from './duplicateService';
export { RateLimitService, rateLimitService } from './rateLimitService';
export { SuggestionLogService, suggestionLogService } from './suggestionLogService';
export { IngestService, ingestService } from './ingestService';

// Backward compatibility exports (DEPRECATED - Use factory functions instead)
export { ValidationService as LegacyValidationService, validationService } from './validationService';
// Note: TieredValidationService variants have been consolidated into composition-based architecture

// Re-export types for convenience
export type { ValidationRequest, ValidationResult } from './validationService';
export type { DuplicateCheckRequest, DuplicateCheckResult } from './duplicateService';
export type { RateLimitRequest, RateLimitResult } from './rateLimitService';
export type { LogSuggestionRequest } from './suggestionLogService';
export type { IngestOptions, IngestResult } from './ingestService';