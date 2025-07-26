/**
 * Validation Service Factory
 * 
 * @artifact docs/cookbook/recipe_tiered_validation.md
 * @epic foundation_consolidation_epic
 * @task foundation_consolidation_task2_corrected
 * @tdd-phase GREEN
 * 
 * Factory functions for creating validation services with different compositions.
 * Provides clear, named service configurations instead of complex feature flags.
 * 
 * Usage Examples:
 * - Basic: createBasicValidationService()
 * - Optimized: createOptimizedValidationService() 
 * - With Metrics: createMetricsValidationService()
 * - Full Featured: createFullValidationService()
 */

import { createAgentLogger } from '../../utils/logger';
import { TieredValidationService } from './TieredValidationService';
import { TierConfigurationLoader } from './ConfigurationLoader';
import { ValidationMetricsCollector } from './ValidationMetricsCollector';
import { MapBasedPerformanceOptimizer } from './MapBasedPerformanceOptimizer';
import type { ValidationService, ValidationLogger, ValidationServiceFactoryInterface } from './interfaces';

/**
 * Simple logger wrapper implementing ValidationLogger interface
 */
class ValidationLoggerWrapper implements ValidationLogger {
  constructor(private logger: any) {}

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }
}

/**
 * Validation service factory implementation
 */
export class ValidationServiceFactory implements ValidationServiceFactoryInterface {
  /**
   * Create basic validation service without optimizations or metrics
   * 
   * Use case: Simple validation needs, minimal resource usage
   * Performance: Basic validation logic
   * Features: Core validation only
   */
  createBasicValidationService(): ValidationService {
    const configurationLoader = new TierConfigurationLoader();
    
    return new TieredValidationService(
      configurationLoader
      // No metrics, no optimizer, no logger
    );
  }

  /**
   * Create optimized validation service with performance enhancements
   * 
   * Use case: Production workloads requiring fast validation
   * Performance: Map-based O(1) lookups, optimized algorithms
   * Features: Core validation + performance optimization
   */
  createOptimizedValidationService(): ValidationService {
    const configurationLoader = new TierConfigurationLoader();
    const performanceOptimizer = new MapBasedPerformanceOptimizer();
    
    return new TieredValidationService(
      configurationLoader,
      undefined, // No metrics
      performanceOptimizer
      // No logger
    );
  }

  /**
   * Create validation service with metrics collection
   * 
   * Use case: Monitoring and observability requirements
   * Performance: Basic validation with metrics overhead
   * Features: Core validation + metrics collection + structured logging
   */
  createMetricsValidationService(): ValidationService {
    const configurationLoader = new TierConfigurationLoader();
    const metricsCollector = new ValidationMetricsCollector('info');
    const logger = new ValidationLoggerWrapper(
      createAgentLogger('validation-service-metrics')
    );
    
    return new TieredValidationService(
      configurationLoader,
      metricsCollector,
      undefined, // No optimizer
      logger
    );
  }

  /**
   * Create full-featured validation service with all enhancements
   * 
   * Use case: Production workloads requiring performance + monitoring
   * Performance: Optimized validation with metrics collection
   * Features: All features enabled
   */
  createFullValidationService(): ValidationService {
    const configurationLoader = new TierConfigurationLoader();
    const metricsCollector = new ValidationMetricsCollector('info');
    const performanceOptimizer = new MapBasedPerformanceOptimizer();
    const logger = new ValidationLoggerWrapper(
      createAgentLogger('validation-service-full')
    );
    
    return new TieredValidationService(
      configurationLoader,
      metricsCollector,
      performanceOptimizer,
      logger
    );
  }

  /**
   * Create validation service with custom configuration
   * 
   * Use case: Specific requirements not covered by standard factories
   * Performance: Depends on injected components
   * Features: Customizable based on parameters
   */
  createCustomValidationService(options: {
    enableMetrics?: boolean;
    enableOptimization?: boolean;
    enableLogging?: boolean;
    logLevel?: string;
  }): ValidationService {
    const configurationLoader = new TierConfigurationLoader();
    
    // Conditionally create components based on options
    const metricsCollector = options.enableMetrics 
      ? new ValidationMetricsCollector(options.logLevel || 'info')
      : undefined;
    
    const performanceOptimizer = options.enableOptimization
      ? new MapBasedPerformanceOptimizer()
      : undefined;
    
    const logger = options.enableLogging
      ? new ValidationLoggerWrapper(
          createAgentLogger('validation-service-custom')
        )
      : undefined;
    
    return new TieredValidationService(
      configurationLoader,
      metricsCollector,
      performanceOptimizer,
      logger
    );
  }
}

/**
 * Singleton factory instance for convenient access
 */
const factory = new ValidationServiceFactory();

/**
 * Factory function exports for clean API
 */

/**
 * Create basic validation service
 * No optimizations, no metrics - minimal resource usage
 */
export function createBasicValidationService(): ValidationService {
  return factory.createBasicValidationService();
}

/**
 * Create optimized validation service
 * Performance optimizations enabled - fastest validation
 */
export function createOptimizedValidationService(): ValidationService {
  return factory.createOptimizedValidationService();
}

/**
 * Create validation service with metrics
 * Metrics collection and monitoring enabled
 */
export function createMetricsValidationService(): ValidationService {
  return factory.createMetricsValidationService();
}

/**
 * Create full-featured validation service
 * All features enabled - production ready
 */
export function createFullValidationService(): ValidationService {
  return factory.createFullValidationService();
}

/**
 * Create validation service with custom configuration
 * Flexible configuration for specific needs
 */
export function createCustomValidationService(options: {
  enableMetrics?: boolean;
  enableOptimization?: boolean;
  enableLogging?: boolean;
  logLevel?: string;
}): ValidationService {
  return factory.createCustomValidationService(options);
}

/**
 * Backward compatibility exports
 * 
 * These exports maintain compatibility with existing imports while
 * providing the new composition-based architecture.
 */

/**
 * @deprecated Use createOptimizedValidationService() instead
 * Backward compatibility for TieredValidationServiceOptimized
 */
export function TieredValidationServiceOptimized(): ValidationService {
  console.warn('TieredValidationServiceOptimized is deprecated. Use createOptimizedValidationService() instead.');
  return createOptimizedValidationService();
}

/**
 * @deprecated Use createMetricsValidationService() instead  
 * Backward compatibility for TieredValidationServiceWithMetrics
 */
export function TieredValidationServiceWithMetrics(): ValidationService {
  console.warn('TieredValidationServiceWithMetrics is deprecated. Use createMetricsValidationService() instead.');
  return createMetricsValidationService();
}

/**
 * @deprecated Use createBasicValidationService() instead
 * Backward compatibility for ValidationService
 */
export function ValidationService(): ValidationService {
  console.warn('ValidationService factory is deprecated. Use createBasicValidationService() instead.');
  return createBasicValidationService();
}

/**
 * Get factory instance for advanced usage
 */
export function getValidationServiceFactory(): ValidationServiceFactoryInterface {
  return factory;
}

/**
 * Create validation service based on environment configuration
 * 
 * Uses environment variables to determine service configuration:
 * - VALIDATION_METRICS=true enables metrics
 * - VALIDATION_OPTIMIZATION=true enables optimization  
 * - VALIDATION_LOGGING=true enables logging
 * - VALIDATION_LOG_LEVEL sets log level
 */
export function createValidationServiceFromEnv(): ValidationService {
  const enableMetrics = process.env.VALIDATION_METRICS === 'true';
  const enableOptimization = process.env.VALIDATION_OPTIMIZATION !== 'false'; // Default true
  const enableLogging = process.env.VALIDATION_LOGGING === 'true';
  const logLevel = process.env.VALIDATION_LOG_LEVEL || 'info';

  return factory.createCustomValidationService({
    enableMetrics,
    enableOptimization,
    enableLogging,
    logLevel
  });
}

/**
 * Performance testing utility
 * Creates validation service optimized for benchmarking
 */
export function createPerformanceTestValidationService(): ValidationService {
  // For performance testing, we want optimization but minimal logging overhead
  return factory.createCustomValidationService({
    enableMetrics: true,     // Need metrics to measure performance
    enableOptimization: true, // Need optimization for best performance
    enableLogging: false,    // No logging overhead during benchmarks
    logLevel: 'error'        // Only critical errors
  });
}