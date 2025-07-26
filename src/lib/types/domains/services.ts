/**
 * Service Domain Types
 * 
 * @artifact docs/analysis/type-system-organization-analysis.md
 * @epic architecture_optimization_epic
 * @task architecture_optimization_task2
 * @tdd-phase GREEN
 * 
 * Service-specific request/response types for internal APIs.
 * Consolidates scattered service interfaces into unified location.
 * 
 * Sources for migration:
 * - src/services/duplicateService.ts: DuplicateCheckRequest, DuplicateCheckResult
 * - src/services/ingestService.ts: IngestOptions, IngestResult
 * - src/services/suggestionLogService.ts: LogSuggestionRequest
 * - src/services/rateLimitService.ts: RateLimitRequest, RateLimitResult
 * - src/services/MonitorService.ts: MonitorConfig, MonitorResult
 * 
 * Note: Many of these are already re-exported in src/services/index.ts
 * which will be updated to use this consolidated location.
 */

import { NextRequest } from 'next/server';
import { SuggestionValidation } from '@/lib';

// ============================================================================
// Duplicate Detection Service Types
// ============================================================================

/**
 * Request for duplicate detection check
 */
export interface DuplicateCheckRequest {
  lat: number;
  lng: number;
  validation: SuggestionValidation;
}

/**
 * Result of duplicate detection check
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  distance: number;
  nearestToiletId: string | null;
  validation: SuggestionValidation;
  error?: any;
}

// ============================================================================
// Ingest Service Types
// ============================================================================

/**
 * Options for toilet data ingestion
 */
export interface IngestOptions {
  overpassApiUrl?: string;
  outputFile?: string;
  retryAttempts?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  userAgent?: string;
  enableCache?: boolean;
  cacheExpiryMs?: number;
}

/**
 * Result of toilet data ingestion
 */
export interface IngestResult {
  success: boolean;
  featuresCount: number;
  outputFile: string;
  generatedAt: string;
  error?: string;
}

// ============================================================================
// Suggestion Logging Service Types
// ============================================================================

/**
 * Request for logging suggestion events
 */
export interface LogSuggestionRequest {
  suggestionId: string;
  action: 'submitted' | 'validation_failed' | 'duplicate_detected' | 'rate_limited' | 'server_error';
  data: any;
  result: SuggestionValidation;
  ipAddress: string;
}

// ============================================================================
// Rate Limiting Service Types
// ============================================================================

/**
 * Request for rate limit check
 */
export interface RateLimitRequest {
  request: NextRequest;
}

/**
 * Result of rate limit check
 */
export interface RateLimitResult {
  allowed: boolean;
  ipAddress: string;
  submissions: number;
  maxSubmissions: number;
  windowDuration: number;
  error?: any;
}

// ============================================================================
// Monitor Service Types
// ============================================================================

/**
 * Configuration for monitoring service
 */
export interface MonitorConfig {
  discordWebhookUrl?: string;
  metricsApiUrl?: string;
  validationSummaryUrl?: string;
  toiletsDataPath?: string;
  cacheDataPath?: string;
  suggestionsLogPath?: string;
  requestedMetrics?: string[];
  alertChannels?: string[];
}

/**
 * Result of monitoring execution
 */
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