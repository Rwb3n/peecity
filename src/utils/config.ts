/**
 * Configuration Utilities
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * 
 * Centralized configuration management for validation rules, rate limiting,
 * and other system parameters. Provides type-safe access to configuration
 * values with environment variable overrides.
 */

import * as path from 'path';

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

/**
 * Rate limiting configuration interface
 */
export interface RateLimitConfig {
  maxSubmissions: number;
  windowDuration: number; // milliseconds
  cleanupInterval: number; // milliseconds
}

/**
 * Duplicate detection configuration interface
 */
export interface DuplicateDetectionConfig {
  thresholdMeters: number;
  spatialIndexCellSize: number; // degrees
  useCaching: boolean;
  maxSearchRadius: number; // meters
}

/**
 * File paths configuration interface
 */
export interface FilePathsConfig {
  logDir: string;
  suggestionsLog: string;
  toiletsData: string;
}

/**
 * Complete system configuration interface
 */
export interface SystemConfig {
  validation: ValidationConfig;
  rateLimit: RateLimitConfig;
  duplicateDetection: DuplicateDetectionConfig;
  filePaths: FilePathsConfig;
}

/**
 * Default validation configuration
 */
const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  coordinates: {
    latRange: { min: -90, max: 90 },
    lngRange: { min: -180, max: 180 },
    precision: 6
  },
  strings: {
    maxNameLength: 255,
    maxDescriptionLength: 1000,
    maxAddressLength: 500,
    maxHoursLength: 100
  },
  numbers: {
    maxFee: 1000, // pence
    minFee: 0
  },
  email: {
    maxLength: 254,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
};

/**
 * Default rate limiting configuration
 */
const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxSubmissions: parseInt(process.env.RATE_LIMIT_MAX_SUBMISSIONS || '5'),
  windowDuration: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '60') * 60 * 1000,
  cleanupInterval: parseInt(process.env.RATE_LIMIT_CLEANUP_MINUTES || '15') * 60 * 1000
};

/**
 * Default duplicate detection configuration
 */
const DEFAULT_DUPLICATE_DETECTION_CONFIG: DuplicateDetectionConfig = {
  thresholdMeters: parseInt(process.env.DUPLICATE_THRESHOLD_METERS || '50'),
  spatialIndexCellSize: parseFloat(process.env.SPATIAL_INDEX_CELL_SIZE || '0.01'),
  useCaching: process.env.SPATIAL_INDEX_CACHING !== 'false',
  maxSearchRadius: parseInt(process.env.MAX_SEARCH_RADIUS_METERS || '5000')
};

/**
 * Default file paths configuration
 */
const DEFAULT_FILE_PATHS_CONFIG: FilePathsConfig = {
  logDir: path.join(process.cwd(), 'data'),
  suggestionsLog: path.join(process.cwd(), 'data', 'suggestions.log'),
  toiletsData: path.join(process.cwd(), 'data', 'toilets.geojson')
};

/**
 * Global configuration instance
 */
let globalConfig: SystemConfig | null = null;

/**
 * Create system configuration with optional overrides
 * @param overrides Partial configuration overrides
 * @returns Complete system configuration
 */
export function createConfig(overrides: Partial<SystemConfig> = {}): SystemConfig {
  const config: SystemConfig = {
    validation: { ...DEFAULT_VALIDATION_CONFIG, ...overrides.validation },
    rateLimit: { ...DEFAULT_RATE_LIMIT_CONFIG, ...overrides.rateLimit },
    duplicateDetection: { ...DEFAULT_DUPLICATE_DETECTION_CONFIG, ...overrides.duplicateDetection },
    filePaths: { ...DEFAULT_FILE_PATHS_CONFIG, ...overrides.filePaths }
  };

  // Apply environment variable overrides for validation
  if (process.env.MAX_NAME_LENGTH) {
    config.validation.strings.maxNameLength = parseInt(process.env.MAX_NAME_LENGTH);
  }
  if (process.env.MAX_DESCRIPTION_LENGTH) {
    config.validation.strings.maxDescriptionLength = parseInt(process.env.MAX_DESCRIPTION_LENGTH);
  }

  return config;
}

/**
 * Get or create global configuration instance
 * @param overrides Optional configuration overrides
 * @returns Global system configuration
 */
export function getConfig(overrides?: Partial<SystemConfig>): SystemConfig {
  if (!globalConfig || overrides) {
    globalConfig = createConfig(overrides);
  }
  return globalConfig;
}

/**
 * Reset global configuration (useful for testing)
 */
export function resetConfig(): void {
  globalConfig = null;
}

/**
 * Get validation configuration
 */
export function getValidationConfig(): ValidationConfig {
  return getConfig().validation;
}

/**
 * Get rate limiting configuration
 */
export function getRateLimitConfig(): RateLimitConfig {
  return getConfig().rateLimit;
}

/**
 * Get duplicate detection configuration
 */
export function getDuplicateDetectionConfig(): DuplicateDetectionConfig {
  return getConfig().duplicateDetection;
}

/**
 * Get file paths configuration
 */
export function getFilePathsConfig(): FilePathsConfig {
  return getConfig().filePaths;
}

/**
 * Validate configuration values
 * @param config Configuration to validate
 * @returns Validation result with errors if any
 */
export function validateConfig(config: SystemConfig): { 
  isValid: boolean; 
  errors: string[];
} {
  const errors: string[] = [];

  // Validate coordinate ranges
  if (config.validation.coordinates.latRange.min >= config.validation.coordinates.latRange.max) {
    errors.push('Latitude range: min must be less than max');
  }
  if (config.validation.coordinates.lngRange.min >= config.validation.coordinates.lngRange.max) {
    errors.push('Longitude range: min must be less than max');
  }

  // Validate string lengths
  if (config.validation.strings.maxNameLength <= 0) {
    errors.push('Max name length must be positive');
  }
  if (config.validation.strings.maxDescriptionLength <= 0) {
    errors.push('Max description length must be positive');
  }

  // Validate rate limiting
  if (config.rateLimit.maxSubmissions <= 0) {
    errors.push('Max submissions must be positive');
  }
  if (config.rateLimit.windowDuration <= 0) {
    errors.push('Rate limit window duration must be positive');
  }

  // Validate duplicate detection
  if (config.duplicateDetection.thresholdMeters <= 0) {
    errors.push('Duplicate threshold must be positive');
  }
  if (config.duplicateDetection.spatialIndexCellSize <= 0) {
    errors.push('Spatial index cell size must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get configuration summary for logging/monitoring
 */
export function getConfigSummary(): Record<string, any> {
  const config = getConfig();
  
  return {
    validation: {
      maxNameLength: config.validation.strings.maxNameLength,
      maxDescriptionLength: config.validation.strings.maxDescriptionLength,
      coordinatePrecision: config.validation.coordinates.precision
    },
    rateLimit: {
      maxSubmissions: config.rateLimit.maxSubmissions,
      windowMinutes: Math.round(config.rateLimit.windowDuration / 60000)
    },
    duplicateDetection: {
      thresholdMeters: config.duplicateDetection.thresholdMeters,
      cachingEnabled: config.duplicateDetection.useCaching
    },
    environment: process.env.NODE_ENV || 'development'
  };
}