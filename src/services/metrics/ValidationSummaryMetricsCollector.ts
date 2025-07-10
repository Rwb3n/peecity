/**
 * Validation Summary Metrics Collector
 * 
 * @doc refs docs/architecture-spec.md#monitor-agent
 * 
 * Collects metrics from the validation summary API endpoint.
 * Preferred source due to structured JSON format.
 */

import fetch from 'node-fetch';
import { MetricsCollector, MetricsData, MetricsCollectionResult } from '../../interfaces/MetricsCollector';
import { createAgentLogger } from '../../utils/logger';

const logger = createAgentLogger('validation-summary-metrics');

export class ValidationSummaryMetricsCollector implements MetricsCollector {
  private apiUrl: string;
  private availableMetrics = ['errorRate', 'p95Latency'];

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async collectMetrics(requestedMetrics?: string[]): Promise<MetricsCollectionResult> {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        logger.warn('validation_summary_failed', 'Validation summary endpoint failed', {
          status: response.status,
          statusText: response.statusText
        });
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          source: 'validation-summary'
        };
      }

      const data = await response.json() as any;
      
      // Extract metrics
      const metrics: MetricsData = {
        errorRate: data.errorStats ? 
          (data.errorStats.totalErrors / data.errorStats.totalRequests) || 0 : 0,
        p95Latency: data.performance?.p95Latency || 0
      };

      // Filter requested metrics if specified
      if (requestedMetrics && requestedMetrics.length > 0) {
        const filteredMetrics: MetricsData = { errorRate: 0, p95Latency: 0 };
        for (const metric of requestedMetrics) {
          if (metric in metrics) {
            filteredMetrics[metric] = metrics[metric];
          }
        }
        Object.assign(metrics, filteredMetrics);
      }
      
      logger.info('metrics_collected', 'Metrics collected from validation summary', {
        metrics,
        requestedMetrics
      });
      
      return {
        success: true,
        data: metrics,
        source: 'validation-summary'
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.warn('validation_summary_error', 'Error collecting from validation summary', {
        error: errorMessage
      });
      
      return {
        success: false,
        error: errorMessage,
        source: 'validation-summary'
      };
    }
  }

  getSourceName(): string {
    return 'validation-summary';
  }

  isAvailable(): boolean {
    return this.apiUrl.trim() !== '';
  }

  getAvailableMetrics(): string[] {
    return [...this.availableMetrics];
  }
}