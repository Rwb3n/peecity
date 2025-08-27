import { ValidationResult, ValidationRequest } from '@/lib';
import { ValidationService } from './interfaces';
import { validateRequestBody, generateSuggestionId, ErrorFactory } from '../../lib';
import { validateServiceResponse, createSchemaValidationError } from '../../lib/validation/schemas';
import { SuggestionValidation, SuggestionValidationError, ValidationWarning } from '../../types/suggestions';
import { 
  TierConfig, 
  ConfigurationLoader, 
  ValidationMetricsCollectorInterface, 
  PerformanceOptimizer, 
  ValidationLogger,
  ValidationContext,
  TieredValidationResult
} from './interfaces';

/**
 * Enhanced validation error with tier information
 */
interface TieredSuggestionValidationError extends SuggestionValidationError {
  tier?: string;
}

/**
 * Enhanced validation warning with tier information
 */
interface TieredValidationWarning extends ValidationWarning {
  tier?: string;
}

/**
 * Tier summary structure
 */
interface TierSummary {
  [tierName: string]: {
    total: number;
    provided: number;
    valid: number;
  };
}

/**
 * Clean TieredValidationService using dependency injection
 * 
 * Single responsibility: orchestrating validation using injected dependencies.
 * No configuration complexity - behavior determined by injected components.
 */
export class TieredValidationService implements ValidationService {
  private config: TierConfig | null = null;

  constructor(
    private configurationLoader: ConfigurationLoader,
    private metricsCollector?: ValidationMetricsCollectorInterface,
    private performanceOptimizer?: PerformanceOptimizer,
    private logger?: ValidationLogger
  ) {
    // Constructor implementation
  }

  /**
   * Initialize the service by loading configuration
   */
  async initialize(): Promise<void> {
    try {
      const configPath = this.getConfigPath();
      this.config = await this.configurationLoader.loadConfiguration(configPath);
      
      // Initialize performance optimizer if provided
      if (this.performanceOptimizer) {
        await this.performanceOptimizer.initialize(this.config);
      }

      this.logger?.info('TieredValidationService initialized', {
        configVersion: this.config.version,
        hasMetrics: !!this.metricsCollector,
        hasOptimizer: !!this.performanceOptimizer
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger?.error('Failed to initialize TieredValidationService', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Schema validation preprocessing step (error-throwing for data integrity)
   * @param result The validation result to validate with schema
   * @returns The same result if valid, throws error if invalid
   */
  private validateResultSchema(result: TieredValidationResult): TieredValidationResult {
    const schemaValidationStart = performance.now();
    const schemaResult = validateServiceResponse(result);
    const schemaValidationDuration = performance.now() - schemaValidationStart;
    
    if (!schemaResult.isValid) {
      this.logger?.error('TieredValidationService: Result schema validation failed', {
        errors: schemaResult.errors,
        validationDurationMs: schemaValidationDuration
      });
      
      // Error-throwing mode for data integrity (as recommended by skeptic)
      throw createSchemaValidationError('serviceResponse', schemaResult.errors || [], result);
    }
    
    this.logger?.debug('TieredValidationService: Result schema validation passed', {
      validationDurationMs: schemaValidationDuration
    });
    
    return result;
  }

  /**
   * Main validation method using injected dependencies
   */
  async validateRequest(request: ValidationRequest, context: ValidationContext = {}): Promise<TieredValidationResult> {
    // Ensure service is initialized
    if (!this.config) {
      await this.initialize();
    }

    const startTime = this.metricsCollector?.startTimer();

    try {
      // Parse request body
      const { isValid: bodyValid, data, error: bodyError } = validateRequestBody(request.body);
      
      if (!bodyValid) {
        const error = bodyError?.includes('JSON') 
          ? ErrorFactory.invalidJson(bodyError)
          : ErrorFactory.missingBody();
        
        const result: TieredValidationResult = {
          isValid: false,
          error
        };

        // Record error metrics if collector is available
        if (this.metricsCollector && startTime !== undefined) {
          this.metricsCollector.recordError(new Error(bodyError || 'Invalid body'), startTime);
        }

        return this.validateResultSchema(result);
      }

      // Apply v1 field mappings if optimizer is available (for backward compatibility)
      const mappedData = this.performanceOptimizer 
        ? this.performanceOptimizer.applyV1FieldMappings(data)
        : data;

      // Perform validation - use optimizer if available, otherwise basic validation
      let validationResult: ValidationResult;
      if (this.performanceOptimizer) {
        this.logger?.debug('Using optimized validation');
        validationResult = await this.performanceOptimizer.validateOptimized(request, this.config!);
      } else {
        this.logger?.debug('Using basic validation');
        validationResult = await this.performBasicValidation(mappedData, context);
      }

      // Enhance result with tiered information
      const tieredResult: TieredValidationResult = {
        ...validationResult,
        data: mappedData,
        sanitizedData: this.sanitizeData(mappedData),
        suggestionId: generateSuggestionId()
      };

      // Record success metrics if collector is available
      if (this.metricsCollector && startTime !== undefined) {
        this.metricsCollector.recordValidation(tieredResult, startTime);
      }

      this.logger?.debug('Validation completed', {
        isValid: tieredResult.isValid,
        errorCount: tieredResult.validation?.errors?.length || 0,
        warningCount: tieredResult.validation?.warnings?.length || 0
      });

      return tieredResult;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logger?.error('Validation request failed', { 
        error: errorMessage,
        stack: errorStack 
      });

      // Record error metrics if collector is available
      if (this.metricsCollector && startTime !== undefined) {
        const errorToRecord = error instanceof Error ? error : new Error(errorMessage);
        this.metricsCollector.recordError(errorToRecord, startTime);
      }

      const errorResult = {
        isValid: false,
        error: ErrorFactory.internalError(errorMessage)
      };
      
      return this.validateResultSchema(errorResult);
    }
  }

  /**
   * Basic validation without performance optimizations
   * Used when no PerformanceOptimizer is injected
   */
  private async performBasicValidation(data: any, context: ValidationContext): Promise<ValidationResult> {
    if (!this.config) {
      throw new Error('Service not initialized');
    }

    const errors: TieredSuggestionValidationError[] = [];
    const warnings: TieredValidationWarning[] = [];
    const tierSummary: TierSummary = {
      core: { total: 0, provided: 0, valid: 0 },
      high_frequency: { total: 0, provided: 0, valid: 0 },
      optional: { total: 0, provided: 0, valid: 0 },
      specialized: { total: 0, provided: 0, valid: 0 }
    };

    // Validate core required properties
    const coreProperties = ['lat', 'lng'];
    for (const prop of coreProperties) {
      tierSummary.core.total++;
      
      if (prop in data) {
        tierSummary.core.provided++;
        
        // Basic coordinate validation
        if (prop === 'lat') {
          const lat = data[prop];
          if (typeof lat !== 'number' || lat < -90 || lat > 90) {
            errors.push({
              field: prop,
              message: 'Latitude must be a number between -90 and 90',
              code: 'out_of_range',
              tier: 'core'
            });
          } else {
            tierSummary.core.valid++;
          }
        } else if (prop === 'lng') {
          const lng = data[prop];
          if (typeof lng !== 'number' || lng < -180 || lng > 180) {
            errors.push({
              field: prop,
              message: 'Longitude must be a number between -180 and 180',
              code: 'out_of_range',
              tier: 'core'
            });
          } else {
            tierSummary.core.valid++;
          }
        }
      } else {
        errors.push({
          field: prop,
          message: `${prop} is required`,
          code: 'required',
          tier: 'core'
        });
      }
    }

    // Basic validation for other properties
    Object.keys(data).forEach(prop => {
      if (!coreProperties.includes(prop)) {
        const propertyInfo = this.getPropertyInfo(prop);
        const tier = propertyInfo?.tier || 'specialized';
        
        tierSummary[tier].total++;
        tierSummary[tier].provided++;
        tierSummary[tier].valid++; // Basic validation just accepts most values
      }
    });

    const validation: SuggestionValidation = {
      isValid: errors.length === 0,
      errors,
      warnings,
      isDuplicate: false,
      tierSummary
    };

    const validationResult = {
      isValid: errors.length === 0,
      validation
    };
    
    return this.validateResultSchema(validationResult);
  }

  /**
   * Get property information (basic implementation)
   */
  private getPropertyInfo(property: string): { tier: string } | null {
    if (!this.config) return null;
    
    const propertyData = this.config.properties[property];
    return propertyData ? { tier: propertyData.tier } : null;
  }

  /**
   * Sanitize data (basic implementation)
   */
  private sanitizeData(data: any): any {
    const sanitized = { ...data };

    // Remove null/undefined values
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === null || sanitized[key] === undefined) {
        delete sanitized[key];
      }
    });

    // Ensure coordinate types
    if ('lat' in sanitized) {
      sanitized.lat = Number(sanitized.lat);
    }
    if ('lng' in sanitized) {
      sanitized.lng = Number(sanitized.lng);
    }

    // Trim string values
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim();
      }
    });

    return sanitized;
  }

  /**
   * Get configuration path
   */
  private getConfigPath(): string {
    return process.env.TIER_CONFIG || 
      require('path').join(process.cwd(), 'src', 'config', 'suggestPropertyTiers.json');
  }

  /**
   * Get current configuration (for compatibility)
   */
  async getConfiguration(): Promise<TierConfig | null> {
    if (!this.config) {
      await this.initialize();
    }
    return this.config;
  }

  /**
   * Get property metadata (for compatibility)
   */
  async getPropertyMetadata(propertyName: string): Promise<any> {
    if (!this.config) {
      await this.initialize();
    }
    
    // Use optimizer if available, otherwise basic lookup
    if (this.performanceOptimizer) {
      return this.performanceOptimizer.getPropertyInfo(propertyName);
    }
    
    return this.config?.properties[propertyName];
  }

  /**
   * Get tier statistics (delegates to optimizer if available)
   */
  async getTierStatistics(): Promise<any> {
    if (this.performanceOptimizer) {
      return this.performanceOptimizer.getTierStatistics();
    }
    
    // Basic implementation
    if (!this.config) {
      await this.initialize();
    }
    
    const stats: { [tierName: string]: any } = {};
    Object.keys(this.config?.tiers || {}).forEach(tierName => {
      stats[tierName] = {
        totalCount: 0,
        syntheticCount: 0,
        osmPropertyCount: 0
      };
    });

    // Count properties by tier
    Object.entries(this.config?.properties || {}).forEach(([propName, propData]) => {
      const tierName = propData.tier;
      if (stats[tierName]) {
        stats[tierName].totalCount++;
        if (propData.synthetic) {
          stats[tierName].syntheticCount++;
        } else {
          stats[tierName].osmPropertyCount++;
        }
      }
    });

    return stats;
  }

  /**
   * Validate suggestion (compatibility method)
   */
  async validateSuggestion(data: any): Promise<ValidationResult> {
    const request: ValidationRequest = {
      body: JSON.stringify(data),
      ipAddress: '127.0.0.1'
    };
    return this.validateRequest(request);
  }

  /**
   * Get validation summary (delegates to metrics collector if available)
   */
  async getValidationSummary(): Promise<any> {
    if (this.metricsCollector) {
      return this.metricsCollector.getValidationSummary();
    }
    
    return { error: 'Metrics collection not enabled' };
  }

  /**
   * Ensure config loaded (compatibility method)
   */
  async ensureConfigLoaded(): Promise<void> {
    if (!this.config) {
      await this.initialize();
    }
  }
}