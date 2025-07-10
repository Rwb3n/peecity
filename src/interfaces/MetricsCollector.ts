/**
 * Metrics Collector Interface
 * 
 * @doc refs docs/architecture-spec.md#monitor-agent
 * 
 * Defines the contract for metrics collection services. Allows pluggable
 * metrics sources and configurable metric sets.
 */

export interface MetricsData {
  errorRate: number;
  p95Latency: number;
  [key: string]: number; // Allow additional metrics
}

export interface MetricsCollectionResult {
  success: boolean;
  data?: MetricsData;
  error?: string;
  source: string;
}

export interface MetricsCollector {
  /**
   * Collect metrics from the configured source
   * @param requestedMetrics - List of metrics to collect (optional, defaults to all)
   * @returns Promise with collection result
   */
  collectMetrics(requestedMetrics?: string[]): Promise<MetricsCollectionResult>;
  
  /**
   * Get the source name for logging purposes
   * @returns Source name (e.g., "validation-summary", "prometheus")
   */
  getSourceName(): string;
  
  /**
   * Check if the metrics collector is properly configured
   * @returns true if configured and ready to collect
   */
  isAvailable(): boolean;
  
  /**
   * Get list of available metrics this collector can provide
   * @returns Array of metric names
   */
  getAvailableMetrics(): string[];
}