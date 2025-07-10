/**
 * Prometheus Metrics Collector
 * 
 * @doc refs docs/architecture-spec.md#monitor-agent
 * 
 * Collects metrics from the Prometheus metrics endpoint.
 * Fallback source with text format parsing.
 */

import fetch from 'node-fetch';
import { MetricsCollector, MetricsData, MetricsCollectionResult } from '../../interfaces/MetricsCollector';
import { createAgentLogger } from '../../utils/logger';

const logger = createAgentLogger('prometheus-metrics');

export class PrometheusMetricsCollector implements MetricsCollector {
  private apiUrl: string;
  private availableMetrics = ['errorRate', 'p95Latency'];

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async collectMetrics(requestedMetrics?: string[]): Promise<MetricsCollectionResult> {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        logger.warn('prometheus_metrics_failed', 'Prometheus metrics endpoint failed', {
          status: response.status,
          statusText: response.statusText
        });
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          source: 'prometheus'
        };
      }

      const metricsText = await response.text();
      
      // Parse Prometheus text format
      const metrics: MetricsData = {
        errorRate: this.parsePrometheusMetric(metricsText, 'citypee_validation_errors_total') /
                   this.parsePrometheusMetric(metricsText, 'citypee_validation_requests_total') || 0,
        p95Latency: this.parsePrometheusHistogramP95(metricsText, 'citypee_validation_duration_seconds')
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
      
      logger.info('metrics_collected', 'Metrics collected from Prometheus endpoint', {
        metrics,
        requestedMetrics
      });
      
      return {
        success: true,
        data: metrics,
        source: 'prometheus'
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.warn('prometheus_metrics_error', 'Error collecting from Prometheus metrics', {
        error: errorMessage
      });
      
      return {
        success: false,
        error: errorMessage,
        source: 'prometheus'
      };
    }
  }

  getSourceName(): string {
    return 'prometheus';
  }

  isAvailable(): boolean {
    return this.apiUrl.trim() !== '';
  }

  getAvailableMetrics(): string[] {
    return [...this.availableMetrics];
  }

  /**
   * Parse Prometheus metric value (simplified parser)
   */
  private parsePrometheusMetric(text: string, metricName: string): number {
    const regex = new RegExp(`${metricName}\\s+(\\d+)`);
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Parse Prometheus histogram P95 value (simplified parser)
   */
  private parsePrometheusHistogramP95(text: string, metricName: string): number {
    // Look for histogram buckets and estimate P95 (simplified approach)
    const bucketRegex = new RegExp(`${metricName}_bucket\\{le="([^"]+)"\\}\\s+(\\d+)`, 'g');
    const buckets: Array<{ le: number; count: number }> = [];
    
    let match;
    while ((match = bucketRegex.exec(text)) !== null) {
      const le = parseFloat(match[1]);
      const count = parseInt(match[2]);
      if (!isNaN(le) && !isNaN(count)) {
        buckets.push({ le, count });
      }
    }
    
    // Simple P95 estimation - find bucket where 95% of requests fall
    if (buckets.length > 0) {
      const totalCount = Math.max(...buckets.map(b => b.count));
      const p95Target = totalCount * 0.95;
      
      for (const bucket of buckets.sort((a, b) => a.le - b.le)) {
        if (bucket.count >= p95Target) {
          return bucket.le * 1000; // Convert to milliseconds
        }
      }
    }
    
    return 0;
  }
}