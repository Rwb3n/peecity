/**
 * Provider Interface Types - Consolidated Re-exports
 * 
 * @artifact docs/analysis/type-system-organization-analysis.md
 * @epic architecture_optimization_epic
 * @task architecture_optimization_task3
 * @tdd-phase GREEN
 * 
 * Re-exports provider interfaces from their source of truth locations.
 * Eliminates duplication while maintaining @/lib barrel export access.
 * 
 * INTERFACE CONSOLIDATION (Alternative 1):
 * - src/interfaces/ = Source of truth for all provider interfaces
 * - This file = Re-exports only (no duplicate definitions)
 * - Maintains @/lib import access while eliminating duplication
 */

// ============================================================================
// Data Provider Interface Re-exports
// ============================================================================

// Re-export toilet data provider interfaces (source of truth: src/interfaces/toiletDataProvider.ts)
export type { 
  ToiletDataProvider, 
  CachedToiletDataProvider 
} from '../../../interfaces/toiletDataProvider';

// ============================================================================
// Metrics Collection Interface Re-exports  
// ============================================================================

// Re-export metrics collector interfaces (source of truth: src/interfaces/MetricsCollector.ts)
export type { 
  MetricsCollector, 
  MetricsData, 
  MetricsCollectionResult 
} from '../../../interfaces/MetricsCollector';

// ============================================================================
// Alert Notification Interface Re-exports
// ============================================================================

// Re-export alert sender interfaces (source of truth: src/interfaces/AlertSender.ts)
export type { 
  AlertSender, 
  AlertData, 
  AlertSendResult 
} from '../../../interfaces/AlertSender';

// ============================================================================
// Provider Configuration Interfaces (NEW - no duplication)
// ============================================================================

/**
 * Configuration for file-based toilet data provider
 * Note: This is unique to the types system, not duplicated elsewhere
 */
export interface FileToiletDataConfig {
  filePath: string;
  cacheValidityMs?: number;
  encoding?: BufferEncoding;
}