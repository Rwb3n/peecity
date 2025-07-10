/**
 * Pre-aggregation service for metrics to improve query performance
 * 
 * @artifact docs/cookbook/recipe_metrics_export.md
 * @task metrics_export_0013_task6
 * @tdd-phase REFACTOR
 */

import { percentileCalculators, StreamingPercentileCalculator } from '@/utils/percentiles';
import { getValidationService } from '@/app/api/metrics/route';
import { invalidateSummaryCache } from '@/app/api/validation/summary/route';

export class MetricsAggregationService {
  private updateInterval: NodeJS.Timeout | null = null;
  private lastUpdateTime: number = Date.now();

  constructor(private intervalMs: number = 10000) {}

  /**
   * Start periodic updates of pre-computed percentiles
   */
  start(): void {
    if (this.updateInterval) {
      return; // Already running
    }

    // Initial update
    this.updatePercentiles();

    // Schedule periodic updates
    this.updateInterval = setInterval(() => {
      this.updatePercentiles();
    }, this.intervalMs);
  }

  /**
   * Stop periodic updates
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Update pre-computed percentiles from metrics
   */
  private updatePercentiles(): void {
    try {
      const validationService = getValidationService();
      const metrics = validationService.getMetrics();

      // Update time window calculators with recent data
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

      // For demo purposes, we'll add the current p95 values
      // In production, this would integrate with time-series data
      if (metrics.performanceMetrics.p95.length > 0) {
        metrics.performanceMetrics.p95.forEach(value => {
          // Add to all calculators
          percentileCalculators['all'].add(value);
          
          // Add to time-windowed calculators based on simulated timestamps
          // In production, you'd filter by actual timestamps
          percentileCalculators['1h'].add(value);
          percentileCalculators['24h'].add(value);
          percentileCalculators['7d'].add(value);
        });
      }

      this.lastUpdateTime = now;
    } catch (error) {
      console.error('Error updating percentiles:', error);
    }
  }

  /**
   * Reset all percentile calculators and invalidate cache
   */
  reset(): void {
    // Reset all calculators
    Object.values(percentileCalculators).forEach(calc => calc.reset());
    
    // Invalidate cached summaries
    invalidateSummaryCache();
    
    this.lastUpdateTime = Date.now();
  }

  /**
   * Get last update timestamp
   */
  getLastUpdateTime(): number {
    return this.lastUpdateTime;
  }

  /**
   * Check if service is running
   */
  isRunning(): boolean {
    return this.updateInterval !== null;
  }
}

// Global instance
let aggregationService: MetricsAggregationService | null = null;

export function getAggregationService(): MetricsAggregationService {
  if (!aggregationService) {
    aggregationService = new MetricsAggregationService();
    aggregationService.start();
  }
  return aggregationService;
}

export function resetAggregationService(): void {
  if (aggregationService) {
    aggregationService.reset();
  }
}