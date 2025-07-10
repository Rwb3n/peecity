/**
 * @fileoverview Comprehensive test coverage for errorMessages.ts templates
 * @artifact docs/cookbook/recipe_tiered_validation.md
 * @task validation_service_tier_0012_task8
 * @tdd-phase REFACTOR
 * 
 * Tests every message template and formatter to achieve 100% coverage
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

describe('ErrorMessages Template Coverage', () => {
  describe('ValidationErrorMessages', () => {
    test('REQUIRED template', () => {
      expect(ValidationErrorMessages.REQUIRED('email')).toBe('email is required');
    });

    test('MISSING template', () => {
      expect(ValidationErrorMessages.MISSING('password')).toBe('Missing required field: password');
    });

    test('INVALID_TYPE template', () => {
      expect(ValidationErrorMessages.INVALID_TYPE('age', 'number')).toBe('age must be a number');
    });

    test('INVALID_TYPE_RECEIVED template', () => {
      expect(ValidationErrorMessages.INVALID_TYPE_RECEIVED('score', 'number', 'string'))
        .toBe('score must be a number, received string');
    });

    test('OUT_OF_RANGE template', () => {
      expect(ValidationErrorMessages.OUT_OF_RANGE('score', 0, 100))
        .toBe('score must be between 0 and 100');
    });

    test('TOO_SMALL template', () => {
      expect(ValidationErrorMessages.TOO_SMALL('price', 0))
        .toBe('price must be at least 0');
    });

    test('TOO_LARGE template', () => {
      expect(ValidationErrorMessages.TOO_LARGE('quantity', 999))
        .toBe('quantity must be at most 999');
    });

    test('INVALID_ENUM template', () => {
      expect(ValidationErrorMessages.INVALID_ENUM('status', ['active', 'inactive']))
        .toBe('status must be one of: active, inactive');
    });

    test('INVALID_ENUM_VALUE template', () => {
      expect(ValidationErrorMessages.INVALID_ENUM_VALUE('status', 'pending', ['active', 'inactive']))
        .toBe("'pending' is not a valid status. Must be one of: active, inactive");
    });

    test('INVALID_FORMAT template', () => {
      expect(ValidationErrorMessages.INVALID_FORMAT('date', 'YYYY-MM-DD'))
        .toBe('date must be in YYYY-MM-DD format');
    });

    test('INVALID_EMAIL template', () => {
      expect(ValidationErrorMessages.INVALID_EMAIL('contact'))
        .toBe('contact must be a valid email address');
    });

    test('INVALID_COORDINATE template', () => {
      expect(ValidationErrorMessages.INVALID_COORDINATE('lat', 'latitude'))
        .toBe('lat must be a valid latitude');
      expect(ValidationErrorMessages.INVALID_COORDINATE('lng', 'longitude'))
        .toBe('lng must be a valid longitude');
    });

    test('TOO_LONG template', () => {
      expect(ValidationErrorMessages.TOO_LONG('description', 500))
        .toBe('description is too long (maximum 500 characters)');
    });

    test('TOO_SHORT template', () => {
      expect(ValidationErrorMessages.TOO_SHORT('password', 8))
        .toBe('password is too short (minimum 8 characters)');
    });

    test('INVALID_MONETARY template', () => {
      expect(ValidationErrorMessages.INVALID_MONETARY('fee'))
        .toBe('fee must be a boolean, string amount, or number');
    });

    test('NEGATIVE_FEE template', () => {
      expect(ValidationErrorMessages.NEGATIVE_FEE('charge'))
        .toBe('charge cannot be negative');
    });

    test('LATITUDE_RANGE template', () => {
      expect(ValidationErrorMessages.LATITUDE_RANGE())
        .toBe('Latitude must be between -90 and 90 degrees');
    });

    test('LONGITUDE_RANGE template', () => {
      expect(ValidationErrorMessages.LONGITUDE_RANGE())
        .toBe('Longitude must be between -180 and 180 degrees');
    });

    test('INVALID_JSON template with details', () => {
      expect(ValidationErrorMessages.INVALID_JSON('Unexpected token'))
        .toBe('Invalid JSON format: Unexpected token');
    });

    test('INVALID_JSON template without details', () => {
      expect(ValidationErrorMessages.INVALID_JSON())
        .toBe('Invalid JSON format');
    });

    test('MISSING_BODY template', () => {
      expect(ValidationErrorMessages.MISSING_BODY())
        .toBe('Request body is required');
    });

    test('CORE_PROPERTY_MISSING template', () => {
      expect(ValidationErrorMessages.CORE_PROPERTY_MISSING('lat'))
        .toBe("Core property 'lat' is required");
    });

    test('HIGH_FREQUENCY_INVALID template', () => {
      expect(ValidationErrorMessages.HIGH_FREQUENCY_INVALID('name', 'too short'))
        .toBe("High-frequency property 'name' validation failed: too short");
    });

    test('VALIDATION_FAILED template with details', () => {
      expect(ValidationErrorMessages.VALIDATION_FAILED('Multiple errors'))
        .toBe('Validation failed: Multiple errors');
    });

    test('VALIDATION_FAILED template without details', () => {
      expect(ValidationErrorMessages.VALIDATION_FAILED())
        .toBe('Validation failed');
    });

    test('MULTIPLE_ERRORS template', () => {
      expect(ValidationErrorMessages.MULTIPLE_ERRORS(3))
        .toBe('3 validation errors found');
    });
  });

  describe('ValidationWarningMessages', () => {
    test('TYPE_COERCED template', () => {
      expect(ValidationWarningMessages.TYPE_COERCED('count', 'number'))
        .toBe('count was coerced to number');
    });

    test('TYPE_COERCION_FAILED template', () => {
      expect(ValidationWarningMessages.TYPE_COERCION_FAILED('value', 'boolean'))
        .toBe('value could not be reliably coerced to boolean');
    });

    test('EMPTY_VALUE template', () => {
      expect(ValidationWarningMessages.EMPTY_VALUE('description'))
        .toBe('description is empty');
    });

    test('UNUSUAL_VALUE template', () => {
      expect(ValidationWarningMessages.UNUSUAL_VALUE('age', 'negative number'))
        .toBe('age has an unusual value: negative number');
    });

    test('INCOMPLETE_DATA template', () => {
      expect(ValidationWarningMessages.INCOMPLETE_DATA('address'))
        .toBe('address appears to be incomplete');
    });

    test('TYPE_MISMATCH template', () => {
      expect(ValidationWarningMessages.TYPE_MISMATCH('score'))
        .toBe('Type mismatch for score');
    });

    test('UNEXPECTED_TYPE template', () => {
      expect(ValidationWarningMessages.UNEXPECTED_TYPE('count', 'number', 'string'))
        .toBe('count is typically a number but received string');
    });

    test('DEPRECATED_FIELD template with alternative', () => {
      expect(ValidationWarningMessages.DEPRECATED_FIELD('old_field', 'new_field'))
        .toBe("old_field is deprecated. Use 'new_field' instead");
    });

    test('DEPRECATED_FIELD template without alternative', () => {
      expect(ValidationWarningMessages.DEPRECATED_FIELD('legacy_field'))
        .toBe('legacy_field is deprecated');
    });

    test('NEGATIVE_FEE warning template', () => {
      expect(ValidationWarningMessages.NEGATIVE_FEE('charge'))
        .toBe('Negative charge values are unusual');
    });

    test('HIGH_FEE template', () => {
      expect(ValidationWarningMessages.HIGH_FEE('parking_fee', 50))
        .toBe('parking_fee of 50 seems unusually high');
    });

    test('MISSING_RECOMMENDED template', () => {
      expect(ValidationWarningMessages.MISSING_RECOMMENDED('phone_number'))
        .toBe('Consider providing phone_number for better data quality');
    });

    test('DEFAULT_USED template', () => {
      expect(ValidationWarningMessages.DEFAULT_USED('timezone', 'UTC'))
        .toBe('timezone was not provided, using default: UTC');
    });
  });

  describe('ValidationErrorCodes', () => {
    test('should contain all required error codes', () => {
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

  describe('formatFieldName', () => {
    test('should format known field mappings', () => {
      expect(formatFieldName('lat')).toBe('Latitude');
      expect(formatFieldName('lng')).toBe('Longitude');
      expect(formatFieldName('@id')).toBe('ID');
      expect(formatFieldName('amenity')).toBe('Amenity type');
      expect(formatFieldName('wheelchair')).toBe('Wheelchair accessibility');
      expect(formatFieldName('opening_hours')).toBe('Opening hours');
      expect(formatFieldName('fee')).toBe('Fee required');
      expect(formatFieldName('charge')).toBe('Fee amount');
      expect(formatFieldName('toilets:disposal')).toBe('Disposal type');
      expect(formatFieldName('payment:contactless')).toBe('Contactless payment');
      expect(formatFieldName('changing_table')).toBe('Baby changing table');
      expect(formatFieldName('toilets:wheelchair')).toBe('Wheelchair accessible toilets');
      expect(formatFieldName('male')).toBe('Male facilities');
      expect(formatFieldName('female')).toBe('Female facilities');
      expect(formatFieldName('unisex')).toBe('Unisex facilities');
    });

    test('should format unknown fields', () => {
      expect(formatFieldName('unknown_field')).toBe('Unknown field');
      expect(formatFieldName('test_property')).toBe('Test property');
    });
  });

  describe('getArticle', () => {
    test('should return "an" for vowel-starting types', () => {
      expect(getArticle('array')).toBe('an');
      expect(getArticle('object')).toBe('an');
      expect(getArticle('integer')).toBe('an');
      expect(getArticle('error')).toBe('an');
      expect(getArticle('update')).toBe('an');
    });

    test('should return "a" for consonant-starting types', () => {
      expect(getArticle('string')).toBe('a');
      expect(getArticle('number')).toBe('a');
      expect(getArticle('boolean')).toBe('a');
      expect(getArticle('function')).toBe('a');
      expect(getArticle('date')).toBe('a');
    });

    test('should handle mixed case', () => {
      expect(getArticle('Array')).toBe('an');
      expect(getArticle('String')).toBe('a');
    });
  });

  describe('formatValidationError', () => {
    test('should format REQUIRED errors', () => {
      expect(formatValidationError('email', ValidationErrorCodes.REQUIRED))
        .toBe('Email is required');
    });

    test('should format INVALID_TYPE errors', () => {
      expect(formatValidationError('age', ValidationErrorCodes.INVALID_TYPE, { expectedType: 'number' }))
        .toBe('Age must be a number');
    });

    test('should format INVALID_TYPE errors without context', () => {
      expect(formatValidationError('value', ValidationErrorCodes.INVALID_TYPE))
        .toBe('Value must be a valid value');
    });

    test('should format OUT_OF_RANGE errors for latitude', () => {
      expect(formatValidationError('lat', ValidationErrorCodes.OUT_OF_RANGE))
        .toBe('Latitude must be between -90 and 90 degrees');
    });

    test('should format OUT_OF_RANGE errors for longitude', () => {
      expect(formatValidationError('lng', ValidationErrorCodes.OUT_OF_RANGE))
        .toBe('Longitude must be between -180 and 180 degrees');
    });

    test('should format OUT_OF_RANGE errors with context', () => {
      expect(formatValidationError('score', ValidationErrorCodes.OUT_OF_RANGE, { min: 0, max: 100 }))
        .toBe('Score must be between 0 and 100');
    });

    test('should format OUT_OF_RANGE errors without context', () => {
      expect(formatValidationError('value', ValidationErrorCodes.OUT_OF_RANGE))
        .toBe('Value must be between 0 and 100');
    });

    test('should format INVALID_ENUM errors', () => {
      expect(formatValidationError('status', ValidationErrorCodes.INVALID_ENUM, { options: ['active', 'inactive'] }))
        .toBe('Status must be one of: active, inactive');
    });

    test('should format INVALID_ENUM errors without context', () => {
      expect(formatValidationError('status', ValidationErrorCodes.INVALID_ENUM))
        .toBe('Status must be one of: ');
    });

    test('should format INVALID_FORMAT errors', () => {
      expect(formatValidationError('date', ValidationErrorCodes.INVALID_FORMAT, { format: 'YYYY-MM-DD' }))
        .toBe('Date must be in YYYY-MM-DD format');
    });

    test('should format INVALID_FORMAT errors without context', () => {
      expect(formatValidationError('value', ValidationErrorCodes.INVALID_FORMAT))
        .toBe('Value must be in correct format');
    });

    test('should format unknown error codes', () => {
      expect(formatValidationError('field', 'unknown_code'))
        .toBe('Validation failed: Field validation failed');
    });
  });

  describe('formatValidationWarning', () => {
    test('should format TYPE_COERCION warnings', () => {
      expect(formatValidationWarning('count', ValidationErrorCodes.TYPE_COERCION, { toType: 'number' }))
        .toBe('Count was coerced to number');
    });

    test('should format TYPE_COERCION warnings without context', () => {
      expect(formatValidationWarning('value', ValidationErrorCodes.TYPE_COERCION))
        .toBe('Value was coerced to string');
    });

    test('should format UNUSUAL_VALUE warnings', () => {
      expect(formatValidationWarning('age', ValidationErrorCodes.UNUSUAL_VALUE, { reason: 'negative number' }))
        .toBe('Age has an unusual value: negative number');
    });

    test('should format UNUSUAL_VALUE warnings without context', () => {
      expect(formatValidationWarning('value', ValidationErrorCodes.UNUSUAL_VALUE))
        .toBe('Value has an unusual value: unexpected format');
    });

    test('should format INCOMPLETE_DATA warnings', () => {
      expect(formatValidationWarning('address', ValidationErrorCodes.INCOMPLETE_DATA))
        .toBe('Address appears to be incomplete');
    });

    test('should format DEPRECATED warnings', () => {
      expect(formatValidationWarning('old_field', ValidationErrorCodes.DEPRECATED, { alternative: 'new_field' }))
        .toBe("Old field is deprecated. Use 'new_field' instead");
    });

    test('should format DEPRECATED warnings without alternative', () => {
      expect(formatValidationWarning('legacy_field', ValidationErrorCodes.DEPRECATED))
        .toBe('Legacy field is deprecated');
    });

    test('should format unknown warning codes', () => {
      expect(formatValidationWarning('field', 'unknown_code'))
        .toBe('Type mismatch for Field');
    });
  });
});