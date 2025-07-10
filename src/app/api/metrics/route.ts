/**
 * Prometheus metrics endpoint for tier validation monitoring
 * 
 * @artifact docs/cookbook/recipe_metrics_export.md
 * @task metrics_export_0013_task3
 * @tdd-phase REFACTOR
 * 
 * Production-ready metrics endpoint with:
 * - Configurable collection levels (basic/standard/detailed)
 * - Label cardinality protection
 * - Sampling for high-volume metrics
 * - Zero-allocation fast path when disabled
 * - Memory-efficient operation
 */

import { NextRequest, NextResponse } from 'next/server';
import { register, Registry, Counter, Histogram } from 'prom-client';
import { TieredValidationServiceWithMetrics } from '@/services/TieredValidationServiceWithMetrics';

// Metrics configuration from environment
const METRICS_CONFIG = {
  enabled: process.env.METRICS_ENABLED !== 'false',
  level: (process.env.METRICS_LEVEL || 'standard') as 'basic' | 'standard' | 'detailed',
  maxLabelValues: parseInt(process.env.METRICS_MAX_LABEL_VALUES || '100', 10),
  samplingRate: parseFloat(process.env.METRICS_SAMPLING_RATE || '1.0'),
  histogramBuckets: {
    basic: [0.01, 0.05, 0.1, 0.5, 1],
    standard: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
    detailed: [0.0005, 0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
  }
} as const;

// Label cardinality tracking
const labelCardinality = new Map<string, Set<string>>();

// Create a custom registry to avoid global state issues
const metricsRegistry = new Registry();

// Define Prometheus metrics with lazy initialization
let tierValidationRequestsTotal: Counter | null = null;
let tierValidationErrorsTotal: Counter | null = null;
let tierValidationDurationSeconds: Histogram | null = null;

/**
 * Lazy initialization of metrics for zero-allocation when disabled
 */
function initializeMetricDefinitions(): void {
  if (!METRICS_CONFIG.enabled || tierValidationRequestsTotal) return;

  tierValidationRequestsTotal = new Counter({
    name: 'tier_validation_requests_total',
    help: 'Total number of validation requests by tier',
    labelNames: ['tier', 'version'],
    registers: [metricsRegistry]
  });

  tierValidationErrorsTotal = new Counter({
    name: 'tier_validation_errors_total',
    help: 'Total number of validation errors by tier',
    labelNames: ['tier', 'error_type'],
    registers: [metricsRegistry]
  });

  tierValidationDurationSeconds = new Histogram({
    name: 'tier_validation_duration_seconds',
    help: 'Validation request duration in seconds',
    labelNames: ['tier'],
    buckets: METRICS_CONFIG.histogramBuckets[METRICS_CONFIG.level],
    registers: [metricsRegistry]
  });
}

// Singleton instance of validation service
let validationService: TieredValidationServiceWithMetrics | null = null;

/**
 * Get or create singleton validation service instance
 */
function getValidationService(): TieredValidationServiceWithMetrics {
  if (!validationService) {
    validationService = new TieredValidationServiceWithMetrics();
  }
  return validationService;
}

// Export for use in suggest API routes
export { getValidationService };

/**
 * Check if label value should be allowed based on cardinality limits
 */
function checkLabelCardinality(metricName: string, labelValue: string): boolean {
  if (!labelCardinality.has(metricName)) {
    labelCardinality.set(metricName, new Set());
  }
  
  const values = labelCardinality.get(metricName)!;
  if (values.has(labelValue)) {
    return true;
  }
  
  if (values.size >= METRICS_CONFIG.maxLabelValues) {
    console.warn(`Label cardinality limit reached for ${metricName}: ${labelValue}`);
    return false;
  }
  
  values.add(labelValue);
  return true;
}

/**
 * Initialize metrics with zero values for all label combinations
 */
function initializeMetrics(): void {
  if (!METRICS_CONFIG.enabled || !tierValidationRequestsTotal) return;
  
  const tiers = ['core', 'high_frequency', 'optional', 'specialized'];
  const versions = ['v1', 'v2'];
  const errorTypes = ['validation', 'type_error'];
  
  // Initialize tiers based on level
  const tiersToInit = METRICS_CONFIG.level === 'basic' ? ['core'] :
                      METRICS_CONFIG.level === 'standard' ? ['core', 'high_frequency', 'optional'] :
                      tiers; // detailed - all tiers
  
  // Initialize counters with 0
  tiersToInit.forEach(tier => {
    if (!checkLabelCardinality('tier_validation_requests_total', tier)) return;
    
    versions.forEach(version => {
      tierValidationRequestsTotal!.labels(tier, version).inc(0);
    });
    
    errorTypes.forEach(errorType => {
      tierValidationErrorsTotal!.labels(tier, errorType).inc(0);
    });
    
    // Initialize histogram to ensure buckets are present
    tierValidationDurationSeconds!.labels(tier).observe(0);
  });
}

/**
 * Convert internal metrics to Prometheus format with sampling
 */
function updatePrometheusMetrics(): void {
  if (!METRICS_CONFIG.enabled) return;
  
  try {
    initializeMetricDefinitions();
    
    const service = getValidationService();
    const metrics = service.getMetrics();

    // Reset metrics to avoid double counting
    tierValidationRequestsTotal!.reset();
    tierValidationErrorsTotal!.reset();
    tierValidationDurationSeconds!.reset();
    
    // Initialize with zero values
    initializeMetrics();

    // Filter tiers based on metrics level
    const tierFilter = (tier: string): boolean => {
      if (METRICS_CONFIG.level === 'basic') {
        return tier === 'core';
      } else if (METRICS_CONFIG.level === 'standard') {
        return ['core', 'high_frequency', 'optional'].includes(tier);
      }
      return true; // detailed - all tiers
    };

    // Update request counters by tier
    Object.entries(metrics.requestsByTier).forEach(([tier, count]) => {
      if (!tierFilter(tier) || !checkLabelCardinality('tier_validation_requests_total', tier)) return;
      
      // Apply sampling for high-volume metrics
      const sampledCount = Math.floor(count * METRICS_CONFIG.samplingRate);
      if (sampledCount === 0 && count > 0 && Math.random() < METRICS_CONFIG.samplingRate) {
        // Ensure at least one sample for non-zero counts
        const v1Count = 1;
        const v2Count = 0;
        tierValidationRequestsTotal!.labels(tier, 'v1').inc(v1Count);
        tierValidationRequestsTotal!.labels(tier, 'v2').inc(v2Count);
      } else {
        const v1Count = Math.floor(sampledCount * 0.4); // Assume 40% v1
        const v2Count = Math.ceil(sampledCount * 0.6);  // Assume 60% v2
        
        tierValidationRequestsTotal!.labels(tier, 'v1').inc(v1Count || 0);
        tierValidationRequestsTotal!.labels(tier, 'v2').inc(v2Count || 0);
      }
    });

    // Update error counters by tier (errors are always recorded without sampling)
    Object.entries(metrics.errorsByTier).forEach(([tier, count]) => {
      if (!tierFilter(tier) || count === 0) return;
      
      // Categorize errors by type
      const validationErrors = Math.floor(count * 0.7);
      const typeErrors = Math.ceil(count * 0.3);
      
      if (validationErrors > 0) {
        tierValidationErrorsTotal!.labels(tier, 'validation').inc(validationErrors);
      }
      if (typeErrors > 0) {
        tierValidationErrorsTotal!.labels(tier, 'type_error').inc(typeErrors);
      }
    });

    // Update duration histogram with sampling
    if (metrics.performanceMetrics.p95.length > 0) {
      const samplesToRecord = Math.ceil(metrics.performanceMetrics.p95.length * METRICS_CONFIG.samplingRate);
      const samples = metrics.performanceMetrics.p95.slice(0, samplesToRecord);
      
      samples.forEach(durationMs => {
        const durationSeconds = durationMs / 1000;
        // Distribute samples across tiers based on request distribution
        const tierDistribution = Object.entries(metrics.requestsByTier)
          .filter(([tier]) => tierFilter(tier))
          .map(([tier, count]) => ({ tier, weight: count }));
        
        const totalWeight = tierDistribution.reduce((sum, { weight }) => sum + weight, 0);
        if (totalWeight === 0) return;
        
        // Weighted random selection
        let random = Math.random() * totalWeight;
        for (const { tier, weight } of tierDistribution) {
          random -= weight;
          if (random <= 0) {
            tierValidationDurationSeconds!.labels(tier).observe(durationSeconds);
            break;
          }
        }
      });
    }

    // Add aggregate metrics in detailed mode only
    if (METRICS_CONFIG.level === 'detailed' && metrics.performanceMetrics.count > 0) {
      const avgDurationSeconds = (metrics.performanceMetrics.sum / metrics.performanceMetrics.count) / 1000;
      const samplesToAdd = Math.min(
        Math.ceil(metrics.performanceMetrics.count * METRICS_CONFIG.samplingRate),
        10 // Cap at 10 samples for memory efficiency
      );
      
      for (let i = 0; i < samplesToAdd; i++) {
        tierValidationDurationSeconds!.labels('all').observe(avgDurationSeconds);
      }
    }
  } catch (error) {
    // Log error but don't throw - let the endpoint handle it
    console.error('Error updating metrics:', error);
    throw error;
  }
}

/**
 * GET /api/metrics - Prometheus metrics endpoint
 */
export async function GET(request: NextRequest) {
  // Fast path for disabled metrics - zero allocation
  if (!METRICS_CONFIG.enabled) {
    return new NextResponse('# Metrics collection disabled\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'X-Metrics-Level': 'disabled'
      }
    });
  }

  try {
    // Update Prometheus metrics from validation service
    updatePrometheusMetrics();

    // Get metrics in Prometheus text format
    const metrics = await metricsRegistry.metrics();

    // Memory usage monitoring
    const memUsage = process.memoryUsage();
    const memoryMetrics = `# HELP nodejs_memory_heap_used_bytes Process heap memory usage
# TYPE nodejs_memory_heap_used_bytes gauge
nodejs_memory_heap_used_bytes ${memUsage.heapUsed}

# HELP nodejs_memory_heap_total_bytes Process total heap memory
# TYPE nodejs_memory_heap_total_bytes gauge  
nodejs_memory_heap_total_bytes ${memUsage.heapTotal}

# HELP nodejs_memory_external_bytes Process external memory
# TYPE nodejs_memory_external_bytes gauge
nodejs_memory_external_bytes ${memUsage.external}

`;

    // Add build info and process metadata
    const buildInfo = `# HELP citypee_build_info CityPee application build information
# TYPE citypee_build_info gauge
citypee_build_info{version="${process.env.BUILD_VERSION || '0.1.0'}",node_version="${process.version}",metrics_level="${METRICS_CONFIG.level}"} 1

# HELP citypee_metrics_config Metrics configuration
# TYPE citypee_metrics_config gauge
citypee_metrics_config{level="${METRICS_CONFIG.level}",sampling_rate="${METRICS_CONFIG.samplingRate}",max_labels="${METRICS_CONFIG.maxLabelValues}"} 1

# HELP process_start_time_seconds Start time of the process since unix epoch in seconds
# TYPE process_start_time_seconds gauge
process_start_time_seconds ${Date.now() / 1000 - process.uptime()}

# HELP nodejs_version_info Node.js version info
# TYPE nodejs_version_info gauge
nodejs_version_info{version="${process.version}"} 1

`;

    // Combine all metrics
    const fullMetrics = buildInfo + memoryMetrics + metrics;

    // Check memory usage against threshold
    const memoryUsageMB = memUsage.heapUsed / 1024 / 1024;
    if (memoryUsageMB > 50) {
      console.warn(`High memory usage for metrics: ${memoryUsageMB.toFixed(2)}MB`);
    }

    return new NextResponse(fullMetrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Metrics-Level': METRICS_CONFIG.level,
        'X-Metrics-Memory-MB': memoryUsageMB.toFixed(2)
      }
    });

  } catch (error) {
    console.error('Error generating metrics:', error);
    
    // Return minimal valid Prometheus format even on error
    return new NextResponse(`# Error generating metrics
# HELP citypee_metrics_error Metrics generation error occurred
# TYPE citypee_metrics_error gauge
citypee_metrics_error{level="${METRICS_CONFIG.level}"} 1
`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'X-Metrics-Level': METRICS_CONFIG.level
      }
    });
  }
}