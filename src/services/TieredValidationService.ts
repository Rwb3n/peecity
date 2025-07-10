/**
 * TieredValidationService
 * 
 * @doc refs docs/cookbook/recipe_tiered_validation.md
 * @doc refs docs/adr/ADR-002-property-tiering.md
 * 
 * Extends ValidationService to provide tier-based validation for OpenStreetMap properties.
 * Core properties are strictly required, high-frequency properties are strictly validated when present,
 * optional properties are leniently validated, and specialized properties receive basic type checking.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import { ValidationService, ValidationRequest, ValidationResult } from './validationService';
import { validateRequestBody, generateSuggestionId } from '../utils/validation';
import { ErrorFactory } from '../utils/errors';
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
 * Tier statistics
 */
interface TierStatistics {
  [tierName: string]: {
    totalCount: number;
    syntheticCount: number;
    osmPropertyCount: number;
  };
}

/**
 * Validation summary by tier
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
 * Enhanced suggestion validation with tier information
 */
interface TieredSuggestionValidation extends SuggestionValidation {
  errors: TieredValidationError[];
  warnings: TieredValidationWarning[];
  tierSummary?: TierSummary;
  errorsByTier?: { [tierName: string]: number };
}

/**
 * Tier-aware validation service
 */
export class TieredValidationService extends ValidationService {
  private config: TierConfig | null = null;
  private configPath: string;
  private ajv: any; // Ajv instance
  private v1FieldMappings: { [key: string]: string } = {
    accessible: 'wheelchair',
    hours: 'opening_hours',
    payment_contactless: 'payment:contactless'
  };
  
  // Hard-coded enum values for known enum fields
  private enumValues: { [key: string]: string[] } = {
    amenity: ['toilets'],
    wheelchair: ['yes', 'no', 'limited'],
    access: ['yes', 'private', 'customers'],
    'toilets:disposal': ['flush', 'chemical', 'pitlatrine', 'none']
  };

  constructor(configPath?: string) {
    super();
    this.configPath = configPath || process.env.TIER_CONFIG || 
      path.join(__dirname, '../config/suggestPropertyTiers.json');
    this.ajv = new Ajv();
  }

  /**
   * Initialize the service by loading tier configuration
   */
  async initialize(): Promise<void> {
    if (this.config) {
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
    } catch (error) {
      throw new Error(`Failed to load tier configuration: ${error.message}`);
    }
  }

  /**
   * Get the loaded configuration
   */
  async getConfiguration(): Promise<TierConfig | null> {
    await this.initialize();
    return this.config;
  }

  /**
   * Get metadata for a specific property
   */
  async getPropertyMetadata(propertyName: string): Promise<PropertyMetadata | undefined> {
    await this.initialize();
    return this.config?.properties[propertyName];
  }

  /**
   * Get tier statistics
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

    // Count properties by tier
    Object.entries(this.config.properties).forEach(([propName, propData]) => {
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
   * Enhanced validation request with tier awareness
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
    
    // Determine if we're in strict mode (v2) or compatibility mode (v1)
    const isStrictMode = request.version === 'v2';
    
    // Only add defaults for v1 compatibility mode
    if (!isStrictMode) {
      // Add default core properties if missing for v1 compatibility
      if (!('@id' in mappedData)) {
        mappedData['@id'] = `node/${Date.now()}`;
      }
      if (!('amenity' in mappedData)) {
        mappedData['amenity'] = 'toilets';
      }
      
      // For v1 compatibility, provide defaults for other core properties
      if (!('wheelchair' in mappedData) && !('accessible' in data)) {
        mappedData['wheelchair'] = 'no';  // Use valid enum value
      }
      if (!('access' in mappedData)) {
        mappedData['access'] = 'yes';
      }
      if (!('opening_hours' in mappedData) && !('hours' in data)) {
        mappedData['opening_hours'] = 'unknown';
      }
      if (!('fee' in mappedData) && !('fee' in data)) {
        mappedData['fee'] = false;  // Use boolean for v1 compatibility, will be converted later
      }
    }

    // Perform tier-based validation
    const validation = await this.validateTiered(mappedData);
    
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
   */
  private applyV1FieldMappings(data: any): any {
    const mapped = { ...data };

    // Handle v1 field mappings - keep originals for sanitization
    Object.entries(this.v1FieldMappings).forEach(([v1Field, osmField]) => {
      if (v1Field in mapped && !(osmField in mapped)) {
        // Convert boolean to string for payment fields
        if (v1Field === 'payment_contactless' && typeof mapped[v1Field] === 'boolean') {
          mapped[osmField] = mapped[v1Field] ? 'yes' : 'no';
        } else {
          mapped[osmField] = mapped[v1Field];
        }
        // Keep original field for backward compatibility in sanitized output
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
   * Perform tier-based validation
   */
  private async validateTiered(data: any): Promise<TieredSuggestionValidation> {
    const errors: TieredValidationError[] = [];
    const warnings: TieredValidationWarning[] = [];
    const tierSummary: TierSummary = {};
    const errorsByTier: { [tierName: string]: number } = {};

    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    // Initialize tier summary
    Object.keys(this.config.tiers).forEach(tierName => {
      tierSummary[tierName] = { provided: 0, required: 0, valid: 0 };
      errorsByTier[tierName] = 0;
    });

    // Validate core properties (required)
    const coreProperties = Object.entries(this.config.properties)
      .filter(([_, prop]) => prop.tier === 'core');

    for (const [propName, propConfig] of coreProperties) {
      tierSummary.core.required++;

      if (!(propName in data) || data[propName] === undefined || data[propName] === null) {
        errors.push({
          field: propName,
          message: `${propName} is required`,
          code: 'required',
          tier: 'core'
        });
        errorsByTier.core++;
      } else {
        tierSummary.core.provided++;
        const propErrors = this.validateProperty(propName, data[propName], propConfig, 'core');
        if (propErrors.length === 0) {
          tierSummary.core.valid++;
        } else {
          errors.push(...propErrors);
          errorsByTier.core += propErrors.length;
        }
      }
    }

    // Initialize specialized tier if needed
    if (!tierSummary.specialized) {
      tierSummary.specialized = { provided: 0, required: 0, valid: 0 };
    }

    // Validate non-core properties if provided
    Object.entries(data).forEach(([propName, value]) => {
      const propConfig = this.config!.properties[propName];
      
      if (!propConfig) {
        // Unknown property - treat as specialized
        tierSummary.specialized.provided++;
        tierSummary.specialized.valid++;
        return;
      }

      if (propConfig.tier === 'core') {
        return; // Already handled above
      }

      const tierName = propConfig.tier;
      tierSummary[tierName].provided++;

      if (tierName === 'high_frequency') {
        // Strict validation for high-frequency properties
        const propErrors = this.validateProperty(propName, value, propConfig, tierName);
        if (propErrors.length === 0) {
          tierSummary[tierName].valid++;
        } else {
          errors.push(...propErrors);
          errorsByTier[tierName] = (errorsByTier[tierName] || 0) + propErrors.length;
        }
      } else if (tierName === 'optional') {
        // Lenient validation for optional properties
        const result = this.validateOptionalProperty(propName, value, propConfig);
        if (result.errors.length > 0) {
          warnings.push(...result.warnings);
        } else {
          tierSummary[tierName].valid++;
        }
        if (result.warnings.length > 0) {
          warnings.push(...result.warnings);
        }
      } else if (tierName === 'specialized') {
        // Basic type checking for specialized properties
        const result = this.validateSpecializedProperty(propName, value, propConfig);
        tierSummary[tierName].valid++;
        if (result.warnings.length > 0) {
          warnings.push(...result.warnings);
        }
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
   * Validate a property strictly
   */
  private validateProperty(
    propName: string, 
    value: any, 
    config: PropertyMetadata, 
    tierName: string
  ): TieredValidationError[] {
    const errors: TieredValidationError[] = [];

    // Type validation
    switch (config.validationType) {
      case 'number':
        if (typeof value !== 'number') {
          errors.push({
            field: propName,
            message: `${propName} must be a number`,
            code: 'invalid_type',
            tier: tierName
          });
        } else if (propName === 'lat' && (value < -90 || value > 90)) {
          errors.push({
            field: propName,
            message: 'Latitude must be between -90 and 90 degrees',
            code: 'out_of_range',
            tier: tierName
          });
        } else if (propName === 'lng' && (value < -180 || value > 180)) {
          errors.push({
            field: propName,
            message: 'Longitude must be between -180 and 180 degrees',
            code: 'out_of_range',
            tier: tierName
          });
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field: propName,
            message: `${propName} must be a boolean`,
            code: 'invalid_type',
            tier: tierName
          });
        }
        break;

      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field: propName,
            message: `${propName} must be a string`,
            code: 'invalid_type',
            tier: tierName
          });
        }
        break;

      case 'enum':
        const enumOptions = this.enumValues[propName];
        if (enumOptions && !enumOptions.includes(value)) {
          errors.push({
            field: propName,
            message: `${propName} must be one of: ${JSON.stringify(enumOptions)}`,
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
            message: `${propName} must be a boolean, string, or number`,
            code: 'invalid_type',
            tier: tierName
          });
        }
        break;
    }

    return errors;
  }

  /**
   * Validate optional property leniently
   */
  private validateOptionalProperty(
    propName: string, 
    value: any, 
    config: PropertyMetadata
  ): { errors: TieredValidationError[], warnings: TieredValidationWarning[] } {
    const warnings: TieredValidationWarning[] = [];

    // Type coercion for optional properties
    if (config.validationType === 'string' && typeof value !== 'string') {
      warnings.push({
        field: propName,
        message: `${propName} was coerced to string`,
        code: 'type_coercion' as any,
        tier: 'optional'
      });
    }

    return { errors: [], warnings };
  }

  /**
   * Validate specialized property with basic checks
   */
  private validateSpecializedProperty(
    propName: string, 
    value: any, 
    config: PropertyMetadata
  ): { warnings: TieredValidationWarning[] } {
    const warnings: TieredValidationWarning[] = [];

    // Basic type mismatch warning
    if (config.validationType === 'string' && typeof value !== 'string') {
      warnings.push({
        field: propName,
        message: `Type mismatch for ${propName}`,
        code: 'type_mismatch' as any,
        tier: 'specialized'
      });
    }

    return { warnings };
  }

  /**
   * Sanitize data with tier awareness
   */
  private sanitizeTiered(data: any): any {
    const sanitized: any = {};

    Object.entries(data).forEach(([key, value]) => {
      // Skip empty strings for optional properties
      const propConfig = this.config?.properties[key];
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
export const tieredValidationService = new TieredValidationService();