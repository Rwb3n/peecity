/**
 * Configuration Types
 * 
 * @artifact docs/analysis/type-system-organization-analysis.md
 * @epic architecture_optimization_epic
 * @task architecture_optimization_task2
 * @tdd-phase GREEN
 * 
 * System configuration interfaces for validation, rate limiting, and more.
 * Centralizes all configuration-related type definitions.
 * 
 * Sources for migration:
 * - src/utils/config.ts: ValidationConfig, RateLimitConfig, DuplicateDetectionConfig,
 *   FilePathsConfig, SystemConfig
 * - src/utils/fileLogWriter.ts: FileLogConfig
 * 
 * Total: 6 configuration interfaces to consolidate.
 */

// ============================================================================
// Validation Configuration
// ============================================================================

/**
 * Validation configuration interface
 */
export interface ValidationConfig {
  coordinates: {
    latRange: { min: number; max: number };
    lngRange: { min: number; max: number };
    precision: number;
  };
  strings: {
    maxNameLength: number;
    maxDescriptionLength: number;
    maxAddressLength: number;
    maxHoursLength: number;
  };
  numbers: {
    maxFee: number;
    minFee: number;
  };
  email: {
    maxLength: number;
    pattern: RegExp;
  };
}

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

/**
 * Rate limiting configuration interface
 */
export interface RateLimitConfig {
  maxSubmissions: number;
  windowDuration: number; // milliseconds
  cleanupInterval: number; // milliseconds
}

// ============================================================================
// Duplicate Detection Configuration
// ============================================================================

/**
 * Duplicate detection configuration interface
 */
export interface DuplicateDetectionConfig {
  thresholdMeters: number;
  spatialIndexCellSize: number; // degrees
  useCaching: boolean;
  maxSearchRadius: number; // meters
}

// ============================================================================
// File Paths Configuration
// ============================================================================

/**
 * File paths configuration interface
 */
export interface FilePathsConfig {
  logDir: string;
  suggestionsLog: string;
  toiletsData: string;
}

// ============================================================================
// File Log Configuration
// ============================================================================

/**
 * File log writer configuration
 * Note: This was found in src/utils/fileLogWriter.ts
 */
export interface FileLogConfig {
  filePath: string;
  maxFileSize?: number; // bytes
  maxFiles?: number;
  encoding?: BufferEncoding;
}

// ============================================================================
// System Configuration
// ============================================================================

/**
 * Complete system configuration interface
 */
export interface SystemConfig {
  validation: ValidationConfig;
  rateLimit: RateLimitConfig;
  duplicateDetection: DuplicateDetectionConfig;
  filePaths: FilePathsConfig;
}