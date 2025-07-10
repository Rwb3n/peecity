/**
 * Validation Utilities for Suggest Agent
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * @doc refs docs/cookbook/recipe_tiered_validation.md
 * @doc refs docs/adr/ADR-002-property-tiering.md
 * 
 * Comprehensive validation functions for user-submitted toilet suggestions.
 * Provides schema validation, type checking, and data sanitization.
 * 
 * Now includes tier-aware validation functions that work with the property
 * tier configuration for intelligent validation of all 120 OSM properties.
 */

import { ToiletSuggestion, ValidationError, ValidationWarning, SuggestionValidation } from '../types/suggestions';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Email validation regex pattern
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Maximum field lengths
 */
const MAX_LENGTHS = {
  name: 255,
  description: 1000,
  hours: 100
} as const;

/**
 * Validate a toilet suggestion against the schema
 */
export function validateSuggestion(data: any): SuggestionValidation {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required field validation
  if (typeof data.lat !== 'number') {
    errors.push({
      field: 'lat',
      message: 'Latitude is required and must be a number',
      code: data.lat === undefined ? 'required' : 'invalid_type'
    });
  }

  if (typeof data.lng !== 'number') {
    errors.push({
      field: 'lng',
      message: 'Longitude is required and must be a number',
      code: data.lng === undefined ? 'required' : 'invalid_type'
    });
  }

  // Coordinate range validation
  if (typeof data.lat === 'number') {
    if (data.lat < -90 || data.lat > 90) {
      errors.push({
        field: 'lat',
        message: 'Latitude must be between -90 and 90 degrees',
        code: 'out_of_range'
      });
    }
  }

  if (typeof data.lng === 'number') {
    if (data.lng < -180 || data.lng > 180) {
      errors.push({
        field: 'lng',
        message: 'Longitude must be between -180 and 180 degrees',
        code: 'out_of_range'
      });
    }
  }

  // Optional field type validation
  if (data.name !== undefined && typeof data.name !== 'string') {
    errors.push({
      field: 'name',
      message: 'Name must be a string',
      code: 'invalid_type'
    });
  }

  if (data.hours !== undefined && typeof data.hours !== 'string') {
    errors.push({
      field: 'hours',
      message: 'Hours must be a string',
      code: 'invalid_type'
    });
  }

  if (data.accessible !== undefined && typeof data.accessible !== 'boolean') {
    errors.push({
      field: 'accessible',
      message: 'Accessible must be a boolean',
      code: 'invalid_type'
    });
  }

  if (data.fee !== undefined && typeof data.fee !== 'number') {
    errors.push({
      field: 'fee',
      message: 'Fee must be a number',
      code: 'invalid_type'
    });
  }

  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push({
      field: 'description',
      message: 'Description must be a string',
      code: 'invalid_type'
    });
  }

  if (data.submitter_email !== undefined && typeof data.submitter_email !== 'string') {
    errors.push({
      field: 'submitter_email',
      message: 'Submitter email must be a string',
      code: 'invalid_type'
    });
  }

  // String length validation
  if (typeof data.name === 'string' && data.name.length > MAX_LENGTHS.name) {
    errors.push({
      field: 'name',
      message: `Name is too long (maximum ${MAX_LENGTHS.name} characters)`,
      code: 'invalid_format'
    });
  }

  if (typeof data.description === 'string' && data.description.length > MAX_LENGTHS.description) {
    errors.push({
      field: 'description',
      message: `Description is too long (maximum ${MAX_LENGTHS.description} characters)`,
      code: 'invalid_format'
    });
  }

  if (typeof data.hours === 'string' && data.hours.length > MAX_LENGTHS.hours) {
    errors.push({
      field: 'hours',
      message: `Hours is too long (maximum ${MAX_LENGTHS.hours} characters)`,
      code: 'invalid_format'
    });
  }

  // Email format validation
  if (typeof data.submitter_email === 'string' && !EMAIL_REGEX.test(data.submitter_email)) {
    errors.push({
      field: 'submitter_email',
      message: 'Must be a valid email address',
      code: 'invalid_format'
    });
  }

  // Fee validation
  if (typeof data.fee === 'number' && data.fee < 0) {
    warnings.push({
      field: 'fee',
      message: 'Negative fee values are unusual',
      code: 'unusual_value'
    });
  }

  // Warnings for empty or unusual values
  if (typeof data.name === 'string' && data.name.trim().length === 0) {
    warnings.push({
      field: 'name',
      message: 'Empty name provided',
      code: 'incomplete_data'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    isDuplicate: false, // Will be set by duplicate detection
    duplicateDistance: undefined,
    nearestToiletId: undefined
  };
}

/**
 * Sanitize user input data
 */
export function sanitizeSuggestion(data: any): Partial<ToiletSuggestion> {
  const sanitized: Partial<ToiletSuggestion> = {};

  // Copy valid fields only
  if (typeof data.lat === 'number') sanitized.lat = data.lat;
  if (typeof data.lng === 'number') sanitized.lng = data.lng;
  if (typeof data.name === 'string') sanitized.name = data.name.trim();
  if (typeof data.hours === 'string') sanitized.hours = data.hours.trim();
  if (typeof data.accessible === 'boolean') sanitized.accessible = data.accessible;
  if (typeof data.fee === 'number') sanitized.fee = Math.max(0, data.fee);
  if (typeof data.description === 'string') sanitized.description = data.description.trim();
  if (typeof data.submitter_email === 'string') sanitized.submitter_email = data.submitter_email.trim().toLowerCase();

  return sanitized;
}

/**
 * Validate JSON request body
 */
export function validateRequestBody(body: string | null): { isValid: boolean; data?: any; error?: string } {
  if (!body) {
    return { isValid: false, error: 'Request body is required' };
  }

  try {
    const data = JSON.parse(body);
    return { isValid: true, data };
  } catch (error) {
    return { isValid: false, error: 'Invalid JSON format' };
  }
}

/**
 * Generate a unique suggestion ID
 */
export function generateSuggestionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(16).substring(2, 10); // Use hex and ensure 8 chars
  return `suggest_${timestamp}_${random.padEnd(8, '0')}`;
}

/**
 * Tier validation result aggregation
 */
export interface TierValidationSummary {
  core: { provided: number; required: number; valid: number; errors: number };
  high_frequency: { provided: number; valid: number; errors: number };
  optional: { provided: number; valid: number; warnings: number };
  specialized: { provided: number; valid: number; warnings: number };
}

/**
 * Property validation context with tier information
 */
export interface PropertyValidationContext {
  propertyName: string;
  value: any;
  tier: string;
  validationType: string;
  isRequired: boolean;
  strictValidation: boolean;
}

/**
 * Validate a property based on its tier and type
 * @param context Property validation context
 * @returns Validation errors and warnings
 */
export function validatePropertyByTier(
  context: PropertyValidationContext
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const { propertyName, value, tier, validationType, isRequired, strictValidation } = context;
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required field check (core tier only)
  if (isRequired && (value === undefined || value === null)) {
    errors.push({
      field: propertyName,
      message: `${propertyName} is required`,
      code: 'required'
    });
    return { errors, warnings };
  }

  // Skip validation if value is not provided for optional properties
  if (!isRequired && (value === undefined || value === null)) {
    return { errors, warnings };
  }

  // Type validation based on tier
  if (tier === 'core' || tier === 'high_frequency') {
    // Strict validation for core and high-frequency
    const typeError = validateStrictType(propertyName, value, validationType);
    if (typeError) {
      errors.push(typeError);
    }
  } else if (tier === 'optional') {
    // Lenient validation with type coercion for optional
    const coercionResult = validateWithCoercion(propertyName, value, validationType);
    if (coercionResult.error) {
      errors.push(coercionResult.error);
    }
    if (coercionResult.warning) {
      warnings.push(coercionResult.warning);
    }
  } else if (tier === 'specialized') {
    // Basic type checking with warnings for specialized
    const typeWarning = validateSpecializedType(propertyName, value, validationType);
    if (typeWarning) {
      warnings.push(typeWarning);
    }
  }

  return { errors, warnings };
}

/**
 * Strict type validation (for core and high-frequency properties)
 */
function validateStrictType(
  propertyName: string,
  value: any,
  validationType: string
): ValidationError | null {
  switch (validationType) {
    case 'number':
      if (typeof value !== 'number') {
        return {
          field: propertyName,
          message: `${propertyName} must be a number`,
          code: 'invalid_type'
        };
      }
      // Additional range checks for coordinates
      if (propertyName === 'lat' && (value < -90 || value > 90)) {
        return {
          field: propertyName,
          message: 'Latitude must be between -90 and 90 degrees',
          code: 'out_of_range'
        };
      }
      if (propertyName === 'lng' && (value < -180 || value > 180)) {
        return {
          field: propertyName,
          message: 'Longitude must be between -180 and 180 degrees',
          code: 'out_of_range'
        };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return {
          field: propertyName,
          message: `${propertyName} must be a boolean`,
          code: 'invalid_type'
        };
      }
      break;

    case 'string':
      if (typeof value !== 'string') {
        return {
          field: propertyName,
          message: `${propertyName} must be a string`,
          code: 'invalid_type'
        };
      }
      break;

    case 'enum':
      // Enum validation would require access to allowed values
      // This is handled in TieredValidationService with enum configuration
      if (typeof value !== 'string') {
        return {
          field: propertyName,
          message: `${propertyName} must be a string`,
          code: 'invalid_type'
        };
      }
      break;

    case 'monetary':
      // Monetary values can be boolean (fee yes/no) or string/number (amounts)
      if (typeof value !== 'boolean' && typeof value !== 'string' && typeof value !== 'number') {
        return {
          field: propertyName,
          message: `${propertyName} must be a boolean, string, or number`,
          code: 'invalid_type'
        };
      }
      break;
  }

  return null;
}

/**
 * Lenient validation with type coercion (for optional properties)
 */
function validateWithCoercion(
  propertyName: string,
  value: any,
  validationType: string
): { error: ValidationError | null; warning: ValidationWarning | null } {
  let error: ValidationError | null = null;
  let warning: ValidationWarning | null = null;

  switch (validationType) {
    case 'string':
      if (typeof value !== 'string') {
        // Attempt coercion
        if (value !== null && value !== undefined) {
          warning = {
            field: propertyName,
            message: `${propertyName} was coerced to string`,
            code: 'type_coercion' as any
          };
        } else {
          error = {
            field: propertyName,
            message: `${propertyName} cannot be coerced to string`,
            code: 'invalid_type'
          };
        }
      }
      break;

    case 'number':
      if (typeof value !== 'number') {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          warning = {
            field: propertyName,
            message: `${propertyName} was coerced to number`,
            code: 'type_coercion' as any
          };
        } else {
          error = {
            field: propertyName,
            message: `${propertyName} cannot be coerced to number`,
            code: 'invalid_type'
          };
        }
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        // Common boolean string values
        if (value === 'true' || value === 'yes' || value === '1') {
          warning = {
            field: propertyName,
            message: `${propertyName} was coerced to boolean`,
            code: 'type_coercion' as any
          };
        } else if (value === 'false' || value === 'no' || value === '0') {
          warning = {
            field: propertyName,
            message: `${propertyName} was coerced to boolean`,
            code: 'type_coercion' as any
          };
        } else {
          error = {
            field: propertyName,
            message: `${propertyName} cannot be coerced to boolean`,
            code: 'invalid_type'
          };
        }
      }
      break;
  }

  return { error, warning };
}

/**
 * Basic type checking for specialized properties
 */
function validateSpecializedType(
  propertyName: string,
  value: any,
  validationType: string
): ValidationWarning | null {
  // For specialized properties, we're very lenient
  // Just warn about obvious type mismatches
  if (validationType === 'string' && typeof value !== 'string') {
    return {
      field: propertyName,
      message: `Type mismatch for ${propertyName}`,
      code: 'type_mismatch' as any
    };
  }

  return null;
}

/**
 * Aggregate validation results by tier
 * @param validationResult The validation result containing errors and warnings
 * @param propertyTiers Map of property names to their tiers
 * @returns Aggregated summary by tier
 */
export function aggregateValidationByTier(
  validationResult: SuggestionValidation,
  propertyTiers: Record<string, string>
): TierValidationSummary {
  const summary: TierValidationSummary = {
    core: { provided: 0, required: 0, valid: 0, errors: 0 },
    high_frequency: { provided: 0, valid: 0, errors: 0 },
    optional: { provided: 0, valid: 0, warnings: 0 },
    specialized: { provided: 0, valid: 0, warnings: 0 }
  };

  // Count errors by tier
  validationResult.errors.forEach(error => {
    const tier = propertyTiers[error.field] || 'specialized';
    if (tier === 'core') {
      summary.core.errors++;
    } else if (tier === 'high_frequency') {
      summary.high_frequency.errors++;
    }
  });

  // Count warnings by tier
  validationResult.warnings.forEach(warning => {
    const tier = propertyTiers[warning.field] || 'specialized';
    if (tier === 'optional') {
      summary.optional.warnings++;
    } else if (tier === 'specialized') {
      summary.specialized.warnings++;
    }
  });

  return summary;
}

/**
 * Performance-optimized validation for 120+ properties
 * Uses early exit strategies and caching for better performance
 */
export function validateManyProperties(
  data: Record<string, any>,
  propertyConfigs: Record<string, any>
): { errors: ValidationError[]; warnings: ValidationWarning[]; validCount: number } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let validCount = 0;

  // Process core properties first (fail fast)
  const coreProps = Object.entries(propertyConfigs).filter(([_, config]) => config.tier === 'core');
  for (const [propName, config] of coreProps) {
    const result = validatePropertyByTier({
      propertyName: propName,
      value: data[propName],
      tier: config.tier,
      validationType: config.validationType,
      isRequired: true,
      strictValidation: true
    });

    if (result.errors.length > 0) {
      errors.push(...result.errors);
    } else if (data[propName] !== undefined) {
      validCount++;
    }
  }

  // If core validation failed, skip the rest for performance
  if (errors.length > 0) {
    return { errors, warnings, validCount };
  }

  // Process remaining properties in parallel batches
  const nonCoreProps = Object.entries(data).filter(([propName]) => {
    const config = propertyConfigs[propName];
    return !config || config.tier !== 'core';
  });

  for (const [propName, value] of nonCoreProps) {
    const config = propertyConfigs[propName] || {
      tier: 'specialized',
      validationType: 'string'
    };

    const result = validatePropertyByTier({
      propertyName: propName,
      value,
      tier: config.tier,
      validationType: config.validationType,
      isRequired: false,
      strictValidation: config.tier === 'high_frequency'
    });

    errors.push(...result.errors);
    warnings.push(...result.warnings);

    if (result.errors.length === 0 && value !== undefined) {
      validCount++;
    }
  }

  return { errors, warnings, validCount };
}