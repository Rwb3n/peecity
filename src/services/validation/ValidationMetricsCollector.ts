/**
 * ValidationMetricsCollector
 * 
 * @artifact docs/cookbook/recipe_tiered_validation.md
 * @epic foundation_consolidation_epic
 * @task foundation_consolidation_task2_corrected
 * @tdd-phase GREEN
 * 
 * Handles performance monitoring and validation metrics collection.
 * Single responsibility: metrics collection, monitoring, and reporting.
 * 
 * Features:
 * - P95 latency tracking with sliding window
 * - Tier-specific request and error metrics
 * - Performance benchmark validation
 * - Structured logging integration
 * - Memory-efficient metrics storage
 */

import { performance } from 'perf_hooks';
import { ValidationResult } from '@/lib';
import { createAgentLogger } from '../../utils/logger';
import { ValidationMetricsCollectorInterface, ValidationMetrics, TierConfig, PropertyMetadata } from './interfaces';

/**
 * Validation metrics collector with performance monitoring
 */
export class ValidationMetricsCollector implements ValidationMetricsCollectorInterface {
  private metrics: ValidationMetrics;
  private logger: any;
  private propertyCache: Map<string, PropertyMetadata> | null = null;

  constructor(private logLevel: string = 'info') {
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
      },
      startTime: Date.now()
    };

    // Initialize structured logger
    this.logger = createAgentLogger('validation-metrics');
  }

  /**
   * Start timing a validation operation
   */
  startTimer(): number {
    return performance.now();
  }

  /**
   * Record successful validation metrics
   */
  recordValidation(result: ValidationResult, startTime: number): void {
    const duration = performance.now() - startTime;
    
    // Update performance metrics
    this.updatePerformanceMetrics(duration);
    
    // Update request counts
    this.metrics.totalRequests++;

    // Update tier-specific metrics if validation has tier information
    if (result.validation && (result.validation as any).tierSummary) {
      this.updateTierMetrics((result.validation as any).tierSummary);
    }

    // Log performance warnings for ADR-004 compliance
    if (duration > 25) {
      this.logger.warn('validation_performance_warning', 'Validation exceeded P95 target', {
        duration: `${duration.toFixed(2)}ms`,
        target: '25ms',
        isValid: result.isValid
      });
    }

    // Log structured metrics for monitoring
    this.logger.debug('validation_recorded', 'Validation metrics recorded', {
      duration: `${duration.toFixed(2)}ms`,
      isValid: result.isValid,
      errorCount: result.validation?.errors?.length || 0,
      warningCount: result.validation?.warnings?.length || 0,
      totalRequests: this.metrics.totalRequests
    });
  }

  /**
   * Record validation error metrics
   */
  recordError(error: Error, startTime: number): void {
    const duration = performance.now() - startTime;
    
    // Update performance metrics (errors also count toward performance)
    this.updatePerformanceMetrics(duration);
    
    // Update request counts
    this.metrics.totalRequests++;

    // Log error with context
    this.logger.error('validation_error_recorded', 'Validation error recorded', {
      duration: `${duration.toFixed(2)}ms`,
      error: error.message,
      totalRequests: this.metrics.totalRequests
    });
  }

  /**
   * Update performance metrics with new duration
   */
  private updatePerformanceMetrics(duration: number): void {
    this.metrics.performanceMetrics.count++;
    this.metrics.performanceMetrics.sum += duration;
    this.metrics.performanceMetrics.min = Math.min(this.metrics.performanceMetrics.min, duration);
    this.metrics.performanceMetrics.max = Math.max(this.metrics.performanceMetrics.max, duration);
    
    // Keep P95 calculation data with sliding window (max 1000 samples)
    this.metrics.performanceMetrics.p95.push(duration);
    if (this.metrics.performanceMetrics.p95.length > 1000) {
      this.metrics.performanceMetrics.p95.shift();
    }

    // Calculate average for current metrics
    this.metrics.performanceMetrics.average = 
      this.metrics.performanceMetrics.sum / this.metrics.performanceMetrics.count;
  }

  /**
   * Update tier-specific metrics from validation result
   */
  private updateTierMetrics(tierSummary: { [tierName: string]: { provided: number } }): void {
    Object.keys(tierSummary).forEach(tier => {
      if (tier in this.metrics.requestsByTier) {
        (this.metrics.requestsByTier as any)[tier]++;
      }
    });
  }

  /**
   * Record tier-specific errors
   */
  private recordTierErrors(errors: any[]): void {
    errors.forEach(error => {
      const tier = error.tier || 'specialized';
      if (tier in this.metrics.errorsByTier) {
        (this.metrics.errorsByTier as any)[tier]++;
      }
    });
  }

  /**
   * Get current metrics summary
   */
  getMetrics(): ValidationMetrics {
    // Calculate current P95
    const p95Duration = this.calculateP95(this.metrics.performanceMetrics.p95);
    
    return {
      ...this.metrics,
      performanceMetrics: {
        ...this.metrics.performanceMetrics,
        p95: [p95Duration] // Format for backward compatibility
      }
    };
  }

  /**
   * Get validation summary for API endpoint
   */
  async getValidationSummary(): Promise<any> {
    const p95Duration = this.calculateP95(this.metrics.performanceMetrics.p95);
    const avgDuration = this.metrics.performanceMetrics.average || 0;
    const uptime = Date.now() - this.metrics.startTime;

    return {
      totalRequests: this.metrics.totalRequests,
      requestsByTier: this.metrics.requestsByTier,
      errorsByTier: this.metrics.errorsByTier,
      performance: {
        averageDuration: avgDuration,
        p95Duration: p95Duration,
        minDuration: this.metrics.performanceMetrics.min === Infinity ? 0 : this.metrics.performanceMetrics.min,
        maxDuration: this.metrics.performanceMetrics.max,
        sampleCount: this.metrics.performanceMetrics.count
      },
      uptime: uptime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset all collected metrics (useful for testing)
   */
  resetMetrics(): void {
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
        p95: [],
        average: 0
      },
      startTime: Date.now()
    };

    this.logger.info('metrics_reset', 'Validation metrics reset');
  }

  /**
   * Calculate P95 from duration array
   */
  private calculateP95(durations: number[]): number {
    if (durations.length === 0) return 0;
    
    const sorted = [...durations].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Set property cache for tier-specific error tracking
   */
  setPropertyCache(propertyCache: Map<string, PropertyMetadata>): void {
    this.propertyCache = propertyCache;
  }

  /**
   * Initialize metrics collector with tier configuration
   */
  async initialize(config: TierConfig): Promise<void> {
    // Build property cache for efficient tier lookups
    this.propertyCache = new Map();
    Object.entries(config.properties).forEach(([name, info]) => {
      this.propertyCache!.set(name, info);
    });

    this.logger.info('metrics_collector_initialized', 'Metrics collector initialized', {
      propertyCount: this.propertyCache.size,
      configVersion: config.version
    });
  }

  /**
   * Get performance benchmark results
   */
  getPerformanceBenchmark(): {
    p95: number;
    mean: number;
    samples: number;
    meetsRequirement: boolean;
  } {
    const p95 = this.calculateP95(this.metrics.performanceMetrics.p95);
    const mean = this.metrics.performanceMetrics.average || 0;
    
    return {
      p95,
      mean,
      samples: this.metrics.performanceMetrics.count,
      meetsRequirement: p95 < 25 // ADR-004 requirement
    };
  }

  /**
   * Get detailed performance metrics for monitoring
   */
  getDetailedMetrics(): {
    requests: ValidationMetrics['requestsByTier'];
    errors: ValidationMetrics['errorsByTier'];
    performance: {
      p95: number;
      p50: number;
      p99: number;
      mean: number;
      min: number;
      max: number;
      samples: number;
    };
    uptime: number;
  } {
    const durations = this.metrics.performanceMetrics.p95;
    const sorted = [...durations].sort((a, b) => a - b);
    
    const p50Index = Math.ceil(sorted.length * 0.50) - 1;
    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    const p99Index = Math.ceil(sorted.length * 0.99) - 1;

    return {
      requests: this.metrics.requestsByTier,
      errors: this.metrics.errorsByTier,
      performance: {
        p95: sorted[Math.max(0, p95Index)] || 0,
        p50: sorted[Math.max(0, p50Index)] || 0,
        p99: sorted[Math.max(0, p99Index)] || 0,
        mean: this.metrics.performanceMetrics.average || 0,
        min: this.metrics.performanceMetrics.min === Infinity ? 0 : this.metrics.performanceMetrics.min,
        max: this.metrics.performanceMetrics.max,
        samples: this.metrics.performanceMetrics.count
      },
      uptime: Date.now() - this.metrics.startTime
    };
  }

  /**
   * Export metrics in Prometheus format (for observability)
   */
  exportPrometheusMetrics(): string {
    const p95 = this.calculateP95(this.metrics.performanceMetrics.p95);
    const timestamp = Date.now();

    return [
      `# HELP validation_requests_total Total number of validation requests`,
      `# TYPE validation_requests_total counter`,
      `validation_requests_total ${this.metrics.totalRequests} ${timestamp}`,
      '',
      `# HELP validation_duration_p95_milliseconds P95 validation duration`,
      `# TYPE validation_duration_p95_milliseconds gauge`,
      `validation_duration_p95_milliseconds ${p95.toFixed(2)} ${timestamp}`,
      '',
      `# HELP validation_requests_by_tier_total Requests by property tier`,
      `# TYPE validation_requests_by_tier_total counter`,
      ...Object.entries(this.metrics.requestsByTier).map(([tier, count]) => 
        `validation_requests_by_tier_total{tier="${tier}"} ${count} ${timestamp}`
      ),
      '',
      `# HELP validation_errors_by_tier_total Errors by property tier`,
      `# TYPE validation_errors_by_tier_total counter`,
      ...Object.entries(this.metrics.errorsByTier).map(([tier, count]) => 
        `validation_errors_by_tier_total{tier="${tier}"} ${count} ${timestamp}`
      )
    ].join('\n');
  }
}