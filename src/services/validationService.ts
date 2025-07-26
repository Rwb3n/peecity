import { validateSuggestion, sanitizeSuggestion, validateRequestBody, generateSuggestionId, ErrorFactory } from '@/lib';
import { validateServiceResponse } from '../lib/validation/schemas';
import { SuggestionValidation } from '../types/suggestions';

export interface ValidationRequest {
  body: string;
  ipAddress: string;
}

export interface ValidationResult {
  isValid: boolean;
  data?: any;
  sanitizedData?: any;
  validation?: SuggestionValidation;
  suggestionId?: string;
  error?: any;
}

/**
 * Validation service class for processing suggestion requests
 */
export class ValidationService {
  /**
   * Validate response using schema validation (warning-only for debugging)
   * @param response The validation result to validate
   * @returns The same response (unmodified)
   */
  private validateResponseSchema(response: ValidationResult): ValidationResult {
    const schemaValidationStart = performance.now();
    const schemaResult = validateServiceResponse(response);
    const schemaValidationDuration = performance.now() - schemaValidationStart;
    
    if (!schemaResult.isValid) {
      // Warning-only mode - log but don't throw
      console.warn('ValidationService: Response schema validation failed', {
        errors: schemaResult.errors,
        response: JSON.stringify(response, null, 2),
        validationDurationMs: schemaValidationDuration
      });
    } else {
      console.debug('ValidationService: Response schema validation passed', {
        validationDurationMs: schemaValidationDuration
      });
    }
    
    return response;
  }

  /**
   * Process and validate a suggestion request
   * @param request Validation request with body and IP address
   * @returns Validation result with processed data or error
   */
  async validateRequest(request: ValidationRequest): Promise<ValidationResult> {
    // Parse request body
    const { isValid: bodyValid, data, error: bodyError } = validateRequestBody(request.body);
    
    if (!bodyValid) {
      const error = bodyError?.includes('JSON') 
        ? ErrorFactory.invalidJson(bodyError)
        : ErrorFactory.missingBody();
      
      const response = {
        isValid: false,
        error
      };
      
      return this.validateResponseSchema(response);
    }

    // Validate suggestion schema
    const validation = validateSuggestion(data);
    
    if (!validation.isValid) {
      const errorDetails = validation.errors.map(e => `${e.field}: ${e.message}`).join('; ');
      const validationError = ErrorFactory.validation('Validation failed', validation, errorDetails);
      
      const response = {
        isValid: false,
        data,
        validation,
        error: validationError
      };
      
      return this.validateResponseSchema(response);
    }

    // Sanitize the data
    const sanitizedData = sanitizeSuggestion(data);
    
    // Generate suggestion ID
    const suggestionId = generateSuggestionId();

    const response = {
      isValid: true,
      data,
      sanitizedData,
      validation,
      suggestionId
    };
    
    return this.validateResponseSchema(response);
  }
}

/**
 * Create singleton validation service instance
 */
export const validationService = new ValidationService();