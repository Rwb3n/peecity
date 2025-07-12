/**
 * Services Index
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * 
 * Centralized export for all business logic services.
 * Provides clean separation between API routes and business logic.
 */

export { ValidationService, validationService } from './validationService';
export { TieredValidationService } from './TieredValidationService';
export { TieredValidationServiceOptimized } from './TieredValidationService_optimized';
export { DuplicateService, duplicateService } from './duplicateService';
export { RateLimitService, rateLimitService } from './rateLimitService';
export { SuggestionLogService, suggestionLogService } from './suggestionLogService';
export { IngestService, ingestService } from './ingestService';
export { SuggestPayloadTransformer } from './SuggestPayloadTransformer';

// Re-export types for convenience
export type { ValidationRequest, ValidationResult } from './validationService';
export type { DuplicateCheckRequest, DuplicateCheckResult } from './duplicateService';
export type { RateLimitRequest, RateLimitResult } from './rateLimitService';
export type { LogSuggestionRequest } from './suggestionLogService';
export type { IngestOptions, IngestResult } from './ingestService';
export type { ContributionFormData, SuggestV1Payload, SuggestV2Payload } from './SuggestPayloadTransformer';