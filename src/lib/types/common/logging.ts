/**
 * Logging Types
 * 
 * @artifact docs/analysis/type-system-organization-analysis.md
 * @epic architecture_optimization_epic
 * @task architecture_optimization_task2
 * @tdd-phase GREEN
 * 
 * Structured logging interfaces for consistent logging across services.
 * Provides type-safe logging patterns for all agents and services.
 * 
 * Sources for migration:
 * - src/utils/logger.ts: LogEntry, LoggerConfig
 * 
 * Total: 2 logging interfaces to consolidate.
 */

// ============================================================================
// Log Entry Types
// ============================================================================

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  action: string;
  data?: any;
  metadata?: {
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    duration?: number;
  };
}

// ============================================================================
// Logger Configuration
// ============================================================================

/**
 * Logger configuration
 */
export interface LoggerConfig {
  logDir: string;
  maxFileSize: number; // bytes
  maxFiles: number;
  enableConsole: boolean;
  level: 'info' | 'warn' | 'error' | 'debug';
}