import { ValidationResult, ValidationRequest } from '@/lib';
import { SuggestionValidation } from '../../types/suggestions';

/**
 * Tier configuration structure
 */
export interface TierConfig {
  version: string;
  generated_at: string;
  source: string;
  tiers: {
    [tierName: string]: {
      description: string;
      ui_behavior: string;
      validation_requirement: string;
      strict_validation: boolean;
      required: boolean;
    };
  };
  properties: {
    [propertyName: string]: {
      tier: string;
      frequency: number;
      validationType: string;
      synthetic?: boolean;
      description?: string;
      enumValues?: string[];
    };
  };
}

/**
 * Property metadata interface
 */
export interface PropertyMetadata {
  tier: string;
  frequency: number;
  validationType: string;
  synthetic?: boolean;
  description?: string;
  enumValues?: string[];
}

/**
 * Validation metrics structure
 */
export interface ValidationMetrics {
  totalRequests: number;
  requestsByTier: {
    core: number;
    high_frequency: number;
    optional: number;
    specialized: number;
  };
  errorsByTier: {
    core: number;
    high_frequency: number;
    optional: number;
    specialized: number;
  };
  performanceMetrics: {
    count: number;
    sum: number;
    min: number;
    max: number;
    p95: number[];
    average?: number;
  };
  startTime: number;
}

/**
 * Validation metrics collection interface
 * 
 * Handles performance monitoring and validation metrics collection.
 * Single responsibility: metrics collection and reporting.
 */
export interface ValidationMetricsCollectorInterface {
  /**
   * Start timing a validation operation
   * @returns High-precision timestamp for duration calculation
   */
  startTimer(): number;

  /**
   * Record successful validation metrics
   * @param result Validation result with tier information
   * @param startTime Timestamp from startTimer()
   */
  recordValidation(result: ValidationResult, startTime: number): void;

  /**
   * Record validation error metrics
   * @param error Error that occurred during validation
   * @param startTime Timestamp from startTimer()
   */
  recordError(error: Error, startTime: number): void;

  /**
   * Get current metrics summary
   * @returns Current validation metrics
   */
  getMetrics(): ValidationMetrics;

  /**
   * Get validation summary for API endpoint
   * @returns Formatted metrics summary
   */
  getValidationSummary(): Promise<any>;

  /**
   * Reset all collected metrics (useful for testing)
   */
  resetMetrics(): void;
}

/**
 * Performance optimization interface
 * 
 * Handles optimized validation algorithms and caching.
 * Single responsibility: performance optimization.
 */
export interface PerformanceOptimizer {
  /**
   * Initialize optimizer with tier configuration
   * @param config Tier configuration for building optimized lookups
   */
  initialize(config: TierConfig): Promise<void>;

  /**
   * Perform optimized validation using Map-based lookups
   * @param request Validation request
   * @param config Tier configuration
   * @returns Optimized validation result
   */
  validateOptimized(request: ValidationRequest, config: TierConfig): Promise<ValidationResult>;

  /**
   * Get property information with O(1) lookup
   * @param propertyName Property to look up
   * @returns Property metadata or undefined
   */
  getPropertyInfo(propertyName: string): PropertyMetadata | undefined;

  /**
   * Get tier statistics
   * @returns Statistics about properties by tier
   */
  getTierStatistics(): Promise<{ [tierName: string]: { totalCount: number; syntheticCount: number; osmPropertyCount: number } }>;

  /**
   * Apply v1 field mappings for backward compatibility
   * @param data Raw suggestion data
   * @returns Data with v1 mappings applied
   */
  applyV1FieldMappings(data: any): any;
}

/**
 * Validation logging interface
 * 
 * Handles structured logging for validation operations.
 * Single responsibility: logging and monitoring.
 */
export interface ValidationLogger {
  /**
   * Log debug information
   * @param message Debug message
   * @param meta Optional metadata object
   */
  debug(message: string, meta?: any): void;

  /**
   * Log informational message
   * @param message Info message
   * @param meta Optional metadata object
   */
  info(message: string, meta?: any): void;

  /**
   * Log warning message
   * @param message Warning message
   * @param meta Optional metadata object
   */
  warn(message: string, meta?: any): void;

  /**
   * Log error message
   * @param message Error message
   * @param meta Optional metadata object
   */
  error(message: string, meta?: any): void;
}

/**
 * Configuration loader interface
 * 
 * Handles loading and caching of tier configuration.
 * Single responsibility: configuration management.
 */
export interface ConfigurationLoader {
  /**
   * Load tier configuration from file
   * @param configPath Path to tier configuration file
   * @returns Parsed and validated tier configuration
   */
  loadConfiguration(configPath: string): Promise<TierConfig>;

  /**
   * Get cached configuration if available
   * @returns Cached configuration or null
   */
  getCachedConfiguration(): TierConfig | null;

  /**
   * Validate configuration against schema
   * @param config Configuration to validate
   * @returns True if valid, throws error if invalid
   */
  validateConfiguration(config: TierConfig): boolean;
}

/**
 * Validation context for request processing
 */
export interface ValidationContext {
  version?: string; // API version (v1/v2)
  strictMode?: boolean;
  ipAddress?: string;
  requestMetadata?: any;
}

/**
 * Enhanced validation result with tier information
 */
export interface TieredValidationResult extends ValidationResult {
  validation?: SuggestionValidation & {
    tierSummary?: {
      [tierName: string]: {
        total: number;
        provided: number;
        valid: number;
      };
    };
    errorsByTier?: { [tierName: string]: number };
  };
}

/**
 * Factory function type for creating validation services
 */
export type ValidationServiceFactory = () => ValidationService;

/**
 * Base validation service interface
 * 
 * Defines the core contract that all validation services must implement.
 */
export interface ValidationService {
  /**
   * Validate a suggestion request
   * @param request Validation request with body and metadata
   * @param context Optional validation context
   * @returns Validation result
   */
  validateRequest(request: ValidationRequest, context?: ValidationContext): Promise<ValidationResult>;

  /**
   * Initialize the validation service
   * @returns Promise that resolves when initialization is complete
   */
  initialize?(): Promise<void>;

  /**
   * Get service configuration
   * @returns Service configuration
   */
  getConfiguration?(): Promise<any>;
}

/**
 * Service composition configuration
 * 
 * Defines how validation services are composed from their dependencies.
 */
export interface ServiceComposition {
  configurationLoader: ConfigurationLoader;
  metricsCollector?: ValidationMetricsCollectorInterface;
  performanceOptimizer?: PerformanceOptimizer;
  logger?: ValidationLogger;
}

/**
 * Validation service factory interface
 * 
 * Provides standardized methods for creating validation service instances.
 */
export interface ValidationServiceFactoryInterface {
  /**
   * Create basic validation service
   * @returns Basic validation service instance
   */
  createBasicValidationService(): ValidationService;

  /**
   * Create optimized validation service with performance enhancements
   * @returns Optimized validation service instance
   */
  createOptimizedValidationService(): ValidationService;

  /**
   * Create validation service with metrics collection
   * @returns Validation service with metrics
   */
  createMetricsValidationService(): ValidationService;

  /**
   * Create full-featured validation service
   * @returns Validation service with all features
   */
  createFullValidationService(): ValidationService;
}

/**
 * Error types for validation failures
 */
export enum ValidationErrorType {
  INVALID_JSON = 'invalid_json',
  MISSING_BODY = 'missing_body',
  REQUIRED_FIELD = 'required_field',
  INVALID_TYPE = 'invalid_type',
  INVALID_COORDINATE = 'invalid_coordinate',
  INVALID_ENUM = 'invalid_enum',
  SYSTEM_ERROR = 'system_error',
  CONFIGURATION_ERROR = 'configuration_error'
}

/**
 * Performance benchmark interface
 */
export interface PerformanceBenchmark {
  p95: number;
  mean: number;
  samples: number;
  meetsRequirement: boolean;
  allDurations: number[];
}