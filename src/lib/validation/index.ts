/**
 * Validation Library Barrel Export
 * 
 * @artifact docs/cookbook/recipe_tiered_validation.md
 * @epic foundation_consolidation_epic
 * @task foundation_consolidation_task3
 * @tdd-phase GREEN
 * 
 * Centralized exports for all validation utilities.
 * Enables clean imports: import { validateSuggestion } from '@/lib/validation'
 */

// Core validation functions
export {
  validateSuggestion,
  sanitizeSuggestion,
  validateRequestBody,
  generateSuggestionId
} from './core';

// Tier-based validation functions  
export {
  validatePropertyByTier,
  aggregateValidationByTier,
  validateManyProperties,
  type TierValidationSummary,
  type PropertyValidationContext
} from './tiered';

// Error handling and messages
export {
  ErrorCode,
  HttpStatus,
  AppError,
  ValidationError,
  ValidationErrorMessages,
  ErrorFactory,
  createErrorResponse,
  createSuccessResponse,
  formatFieldName,
  type ErrorResponse
} from './errors';

// Schema validation functions
export {
  validateSchema,
  validateGeoJsonToilet,
  validateOverpassQuery,
  validateServiceResponse,
  clearSchemaCache,
  getSchemaCacheStats,
  validateManyWithSchema,
  createSchemaValidator,
  createSchemaValidationError,
  benchmarkSchemaValidation,
  type SchemaValidationResult
} from './schemas';