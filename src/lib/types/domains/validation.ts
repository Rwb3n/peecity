/**
 * Validation Domain Types
 * 
 * @artifact docs/analysis/type-system-organization-analysis.md
 * @epic architecture_optimization_epic
 * @task architecture_optimization_task2
 * @tdd-phase GREEN
 * 
 * Consolidated validation types NOT already in src/lib/validation/.
 * Complements existing validation utilities with domain-specific types.
 * 
 * Sources for migration:
 * - src/services/validationService.ts: ValidationRequest, ValidationResult
 * - src/services/validation/interfaces.ts: TierConfig, PropertyMetadata, ValidationMetrics,
 *   MetricsCollector, PerformanceOptimizer, ValidationLogger, ConfigurationLoader,
 *   ValidationContext, TieredValidationResult, ValidationService, ServiceComposition,
 *   ValidationServiceFactoryInterface, PerformanceBenchmark
 * - src/types/suggestions.ts: ValidationError, ValidationWarning (if not in lib already)
 * 
 * Note: TierValidationSummary, PropertyValidationContext, ErrorResponse, SchemaValidationResult
 * remain in their current lib locations and will be re-exported.
 */

import { SuggestionValidation } from './toilet';

// ============================================================================
// Core Validation Types
// ============================================================================

/**
 * Validation request structure
 */
export interface ValidationRequest {
  body: string;
  ipAddress: string;
}

/**
 * Validation result structure
 */
export interface ValidationResult {
  isValid: boolean;
  data?: any;
  sanitizedData?: any;
  validation?: SuggestionValidation;
  suggestionId?: string;
  error?: any;
}

// ============================================================================
// Tier Configuration Types
// ============================================================================

/**
 * Tier configuration structure
 */
export interface TierConfig {
  version: string;
  generated_at: string;
  source: string;
  tiers: {
    [tierName: string]: {
      description: string;
      ui_behavior: string;
      validation_requirement: string;
      strict_validation: boolean;
      required: boolean;
    };
  };
  properties: {
    [propertyName: string]: {
      tier: string;
      frequency: number;
      validationType: string;
      synthetic?: boolean;
      description?: string;
      enumValues?: string[];
    };
  };
}

/**
 * Property metadata interface
 */
export interface PropertyMetadata {
  tier: string;
  frequency: number;
  validationType: string;
  synthetic?: boolean;
  description?: string;
  enumValues?: string[];
}

// ============================================================================
// Validation Metrics Types
// ============================================================================

/**
 * Validation metrics structure
 */
export interface ValidationMetrics {
  totalRequests: number;
  requestsByTier: {
    core: number;
    high_frequency: number;
    optional: number;
    specialized: number;
  };
  errorsByTier: {
    core: number;
    high_frequency: number;
    optional: number;
    specialized: number;
  };
  performanceMetrics: {
    count: number;
    sum: number;
    min: number;
    max: number;
    p95: number[];
    average?: number;
  };
  startTime: number;
}

// ============================================================================
// Service Interfaces (Selective)
// ============================================================================

/**
 * Validation context for processing
 */
export interface ValidationContext {
  request: ValidationRequest;
  version: 'v1' | 'v2';
  startTime: number;
  tierMetadata?: Map<string, PropertyMetadata>;
}

/**
 * Tiered validation result extending base result
 */
export interface TieredValidationResult extends ValidationResult {
  tierSummary?: {
    requestedTiers: string[];
    validatedProperties: string[];
    errors: Array<{
      property: string;
      tier: string;
      error: string;
    }>;
  };
  performanceMs?: number;
}

/**
 * Validation service interface
 */
export interface ValidationService {
  /**
   * Validate a suggestion request
   * @param request The validation request
   * @returns Promise with validation result
   */
  validateSuggestion(request: ValidationRequest): Promise<ValidationResult>;
  
  /**
   * Get service metadata
   * @returns Service metadata including version and capabilities
   */
  getMetadata(): {
    version: string;
    capabilities: string[];
    tieringEnabled: boolean;
  };
}

/**
 * Service composition structure
 */
export interface ServiceComposition {
  metricsCollector?: any; // MetricsCollector interface
  performanceOptimizer?: any; // PerformanceOptimizer interface
  logger?: any; // ValidationLogger interface
  configLoader?: any; // ConfigurationLoader interface
}

/**
 * Performance benchmark result
 */
export interface PerformanceBenchmark {
  name: string;
  iterations: number;
  averageMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
}