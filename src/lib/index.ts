/**
 * Main Library Barrel Export
 * 
 * @artifact docs/cookbook/recipe_tiered_validation.md
 * @epic foundation_consolidation_epic
 * @task foundation_consolidation_task3
 * @tdd-phase GREEN
 * 
 * Central entry point for all library utilities.
 * Enables clean imports: import { validateSuggestion, calculateDistance } from '@/lib'
 * 
 * This is the key file that makes the lib consolidation functional.
 * Without this, clean imports are impossible.
 */

// Validation utilities - Core validation functions and error handling
export {
  // Core validation
  validateSuggestion,
  sanitizeSuggestion,
  validateRequestBody,
  generateSuggestionId,
  
  // Tier-based validation
  validatePropertyByTier,
  aggregateValidationByTier,
  validateManyProperties,
  type TierValidationSummary,
  type PropertyValidationContext,
  
  // Error handling and messages
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
} from './validation/index';

// Geospatial utilities - Distance calculations and spatial indexing
export {
  // Coordinate utilities
  calculateDistance,
  isWithinLondonBounds,
  toRadians,
  toDegrees,
  formatCoordinates,
  validateCoordinates,
  
  // Spatial indexing utilities
  createSpatialIndex,
  findNearestToilet,
  clearSpatialIndexCache,
  getSpatialIndexCacheStats,
  
  // Overpass API utilities
  queryOverpass,
  TOILET_QUERIES,
  getPerformanceMetrics,
  clearCache,
  benchmarkQuery,
  type OverpassConfig,
  type CacheEntry
} from './geospatial/index';

// Performance utilities (when implemented)
// export { } from './performance';

// Networking utilities (when implemented)  
// export { } from './networking';

// Logging utilities (when implemented)
// export { } from './logging';

// Configuration utilities (when implemented)
// export { } from './config';

// Legacy styling utility (maintained for compatibility)
export { cn } from './utils';

// New consolidated types (avoiding existing conflicts)
export type {
  // Toilet domain
  ToiletSuggestion,
  ToiletFeature,
  ToiletCollection,
  ProcessedSuggestion,
  SuggestionValidation,
  SuggestionValidationError,
  ValidationWarning,
  SuggestionResponse,
  SuggestionLogEntry,
  SuggestionConfig,
  RateLimitInfo,
  Point,
  ToiletProperties,
  
  // API types
  OverpassElement,
  OverpassResponse,
  RequestOptions,
  IngestConfig,
  
  // Service types
  DuplicateCheckRequest,
  DuplicateCheckResult,
  IngestOptions,
  IngestResult,
  LogSuggestionRequest,
  RateLimitRequest,
  RateLimitResult,
  MonitorConfig,
  MonitorResult,
  
  // Provider interfaces
  ToiletDataProvider,
  CachedToiletDataProvider,
  FileToiletDataConfig,
  MetricsCollector,
  MetricsData,
  MetricsCollectionResult,
  AlertSender,
  AlertData,
  AlertSendResult,
  
  // Validation types (NEW ones only)
  ValidationRequest,
  ValidationResult,
  TierConfig,
  PropertyMetadata,
  ValidationMetrics,
  ValidationContext,
  TieredValidationResult,
  ValidationService,
  ServiceComposition,
  PerformanceBenchmark,
  
  // Common utilities
  GenericCacheEntry,
  LogEntry,
  LoggerConfig,
  ValidationConfig,
  RateLimitConfig,
  DuplicateDetectionConfig,
  FilePathsConfig,
  FileLogConfig,
  SystemConfig,
  BaseEntity,
  BaseResponse,
  PaginatedResponse,
  
  // Utility types
  DeepPartial,
  KeysOfType,
  PartialKeys,
  RequiredKeys
} from './types';