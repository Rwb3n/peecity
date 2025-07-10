/**
 * Suggest Agent API Route Handler
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * @doc refs docs/adr/ADR-003-core-property-validation.md
 * 
 * Next.js App Router API v1 endpoint for handling user-submitted toilet suggestions.
 * Provides tier-based schema validation with backward compatibility, duplicate detection, 
 * logging, and rate limiting. Uses lenient validation with defaults for core properties.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  TieredValidationServiceOptimized,
  duplicateService,
  rateLimitService,
  suggestionLogService
} from '../../../services';
import { 
  createErrorResponse as createStandardErrorResponse,
  createSuccessResponse as createStandardSuccessResponse,
  handleUnexpectedError,
  ErrorFactory
} from '../../../utils/errors';
import { createAgentLogger } from '../../../utils/logger';
import { ProcessedSuggestion, SuggestionValidation } from '../../../types/suggestions';

/**
 * Agent-specific logger
 */
const logger = createAgentLogger('suggest-agent');

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
 * Handle POST requests for toilet suggestions
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let ipAddress = '';
  
  try {
    logger.info('suggestion_request', 'Processing suggestion request');
    
    // 1. Check rate limiting
    const rateLimitResult = await rateLimitService.checkRateLimit({ request });
    ipAddress = rateLimitResult.ipAddress;
    
    if (!rateLimitResult.allowed) {
      await suggestionLogService.logRateLimitExceeded(ipAddress, {
        isValid: false,
        errors: [{ field: 'rate_limit', message: 'Too many submissions', code: 'rate_limited' }],
        warnings: [],
        isDuplicate: false
      });
      
      return createStandardErrorResponse(rateLimitResult.error!);
    }
    
    // 2. Validate request with tier-based validation (v1 compatibility mode)
    const body = await request.text();
    const validationResult = await tieredValidationService.validateRequest({ body, ipAddress });
    
    if (!validationResult.isValid) {
      if (validationResult.validation && validationResult.suggestionId) {
        // Schema validation failed
        await suggestionLogService.logValidationFailure(
          validationResult.suggestionId,
          validationResult.data,
          validationResult.validation,
          ipAddress
        );
      }
      
      return createStandardErrorResponse(validationResult.error!);
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
        ipAddress
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
    
    // 6. Log successful submission
    await suggestionLogService.logSuccessfulSubmission(
      processedSuggestion,
      duplicateResult.validation,
      ipAddress
    );
    
    logger.info('suggestion_success', 'Suggestion processed successfully', {
      suggestionId: validationResult.suggestionId,
      ipAddress,
      tierSummary: (validationResult.validation as any)?.tierSummary
    });
    
    // Enrich validation with tier information if available
    const tierSummary = (validationResult.validation as any)?.tierSummary || 
                       (duplicateResult.validation as any)?.tierSummary;
    
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
    console.error('=== SUGGEST API ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('IP Address:', ipAddress);
    console.error('=========================');
    
    logger.error('suggestion_error', 'Error processing suggestion', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error?.constructor?.name,
      stack: error instanceof Error ? error.stack : undefined,
      ipAddress
    });
    
    try {
      await suggestionLogService.logServerError(error, ipAddress);
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