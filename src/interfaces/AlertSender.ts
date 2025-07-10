/**
 * Alert Sender Interface
 * 
 * @doc refs docs/architecture-spec.md#monitor-agent
 * 
 * Defines the contract for alert notification services. Supports multiple
 * channels (Discord, Slack, Email) with pluggable implementations.
 */

export interface AlertData {
  week: string;
  newToilets: number;
  removedToilets: number;
  suggestSubmissions: number;
  errorRate: number;
  p95Latency: number;
}

export interface AlertSendResult {
  success: boolean;
  error?: string;
  channelName: string;
}

export interface AlertSender {
  /**
   * Send alert notification to the configured channel
   * @param data - Alert data to send
   * @returns Promise with send result
   */
  sendAlert(data: AlertData): Promise<AlertSendResult>;
  
  /**
   * Get the channel name for logging purposes
   * @returns Channel name (e.g., "discord", "slack", "email")
   */
  getChannelName(): string;
  
  /**
   * Check if the alert sender is properly configured
   * @returns true if configured and ready to send
   */
  isConfigured(): boolean;
}