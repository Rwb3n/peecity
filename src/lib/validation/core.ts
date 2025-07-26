/**
 * Core Validation Utilities
 * 
 * @artifact docs/cookbook/recipe_tiered_validation.md
 * @epic foundation_consolidation_epic
 * @task foundation_consolidation_task3
 * @tdd-phase GREEN
 * 
 * Core validation functions for user-submitted toilet suggestions.
 * Provides schema validation, type checking, and data sanitization.
 * 
 * Migrated from src/utils/validation.ts as part of lib foundation consolidation.
 */

import { ToiletSuggestion, SuggestionValidationError, ValidationWarning, SuggestionValidation } from '../../types/suggestions';

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
  const errors: SuggestionValidationError[] = [];
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
    isDuplicate: false,
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
  const random = Math.random().toString(16).substring(2, 10);
  return `suggest_${timestamp}_${random.padEnd(8, '0')}`;
}