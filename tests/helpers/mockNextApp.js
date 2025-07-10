/**
 * Mock Next.js App for Integration Testing
 * 
 * @doc refs docs/adr/ADR-003-core-property-validation.md
 * 
 * Creates a minimal Express app that implements the actual Next.js API route behavior
 * for testing purposes. Uses the real service implementations to test integration.
 */

const express = require('express');
const path = require('path');
const { 
  TieredValidationService,
  duplicateService,
  rateLimitService,
  suggestionLogService
} = require('../../src/services');
const {
  createErrorResponse,
  createSuccessResponse,
  handleUnexpectedError,
  ErrorFactory
} = require('../../src/utils/errors');

// Create shared service instance with explicit config path
const configPath = path.resolve(__dirname, '../../src/config/suggestPropertyTiers.json');
const tieredValidationService = new TieredValidationService(configPath);

/**
 * Create processed suggestion from validated data
 */
function createProcessedSuggestion(sanitizedData, suggestionId, ipAddress, userAgent) {
  return {
    ...sanitizedData,
    id: suggestionId,
    submitted_at: new Date().toISOString(),
    status: 'pending',
    ip_address: ipAddress,
    user_agent: userAgent
  };
}

/**
 * Create a mock Express app with Next.js-like API routes
 */
function createMockApp() {
  const app = express();
  
  // Parse JSON bodies
  app.use(express.json());
  app.use(express.text());
  
  // Add request transformation to match Next.js Request API
  app.use((req, res, next) => {
    // Mock Next.js request methods
    req.text = async () => JSON.stringify(req.body);
    req.headers.get = (name) => req.headers[name.toLowerCase()];
    next();
  });
  
  // v1 API endpoint (with defaults and backward compatibility)
  app.post('/api/suggest', async (req, res) => {
    let ipAddress = '';
    
    try {
      // 1. Check rate limiting
      const rateLimitResult = await rateLimitService.checkRateLimit({ request: req });
      ipAddress = rateLimitResult.ipAddress;
      
      if (!rateLimitResult.allowed) {
        await suggestionLogService.logRateLimitExceeded(ipAddress, {
          isValid: false,
          errors: [{ field: 'rate_limit', message: 'Too many submissions', code: 'rate_limited' }],
          warnings: [],
          isDuplicate: false
        });
        
        const errorResponse = createErrorResponse(rateLimitResult.error);
        // In test environment, createErrorResponse returns a mock response object
        return res.status(errorResponse.status).json(await errorResponse.json());
      }
      
      // 2. Validate request with tier-based validation (v1 compatibility mode)
      const body = await req.text();
      const validationResult = await tieredValidationService.validateRequest({ body, ipAddress });
      
      if (!validationResult.isValid) {
        if (validationResult.validation && validationResult.suggestionId) {
          await suggestionLogService.logValidationFailure(
            validationResult.suggestionId,
            validationResult.data,
            validationResult.validation,
            ipAddress
          );
        }
        
        const errorResponse = createErrorResponse(validationResult.error, validationResult.validation);
        return res.status(errorResponse.status).json(await errorResponse.json());
      }
      
      // 3. Check for duplicates
      const duplicateResult = await duplicateService.checkDuplicate({
        lat: validationResult.sanitizedData.lat,
        lng: validationResult.sanitizedData.lng,
        validation: validationResult.validation
      });
      
      if (duplicateResult.isDuplicate) {
        await suggestionLogService.logDuplicateDetection(
          validationResult.suggestionId,
          validationResult.sanitizedData,
          duplicateResult.validation,
          ipAddress
        );
        
        const errorResponse = createErrorResponse(duplicateResult.error, duplicateResult.validation);
        return res.status(errorResponse.status).json(await errorResponse.json());
      }
      
      // 4. Record successful submission
      await rateLimitService.recordSubmission(ipAddress);
      
      // 5. Create processed suggestion
      const processedSuggestion = createProcessedSuggestion(
        validationResult.sanitizedData,
        validationResult.suggestionId,
        ipAddress,
        req.headers.get('user-agent')
      );
      
      // 6. Log successful submission
      const tierSummary = validationResult.validation?.tierSummary || 
                         duplicateResult.validation?.tierSummary;
      
      const enrichedValidation = {
        ...duplicateResult.validation,
        ...(tierSummary && { tierSummary })
      };
      
      // Log validation completion with tier summary
      if (tierSummary) {
        console.log('Validation completed', {
          tierSummary
        });
      }
      
      await suggestionLogService.logSuccessfulSubmission(
        processedSuggestion,
        enrichedValidation,
        ipAddress
      );
      
      const successResponse = createSuccessResponse({
        suggestionId: validationResult.suggestionId,
        message: 'Toilet suggestion submitted successfully',
        validation: enrichedValidation,
        data: {
          sanitizedData: validationResult.sanitizedData
        }
      }, 201);
      
      return res.status(successResponse.status).json(await successResponse.json());
      
    } catch (error) {
      console.error('=== SUGGEST API ERROR ===');
      console.error('Error:', error);
      
      await suggestionLogService.logServerError(error, ipAddress);
      
      const appError = handleUnexpectedError(error);
      const errorResponse = createErrorResponse(appError);
      return res.status(errorResponse.status).json(await errorResponse.json());
    }
  });
  
  // v2 API endpoint (strict validation)
  app.post('/api/v2/suggest', async (req, res) => {
    let ipAddress = '';
    
    try {
      // 1. Check rate limiting
      const rateLimitResult = await rateLimitService.checkRateLimit({ request: req });
      ipAddress = rateLimitResult.ipAddress;
      
      if (!rateLimitResult.allowed) {
        await suggestionLogService.logRateLimitExceeded(ipAddress, {
          isValid: false,
          errors: [{ field: 'rate_limit', message: 'Too many submissions', code: 'rate_limited' }],
          warnings: [],
          isDuplicate: false
        });
        
        const errorResponse = createErrorResponse(rateLimitResult.error);
        // In test environment, createErrorResponse returns a mock response object
        return res.status(errorResponse.status).json(await errorResponse.json());
      }
      
      // 2. Validate request with tier-based validation (v2 strict mode)
      const body = await req.text();
      const validationResult = await tieredValidationService.validateRequest({ 
        body, 
        ipAddress,
        version: 'v2'
      });
      
      if (!validationResult.isValid) {
        if (validationResult.validation && validationResult.suggestionId) {
          await suggestionLogService.logValidationFailure(
            validationResult.suggestionId,
            validationResult.data,
            validationResult.validation,
            ipAddress
          );
        }
        
        const errorResponse = createErrorResponse(validationResult.error, validationResult.validation);
        return res.status(errorResponse.status).json(await errorResponse.json());
      }
      
      // 3. Check for duplicates
      const duplicateResult = await duplicateService.checkDuplicate({
        lat: validationResult.sanitizedData.lat,
        lng: validationResult.sanitizedData.lng,
        validation: validationResult.validation
      });
      
      if (duplicateResult.isDuplicate) {
        await suggestionLogService.logDuplicateDetection(
          validationResult.suggestionId,
          validationResult.sanitizedData,
          duplicateResult.validation,
          ipAddress
        );
        
        const errorResponse = createErrorResponse(duplicateResult.error, duplicateResult.validation);
        return res.status(errorResponse.status).json(await errorResponse.json());
      }
      
      // 4. Record successful submission
      await rateLimitService.recordSubmission(ipAddress);
      
      // 5. Create processed suggestion
      const processedSuggestion = createProcessedSuggestion(
        validationResult.sanitizedData,
        validationResult.suggestionId,
        ipAddress,
        req.headers.get('user-agent')
      );
      
      // 6. Log successful submission with tier information
      const tierSummary = validationResult.validation?.tierSummary || 
                         duplicateResult.validation?.tierSummary;
      
      const enrichedValidation = {
        ...duplicateResult.validation,
        ...(tierSummary && { tierSummary })
      };
      
      // Log validation completion with tier summary
      if (tierSummary) {
        console.log('Validation completed', {
          tierSummary
        });
      }
      
      await suggestionLogService.logSuccessfulSubmission(
        processedSuggestion,
        enrichedValidation,
        ipAddress
      );
      
      const successResponse = createSuccessResponse({
        suggestionId: validationResult.suggestionId,
        message: 'Toilet suggestion submitted successfully',
        validation: enrichedValidation,
        data: {
          sanitizedData: validationResult.sanitizedData
        }
      }, 201);
      
      return res.status(successResponse.status).json(await successResponse.json());
      
    } catch (error) {
      console.error('=== SUGGEST V2 API ERROR ===');
      console.error('Error:', error);
      
      await suggestionLogService.logServerError(error, ipAddress);
      
      const appError = handleUnexpectedError(error);
      const errorResponse = createErrorResponse(appError);
      return res.status(errorResponse.status).json(await errorResponse.json());
    }
  });
  
  return app;
}

module.exports = {
  createMockApp
};