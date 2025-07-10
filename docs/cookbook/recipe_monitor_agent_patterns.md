---
title: "Recipe: Monitor Agent Patterns"
description: "Architectural patterns for building modular, extensible monitoring systems with pluggable alert channels and metrics collectors"
category: cookbook
version: "1.0.0"
last_updated: "2025-07-09"
---

# Recipe: Monitor Agent Patterns

## Overview

This recipe documents the architectural patterns for building modular, extensible monitoring systems with pluggable alert channels and metrics collectors.

## Pattern: Pluggable Alert Channels

### Interface Definition

```typescript
export interface AlertSender {
  sendAlert(data: AlertData): Promise<AlertSendResult>;
  getChannelName(): string;
  isConfigured(): boolean;
}
```

### Benefits

- **Extensibility**: Easy to add new alert channels (Slack, Email, PagerDuty)
- **Testability**: Mock implementations for testing
- **Configuration**: Runtime channel selection
- **Resilience**: Failure in one channel doesn't affect others

### Implementation Example

```typescript
export class DiscordAlertSender implements AlertSender {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async sendAlert(data: AlertData): Promise<AlertSendResult> {
    // Implementation specific to Discord
  }

  getChannelName(): string {
    return 'discord';
  }

  isConfigured(): boolean {
    return this.webhookUrl.trim() !== '';
  }
}
```

### Usage Pattern

```typescript
// Multiple alert channels
const alertSenders: AlertSender[] = [
  new DiscordAlertSender(process.env.DISCORD_WEBHOOK_URL),
  new SlackAlertSender(process.env.SLACK_WEBHOOK_URL),
  new EmailAlertSender(process.env.SMTP_CONFIG)
];

// Send to all configured channels
const sendPromises = alertSenders.map(sender => 
  sender.isConfigured() ? sender.sendAlert(data) : Promise.resolve()
);
await Promise.all(sendPromises);
```

## Pattern: Configurable Metrics Collection

### Interface Definition

```typescript
export interface MetricsCollector {
  collectMetrics(requestedMetrics?: string[]): Promise<MetricsCollectionResult>;
  getSourceName(): string;
  isAvailable(): boolean;
  getAvailableMetrics(): string[];
}
```

### Benefits

- **Flexibility**: Multiple metrics sources (JSON API, Prometheus, logs)
- **Fallback**: Graceful degradation when sources fail
- **Selectivity**: Request only needed metrics
- **Discoverability**: List available metrics per source

### Implementation Example

```typescript
export class ValidationSummaryMetricsCollector implements MetricsCollector {
  private apiUrl: string;
  private availableMetrics = ['errorRate', 'p95Latency'];

  async collectMetrics(requestedMetrics?: string[]): Promise<MetricsCollectionResult> {
    // Fetch from JSON API
    const response = await fetch(this.apiUrl);
    const data = await response.json();
    
    // Extract and filter metrics
    const metrics = this.extractMetrics(data);
    return {
      success: true,
      data: this.filterMetrics(metrics, requestedMetrics),
      source: this.getSourceName()
    };
  }
}
```

### Usage Pattern

```typescript
// Priority-ordered metrics collectors
const metricsCollectors: MetricsCollector[] = [
  new ValidationSummaryMetricsCollector(summaryUrl),  // Preferred
  new PrometheusMetricsCollector(metricsUrl),         // Fallback
  new LogFileMetricsCollector(logPath)                // Last resort
];

// Try collectors in order until one succeeds
for (const collector of metricsCollectors) {
  if (collector.isAvailable()) {
    const result = await collector.collectMetrics(['errorRate', 'p95Latency']);
    if (result.success) {
      return result.data;
    }
  }
}
```

## Pattern: Service-Oriented Architecture

### Core Service Structure

```typescript
export class MonitorService {
  private config: MonitorConfig;
  private alertSenders: AlertSender[];
  private metricsCollectors: MetricsCollector[];

  constructor(config: MonitorConfig = {}) {
    this.alertSenders = config.alertSenders || this.createDefaultAlertSenders();
    this.metricsCollectors = config.metricsCollectors || this.createDefaultMetricsCollectors();
  }

  async execute(): Promise<MonitorResult> {
    // Orchestrate workflow
    const metricsData = await this.collectMetrics();
    const analysisData = await this.analyzeDataChanges();
    const result = this.buildResult(metricsData, analysisData);
    await this.sendAlertNotifications(result);
    return result;
  }
}
```

### Benefits

- **Separation of Concerns**: Each service has a single responsibility
- **Dependency Injection**: Services can be mocked for testing
- **Composition**: Services can be composed differently for different use cases
- **Testability**: Individual services can be tested in isolation

## Pattern: Configuration-Driven Behavior

### Configuration Structure

```typescript
export interface MonitorConfig {
  // Traditional configuration
  discordWebhookUrl?: string;
  metricsApiUrl?: string;
  
  // Behavioral configuration
  requestedMetrics?: string[];
  alertSenders?: AlertSender[];
  metricsCollectors?: MetricsCollector[];
}
```

### Benefits

- **Runtime Flexibility**: Change behavior without code changes
- **Testing**: Inject test implementations
- **Environment-Specific**: Different configurations for dev/staging/production
- **Feature Toggles**: Enable/disable channels based on configuration

### Usage Example

```typescript
// Production configuration
const productionConfig: MonitorConfig = {
  requestedMetrics: ['errorRate', 'p95Latency', 'requestCount'],
  alertSenders: [
    new DiscordAlertSender(process.env.DISCORD_WEBHOOK_URL),
    new PagerDutyAlertSender(process.env.PAGERDUTY_KEY)
  ],
  metricsCollectors: [
    new ValidationSummaryMetricsCollector(process.env.VALIDATION_SUMMARY_URL),
    new PrometheusMetricsCollector(process.env.METRICS_URL)
  ]
};

// Test configuration
const testConfig: MonitorConfig = {
  requestedMetrics: ['errorRate'],
  alertSenders: [new MockAlertSender()],
  metricsCollectors: [new MockMetricsCollector()]
};
```

## Pattern: Graceful Degradation

### Error Handling Strategy

```typescript
// Continue execution even if some components fail
async sendAlertNotifications(result: MonitorResult): Promise<void> {
  const sendPromises = this.alertSenders.map(async (sender) => {
    try {
      const result = await sender.sendAlert(alertData);
      if (result.success) {
        logger.info('alert_sent', 'Alert sent successfully', {
          channel: result.channelName
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
        error: error.message
      });
      // Continue with other senders
    }
  });

  await Promise.all(sendPromises);
}
```

### Benefits

- **Resilience**: System continues functioning even if components fail
- **Observability**: Failures are logged but don't stop execution
- **User Experience**: Partial functionality is better than total failure

## Testing Patterns

### Mock Implementations

```typescript
export class MockAlertSender implements AlertSender {
  public sentAlerts: AlertData[] = [];

  async sendAlert(data: AlertData): Promise<AlertSendResult> {
    this.sentAlerts.push(data);
    return { success: true, channelName: 'mock' };
  }

  getChannelName(): string {
    return 'mock';
  }

  isConfigured(): boolean {
    return true;
  }
}
```

### Test Usage

```typescript
describe('MonitorService', () => {
  it('should send alerts to all configured channels', async () => {
    const mockAlert = new MockAlertSender();
    const service = new MonitorService({
      alertSenders: [mockAlert]
    });

    await service.execute();

    expect(mockAlert.sentAlerts).toHaveLength(1);
    expect(mockAlert.sentAlerts[0]).toMatchObject({
      week: expect.any(String),
      newToilets: expect.any(Number)
    });
  });
});
```

## Migration Strategy

### Incremental Adoption

1. **Extract Interfaces**: Define interfaces for existing functionality
2. **Create Implementations**: Implement interfaces for current behavior
3. **Refactor Service**: Update service to use interfaces
4. **Add New Implementations**: Add new alert channels and metrics sources
5. **Configuration Migration**: Move to configuration-driven approach

### Backward Compatibility

```typescript
// Support both old and new configuration styles
constructor(config: MonitorConfig = {}) {
  // Legacy support
  if (config.discordWebhookUrl && !config.alertSenders) {
    config.alertSenders = [new DiscordAlertSender(config.discordWebhookUrl)];
  }
  
  // New configuration
  this.alertSenders = config.alertSenders || [];
}
```

## Best Practices

### 1. Interface Segregation
- Keep interfaces focused on single responsibilities
- Avoid fat interfaces with many methods

### 2. Dependency Injection
- Accept dependencies through constructor parameters
- Provide sensible defaults for optional dependencies

### 3. Error Handling
- Use Result patterns for operations that can fail
- Log errors but don't let them crash the system

### 4. Configuration Validation
- Validate configuration at startup
- Provide clear error messages for misconfigurations

### 5. Observability
- Log all significant events with structured data
- Include source/channel information in logs
- Use metrics to track success/failure rates

## References

- **Source Code**: `src/services/MonitorService.ts`
- **Interfaces**: `src/interfaces/AlertSender.ts`, `src/interfaces/MetricsCollector.ts`
- **Implementations**: `src/services/alerts/`, `src/services/metrics/`
- **Tests**: `tests/agents/monitor_agent_test.js`
- **Architecture**: `docs/architecture-spec.md#monitor-agent`