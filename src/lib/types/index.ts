/**
 * Type System Barrel Export
 * 
 * @artifact docs/analysis/type-system-organization-analysis.md
 * @epic architecture_optimization_epic
 * @task architecture_optimization_task2
 * @tdd-phase GREEN
 * 
 * Exports only NEW types to avoid conflicts with existing lib exports.
 * These types will be re-exported through src/lib/index.ts for the single @/lib import pattern.
 * 
 * Export strategy: Domain-focused exports (Option A)
 * - Only NEW types that don't conflict with existing lib exports
 * - Maintains single @/lib import pattern
 * - Avoids circular dependencies through selective exclusion
 */

// Domain types (NEW types only)
export * from './domains/toilet';      // ToiletSuggestion, ToiletFeature, etc.
export * from './domains/api';         // OverpassElement, OverpassResponse, etc.
export * from './domains/providers';   // AlertSender, MetricsCollector, etc.
export * from './domains/services';    // DuplicateCheckRequest, IngestOptions, etc.
export * from './domains/validation';  // ValidationRequest, TierConfig, etc. (NEW validation types only)

// Common types (NEW types only)
export * from './common/base';         // Utility types
export * from './common/config';       // Configuration interfaces
export * from './common/logging';      // LogEntry, LoggerConfig
export * from './common/cache';        // GenericCacheEntry (renamed to avoid conflict)

// NOTE: domains/validation is included but the specific conflicting types
// (TierValidationSummary, PropertyValidationContext) remain in lib/validation
// to avoid circular dependencies