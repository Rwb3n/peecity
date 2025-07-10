/**
 * Validation Service
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * 
 * Centralized validation service for suggestion data processing.
 * Handles request parsing, schema validation, and data sanitization.
 */

import { validateSuggestion, sanitizeSuggestion, validateRequestBody, generateSuggestionId } from '../utils/validation';
import { ErrorFactory } from '../utils/errors';
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
      
      return {
        isValid: false,
        error
      };
    }

    // Validate suggestion schema
    const validation = validateSuggestion(data);
    
    if (!validation.isValid) {
      const errorDetails = validation.errors.map(e => `${e.field}: ${e.message}`).join('; ');
      const validationError = ErrorFactory.validation('Validation failed', validation, errorDetails);
      
      return {
        isValid: false,
        data,
        validation,
        error: validationError
      };
    }

    // Sanitize the data
    const sanitizedData = sanitizeSuggestion(data);
    
    // Generate suggestion ID
    const suggestionId = generateSuggestionId();

    return {
      isValid: true,
      data,
      sanitizedData,
      validation,
      suggestionId
    };
  }
}

/**
 * Create singleton validation service instance
 */
export const validationService = new ValidationService();