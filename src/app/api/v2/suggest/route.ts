/**
 * Suggest Agent API v2 Route Handler
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * @doc refs docs/adr/ADR-003-core-property-validation.md
 * 
 * Next.js App Router API v2 endpoint with strict tier-based validation.
 * Requires all core properties and validates according to 4-tier system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  TieredValidationServiceOptimized,
  duplicateService,
  rateLimitService,
  suggestionLogService
} from '../../../../services';
import { 
  createErrorResponse as createStandardErrorResponse,
  createSuccessResponse as createStandardSuccessResponse,
  handleUnexpectedError,
  ErrorFactory
} from '../../../../utils/errors';
import { createAgentLogger } from '../../../../utils/logger';
import { ProcessedSuggestion, SuggestionValidation } from '../../../../types/suggestions';

/**
 * Agent-specific logger
 */
const logger = createAgentLogger('suggest-agent-v2');

/**
 * Tier-based validation service instance (optimized version)
 */
const tieredValidationService = new TieredValidationServiceOptimized();

/**
 * Create processed suggestion from validated data
 * @param sanitizedData Sanitized suggestion data
 * @param suggestionId Generated suggestion ID
 * @param ipAddress Client IP address
 * @param userAgent Client user agent
 * @returns Processed suggestion object
 */
function createProcessedSuggestion(
  sanitizedData: any,
  suggestionId: string,
  ipAddress: string,
  userAgent?: string
): ProcessedSuggestion {
  return {
    ...sanitizedData as any,
    id: suggestionId,
    submitted_at: new Date().toISOString(),
    status: 'pending',
    ip_address: ipAddress,
    user_agent: userAgent
  };
}

/**
 * Create tier-aware validation object for response
 */
function createTierValidation(validation: SuggestionValidation & { tierSummary?: any }): SuggestionValidation {
  return {
    ...validation,
    // Add tier summary if available
    ...(validation.tierSummary && { tierSummary: validation.tierSummary })
  };
}

/**
 * Handle POST requests for toilet suggestions with v2 strict validation
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let ipAddress = '';
  
  try {
    logger.info('suggestion_request_v2', 'Processing v2 suggestion request');
    
    // 1. Check rate limiting
    const rateLimitResult = await rateLimitService.checkRateLimit({ request });
    ipAddress = rateLimitResult.ipAddress;
    
    if (!rateLimitResult.allowed) {
      await suggestionLogService.logRateLimitExceeded(ipAddress, {
        isValid: false,
        errors: [{ field: 'rate_limit', message: 'Too many submissions', code: 'rate_limited' }],
        warnings: [],
        isDuplicate: false
      }, 'v2');
      
      return createStandardErrorResponse(rateLimitResult.error!);
    }
    
    // 2. Validate request with tier-based validation (v2 strict mode)
    const body = await request.text();
    const validationResult = await tieredValidationService.validateRequest({ 
      body, 
      ipAddress,
      // Pass v2 flag to enable strict validation
      version: 'v2'
    } as any);
    
    if (!validationResult.isValid) {
      if (validationResult.validation && validationResult.suggestionId) {
        // Schema validation failed
        await suggestionLogService.logValidationFailure(
          validationResult.suggestionId,
          validationResult.data,
          validationResult.validation,
          ipAddress,
          'v2'
        );
      }
      
      // For v2, include tier information in error response
      const errorResponse = validationResult.error!;
      if (validationResult.validation) {
        errorResponse.validation = createTierValidation(validationResult.validation);
      }
      
      return createStandardErrorResponse(errorResponse, validationResult.validation);
    }
    
    // 3. Check for duplicates
    const duplicateResult = await duplicateService.checkDuplicate({
      lat: validationResult.sanitizedData!.lat!,
      lng: validationResult.sanitizedData!.lng!,
      validation: validationResult.validation!
    });
    
    if (duplicateResult.isDuplicate) {
      await suggestionLogService.logDuplicateDetection(
        validationResult.suggestionId!,
        validationResult.sanitizedData,
        duplicateResult.validation,
        ipAddress,
        'v2'
      );
      
      // Return special duplicate response format that includes validation
      return createStandardErrorResponse(duplicateResult.error!, duplicateResult.validation);
    }
    
    // 4. Record successful submission
    await rateLimitService.recordSubmission(ipAddress);
    
    // 5. Create processed suggestion
    const processedSuggestion = createProcessedSuggestion(
      validationResult.sanitizedData!,
      validationResult.suggestionId!,
      ipAddress,
      request.headers.get('user-agent') || undefined
    );
    
    // 6. Log successful submission with tier information
    const enrichedValidation = createTierValidation(duplicateResult.validation);
    await suggestionLogService.logSuccessfulSubmission(
      processedSuggestion,
      enrichedValidation,
      ipAddress,
      'v2'
    );
    
    logger.info('suggestion_success_v2', 'V2 suggestion processed successfully', {
      suggestionId: validationResult.suggestionId,
      ipAddress,
      tierSummary: (validationResult.validation as any)?.tierSummary
    });
    
    // Log validation completion with tier summary
    if ((validationResult.validation as any).tierSummary) {
      console.log('Validation completed', {
        tierSummary: (validationResult.validation as any).tierSummary
      });
    }
    
    return createStandardSuccessResponse({
      suggestionId: validationResult.suggestionId,
      message: 'Toilet suggestion submitted successfully',
      validation: enrichedValidation,
      data: {
        sanitizedData: validationResult.sanitizedData
      }
    }, 201);
    
  } catch (error) {
    // Enhanced error logging for debugging
    console.error('=== SUGGEST V2 API ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('IP Address:', ipAddress);
    console.error('============================');
    
    logger.error('suggestion_error_v2', 'Error processing v2 suggestion', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error?.constructor?.name,
      stack: error instanceof Error ? error.stack : undefined,
      ipAddress
    });
    
    try {
      await suggestionLogService.logServerError(error, ipAddress, 'v2');
    } catch (logError) {
      console.error('Failed to log server error:', logError);
    }
    
    const appError = handleUnexpectedError(error);
    return createStandardErrorResponse(appError);
  }
}

/**
 * Handle other HTTP methods
 */
export async function GET(): Promise<NextResponse> {
  return createStandardErrorResponse(ErrorFactory.methodNotAllowed('GET'));
}

export async function PUT(): Promise<NextResponse> {
  return createStandardErrorResponse(ErrorFactory.methodNotAllowed('PUT'));
}

export async function DELETE(): Promise<NextResponse> {
  return createStandardErrorResponse(ErrorFactory.methodNotAllowed('DELETE'));
}

export async function PATCH(): Promise<NextResponse> {
  return createStandardErrorResponse(ErrorFactory.methodNotAllowed('PATCH'));
}