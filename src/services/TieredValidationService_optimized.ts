/**
 * TieredValidationService - Optimized Version
 * 
 * @doc refs docs/cookbook/recipe_tiered_validation.md
 * @doc refs docs/adr/ADR-002-property-tiering.md
 * @artifact docs/cookbook/recipe_tiered_validation.md
 * @task validation_service_tier_0012_task8
 * @tdd-phase REFACTOR
 * 
 * Performance-optimized tier-based validation service for OpenStreetMap properties.
 * Implements single-pass validation, Map-based lookups, and consistent error messaging.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import { ValidationService, ValidationRequest, ValidationResult } from './validationService';
import { validateRequestBody, generateSuggestionId } from '../utils/validation';
import { ErrorFactory } from '../utils/errors';
import { ValidationErrorMessages, ValidationWarningMessages } from '../utils/errorMessages';
import { SuggestionValidation, ValidationError, ValidationWarning } from '../types/suggestions';

// Import property tiers schema for validation
const propertyTiersSchema = require('../../schemas/propertyTiers.schema.json');

/**
 * Tier configuration structure
 */
interface TierConfig {
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
    };
  };
}

/**
 * Property metadata with tier information
 */
interface PropertyMetadata {
  tier: string;
  validationType: string;
  synthetic?: boolean;
  frequency: number;
  description?: string;
}

/**
 * Tier statistics for reporting
 */
interface TierStatistics {
  [tierName: string]: {
    totalCount: number;
    syntheticCount: number;
    osmPropertyCount: number;
  };
}

/**
 * Validation summary organized by tier
 */
interface TierSummary {
  [tierName: string]: {
    provided: number;
    required: number;
    valid: number;
  };
}

/**
 * Enhanced validation error with tier information
 */
interface TieredValidationError extends ValidationError {
  tier?: string;
}

/**
 * Enhanced validation warning with tier information
 */
interface TieredValidationWarning extends ValidationWarning {
  tier?: string;
}

/**
 * Enhanced suggestion validation result with tier breakdown
 */
interface TieredSuggestionValidation extends SuggestionValidation {
  errors: TieredValidationError[];
  warnings: TieredValidationWarning[];
  tierSummary?: TierSummary;
  errorsByTier?: { [tierName: string]: number };
}

/**
 * Optimized tier-aware validation service
 * 
 * Key optimizations:
 * - Single-pass validation algorithm
 * - Map-based property lookups (O(1) vs O(n))
 * - Pre-computed core property set
 * - Consistent error message templates
 * - Early exit for critical failures
 */
export class TieredValidationServiceOptimized extends ValidationService {
  private config: TierConfig | null = null;
  private configPath: string;
  private ajv: any; // Ajv instance
  
  // Performance optimization: Use Maps for O(1) lookups
  private propertyMap: Map<string, PropertyMetadata> = new Map();
  private corePropertySet: Set<string> = new Set();
  private enumValuesMap: Map<string, string[]> = new Map();
  
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

  constructor(configPath?: string) {
    super();
    this.configPath = configPath || process.env.TIER_CONFIG || 
      path.join(__dirname, '../config/suggestPropertyTiers.json');
    this.ajv = new Ajv();
    
    // Initialize enum values
    this.enumValuesMap.set('amenity', ['toilets']);
    this.enumValuesMap.set('wheelchair', ['yes', 'no', 'limited']);
    this.enumValuesMap.set('access', ['yes', 'private', 'customers']);
    this.enumValuesMap.set('toilets:disposal', ['flush', 'chemical', 'pitlatrine', 'none']);
  }

  /**
   * Ensure configuration is loaded (alias for initialize, required by metrics service)
   */
  async ensureConfigLoaded(): Promise<void> {
    return this.initialize();
  }

  /**
   * Initialize the service by loading and caching tier configuration
   * @throws {Error} If configuration loading or validation fails
   */
  async initialize(): Promise<void> {
    if (this.config && this.propertyMap.size > 0) {
      return; // Already initialized (caching)
    }

    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(configData);

      // Validate configuration against schema
      const valid = this.ajv.validate(propertyTiersSchema, config);
      if (!valid) {
        throw new Error(`Invalid tier configuration: ${JSON.stringify(this.ajv.errors)}`);
      }

      this.config = config;
      
      // Build optimized lookup structures
      this.buildOptimizedLookups(config);
      
    } catch (error) {
      throw new Error(`Failed to load tier configuration: ${error.message}`);
    }
  }

  /**
   * Build optimized lookup structures for O(1) access
   * @param config The tier configuration
   */
  private buildOptimizedLookups(config: TierConfig): void {
    // Clear existing data
    this.propertyMap.clear();
    this.corePropertySet.clear();
    
    // Build property map and core property set in single pass
    Object.entries(config.properties).forEach(([propName, propData]) => {
      this.propertyMap.set(propName, propData);
      
      if (propData.tier === 'core') {
        this.corePropertySet.add(propName);
      }
    });
  }

  /**
   * Validate suggestion data (convenience method for metrics service)
   * @param data The suggestion data to validate
   * @returns Validation result
   */
  async validateSuggestion(data: any): Promise<ValidationResult> {
    const request: ValidationRequest = {
      body: JSON.stringify(data),
      headers: {},
      method: 'POST',
      url: '/api/suggest'
    };
    return this.validateRequest(request);
  }

  /**
   * Get property information (required by metrics service)
   * @param propertyName The property name to look up
   * @returns Property metadata
   */
  async getPropertyInfo(propertyName: string): Promise<any> {
    await this.initialize();
    return this.propertyMap.get(propertyName);
  }

  /**
   * Get the loaded configuration
   */
  async getConfiguration(): Promise<TierConfig | null> {
    await this.initialize();
    return this.config;
  }

  /**
   * Get metadata for a specific property (O(1) lookup)
   * @param propertyName The property name to look up
   */
  async getPropertyMetadata(propertyName: string): Promise<PropertyMetadata | undefined> {
    await this.initialize();
    return this.propertyMap.get(propertyName);
  }

  /**
   * Get tier statistics with optimized counting
   */
  async getTierStatistics(): Promise<TierStatistics> {
    await this.initialize();
    const stats: TierStatistics = {};

    if (!this.config) return stats;

    // Initialize tier stats
    Object.keys(this.config.tiers).forEach(tierName => {
      stats[tierName] = {
        totalCount: 0,
        syntheticCount: 0,
        osmPropertyCount: 0
      };
    });

    // Count properties by tier in single pass
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
   * Enhanced validation request with tier awareness and optimizations
   */
  async validateRequest(request: ValidationRequest & { version?: string }): Promise<ValidationResult> {
    await this.initialize();

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

    // Apply v1 field mappings
    const mappedData = this.applyV1FieldMappings(data);
    
    // Determine validation mode
    const isStrictMode = request.version === 'v2';
    
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
        validation,
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
      validation,
      suggestionId
    };
  }

  /**
   * Apply v1 field mappings for backward compatibility
   * Optimized with Map lookups
   */
  private applyV1FieldMappings(data: any): any {
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
    if (!('@id' in mappedData)) {
      mappedData['@id'] = `node/${Date.now()}`;
    }
    if (!('amenity' in mappedData)) {
      mappedData['amenity'] = 'toilets';
    }
    if (!('wheelchair' in mappedData) && !('accessible' in originalData)) {
      mappedData['wheelchair'] = 'no';
    }
    if (!('access' in mappedData)) {
      mappedData['access'] = 'yes';
    }
    if (!('opening_hours' in mappedData) && !('hours' in originalData)) {
      mappedData['opening_hours'] = 'unknown';
    }
    if (!('fee' in mappedData) && !('fee' in originalData)) {
      mappedData['fee'] = false;
    }
  }

  /**
   * Optimized single-pass tier-based validation
   * Key optimization: Process all properties in one pass, using efficient lookups
   */
  private async validateTieredOptimized(data: any): Promise<TieredSuggestionValidation> {
    const errors: TieredValidationError[] = [];
    const warnings: TieredValidationWarning[] = [];
    const tierSummary: TierSummary = {};
    const errorsByTier: { [tierName: string]: number } = {};

    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    // Initialize tier summary efficiently
    Object.keys(this.config.tiers).forEach(tierName => {
      tierSummary[tierName] = { provided: 0, required: 0, valid: 0 };
      errorsByTier[tierName] = 0;
    });

    // Mark all core properties as required
    this.corePropertySet.forEach(propName => {
      tierSummary.core.required++;
    });

    // Single pass validation for all properties
    const processedProps = new Set<string>();

    // First pass: validate core properties (fail fast)
    for (const propName of this.corePropertySet) {
      processedProps.add(propName);
      
      if (!(propName in data) || data[propName] === undefined || data[propName] === null) {
        errors.push({
          field: propName,
          message: TieredValidationServiceOptimized.ERROR_MESSAGES.REQUIRED(propName),
          code: 'required',
          tier: 'core'
        });
        errorsByTier.core++;
      } else {
        tierSummary.core.provided++;
        const propConfig = this.propertyMap.get(propName)!;
        const propErrors = this.validatePropertyOptimized(propName, data[propName], propConfig, 'core');
        
        if (propErrors.length === 0) {
          tierSummary.core.valid++;
        } else {
          errors.push(...propErrors);
          errorsByTier.core += propErrors.length;
        }
      }
    }

    // Early exit if core validation failed (performance optimization)
    if (errors.length > 0 && this.config.tiers.core.strict_validation) {
      return {
        isValid: false,
        errors,
        warnings,
        isDuplicate: false,
        tierSummary,
        errorsByTier
      };
    }

    // Second pass: validate all provided non-core properties
    Object.entries(data).forEach(([propName, value]) => {
      if (processedProps.has(propName)) {
        return; // Already processed in core validation
      }

      const propConfig = this.propertyMap.get(propName);
      
      if (!propConfig) {
        // Unknown property - treat as specialized
        tierSummary.specialized = tierSummary.specialized || { provided: 0, required: 0, valid: 0 };
        tierSummary.specialized.provided++;
        tierSummary.specialized.valid++;
        return;
      }

      const tierName = propConfig.tier;
      tierSummary[tierName].provided++;

      // Process based on tier with optimized validation
      const result = this.validateByTierOptimized(propName, value, propConfig, tierName);
      
      if (result.errors.length > 0) {
        errors.push(...result.errors);
        errorsByTier[tierName] = (errorsByTier[tierName] || 0) + result.errors.length;
      } else {
        tierSummary[tierName].valid++;
      }
      
      if (result.warnings.length > 0) {
        warnings.push(...result.warnings);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      isDuplicate: false,
      tierSummary,
      errorsByTier
    };
  }

  /**
   * Optimized property validation by tier
   */
  private validateByTierOptimized(
    propName: string,
    value: any,
    config: PropertyMetadata,
    tierName: string
  ): { errors: TieredValidationError[], warnings: TieredValidationWarning[] } {
    switch (tierName) {
      case 'high_frequency':
        // Strict validation for high-frequency properties
        const strictErrors = this.validatePropertyOptimized(propName, value, config, tierName);
        return { errors: strictErrors, warnings: [] };
        
      case 'optional':
        // Lenient validation for optional properties
        return this.validateOptionalPropertyOptimized(propName, value, config);
        
      case 'specialized':
        // Basic type checking for specialized properties
        return this.validateSpecializedPropertyOptimized(propName, value, config);
        
      default:
        return { errors: [], warnings: [] };
    }
  }

  /**
   * Optimized strict property validation
   */
  private validatePropertyOptimized(
    propName: string, 
    value: any, 
    config: PropertyMetadata, 
    tierName: string
  ): TieredValidationError[] {
    const errors: TieredValidationError[] = [];

    // Type validation with consistent error messages
    switch (config.validationType) {
      case 'number':
        if (typeof value !== 'number') {
          errors.push({
            field: propName,
            message: ValidationErrorMessages.INVALID_TYPE(propName, 'number'),
            code: 'invalid_type',
            tier: tierName
          });
        } else if (propName === 'lat' && (value < -90 || value > 90)) {
          errors.push({
            field: propName,
            message: ValidationErrorMessages.OUT_OF_RANGE('Latitude', -90, 90) + ' degrees',
            code: 'out_of_range',
            tier: tierName
          });
        } else if (propName === 'lng' && (value < -180 || value > 180)) {
          errors.push({
            field: propName,
            message: ValidationErrorMessages.OUT_OF_RANGE('Longitude', -180, 180) + ' degrees',
            code: 'out_of_range',
            tier: tierName
          });
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field: propName,
            message: ValidationErrorMessages.INVALID_TYPE(propName, 'boolean'),
            code: 'invalid_type',
            tier: tierName
          });
        }
        break;

      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field: propName,
            message: ValidationErrorMessages.INVALID_TYPE(propName, 'string'),
            code: 'invalid_type',
            tier: tierName
          });
        }
        break;

      case 'enum':
        const enumOptions = this.enumValuesMap.get(propName);
        if (enumOptions && !enumOptions.includes(value)) {
          errors.push({
            field: propName,
            message: ValidationErrorMessages.INVALID_ENUM(propName, enumOptions),
            code: 'invalid_enum' as any,
            tier: tierName
          });
        }
        break;
        
      case 'monetary':
        // Monetary values can be boolean (for fee yes/no) or string (for amounts)
        if (typeof value !== 'boolean' && typeof value !== 'string' && typeof value !== 'number') {
          errors.push({
            field: propName,
            message: ValidationErrorMessages.INVALID_TYPE(propName, 'boolean, string, or number'),
            code: 'invalid_type',
            tier: tierName
          });
        }
        break;
    }

    return errors;
  }

  /**
   * Optimized optional property validation
   */
  private validateOptionalPropertyOptimized(
    propName: string, 
    value: any, 
    config: PropertyMetadata
  ): { errors: TieredValidationError[], warnings: TieredValidationWarning[] } {
    const warnings: TieredValidationWarning[] = [];

    // Type coercion for optional properties
    if (config.validationType === 'string' && typeof value !== 'string') {
      warnings.push({
        field: propName,
        message: ValidationWarningMessages.TYPE_COERCED(propName, 'string'),
        code: 'type_coercion' as any,
        tier: 'optional'
      });
    }

    return { errors: [], warnings };
  }

  /**
   * Optimized specialized property validation
   */
  private validateSpecializedPropertyOptimized(
    propName: string, 
    value: any, 
    config: PropertyMetadata
  ): { errors: TieredValidationError[], warnings: TieredValidationWarning[] } {
    const warnings: TieredValidationWarning[] = [];

    // Basic type mismatch warning
    if (config.validationType === 'string' && typeof value !== 'string') {
      warnings.push({
        field: propName,
        message: ValidationWarningMessages.TYPE_MISMATCH(propName),
        code: 'type_mismatch' as any,
        tier: 'specialized'
      });
    }

    return { errors: [], warnings };
  }

  /**
   * Sanitize data with tier awareness (optimized)
   */
  private sanitizeTiered(data: any): any {
    const sanitized: any = {};

    Object.entries(data).forEach(([key, value]) => {
      // Get property config efficiently
      const propConfig = this.propertyMap.get(key);
      
      // Skip empty strings for optional properties
      if (typeof value === 'string' && value.trim() === '' && propConfig?.tier !== 'core') {
        return;
      }

      // Skip null/undefined values for non-core properties
      if ((value === null || value === undefined) && propConfig?.tier !== 'core') {
        return;
      }

      // Type coercion for optional properties
      if (propConfig?.tier === 'optional' && propConfig.validationType === 'string' && typeof value !== 'string') {
        sanitized[key] = String(value);
      } else if (typeof value === 'string') {
        sanitized[key] = value.trim();
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }
}

/**
 * Export singleton instance
 */
export const tieredValidationServiceOptimized = new TieredValidationServiceOptimized();