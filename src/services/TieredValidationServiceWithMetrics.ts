/**
 * TieredValidationServiceWithMetrics
 * 
 * @artifact docs/cookbook/recipe_tiered_validation.md
 * @task validation_service_tier_0012_task7
 * @tdd-phase GREEN
 * 
 * Extends TieredValidationService to add performance metrics and monitoring.
 * Implements methods required by performance benchmarks.
 */

import { TieredValidationServiceOptimized } from './TieredValidationService_optimized';
import { ValidationRequest, ValidationResult } from './validationService';
import { performance } from 'perf_hooks';
import { createAgentLogger } from '../utils/logger';

/**
 * Validation metrics structure for monitoring and performance tracking
 * @interface ValidationMetrics
 */
interface ValidationMetrics {
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
  };
}

/**
 * Extended validation service with comprehensive metrics collection
 * 
 * Provides performance monitoring, error tracking by tier, and structured logging
 * for operational visibility into the validation system.
 * 
 * @extends TieredValidationService
 * @example
 * ```typescript
 * const service = new TieredValidationServiceWithMetrics();
 * const result = await service.validateSuggestion(data);
 * const metrics = service.getMetrics();
 * console.log(`P95 latency: ${metrics.performanceMetrics.p95[0]}ms`);
 * ```
 */
export class TieredValidationServiceWithMetrics extends TieredValidationServiceOptimized {
  private metrics: ValidationMetrics;
  private logger: any;
  private propertyCache: Map<string, any> | null = null;
  private configLoaded: boolean = false;

  constructor() {
    super();
    
    // Initialize metrics
    this.metrics = {
      totalRequests: 0,
      requestsByTier: {
        core: 0,
        high_frequency: 0,
        optional: 0,
        specialized: 0
      },
      errorsByTier: {
        core: 0,
        high_frequency: 0,
        optional: 0,
        specialized: 0
      },
      performanceMetrics: {
        count: 0,
        sum: 0,
        min: Infinity,
        max: 0,
        p95: []
      }
    };

    // Initialize structured logger
    this.logger = createAgentLogger('validation-metrics');
  }

  /**
   * Ensure configuration is loaded and cached for optimal performance
   * 
   * This method implements lazy loading with caching to minimize I/O operations.
   * Configuration is loaded once and cached in memory for subsequent requests.
   * 
   * @returns Promise that resolves when configuration is loaded
   * @throws {Error} If configuration loading fails
   * 
   * @example
   * ```typescript
   * await service.ensureConfigLoaded();
   * // Configuration is now guaranteed to be available
   * ```
   */
  async ensureConfigLoaded(): Promise<void> {
    if (this.configLoaded && this.propertyCache) {
      return; // Already loaded and cached
    }

    const start = performance.now();
    
    try {
      // Initialize the parent service
      await this.initialize();
      
      // Build property cache for O(1) lookups
      const config = await this.getConfiguration();
      if (config) {
        this.propertyCache = new Map();
        Object.entries(config.properties).forEach(([name, info]) => {
          this.propertyCache!.set(name, info);
        });
      }
      
      this.configLoaded = true;
      
      const duration = performance.now() - start;
      this.logger.info('config_loaded', 'Configuration loaded and cached', {
        duration,
        propertyCount: this.propertyCache?.size || 0
      });
      
    } catch (error) {
      const duration = performance.now() - start;
      this.logger.error('config_load_failed', 'Failed to load configuration', {
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get property metadata with O(1) cached lookup
   * 
   * Retrieves tier and validation information for a specific property.
   * Uses Map-based caching for optimal performance.
   * 
   * @param propertyName - The OSM property name to look up
   * @returns Property metadata including tier, validation type, and frequency
   * 
   * @example
   * ```typescript
   * const info = await service.getPropertyInfo('wheelchair');
   * // Returns: { tier: 'core', validationType: 'enum', frequency: 95 }
   * ```
   */
  async getPropertyInfo(propertyName: string): Promise<any> {
    await this.ensureConfigLoaded();
    
    const start = performance.now();
    const info = this.propertyCache?.get(propertyName);
    const duration = performance.now() - start;

    if (duration > 0.1) { // Log slow lookups
      this.logger.warn('slow_property_lookup', 'Slow property lookup detected', {
        propertyName,
        duration
      });
    }

    return info;
  }

  /**
   * Validate toilet suggestion data with metrics collection
   * 
   * Performs tier-based validation while collecting performance metrics,
   * error counts by tier, and structured logging for monitoring.
   * 
   * @param data - The suggestion data object to validate
   * @returns Validation result with errors, warnings, and tier summary
   * 
   * @example
   * ```typescript
   * const result = await service.validateSuggestion({
   *   lat: 51.5074,
   *   lng: -0.1278,
   *   name: 'Victoria Station Toilets',
   *   wheelchair: 'yes'
   * });
   * 
   * if (result.isValid) {
   *   console.log('Validation passed');
   * } else {
   *   console.log('Errors:', result.errors);
   * }
   * ```
   */
  async validateSuggestion(data: any): Promise<ValidationResult> {
    const start = performance.now();
    
    try {
      // Ensure config is loaded (this will be cached after first call)
      await this.ensureConfigLoaded();
      
      // Convert to validation request format
      const request: ValidationRequest = {
        body: data,
        headers: {},
        method: 'POST',
        url: '/api/suggest'
      };

      // Call parent's validateRequest but it will call initialize() again
      // For now, we'll use the parent implementation as-is
      const result = await this.validateRequest(request);
      
      // Record metrics
      const duration = performance.now() - start;
      this.recordValidationMetrics(result, duration);
      
      // Log validation event
      this.logger.info('validation_completed', 'Validation completed', {
        duration,
        valid: result.isValid,
        errorCount: result.errors?.length || 0,
        warningCount: result.warnings?.length || 0,
        propertyCount: Object.keys(data).length,
        tierSummary: this.getTierSummaryFromResult(result)
      });

      return result;
      
    } catch (error) {
      const duration = performance.now() - start;
      
      this.logger.error('validation_failed', 'Validation failed with error', {
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * Record validation metrics for monitoring and analysis
   * 
   * Updates performance metrics, request counters by tier, and error tracking.
   * Maintains a sliding window of recent durations for p95 calculation.
   * 
   * @param result - The validation result to analyze
   * @param duration - The validation duration in milliseconds
   * 
   * @private
   */
  private recordValidationMetrics(result: ValidationResult, duration: number): void {
    // Update total requests
    this.metrics.totalRequests++;
    
    // Update performance metrics
    this.metrics.performanceMetrics.count++;
    this.metrics.performanceMetrics.sum += duration;
    this.metrics.performanceMetrics.min = Math.min(this.metrics.performanceMetrics.min, duration);
    this.metrics.performanceMetrics.max = Math.max(this.metrics.performanceMetrics.max, duration);
    
    // Keep last 100 durations for p95 calculation (reduced from 1000 for performance)
    this.metrics.performanceMetrics.p95.push(duration);
    if (this.metrics.performanceMetrics.p95.length > 100) {
      this.metrics.performanceMetrics.p95.shift();
    }
    
    // Update requests by tier - count all validated properties
    if (result.data) {
      Object.keys(result.data).forEach(key => {
        const tier = this.getPropertyTier(key);
        if (tier && tier in this.metrics.requestsByTier) {
          this.metrics.requestsByTier[tier as keyof typeof this.metrics.requestsByTier]++;
        }
      });
    }
    
    // Update errors by tier
    if (result.errors) {
      result.errors.forEach((error: any) => {
        const tier = this.getPropertyTier(error.field);
        if (tier && tier in this.metrics.errorsByTier) {
          this.metrics.errorsByTier[tier as keyof typeof this.metrics.errorsByTier]++;
        }
      });
    }
  }

  /**
   * Get the tier classification for a property
   * 
   * @param propertyName - The property name to classify
   * @returns The tier name ('core', 'high_frequency', 'optional', 'specialized') or null
   * 
   * @private
   */
  private getPropertyTier(propertyName: string): string | null {
    const info = this.propertyCache?.get(propertyName);
    return info?.tier || null;
  }

  /**
   * Extract tier-based summary statistics from validation result
   * 
   * Analyzes validation results to provide counts of validated properties
   * and errors organized by tier for monitoring dashboards.
   * 
   * @param result - The validation result to summarize
   * @returns Summary object with validation and error counts by tier
   * 
   * @private
   */
  private getTierSummaryFromResult(result: ValidationResult): any {
    const summary = {
      core: { validated: 0, errors: 0 },
      high_frequency: { validated: 0, errors: 0 },
      optional: { validated: 0, errors: 0 },
      specialized: { validated: 0, errors: 0 }
    };

    // Count validated properties by tier
    if (result.data) {
      Object.keys(result.data).forEach(key => {
        const tier = this.getPropertyTier(key);
        if (tier && tier in summary) {
          summary[tier as keyof typeof summary].validated++;
        }
      });
    }

    // Count errors by tier
    if (result.errors) {
      result.errors.forEach((error: any) => {
        const tier = this.getPropertyTier(error.field);
        if (tier && tier in summary) {
          summary[tier as keyof typeof summary].errors++;
        }
      });
    }

    return summary;
  }

  /**
   * Get current validation metrics snapshot
   * 
   * Returns comprehensive metrics including request counts, errors by tier,
   * and performance statistics with calculated p95 latency.
   * 
   * @returns Current metrics snapshot
   * 
   * @example
   * ```typescript
   * const metrics = service.getMetrics();
   * console.log(`Total requests: ${metrics.totalRequests}`);
   * console.log(`Core tier errors: ${metrics.errorsByTier.core}`);
   * console.log(`P95 latency: ${metrics.performanceMetrics.p95[0]}ms`);
   * ```
   */
  getMetrics(): ValidationMetrics {
    // Calculate p95
    if (this.metrics.performanceMetrics.p95.length > 0) {
      const sorted = [...this.metrics.performanceMetrics.p95].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p95Value = sorted[p95Index];
      
      return {
        ...this.metrics,
        performanceMetrics: {
          ...this.metrics.performanceMetrics,
          p95: [p95Value] // Return single p95 value
        }
      };
    }

    return this.metrics;
  }

  /**
   * Reset all metrics to initial state
   * 
   * Clears all counters, performance data, and error tracking.
   * Useful for testing or starting a new monitoring period.
   * 
   * @example
   * ```typescript
   * service.resetMetrics();
   * // All metrics are now zeroed
   * ```
   */
  resetMetrics(): void {
    this.metrics.totalRequests = 0;
    this.metrics.requestsByTier = {
      core: 0,
      high_frequency: 0,
      optional: 0,
      specialized: 0
    };
    this.metrics.errorsByTier = {
      core: 0,
      high_frequency: 0,
      optional: 0,
      specialized: 0
    };
    this.metrics.performanceMetrics = {
      count: 0,
      sum: 0,
      min: Infinity,
      max: 0,
      p95: []
    };

    // Invalidate cached summaries and reset aggregation service
    try {
      const { resetAggregationService } = require('@/services/MetricsAggregationService');
      resetAggregationService();
    } catch (error) {
      // Service may not be initialized yet
      console.debug('Aggregation service not available for reset');
    }
  }
}