/**
 * Validation Services - Clean API Exports
 * 
 * @artifact docs/cookbook/recipe_tiered_validation.md
 * @epic foundation_consolidation_epic
 * @task foundation_consolidation_task2_corrected
 * @tdd-phase GREEN
 * 
 * Provides clean barrel exports for validation services.
 * Enables simple imports: import { createOptimizedValidationService } from '@/services/validation'
 */

// Core service and interfaces
export { TieredValidationService } from './TieredValidationService';
export type { 
  ValidationService,
  ValidationServiceFactory as ValidationServiceFactoryInterface,
  TierConfig,
  PropertyMetadata,
  ValidationMetrics,
  ValidationMetricsCollectorInterface,
  PerformanceOptimizer,
  ValidationLogger,
  ConfigurationLoader,
  ValidationContext,
  TieredValidationResult,
  ValidationErrorType,
  PerformanceBenchmark
} from './interfaces';

// Component implementations
export { TierConfigurationLoader } from './ConfigurationLoader';
export { ValidationMetricsCollector } from './ValidationMetricsCollector';
export { MapBasedPerformanceOptimizer } from './MapBasedPerformanceOptimizer';

// Factory functions - Primary API
export {
  createBasicValidationService,
  createOptimizedValidationService,
  createMetricsValidationService,
  createFullValidationService,
  createCustomValidationService,
  createValidationServiceFromEnv,
  createPerformanceTestValidationService,
  ValidationServiceFactory,
  getValidationServiceFactory
} from './factory';

// Backward compatibility exports
export {
  TieredValidationServiceOptimized,
  TieredValidationServiceWithMetrics,
  ValidationService as LegacyValidationService
} from './factory';

/**
 * Convenience re-exports from base validation service
 */
export type { ValidationRequest, ValidationResult } from '../validationService';

/**
 * Default export for most common use case
 */
export { createOptimizedValidationService as default } from './factory';