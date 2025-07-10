/**
 * Monitor Service - Weekly monitoring and Discord notifications
 * 
 * @doc refs docs/architecture-spec.md#monitor-agent
 * 
 * Handles scheduled monitoring tasks including ingest refresh, metrics collection,
 * data analysis, and Discord webhook notifications.
 */

import * as fs from 'fs';
import * as path from 'path';
import { IngestService } from './ingestService';
import { createAgentLogger } from '../utils/logger';
import { AlertSender } from '../interfaces/AlertSender';
import { MetricsCollector } from '../interfaces/MetricsCollector';
import { DiscordAlertSender } from './alerts/DiscordAlertSender';
import { ValidationSummaryMetricsCollector } from './metrics/ValidationSummaryMetricsCollector';
import { PrometheusMetricsCollector } from './metrics/PrometheusMetricsCollector';

const logger = createAgentLogger('monitor-service');

export interface MonitorResult {
  week: string;
  newToilets: number;
  removedToilets: number;
  suggestSubmissions: number;
  errorRate: number;
  p95Latency: number;
  success: boolean;
  error?: string;
}

export interface MonitorConfig {
  discordWebhookUrl?: string;
  metricsApiUrl?: string;
  validationSummaryUrl?: string;
  toiletsDataPath?: string;
  cacheDataPath?: string;
  suggestionsLogPath?: string;
  requestedMetrics?: string[];
  alertSenders?: AlertSender[];
  metricsCollectors?: MetricsCollector[];
}

export class MonitorService {
  private config: Required<Omit<MonitorConfig, 'alertSenders' | 'metricsCollectors' | 'requestedMetrics'>> & {
    requestedMetrics: string[];
    alertSenders: AlertSender[];
    metricsCollectors: MetricsCollector[];
  };
  private ingestService: IngestService;

  constructor(config: MonitorConfig = {}) {
    const discordWebhookUrl = config.discordWebhookUrl || process.env.DISCORD_WEBHOOK_URL || '';
    const metricsApiUrl = config.metricsApiUrl || 'http://localhost:3000/api/metrics';
    const validationSummaryUrl = config.validationSummaryUrl || 'http://localhost:3000/api/validation/summary';
    
    this.config = {
      discordWebhookUrl,
      metricsApiUrl,
      validationSummaryUrl,
      toiletsDataPath: config.toiletsDataPath || path.join(process.cwd(), 'data', 'toilets.geojson'),
      cacheDataPath: config.cacheDataPath || path.join(process.cwd(), 'data', 'monitor-cache', 'toilets-snapshot.json'),
      suggestionsLogPath: config.suggestionsLogPath || path.join(process.cwd(), 'data', 'suggestions.log'),
      requestedMetrics: config.requestedMetrics || ['errorRate', 'p95Latency'],
      alertSenders: config.alertSenders || (discordWebhookUrl ? [new DiscordAlertSender(discordWebhookUrl)] : []),
      metricsCollectors: config.metricsCollectors || [
        new ValidationSummaryMetricsCollector(validationSummaryUrl),
        new PrometheusMetricsCollector(metricsApiUrl)
      ]
    };

    this.ingestService = new IngestService();
  }

  /**
   * Execute the complete monitoring workflow
   * @returns Monitor result with all collected metrics
   */
  async execute(): Promise<MonitorResult> {
    const startTime = Date.now();
    const week = this.getCurrentWeek();

    try {
      logger.info('monitor_start', 'Starting monitor execution', { week });

      // Step 1: Refresh ingest data
      const ingestResult = await this.ingestService.refresh();
      if (!ingestResult.success) {
        logger.warn('ingest_failed', 'Ingest refresh failed', { error: ingestResult.error });
      }

      // Step 2: Analyze data changes
      const { newToilets, removedToilets } = await this.analyzeDataChanges();

      // Step 3: Parse suggestion submissions
      const suggestSubmissions = await this.parseSuggestionSubmissions();

      // Step 4: Collect metrics
      const metricsData = await this.collectMetrics();

      const result: MonitorResult = {
        week,
        newToilets,
        removedToilets,
        suggestSubmissions,
        errorRate: metricsData.errorRate,
        p95Latency: metricsData.p95Latency,
        success: true
      };

      // Step 5: Send alert notifications
      await this.sendAlertNotifications(result);

      // Step 6: Update cache
      await this.updateCache();

      const duration = Date.now() - startTime;
      logger.info('monitor_success', 'Monitor execution completed successfully', {
        ...result,
        durationMs: duration
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('monitor_failed', 'Monitor execution failed', {
        error: errorMessage,
        durationMs: duration,
        week
      });

      return {
        week,
        newToilets: 0,
        removedToilets: 0,
        suggestSubmissions: 0,
        errorRate: 0,
        p95Latency: 0,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get current week identifier (ISO format)
   */
  private getCurrentWeek(): string {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1); // Get Monday of current week
    return monday.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }

  /**
   * Analyze data changes by comparing current data with cached snapshot
   */
  private async analyzeDataChanges(): Promise<{ newToilets: number; removedToilets: number }> {
    try {
      // Read current data
      const currentData = await this.readToiletsData();
      
      // Read cached data
      const cachedData = await this.readCachedData();
      
      // Compare data
      const currentIds = new Set(currentData.features.map(f => f.properties.id));
      const cachedIds = new Set(cachedData.features.map(f => f.properties.id));
      
      const newToilets = currentIds.size - new Set([...currentIds].filter(id => cachedIds.has(id))).size;
      const removedToilets = cachedIds.size - new Set([...cachedIds].filter(id => currentIds.has(id))).size;
      
      logger.info('data_analysis', 'Data change analysis completed', {
        currentCount: currentIds.size,
        cachedCount: cachedIds.size,
        newToilets,
        removedToilets
      });
      
      return { newToilets, removedToilets };
      
    } catch (error) {
      logger.error('data_analysis_failed', 'Data analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { newToilets: 0, removedToilets: 0 };
    }
  }

  /**
   * Parse suggestion submissions from the last week
   */
  private async parseSuggestionSubmissions(): Promise<number> {
    try {
      if (!fs.existsSync(this.config.suggestionsLogPath)) {
        logger.info('suggestions_log_missing', 'Suggestions log file not found');
        return 0;
      }

      const logContent = fs.readFileSync(this.config.suggestionsLogPath, 'utf8');
      const lines = logContent.split('\n').filter(line => line.trim());
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      let count = 0;
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const entryDate = new Date(entry.timestamp);
          if (entryDate >= oneWeekAgo) {
            count++;
          }
        } catch (parseError) {
          // Skip invalid JSON lines
          continue;
        }
      }
      
      logger.info('suggestions_parsed', 'Suggestion submissions parsed', {
        totalLines: lines.length,
        lastWeekCount: count,
        oneWeekAgo: oneWeekAgo.toISOString()
      });
      
      return count;
      
    } catch (error) {
      logger.error('suggestions_parse_failed', 'Failed to parse suggestion submissions', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Collect metrics using configured collectors
   */
  private async collectMetrics(): Promise<{ errorRate: number; p95Latency: number }> {
    try {
      // Try each metrics collector in order
      for (const collector of this.config.metricsCollectors) {
        if (!collector.isAvailable()) {
          continue;
        }

        const result = await collector.collectMetrics(this.config.requestedMetrics);
        if (result.success && result.data) {
          logger.info('metrics_collected', 'Metrics collected successfully', {
            source: result.source,
            metrics: result.data
          });
          return {
            errorRate: result.data.errorRate || 0,
            p95Latency: result.data.p95Latency || 0
          };
        }

        logger.warn('metrics_collection_failed', 'Metrics collection failed', {
          source: result.source,
          error: result.error
        });
      }

      // Default values if all collectors fail
      logger.warn('all_metrics_failed', 'All metrics collectors failed, using defaults');
      return { errorRate: 0, p95Latency: 0 };
      
    } catch (error) {
      logger.error('metrics_collection_error', 'Metrics collection error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { errorRate: 0, p95Latency: 0 };
    }
  }





  /**
   * Send alert notifications using configured alert senders
   */
  private async sendAlertNotifications(result: MonitorResult): Promise<void> {
    if (this.config.alertSenders.length === 0) {
      logger.info('alerts_skipped', 'No alert senders configured');
      return;
    }

    const alertData = {
      week: result.week,
      newToilets: result.newToilets,
      removedToilets: result.removedToilets,
      suggestSubmissions: result.suggestSubmissions,
      errorRate: result.errorRate,
      p95Latency: result.p95Latency
    };

    // Send to all configured alert channels
    const sendPromises = this.config.alertSenders.map(async (sender) => {
      if (!sender.isConfigured()) {
        logger.warn('alert_sender_not_configured', 'Alert sender not configured', {
          channel: sender.getChannelName()
        });
        return;
      }

      try {
        const result = await sender.sendAlert(alertData);
        if (result.success) {
          logger.info('alert_sent', 'Alert sent successfully', {
            channel: result.channelName,
            week: alertData.week
          });
        } else {
          logger.error('alert_failed', 'Alert sending failed', {
            channel: result.channelName,
            error: result.error
          });
        }
      } catch (error) {
        logger.error('alert_error', 'Alert sending error', {
          channel: sender.getChannelName(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    await Promise.all(sendPromises);
  }


  /**
   * Update cache with current data
   */
  private async updateCache(): Promise<void> {
    try {
      const currentData = await this.readToiletsData();
      
      // Ensure cache directory exists
      const cacheDir = path.dirname(this.config.cacheDataPath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      
      fs.writeFileSync(this.config.cacheDataPath, JSON.stringify(currentData, null, 2));
      
      logger.info('cache_updated', 'Cache updated successfully', {
        path: this.config.cacheDataPath,
        featuresCount: currentData.features.length
      });
      
    } catch (error) {
      logger.error('cache_update_failed', 'Failed to update cache', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Read current toilets data
   */
  private async readToiletsData(): Promise<any> {
    if (!fs.existsSync(this.config.toiletsDataPath)) {
      throw new Error(`Toilets data file not found: ${this.config.toiletsDataPath}`);
    }
    
    const content = fs.readFileSync(this.config.toiletsDataPath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Read cached toilets data
   */
  private async readCachedData(): Promise<any> {
    if (!fs.existsSync(this.config.cacheDataPath)) {
      // Return empty data if cache doesn't exist
      return { features: [] };
    }
    
    const content = fs.readFileSync(this.config.cacheDataPath, 'utf8');
    return JSON.parse(content);
  }
}

/**
 * Create singleton monitor service instance
 */
export const monitorService = new MonitorService();

// CommonJS compatibility for Jest tests
module.exports = { MonitorService, monitorService };