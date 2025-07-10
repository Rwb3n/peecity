/**
 * @fileoverview Tests for standardized error messages
 * @artifact docs/cookbook/recipe_tiered_validation.md
 * @task validation_service_tier_0012_task8
 * @tdd-phase REFACTOR
 */

const {
  ValidationErrorMessages,
  ValidationWarningMessages,
  ValidationErrorCodes,
  formatFieldName,
  getArticle,
  formatValidationError,
  formatValidationWarning
} = require('../../src/utils/errorMessages');

describe('Error Messages Utility', () => {
  describe('ValidationErrorMessages', () => {
    it('should generate consistent required field messages', () => {
      expect(ValidationErrorMessages.REQUIRED('lat')).toBe('lat is required');
      expect(ValidationErrorMessages.REQUIRED('wheelchair')).toBe('wheelchair is required');
    });

    it('should generate type error messages', () => {
      expect(ValidationErrorMessages.INVALID_TYPE('lat', 'number')).toBe('lat must be a number');
      expect(ValidationErrorMessages.INVALID_TYPE_RECEIVED('fee', 'boolean', 'string'))
        .toBe('fee must be a boolean, received string');
    });

    it('should generate missing field messages', () => {
      expect(ValidationErrorMessages.MISSING('name')).toBe('Missing required field: name');
    });

    it('should generate range error messages', () => {
      expect(ValidationErrorMessages.OUT_OF_RANGE('lat', -90, 90))
        .toBe('lat must be between -90 and 90');
      expect(ValidationErrorMessages.TOO_SMALL('fee', 0))
        .toBe('fee must be at least 0');
      expect(ValidationErrorMessages.TOO_LARGE('name', 100))
        .toBe('name must be at most 100');
      expect(ValidationErrorMessages.LATITUDE_RANGE())
        .toBe('Latitude must be between -90 and 90 degrees');
      expect(ValidationErrorMessages.LONGITUDE_RANGE())
        .toBe('Longitude must be between -180 and 180 degrees');
    });

    it('should generate enum error messages', () => {
      const options = ['yes', 'no', 'limited'];
      expect(ValidationErrorMessages.INVALID_ENUM('wheelchair', options))
        .toBe('wheelchair must be one of: yes, no, limited');
      expect(ValidationErrorMessages.INVALID_ENUM_VALUE('access', 'private', ['yes', 'customers']))
        .toBe("'private' is not a valid access. Must be one of: yes, customers");
    });

    it('should generate format error messages', () => {
      expect(ValidationErrorMessages.INVALID_FORMAT('opening_hours', 'ISO 8601'))
        .toBe('opening_hours must be in ISO 8601 format');
      expect(ValidationErrorMessages.INVALID_EMAIL('contact'))
        .toBe('contact must be a valid email address');
      expect(ValidationErrorMessages.INVALID_COORDINATE('lat', 'latitude'))
        .toBe('lat must be a valid latitude');
    });

    it('should generate length error messages', () => {
      expect(ValidationErrorMessages.TOO_LONG('description', 500))
        .toBe('description is too long (maximum 500 characters)');
      expect(ValidationErrorMessages.TOO_SHORT('name', 3))
        .toBe('name is too short (minimum 3 characters)');
    });

    it('should generate monetary error messages', () => {
      expect(ValidationErrorMessages.INVALID_MONETARY('fee'))
        .toBe('fee must be a boolean, string amount, or number');
      expect(ValidationErrorMessages.NEGATIVE_FEE('charge'))
        .toBe('charge cannot be negative');
    });

    it('should generate JSON parsing messages', () => {
      expect(ValidationErrorMessages.INVALID_JSON()).toBe('Invalid JSON format');
      expect(ValidationErrorMessages.INVALID_JSON('Unexpected token')).toBe('Invalid JSON format: Unexpected token');
      expect(ValidationErrorMessages.MISSING_BODY()).toBe('Request body is required');
    });

    it('should generate tier-specific messages', () => {
      expect(ValidationErrorMessages.CORE_PROPERTY_MISSING('amenity'))
        .toBe("Core property 'amenity' is required");
      expect(ValidationErrorMessages.HIGH_FREQUENCY_INVALID('male', 'invalid boolean'))
        .toBe("High-frequency property 'male' validation failed: invalid boolean");
    });

    it('should generate generic validation messages', () => {
      expect(ValidationErrorMessages.VALIDATION_FAILED()).toBe('Validation failed');
      expect(ValidationErrorMessages.VALIDATION_FAILED('Missing data')).toBe('Validation failed: Missing data');
      expect(ValidationErrorMessages.MULTIPLE_ERRORS(5)).toBe('5 validation errors found');
    });
  });

  describe('ValidationWarningMessages', () => {
    it('should generate type coercion warnings', () => {
      expect(ValidationWarningMessages.TYPE_COERCED('operator', 'string'))
        .toBe('operator was coerced to string');
      expect(ValidationWarningMessages.TYPE_COERCION_FAILED('fee', 'number'))
        .toBe('fee could not be reliably coerced to number');
    });

    it('should generate data quality warnings', () => {
      expect(ValidationWarningMessages.EMPTY_VALUE('name'))
        .toBe('name is empty');
      expect(ValidationWarningMessages.UNUSUAL_VALUE('fee', 'negative value'))
        .toBe('fee has an unusual value: negative value');
      expect(ValidationWarningMessages.INCOMPLETE_DATA('address'))
        .toBe('address appears to be incomplete');
    });

    it('should generate type mismatch warnings', () => {
      expect(ValidationWarningMessages.TYPE_MISMATCH('operator'))
        .toBe('Type mismatch for operator');
      expect(ValidationWarningMessages.UNEXPECTED_TYPE('fee', 'boolean', 'string'))
        .toBe('fee is typically a boolean but received string');
    });

    it('should generate deprecation warnings', () => {
      expect(ValidationWarningMessages.DEPRECATED_FIELD('accessible', 'wheelchair'))
        .toBe("accessible is deprecated. Use 'wheelchair' instead");
      expect(ValidationWarningMessages.DEPRECATED_FIELD('old_field'))
        .toBe('old_field is deprecated');
    });

    it('should generate fee-specific warnings', () => {
      expect(ValidationWarningMessages.NEGATIVE_FEE('charge'))
        .toBe('Negative charge values are unusual');
      expect(ValidationWarningMessages.HIGH_FEE('fee', 100))
        .toBe('fee of 100 seems unusually high');
    });

    it('should generate data suggestion warnings', () => {
      expect(ValidationWarningMessages.MISSING_RECOMMENDED('opening_hours'))
        .toBe('Consider providing opening_hours for better data quality');
      expect(ValidationWarningMessages.DEFAULT_USED('access', 'yes'))
        .toBe('access was not provided, using default: yes');
    });
  });

  describe('formatFieldName', () => {
    it('should format technical field names to user-friendly labels', () => {
      expect(formatFieldName('lat')).toBe('Latitude');
      expect(formatFieldName('lng')).toBe('Longitude');
      expect(formatFieldName('@id')).toBe('ID');
      expect(formatFieldName('payment:contactless')).toBe('Contactless payment');
      expect(formatFieldName('unknown_field')).toBe('Unknown field');
    });
  });

  describe('getArticle', () => {
    it('should return correct article for types', () => {
      expect(getArticle('array')).toBe('an');
      expect(getArticle('string')).toBe('a');
      expect(getArticle('object')).toBe('an');
      expect(getArticle('number')).toBe('a');
    });
  });

  describe('formatValidationError', () => {
    it('should format required errors', () => {
      expect(formatValidationError('lat', ValidationErrorCodes.REQUIRED))
        .toBe('Latitude is required');
    });

    it('should format type errors', () => {
      expect(formatValidationError('fee', ValidationErrorCodes.INVALID_TYPE, { expectedType: 'boolean' }))
        .toBe('Fee required must be a boolean');
    });

    it('should format range errors for coordinates', () => {
      expect(formatValidationError('lat', ValidationErrorCodes.OUT_OF_RANGE))
        .toBe('Latitude must be between -90 and 90 degrees');
      expect(formatValidationError('lng', ValidationErrorCodes.OUT_OF_RANGE))
        .toBe('Longitude must be between -180 and 180 degrees');
    });

    it('should format enum errors', () => {
      const context = { options: ['yes', 'no', 'limited'] };
      expect(formatValidationError('wheelchair', ValidationErrorCodes.INVALID_ENUM, context))
        .toBe('Wheelchair accessibility must be one of: yes, no, limited');
    });

    it('should format format errors', () => {
      expect(formatValidationError('opening_hours', ValidationErrorCodes.INVALID_FORMAT, { format: 'ISO 8601' }))
        .toBe('Opening hours must be in ISO 8601 format');
    });

    it('should format generic range errors', () => {
      expect(formatValidationError('count', ValidationErrorCodes.OUT_OF_RANGE, { min: 1, max: 10 }))
        .toBe('Count must be between 1 and 10');
    });

    it('should handle default validation failed', () => {
      expect(formatValidationError('unknown', 'unknown_code'))
        .toBe('Validation failed: Unknown validation failed');
    });
  });

  describe('formatValidationWarning', () => {
    it('should format type coercion warnings', () => {
      expect(formatValidationWarning('operator', ValidationErrorCodes.TYPE_COERCION, { toType: 'string' }))
        .toBe('Operator was coerced to string');
    });

    it('should format unusual value warnings', () => {
      expect(formatValidationWarning('fee', ValidationErrorCodes.UNUSUAL_VALUE, { reason: 'negative amount' }))
        .toBe('Fee required has an unusual value: negative amount');
    });

    it('should format incomplete data warnings', () => {
      expect(formatValidationWarning('address', ValidationErrorCodes.INCOMPLETE_DATA))
        .toBe('Address appears to be incomplete');
    });

    it('should format deprecation warnings', () => {
      expect(formatValidationWarning('old_field', ValidationErrorCodes.DEPRECATED, { alternative: 'new_field' }))
        .toBe("Old field is deprecated. Use 'new_field' instead");
    });

    it('should handle default type mismatch', () => {
      expect(formatValidationWarning('unknown', 'unknown_code'))
        .toBe('Type mismatch for Unknown');
    });
  });

  describe('ValidationErrorCodes', () => {
    it('should have all required error codes', () => {
      expect(ValidationErrorCodes.REQUIRED).toBe('required');
      expect(ValidationErrorCodes.MISSING_FIELD).toBe('missing_field');
      expect(ValidationErrorCodes.INVALID_TYPE).toBe('invalid_type');
      expect(ValidationErrorCodes.TYPE_MISMATCH).toBe('type_mismatch');
      expect(ValidationErrorCodes.OUT_OF_RANGE).toBe('out_of_range');
      expect(ValidationErrorCodes.VALUE_TOO_SMALL).toBe('value_too_small');
      expect(ValidationErrorCodes.VALUE_TOO_LARGE).toBe('value_too_large');
      expect(ValidationErrorCodes.INVALID_FORMAT).toBe('invalid_format');
      expect(ValidationErrorCodes.INVALID_ENUM).toBe('invalid_enum');
      expect(ValidationErrorCodes.INVALID_JSON).toBe('invalid_json');
      expect(ValidationErrorCodes.PARSE_ERROR).toBe('parse_error');
      expect(ValidationErrorCodes.VALIDATION_FAILED).toBe('validation_failed');
      expect(ValidationErrorCodes.MULTIPLE_ERRORS).toBe('multiple_errors');
      expect(ValidationErrorCodes.TYPE_COERCION).toBe('type_coercion');
      expect(ValidationErrorCodes.UNUSUAL_VALUE).toBe('unusual_value');
      expect(ValidationErrorCodes.INCOMPLETE_DATA).toBe('incomplete_data');
      expect(ValidationErrorCodes.DEPRECATED).toBe('deprecated');
    });
  });
});