/**
 * Service Response Schema Validation Tests
 * 
 * @epic schema_documentation_completion_epic
 * @task schema_documentation_task2
 * @tdd-phase GREEN
 * 
 * Comprehensive test coverage for service response data validation.
 */

const {
  validateServiceResponse,
  clearSchemaCache,
  benchmarkSchemaValidation
} = require('../../src/lib/validation/schemas');

describe('Service Response Schema Validation', () => {
  beforeEach(() => {
    clearSchemaCache();
  });

  describe('Valid SuggestionResponse Validation', () => {
    const validSuccessResponse = {
      success: true,
      suggestionId: 'suggestion_12345',
      message: 'Suggestion successfully submitted',
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
        isDuplicate: false
      }
    };

    const validErrorResponse = {
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: 'Required fields missing'
      }
    };

    test('should validate successful suggestion response', () => {
      const result = validateServiceResponse(validSuccessResponse);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual(validSuccessResponse);
    });

    test('should validate error suggestion response', () => {
      const result = validateServiceResponse(validErrorResponse);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('should validate minimal success response', () => {
      const minimalSuccess = {
        success: true,
        message: 'Success'
      };

      const result = validateServiceResponse(minimalSuccess);
      expect(result.isValid).toBe(true);
    });

    test('should validate response with duplicate detection', () => {
      const duplicateResponse = {
        success: false,
        message: 'Duplicate toilet detected',
        validation: {
          isValid: false,
          errors: [],
          warnings: [
            {
              field: 'location',
              message: 'Similar toilet found nearby',
              code: 'unusual_value'
            }
          ],
          isDuplicate: true,
          duplicateDistance: 25.5,
          nearestToiletId: 'toilet_987'
        }
      };

      const result = validateServiceResponse(duplicateResponse);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Valid ValidationResult Validation', () => {
    const validValidationResult = {
      isValid: true,
      data: {
        lat: 51.5074,
        lng: -0.1278,
        name: 'Test Toilet'
      },
      sanitizedData: {
        lat: 51.5074,
        lng: -0.1278,
        name: 'Test Toilet'
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
        isDuplicate: false
      },
      suggestionId: 'suggestion_67890'
    };

    test('should validate complete validation result', () => {
      const result = validateServiceResponse(validValidationResult);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('should validate minimal validation result', () => {
      const minimalResult = {
        isValid: false
      };

      const result = validateServiceResponse(minimalResult);
      expect(result.isValid).toBe(true);
    });

    test('should validate validation result with error', () => {
      const errorResult = {
        isValid: false,
        error: {
          message: 'Validation failed',
          code: 'INVALID_INPUT'
        }
      };

      const result = validateServiceResponse(errorResult);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Valid SuggestionValidation Validation', () => {
    const validSuggestionValidation = {
      isValid: true,
      errors: [],
      warnings: [
        {
          field: 'hours',
          message: 'Hours format could be improved',
          code: 'formatting_issue'
        }
      ],
      isDuplicate: false
    };

    test('should validate suggestion validation with warnings', () => {
      const result = validateServiceResponse(validSuggestionValidation);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('should validate suggestion validation with errors', () => {
      const validationWithErrors = {
        isValid: false,
        errors: [
          {
            field: 'lat',
            message: 'Latitude is required',
            code: 'required'
          },
          {
            field: 'lng',
            message: 'Longitude must be a number',
            code: 'invalid_type'
          }
        ],
        warnings: [],
        isDuplicate: false
      };

      const result = validateServiceResponse(validationWithErrors);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Invalid Data Validation', () => {
    test('should reject suggestion response with missing required fields', () => {
      const incompleteResponse = {
        success: true
        // Missing required 'message' field
      };

      const result = validateServiceResponse(incompleteResponse);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.some(error => error.includes('required'))).toBe(true);
    });

    test('should reject successful response with error field', () => {
      const contradictoryResponse = {
        success: true,
        message: 'Success',
        error: {
          code: 'ERROR',
          details: 'This should not be here'
        }
      };

      const result = validateServiceResponse(contradictoryResponse);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should reject failed response with suggestionId', () => {
      const contradictoryResponse = {
        success: false,
        message: 'Failed',
        suggestionId: 'should-not-be-here'
      };

      const result = validateServiceResponse(contradictoryResponse);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should reject validation error with invalid code', () => {
      const invalidErrorCode = {
        isValid: false,
        errors: [
          {
            field: 'test',
            message: 'Test error',
            code: 'invalid_error_code' // Not in enum
          }
        ],
        warnings: [],
        isDuplicate: false
      };

      const result = validateServiceResponse(invalidErrorCode);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('enum'))).toBe(true);
    });

    test('should reject validation warning with invalid code', () => {
      const invalidWarningCode = {
        isValid: true,
        errors: [],
        warnings: [
          {
            field: 'test',
            message: 'Test warning',
            code: 'invalid_warning_code' // Not in enum
          }
        ],
        isDuplicate: false
      };

      const result = validateServiceResponse(invalidWarningCode);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('enum'))).toBe(true);
    });

    test('should reject negative duplicate distance', () => {
      const negativeDuplicateDistance = {
        isValid: false,
        errors: [],
        warnings: [],
        isDuplicate: true,
        duplicateDistance: -10, // Invalid negative distance
        nearestToiletId: 'toilet_123'
      };

      const result = validateServiceResponse(negativeDuplicateDistance);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('minimum'))).toBe(true);
    });

    test('should reject empty field names', () => {
      const emptyFieldName = {
        isValid: false,
        errors: [
          {
            field: '', // Empty field name
            message: 'Test error',
            code: 'required'
          }
        ],
        warnings: [],
        isDuplicate: false
      };

      const result = validateServiceResponse(emptyFieldName);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('minLength'))).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    const testResponse = {
      success: true,
      message: 'Performance test response',
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
        isDuplicate: false
      }
    };

    test('should validate within performance target', () => {
      const start = performance.now();
      const result = validateServiceResponse(testResponse);
      const duration = performance.now() - start;

      expect(result.isValid).toBe(true);
      expect(duration).toBeLessThan(5); // < 5ms target
    });

    test('should benchmark validation performance', () => {
      const benchmark = benchmarkSchemaValidation(testResponse, 'serviceResponse', 100);
      
      expect(benchmark.averageMs).toBeLessThan(5);
      expect(benchmark.minMs).toBeGreaterThan(0);
    });

    test('should handle large error arrays efficiently', () => {
      const largeErrorArray = {
        isValid: false,
        errors: Array.from({ length: 100 }, (_, i) => ({
          field: `field_${i}`,
          message: `Error message ${i}`,
          code: 'invalid_type'
        })),
        warnings: [],
        isDuplicate: false
      };

      const start = performance.now();
      const result = validateServiceResponse(largeErrorArray);
      const duration = performance.now() - start;

      expect(result.isValid).toBe(true);
      expect(duration).toBeLessThan(10); // Allow slightly more time for large arrays
    });
  });

  describe('Edge Cases', () => {
    test('should handle null input', () => {
      const result = validateServiceResponse(null);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should handle undefined input', () => {
      const result = validateServiceResponse(undefined);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should handle empty object', () => {
      const result = validateServiceResponse({});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should handle array input', () => {
      const result = validateServiceResponse([]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should validate empty error and warning arrays', () => {
      const emptyArrays = {
        isValid: true,
        errors: [],
        warnings: [],
        isDuplicate: false
      };

      const result = validateServiceResponse(emptyArrays);
      expect(result.isValid).toBe(true);
    });

    test('should validate validation result without optional fields', () => {
      const minimalValidation = {
        isValid: true,
        errors: [],
        warnings: [],
        isDuplicate: false
      };

      const result = validateServiceResponse(minimalValidation);
      expect(result.isValid).toBe(true);
    });
  });
});