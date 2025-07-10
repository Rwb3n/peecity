/**
 * Standardized Error Messages for Tier-based Validation
 * 
 * @artifact docs/cookbook/recipe_tiered_validation.md
 * @task validation_service_tier_0012_task8
 * @tdd-phase REFACTOR
 * 
 * Provides consistent, user-friendly error messages across the validation system.
 * All messages follow a standard format and tone for better UX.
 */

/**
 * Standard error message templates for validation
 * Ensures consistency across all validation tiers
 */
export const ValidationErrorMessages = {
  // Field requirement messages
  REQUIRED: (field: string) => `${field} is required`,
  MISSING: (field: string) => `Missing required field: ${field}`,
  
  // Type validation messages
  INVALID_TYPE: (field: string, expectedType: string) => 
    `${field} must be a ${expectedType}`,
  INVALID_TYPE_RECEIVED: (field: string, expectedType: string, receivedType: string) => 
    `${field} must be a ${expectedType}, received ${receivedType}`,
  
  // Range validation messages
  OUT_OF_RANGE: (field: string, min: number, max: number) => 
    `${field} must be between ${min} and ${max}`,
  TOO_SMALL: (field: string, min: number) => 
    `${field} must be at least ${min}`,
  TOO_LARGE: (field: string, max: number) => 
    `${field} must be at most ${max}`,
  
  // Enum validation messages
  INVALID_ENUM: (field: string, options: string[]) => 
    `${field} must be one of: ${options.join(', ')}`,
  INVALID_ENUM_VALUE: (field: string, value: string, options: string[]) => 
    `'${value}' is not a valid ${field}. Must be one of: ${options.join(', ')}`,
  
  // Format validation messages
  INVALID_FORMAT: (field: string, format: string) => 
    `${field} must be in ${format} format`,
  INVALID_EMAIL: (field: string) => 
    `${field} must be a valid email address`,
  INVALID_COORDINATE: (field: string, type: 'latitude' | 'longitude') => 
    `${field} must be a valid ${type}`,
  
  // Length validation messages
  TOO_LONG: (field: string, maxLength: number) => 
    `${field} is too long (maximum ${maxLength} characters)`,
  TOO_SHORT: (field: string, minLength: number) => 
    `${field} is too short (minimum ${minLength} characters)`,
  
  // Monetary validation messages
  INVALID_MONETARY: (field: string) => 
    `${field} must be a boolean, string amount, or number`,
  NEGATIVE_FEE: (field: string) => 
    `${field} cannot be negative`,
  
  // Coordinate-specific messages
  LATITUDE_RANGE: () => 
    'Latitude must be between -90 and 90 degrees',
  LONGITUDE_RANGE: () => 
    'Longitude must be between -180 and 180 degrees',
  
  // JSON parsing messages
  INVALID_JSON: (details?: string) => 
    details ? `Invalid JSON format: ${details}` : 'Invalid JSON format',
  MISSING_BODY: () => 
    'Request body is required',
  
  // Tier-specific messages
  CORE_PROPERTY_MISSING: (field: string) => 
    `Core property '${field}' is required`,
  HIGH_FREQUENCY_INVALID: (field: string, reason: string) => 
    `High-frequency property '${field}' validation failed: ${reason}`,
  
  // Generic validation messages
  VALIDATION_FAILED: (details?: string) => 
    details ? `Validation failed: ${details}` : 'Validation failed',
  MULTIPLE_ERRORS: (count: number) => 
    `${count} validation errors found`
} as const;

/**
 * Standard warning message templates
 * Used for non-critical validation issues
 */
export const ValidationWarningMessages = {
  // Type coercion warnings
  TYPE_COERCED: (field: string, toType: string) => 
    `${field} was coerced to ${toType}`,
  TYPE_COERCION_FAILED: (field: string, toType: string) => 
    `${field} could not be reliably coerced to ${toType}`,
  
  // Data quality warnings
  EMPTY_VALUE: (field: string) => 
    `${field} is empty`,
  UNUSUAL_VALUE: (field: string, reason: string) => 
    `${field} has an unusual value: ${reason}`,
  INCOMPLETE_DATA: (field: string) => 
    `${field} appears to be incomplete`,
  
  // Type mismatch warnings (for specialized properties)
  TYPE_MISMATCH: (field: string) => 
    `Type mismatch for ${field}`,
  UNEXPECTED_TYPE: (field: string, expectedType: string, receivedType: string) => 
    `${field} is typically a ${expectedType} but received ${receivedType}`,
  
  // Deprecation warnings
  DEPRECATED_FIELD: (field: string, alternative?: string) => 
    alternative 
      ? `${field} is deprecated. Use '${alternative}' instead`
      : `${field} is deprecated`,
  
  // Fee-specific warnings
  NEGATIVE_FEE: (field: string) => 
    `Negative ${field} values are unusual`,
  HIGH_FEE: (field: string, amount: number) => 
    `${field} of ${amount} seems unusually high`,
  
  // Data suggestion warnings
  MISSING_RECOMMENDED: (field: string) => 
    `Consider providing ${field} for better data quality`,
  DEFAULT_USED: (field: string, defaultValue: any) => 
    `${field} was not provided, using default: ${defaultValue}`
} as const;

/**
 * Error code standardization
 * Maps to HTTP status codes and error types
 */
export const ValidationErrorCodes = {
  // Field errors
  REQUIRED: 'required',
  MISSING_FIELD: 'missing_field',
  
  // Type errors
  INVALID_TYPE: 'invalid_type',
  TYPE_MISMATCH: 'type_mismatch',
  
  // Range errors
  OUT_OF_RANGE: 'out_of_range',
  VALUE_TOO_SMALL: 'value_too_small',
  VALUE_TOO_LARGE: 'value_too_large',
  
  // Format errors
  INVALID_FORMAT: 'invalid_format',
  INVALID_ENUM: 'invalid_enum',
  
  // Parsing errors
  INVALID_JSON: 'invalid_json',
  PARSE_ERROR: 'parse_error',
  
  // Validation errors
  VALIDATION_FAILED: 'validation_failed',
  MULTIPLE_ERRORS: 'multiple_errors',
  
  // Warning codes
  TYPE_COERCION: 'type_coercion',
  UNUSUAL_VALUE: 'unusual_value',
  INCOMPLETE_DATA: 'incomplete_data',
  DEPRECATED: 'deprecated'
} as const;

/**
 * Helper to format field names for display
 * Converts technical names to user-friendly labels
 */
export function formatFieldName(field: string): string {
  const fieldMappings: Record<string, string> = {
    'lat': 'Latitude',
    'lng': 'Longitude',
    '@id': 'ID',
    'amenity': 'Amenity type',
    'wheelchair': 'Wheelchair accessibility',
    'opening_hours': 'Opening hours',
    'fee': 'Fee required',
    'charge': 'Fee amount',
    'toilets:disposal': 'Disposal type',
    'payment:contactless': 'Contactless payment',
    'changing_table': 'Baby changing table',
    'toilets:wheelchair': 'Wheelchair accessible toilets',
    'male': 'Male facilities',
    'female': 'Female facilities',
    'unisex': 'Unisex facilities'
  };
  
  return fieldMappings[field] || field.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
}

/**
 * Helper to get appropriate article for a type
 */
export function getArticle(type: string): string {
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  return vowels.includes(type[0].toLowerCase()) ? 'an' : 'a';
}

/**
 * Format validation error for user display
 */
export function formatValidationError(
  field: string, 
  code: string, 
  context?: any
): string {
  const fieldName = formatFieldName(field);
  
  switch (code) {
    case ValidationErrorCodes.REQUIRED:
      return ValidationErrorMessages.REQUIRED(fieldName);
      
    case ValidationErrorCodes.INVALID_TYPE:
      const expectedType = context?.expectedType || 'valid value';
      return ValidationErrorMessages.INVALID_TYPE(fieldName, expectedType);
      
    case ValidationErrorCodes.OUT_OF_RANGE:
      if (field === 'lat') return ValidationErrorMessages.LATITUDE_RANGE();
      if (field === 'lng') return ValidationErrorMessages.LONGITUDE_RANGE();
      return ValidationErrorMessages.OUT_OF_RANGE(
        fieldName, 
        context?.min || 0, 
        context?.max || 100
      );
      
    case ValidationErrorCodes.INVALID_ENUM:
      return ValidationErrorMessages.INVALID_ENUM(
        fieldName, 
        context?.options || []
      );
      
    case ValidationErrorCodes.INVALID_FORMAT:
      return ValidationErrorMessages.INVALID_FORMAT(
        fieldName, 
        context?.format || 'correct'
      );
      
    default:
      return ValidationErrorMessages.VALIDATION_FAILED(
        `${fieldName} validation failed`
      );
  }
}

/**
 * Format validation warning for user display
 */
export function formatValidationWarning(
  field: string, 
  code: string, 
  context?: any
): string {
  const fieldName = formatFieldName(field);
  
  switch (code) {
    case ValidationErrorCodes.TYPE_COERCION:
      return ValidationWarningMessages.TYPE_COERCED(
        fieldName, 
        context?.toType || 'string'
      );
      
    case ValidationErrorCodes.UNUSUAL_VALUE:
      return ValidationWarningMessages.UNUSUAL_VALUE(
        fieldName, 
        context?.reason || 'unexpected format'
      );
      
    case ValidationErrorCodes.INCOMPLETE_DATA:
      return ValidationWarningMessages.INCOMPLETE_DATA(fieldName);
      
    case ValidationErrorCodes.DEPRECATED:
      return ValidationWarningMessages.DEPRECATED_FIELD(
        fieldName, 
        context?.alternative
      );
      
    default:
      return ValidationWarningMessages.TYPE_MISMATCH(fieldName);
  }
}