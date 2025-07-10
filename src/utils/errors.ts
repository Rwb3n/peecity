/**
 * Error Handling Utilities
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * 
 * Standardized error handling patterns for API routes and business logic.
 * Provides consistent error responses, logging, and debugging information.
 */

import { NextResponse } from 'next/server';

// Test environment polyfill for NextResponse
function createTestResponse(object: any, init?: ResponseInit) {
  const body = JSON.stringify(object);
  const statusCode = (init && init.status) || 200;
  const headers = new Headers({
    'content-type': 'application/json',
    ...((init && init.headers) || {})
  });
  
  return {
    status: statusCode,
    headers,
    text: async () => body,
    json: async () => object,
    ok: statusCode >= 200 && statusCode < 300,
    statusText: getStatusText(statusCode)
  };
}

function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created', 
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    429: 'Too Many Requests',
    500: 'Internal Server Error'
  };
  return statusTexts[status] || 'Unknown';
}

// Use test polyfill in NODE_ENV=test, otherwise use NextResponse
const ResponseHandler = process.env.NODE_ENV === 'test' 
  ? { json: createTestResponse }
  : NextResponse;

/**
 * Standard error codes used across the application
 */
export enum ErrorCode {
  // Validation errors
  VALIDATION_FAILED = 'validation_failed',
  INVALID_JSON = 'invalid_json',
  MISSING_BODY = 'missing_body',
  INVALID_FORMAT = 'invalid_format',
  OUT_OF_RANGE = 'out_of_range',
  REQUIRED = 'required',
  
  // Business logic errors
  DUPLICATE_DETECTED = 'duplicate_detected',
  RATE_LIMITED = 'rate_limited',
  
  // System errors
  SERVER_ERROR = 'server_error',
  FILE_NOT_FOUND = 'file_not_found',
  PERMISSION_DENIED = 'permission_denied',
  
  // HTTP errors
  METHOD_NOT_ALLOWED = 'method_not_allowed',
  NOT_FOUND = 'not_found',
  UNAUTHORIZED = 'unauthorized'
}

/**
 * Standard HTTP status codes
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: string;
    timestamp?: string;
    requestId?: string;
  };
  validation?: any;
}

/**
 * Application error class for structured error handling
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: HttpStatus;
  public readonly details?: string;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: string,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, AppError);
  }
}

/**
 * Validation error class for schema validation failures
 */
export class ValidationError extends AppError {
  public readonly validationResult: any;

  constructor(message: string, validationResult: any, details?: string) {
    super(
      ErrorCode.VALIDATION_FAILED,
      message,
      HttpStatus.BAD_REQUEST,
      details,
      true
    );
    
    this.name = 'ValidationError';
    this.validationResult = validationResult;
  }
}

/**
 * Duplicate detection error class
 */
export class DuplicateError extends AppError {
  public readonly distance: number;
  public readonly nearestToiletId: string | null;

  constructor(distance: number, nearestToiletId: string | null, thresholdMeters: number) {
    const message = `Toilet suggestion too close to existing toilet (${distance}m away)`;
    const details = nearestToiletId 
      ? `Found existing toilet "${nearestToiletId}" ${distance} meters away` 
      : `Found existing toilet ${distance} meters away`;

    super(
      ErrorCode.DUPLICATE_DETECTED,
      message,
      HttpStatus.CONFLICT,
      details,
      true
    );
    
    this.name = 'DuplicateError';
    this.distance = distance;
    this.nearestToiletId = nearestToiletId;
  }
}

/**
 * Rate limiting error class
 */
export class RateLimitError extends AppError {
  public readonly submissions: number;
  public readonly maxSubmissions: number;
  public readonly windowDuration: number;

  constructor(submissions: number, maxSubmissions: number, windowDuration: number) {
    const message = `Rate limit exceeded. Maximum ${maxSubmissions} submissions per hour.`;
    const details = `You have made ${submissions} submissions in the current window.`;

    super(
      ErrorCode.RATE_LIMITED,
      message,
      HttpStatus.TOO_MANY_REQUESTS,
      details,
      true
    );
    
    this.name = 'RateLimitError';
    this.submissions = submissions;
    this.maxSubmissions = maxSubmissions;
    this.windowDuration = windowDuration;
  }
}

/**
 * Create standardized error response
 * @param error Error instance or error details
 * @param requestId Optional request ID for tracking
 * @returns NextResponse with error
 */
export function createErrorResponse(
  error: AppError | {
    code: ErrorCode;
    message: string;
    statusCode: HttpStatus;
    details?: string;
    validation?: any;
  },
  validation?: any,
  requestId?: string
): NextResponse {
  const response: ErrorResponse = {
    success: false,
    message: error.message,
    error: {
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString(),
      requestId
    }
  };

  // Add validation details if available
  if (validation) {
    response.validation = validation;
  } else if (error instanceof ValidationError) {
    response.validation = error.validationResult;
  } else if ('validation' in error && error.validation) {
    response.validation = error.validation;
  }

  const statusCode = error instanceof AppError ? error.statusCode : error.statusCode;
  
  // Add rate limiting headers if applicable
  if (error instanceof RateLimitError) {
    return ResponseHandler.json(response, {
      status: statusCode,
      headers: {
        'X-RateLimit-Limit': error.maxSubmissions.toString(),
        'X-RateLimit-Remaining': Math.max(0, error.maxSubmissions - error.submissions).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + error.windowDuration).toISOString()
      }
    });
  }

  return ResponseHandler.json(response, { status: statusCode });
}

/**
 * Create success response
 * @param data Response data
 * @param statusCode HTTP status code (default: 200)
 * @returns NextResponse with success data
 */
export function createSuccessResponse(
  data: any,
  statusCode: HttpStatus = HttpStatus.OK
): NextResponse {
  const response = {
    success: true,
    ...data,
    timestamp: new Date().toISOString()
  };

  return ResponseHandler.json(response, { status: statusCode });
}

/**
 * Handle unexpected errors and convert them to AppErrors
 * @param error Unknown error
 * @returns AppError instance
 */
export function handleUnexpectedError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      ErrorCode.SERVER_ERROR,
      'Internal server error occurred',
      HttpStatus.INTERNAL_SERVER_ERROR,
      error.message,
      false // Not operational since it's unexpected
    );
  }

  return new AppError(
    ErrorCode.SERVER_ERROR,
    'Unknown server error occurred',
    HttpStatus.INTERNAL_SERVER_ERROR,
    String(error),
    false
  );
}

/**
 * Check if error is operational (expected business logic error)
 * @param error Error to check
 * @returns True if operational error
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Error factory functions for common errors
 */
export const ErrorFactory = {
  /**
   * Create validation error
   */
  validation: (message: string, validationResult: any, details?: string) =>
    new ValidationError(message, validationResult, details),

  /**
   * Create duplicate detection error
   */
  duplicate: (distance: number, nearestToiletId: string | null, thresholdMeters: number) =>
    new DuplicateError(distance, nearestToiletId, thresholdMeters),

  /**
   * Create rate limiting error
   */
  rateLimit: (submissions: number, maxSubmissions: number, windowDuration: number) =>
    new RateLimitError(submissions, maxSubmissions, windowDuration),

  /**
   * Create invalid JSON error
   */
  invalidJson: (details?: string) =>
    new AppError(
      ErrorCode.INVALID_JSON,
      'Invalid JSON in request body',
      HttpStatus.BAD_REQUEST,
      details
    ),

  /**
   * Create missing body error
   */
  missingBody: () =>
    new AppError(
      ErrorCode.MISSING_BODY,
      'Request body is required',
      HttpStatus.BAD_REQUEST
    ),

  /**
   * Create method not allowed error
   */
  methodNotAllowed: (method?: string) =>
    new AppError(
      ErrorCode.METHOD_NOT_ALLOWED,
      'Method not allowed',
      HttpStatus.METHOD_NOT_ALLOWED,
      method ? `Method ${method} is not supported` : undefined
    ),

  /**
   * Create server error
   */
  serverError: (details?: string) =>
    new AppError(
      ErrorCode.SERVER_ERROR,
      'Internal server error occurred',
      HttpStatus.INTERNAL_SERVER_ERROR,
      details,
      false
    )
};