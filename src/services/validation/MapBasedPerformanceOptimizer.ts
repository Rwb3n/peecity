import { ValidationResult, ValidationRequest } from '@/lib';
import { validateRequestBody, generateSuggestionId, ErrorFactory } from '../../lib';
import { SuggestionValidation } from '../../types/suggestions';
import { 
  PerformanceOptimizer, 
  TierConfig, 
  PropertyMetadata,
  PerformanceBenchmark 
} from './interfaces';

/**
 * Enhanced validation error with tier information
 */
interface TieredValidationError {
  field: string;
  message: string;
  type: string;
  tier: string;
}

/**
 * Enhanced validation warning with tier information
 */
interface TieredValidationWarning {
  field: string;
  message: string;
  type: string;
  tier: string;
}

/**
 * Tier summary for validation results
 */
interface TierSummary {
  [tierName: string]: {
    total: number;
    provided: number;
    valid: number;
  };
}

/**
 * Enhanced validation result with tier breakdown
 */
interface OptimizedValidationResult extends ValidationResult {
  validation?: SuggestionValidation & {
    tierSummary?: TierSummary;
    errorsByTier?: { [tierName: string]: number };
  };
}

/**
 * Map-based performance optimizer for validation operations
 */
export class MapBasedPerformanceOptimizer implements PerformanceOptimizer {
  // Performance optimization: Use Maps for O(1) lookups
  private propertyMap: Map<string, PropertyMetadata> = new Map();
  private corePropertySet: Set<string> = new Set();
  private enumValuesMap: Map<string, Set<string>> = new Map();
  
  // V1 compatibility mappings
  private v1FieldMappings: Map<string, string> = new Map([
    ['accessible', 'wheelchair'],
    ['hours', 'opening_hours'],
    ['payment_contactless', 'payment:contactless']
  ]);
  
  // Standardized error message templates
  private static readonly ERROR_MESSAGES = {
    REQUIRED: (field: string) => `${field} is required`,
    INVALID_TYPE: (field: string, expectedType: string) => `${field} must be a ${expectedType}`,
    OUT_OF_RANGE: (field: string, min: number, max: number) => `${field} must be between ${min} and ${max}`,
    INVALID_ENUM: (field: string, options: string[]) => `${field} must be one of: ${JSON.stringify(options)}`,
    TYPE_COERCED: (field: string, toType: string) => `${field} was coerced to ${toType}`,
    TYPE_MISMATCH: (field: string) => `Type mismatch for ${field}`
  };

  private isInitialized: boolean = false;

  /**
   * Initialize optimizer with tier configuration
   */
  async initialize(config: TierConfig): Promise<void> {
    if (this.isInitialized && this.propertyMap.size > 0) {
      return; // Already initialized (caching)
    }

    try {
      // Build optimized lookup structures
      this.buildOptimizedLookups(config);
      
      // Initialize enum values for common properties
      this.initializeEnumValues();
      
      this.isInitialized = true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize performance optimizer: ${errorMessage}`);
    }
  }

  /**
   * Build optimized lookup structures for O(1) access
   */
  private buildOptimizedLookups(config: TierConfig): void {
    // Clear existing data
    this.propertyMap.clear();
    this.corePropertySet.clear();
    this.enumValuesMap.clear();
    
    // Build property map and core property set in single pass
    Object.entries(config.properties).forEach(([propName, propData]) => {
      this.propertyMap.set(propName, propData);
      
      if (propData.tier === 'core') {
        this.corePropertySet.add(propName);
      }

      // Cache enum values for properties that have them
      if (propData.enumValues && propData.enumValues.length > 0) {
        this.enumValuesMap.set(propName, new Set(propData.enumValues));
      }
    });
  }

  /**
   * Initialize enum values for common properties
   */
  private initializeEnumValues(): void {
    // Common enum values for validation
    this.enumValuesMap.set('amenity', new Set(['toilets']));
    this.enumValuesMap.set('wheelchair', new Set(['yes', 'no', 'limited']));
    this.enumValuesMap.set('access', new Set(['yes', 'private', 'customers']));
    this.enumValuesMap.set('toilets:disposal', new Set(['flush', 'chemical', 'pitlatrine', 'none']));
  }

  /**
   * Perform optimized validation using Map-based lookups
   */
  async validateOptimized(request: ValidationRequest, config: TierConfig): Promise<OptimizedValidationResult> {
    if (!this.isInitialized) {
      await this.initialize(config);
    }

    // Parse request body
    const { isValid: bodyValid, data, error: bodyError } = validateRequestBody(request.body);
    
    if (!bodyValid) {
      const error = bodyError?.includes('JSON') 
        ? ErrorFactory.invalidJson(bodyError)
        : ErrorFactory.missingBody();
      
      return {
        isValid: false,
        error
      };
    }

    // Apply v1 field mappings for backward compatibility
    const mappedData = this.applyV1FieldMappings(data);
    
    // Determine validation mode (v2 is stricter)
    const isStrictMode = (request as any).version === 'v2';
    
    // Add defaults for v1 compatibility mode only
    if (!isStrictMode) {
      this.addV1Defaults(mappedData, data);
    }

    // Perform optimized tier-based validation
    const validation = await this.validateTieredOptimized(mappedData);
    
    if (!validation.isValid) {
      const errorDetails = validation.errors.map(e => `${e.field}: ${e.message}`).join('; ');
      const validationError = ErrorFactory.validation('Validation failed', validation, errorDetails);
      
      return {
        isValid: false,
        data: mappedData,
        sanitizedData: this.sanitizeTiered(mappedData),
        validation: {
          isValid: validation.isValid,
          isDuplicate: false, // Add missing required property
          errors: validation.errors.map(err => ({
            field: err.field,
            message: err.message,
            code: 'invalid_type' as const // Convert type to code
          })),
          warnings: validation.warnings.map(warn => ({
            field: warn.field,
            message: warn.message,
            code: 'formatting_issue' as const // Convert to valid warning code
          }))
        },
        suggestionId: generateSuggestionId(),
        error: {
          ...validationError,
          statusCode: validationError.statusCode,
          type: 'VALIDATION_ERROR',
          message: validationError.message,
          details: validationError.details
        }
      };
    }

    // Sanitize the data
    const sanitizedData = this.sanitizeTiered(mappedData);
    
    // Generate suggestion ID
    const suggestionId = generateSuggestionId();

    return {
      isValid: true,
      data: mappedData,
      sanitizedData,
      validation: {
        isValid: validation.isValid,
        isDuplicate: false, // Add missing required property
        errors: validation.errors.map(err => ({
          field: err.field,
          message: err.message,
          code: 'invalid_type' as const // Convert type to code
        })),
        warnings: validation.warnings.map(warn => ({
          field: warn.field,
          message: warn.message,
          code: 'formatting_issue' as const // Convert to valid warning code
        }))
      },
      suggestionId
    };
  }

  /**
   * Apply v1 field mappings for backward compatibility
   * Optimized with Map lookups
   */
  applyV1FieldMappings(data: any): any {
    const mapped = { ...data };

    // Handle v1 field mappings efficiently
    this.v1FieldMappings.forEach((osmField, v1Field) => {
      if (v1Field in mapped && !(osmField in mapped)) {
        // Convert boolean to string for payment fields
        if (v1Field === 'payment_contactless' && typeof mapped[v1Field] === 'boolean') {
          mapped[osmField] = mapped[v1Field] ? 'yes' : 'no';
        } else {
          mapped[osmField] = mapped[v1Field];
        }
      }
    });

    // Handle accessible boolean to wheelchair string
    if ('accessible' in mapped && typeof mapped.accessible === 'boolean' && !('wheelchair' in data)) {
      mapped.wheelchair = mapped.accessible ? 'yes' : 'no';
    }

    // Handle fee as number (v1) to boolean + charge
    if ('fee' in mapped && typeof mapped.fee === 'number') {
      const amount = mapped.fee;
      mapped.fee = amount > 0;
      if (amount > 0) {
        mapped.charge = `${amount.toFixed(2)} GBP`;
      }
    }

    return mapped;
  }

  /**
   * Add v1 compatibility defaults
   */
  private addV1Defaults(mappedData: any, originalData: any): void {
    // Add synthetic @id field for v1 compatibility
    if (!('@id' in mappedData)) {
      mappedData['@id'] = `v1_suggestion_${Date.now()}`;
    }

    // Add amenity default
    if (!('amenity' in mappedData)) {
      mappedData.amenity = 'toilets';
    }

    // Convert v1 boolean fields to OSM strings
    if ('accessible' in originalData && typeof originalData.accessible === 'boolean') {
      mappedData.wheelchair = originalData.accessible ? 'yes' : 'no';
    }

    // Set default access if not provided
    if (!('access' in mappedData)) {
      mappedData.access = 'yes';
    }

    // Convert hours format
    if ('hours' in originalData && !('opening_hours' in mappedData)) {
      mappedData.opening_hours = originalData.hours;
    }
  }

  /**
   * Optimized tier-based validation algorithm
   * Single-pass validation with early exit for critical failures
   */
  private async validateTieredOptimized(data: any): Promise<{ isValid: boolean, errors: TieredValidationError[], warnings: TieredValidationWarning[], tierSummary: TierSummary }> {
    const errors: TieredValidationError[] = [];
    const warnings: TieredValidationWarning[] = [];
    const tierSummary: TierSummary = {
      core: { total: 0, provided: 0, valid: 0 },
      high_frequency: { total: 0, provided: 0, valid: 0 },
      optional: { total: 0, provided: 0, valid: 0 },
      specialized: { total: 0, provided: 0, valid: 0 }
    };

    // First pass: Check core required properties with early exit
    const coreProperties = ['lat', 'lng', '@id', 'amenity', 'wheelchair', 'access', 'opening_hours', 'fee'];
    let coreValidationFailed = false;

    for (const prop of coreProperties) {
      tierSummary.core.total++;
      
      if (prop in data) {
        tierSummary.core.provided++;
        
        const validationResult = this.validateProperty(prop, data[prop], 'core');
        if (validationResult.isValid) {
          tierSummary.core.valid++;
        } else {
          errors.push(...validationResult.errors);
          warnings.push(...validationResult.warnings);
          
          // Early exit for critical coordinate failures
          if (prop === 'lat' || prop === 'lng') {
            coreValidationFailed = true;
            break;
          }
        }
      } else if (prop === 'lat' || prop === 'lng') {
        errors.push({
          field: prop,
          message: MapBasedPerformanceOptimizer.ERROR_MESSAGES.REQUIRED(prop),
          type: 'required_field',
          tier: 'core'
        });
        coreValidationFailed = true;
        break; // Early exit for missing critical fields
      }
    }

    // If core validation failed critically, return early
    if (coreValidationFailed) {
      return {
        isValid: false,
        errors,
        warnings,
        tierSummary
      };
    }

    // Second pass: Validate all other properties by tier
    const processedProperties = new Set(coreProperties);
    
    Object.keys(data).forEach(prop => {
      if (processedProperties.has(prop)) return;
      
      const propertyInfo = this.propertyMap.get(prop);
      if (!propertyInfo) {
        // Unknown property - add to specialized tier
        tierSummary.specialized.total++;
        tierSummary.specialized.provided++;
        tierSummary.specialized.valid++;
        return;
      }

      const tier = propertyInfo.tier;
      if (tierSummary[tier]) {
        tierSummary[tier].total++;
        tierSummary[tier].provided++;

        const validationResult = this.validateProperty(prop, data[prop], tier);
        if (validationResult.isValid) {
          tierSummary[tier].valid++;
        } else {
          errors.push(...validationResult.errors);
          warnings.push(...validationResult.warnings);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      tierSummary
    };
  }

  /**
   * Validate individual property based on tier and type
   */
  private validateProperty(property: string, value: any, tier: string): { isValid: boolean, errors: TieredValidationError[], warnings: TieredValidationWarning[] } {
    const errors: TieredValidationError[] = [];
    const warnings: TieredValidationWarning[] = [];

    try {
      // Get property metadata with O(1) lookup
      const propertyInfo = this.propertyMap.get(property);
      
      if (!propertyInfo) {
        // Unknown property - lenient handling for specialized tier
        return { isValid: true, errors: [], warnings: [] };
      }

      // Critical coordinate validation
      if (property === 'lat') {
        if (typeof value !== 'number' || value < -90 || value > 90) {
          errors.push({
            field: property,
            message: MapBasedPerformanceOptimizer.ERROR_MESSAGES.OUT_OF_RANGE(property, -90, 90),
            type: 'invalid_coordinate',
            tier
          });
        }
      } else if (property === 'lng') {
        if (typeof value !== 'number' || value < -180 || value > 180) {
          errors.push({
            field: property,
            message: MapBasedPerformanceOptimizer.ERROR_MESSAGES.OUT_OF_RANGE(property, -180, 180),
            type: 'invalid_coordinate',
            tier
          });
        }
      }

      // Type validation based on property metadata
      const validationType = propertyInfo.validationType;
      
      switch (validationType) {
        case 'boolean':
          if (typeof value !== 'boolean') {
            if (tier === 'core' || tier === 'high_frequency') {
              errors.push({
                field: property,
                message: MapBasedPerformanceOptimizer.ERROR_MESSAGES.INVALID_TYPE(property, 'boolean'),
                type: 'invalid_type',
                tier
              });
            } else {
              // Attempt type coercion for optional/specialized tiers
              const coerced = this.coerceToBoolean(value);
              if (coerced === null) {
                warnings.push({
                  field: property,
                  message: `${property} could not be coerced to boolean`,
                  type: 'coercion_failed',
                  tier
                });
              }
            }
          }
          break;

        case 'string':
          if (typeof value !== 'string') {
            if (tier === 'core' || tier === 'high_frequency') {
              errors.push({
                field: property,
                message: MapBasedPerformanceOptimizer.ERROR_MESSAGES.INVALID_TYPE(property, 'string'),
                type: 'invalid_type',
                tier
              });
            } else {
              warnings.push({
                field: property,
                message: MapBasedPerformanceOptimizer.ERROR_MESSAGES.TYPE_COERCED(property, 'string'),
                type: 'type_coerced',
                tier
              });
            }
          }
          break;

        case 'enum':
          const enumValues = this.enumValuesMap.get(property);
          if (enumValues && !enumValues.has(value)) {
            errors.push({
              field: property,
              message: MapBasedPerformanceOptimizer.ERROR_MESSAGES.INVALID_ENUM(property, Array.from(enumValues)),
              type: 'invalid_enum',
              tier
            });
          }
          break;

        default:
          // Basic type checking for other types
          break;
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: property,
          message: 'Validation system error',
          type: 'system_error',
          tier
        }],
        warnings: []
      };
    }
  }

  /**
   * Attempt to coerce value to boolean
   */
  private coerceToBoolean(value: any): boolean | null {
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === 'yes' || lower === '1') return true;
      if (lower === 'false' || lower === 'no' || lower === '0') return false;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    return null; // Cannot coerce
  }

  /**
   * Sanitize data based on tier requirements
   */
  private sanitizeTiered(data: any): any {
    const sanitized = { ...data };

    // Remove null/undefined values
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === null || sanitized[key] === undefined) {
        delete sanitized[key];
      }
    });

    // Ensure required fields have proper types
    if ('lat' in sanitized) {
      sanitized.lat = Number(sanitized.lat);
    }
    if ('lng' in sanitized) {
      sanitized.lng = Number(sanitized.lng);
    }

    // Sanitize string fields
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim();
      }
    });

    return sanitized;
  }

  /**
   * Get property information with O(1) lookup
   */
  getPropertyInfo(propertyName: string): PropertyMetadata | undefined {
    return this.propertyMap.get(propertyName);
  }

  /**
   * Get tier statistics
   */
  async getTierStatistics(): Promise<{ [tierName: string]: { totalCount: number; syntheticCount: number; osmPropertyCount: number } }> {
    const stats: { [tierName: string]: any } = {};

    // Initialize tier stats based on available tiers
    const tierNames = ['core', 'high_frequency', 'optional', 'specialized'];
    tierNames.forEach(tierName => {
      stats[tierName] = {
        totalCount: 0,
        syntheticCount: 0,
        osmPropertyCount: 0
      };
    });

    // Count properties by tier in single pass using Map
    this.propertyMap.forEach((propData, propName) => {
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
   * Performance validation method for benchmarking
   */
  async validatePerformance(testCases: ValidationRequest[]): Promise<PerformanceBenchmark> {
    const results: number[] = [];
    
    for (const testCase of testCases) {
      const start = performance.now();
      await this.validateOptimized(testCase, {} as TierConfig); // Config passed separately in real usage
      const duration = performance.now() - start;
      results.push(duration);
    }
    
    const p95 = this.calculateP95(results);
    const mean = results.reduce((a, b) => a + b) / results.length;
    
    return {
      p95,
      mean,
      samples: results.length,
      meetsRequirement: p95 < 25, // ADR-004 requirement
      allDurations: results
    };
  }

  /**
   * Calculate P95 from duration array
   */
  private calculateP95(durations: number[]): number {
    if (durations.length === 0) return 0;
    
    const sorted = [...durations].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.max(0, index)];
  }
}