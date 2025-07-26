/**
 * Validation Error Handling and Messages
 * 
 * @artifact docs/cookbook/recipe_tiered_validation.md
 * @epic foundation_consolidation_epic
 * @task foundation_consolidation_task3
 * @tdd-phase GREEN
 * 
 * Standardized error handling patterns and messages for validation.
 * Provides consistent error responses, logging, and debugging information.
 * 
 * Combines src/utils/errors.ts and src/utils/errorMessages.ts as part of lib consolidation.
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
  SCHEMA_VALIDATION_FAILED = 'schema_validation_failed',
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
  
  // Schema validation messages
  SCHEMA_VALIDATION_FAILED: (schemaType: string, details?: string) =>
    `Schema validation failed for ${schemaType}${details ? `: ${details}` : ''}`,
  SCHEMA_PROPERTY_INVALID: (property: string, schemaType: string) =>
    `Property '${property}' does not match ${schemaType} schema requirements`,
  SCHEMA_REQUIRED_MISSING: (property: string, schemaType: string) =>
    `Required property '${property}' is missing in ${schemaType} schema`,
  SCHEMA_TYPE_MISMATCH: (property: string, expected: string, actual: string) =>
    `Property '${property}' expected ${expected}, got ${actual}`,

  // Generic validation messages
  VALIDATION_FAILED: (details?: string) => 
    details ? `Validation failed: ${details}` : 'Validation failed',
  MULTIPLE_ERRORS: (count: number) => 
    `${count} validation errors found`
} as const;

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
   * Create schema validation error
   */
  schemaValidation: (schemaType: string, errors: any[], data?: any) =>
    new AppError(
      ErrorCode.SCHEMA_VALIDATION_FAILED,
      `Schema validation failed for ${schemaType}`,
      HttpStatus.BAD_REQUEST,
      `Schema errors: ${JSON.stringify(errors)}${data ? ` | Data: ${JSON.stringify(data)}` : ''}`
    ),

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
   * Create internal server error
   */
  internalError: (details?: string) =>
    new AppError(
      ErrorCode.SERVER_ERROR,
      'Internal server error occurred',
      HttpStatus.INTERNAL_SERVER_ERROR,
      details,
      false
    ),

  /**
   * Create server error (alias for backward compatibility)
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

/**
 * Create standardized error response
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
  return ResponseHandler.json(response, { status: statusCode });
}

/**
 * Create success response
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
 * Helper to format field names for display
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
    'charge': 'Fee amount'
  };
  
  return fieldMappings[field] || field.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
}