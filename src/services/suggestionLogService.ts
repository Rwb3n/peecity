/**
 * Suggestion Logging Service
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * 
 * Service for logging suggestion-related events with structured data.
 * Handles suggestion logs, validation failures, and system events.
 */

import { getFilePathsConfig } from '../utils/config';
import { createAgentLogger } from '../utils/logger';
import { FileLogWriter, createFileLogWriter } from '../utils/fileLogWriter';
import { SuggestionLogEntry, ProcessedSuggestion, SuggestionValidation } from '../types/suggestions';

const logger = createAgentLogger('suggestion-log-service');

export interface LogSuggestionRequest {
  suggestionId: string;
  action: 'submitted' | 'validation_failed' | 'duplicate_detected' | 'rate_limited' | 'server_error';
  data: any;
  result: SuggestionValidation;
  ipAddress: string;
}

/**
 * Suggestion logging service class
 */
export class SuggestionLogService {
  private readonly logWriter: FileLogWriter;

  constructor() {
    const config = getFilePathsConfig();
    this.logWriter = createFileLogWriter({
      filePath: config.suggestionsLog,
      createDirectories: true,
      encoding: 'utf8',
      appendNewline: true
    });
  }

  /**
   * Log a suggestion-related event
   * @param request Log request with event data
   */
  async logSuggestion(request: LogSuggestionRequest): Promise<void> {
    const logEntry: SuggestionLogEntry = {
      timestamp: new Date().toISOString(),
      suggestionId: request.suggestionId,
      action: request.action,
      data: { ...request.data, ip_address: request.ipAddress },
      result: request.result
    };
    
    try {
      await this.logWriter.appendJson(logEntry);
      
      logger.debug('log_suggestion', 'Suggestion logged successfully', { 
        suggestionId: request.suggestionId,
        action: request.action,
        ipAddress: request.ipAddress
      });
      
      // Also log through the structured logger for additional monitoring
      switch (request.action) {
        case 'submitted':
          logger.info('suggestion_submitted', 'New suggestion submitted', {
            suggestionId: request.suggestionId,
            coordinates: request.data.lat && request.data.lng 
              ? { lat: request.data.lat, lng: request.data.lng }
              : undefined,
            hasName: !!request.data.name,
            ipAddress: request.ipAddress
          });
          break;
          
        case 'validation_failed':
          logger.warn('suggestion_validation_failed', 'Suggestion validation failed', {
            suggestionId: request.suggestionId,
            errorCount: request.result.errors?.length || 0,
            ipAddress: request.ipAddress
          });
          break;
          
        case 'duplicate_detected':
          logger.info('suggestion_duplicate', 'Duplicate suggestion detected', {
            suggestionId: request.suggestionId,
            distance: request.result.duplicateDistance,
            nearestToiletId: request.result.nearestToiletId,
            ipAddress: request.ipAddress
          });
          break;
          
        case 'rate_limited':
          logger.warn('suggestion_rate_limited', 'Rate limit exceeded', {
            suggestionId: request.suggestionId,
            ipAddress: request.ipAddress
          });
          break;
          
        case 'server_error':
          logger.error('suggestion_server_error', 'Server error during suggestion processing', {
            suggestionId: request.suggestionId,
            error: request.data.error,
            ipAddress: request.ipAddress
          });
          break;
      }
      
    } catch (error) {
      logger.error('log_suggestion', 'Failed to log suggestion', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestionId: request.suggestionId,
        action: request.action
      });
      
      // Don't throw error - logging failure shouldn't block the API response
    }
  }

  /**
   * Log a successful suggestion submission
   * @param suggestion Processed suggestion data
   * @param validation Validation result
   * @param ipAddress Client IP address
   */
  async logSuccessfulSubmission(
    suggestion: ProcessedSuggestion,
    validation: SuggestionValidation,
    ipAddress: string
  ): Promise<void> {
    await this.logSuggestion({
      suggestionId: suggestion.id,
      action: 'submitted',
      data: suggestion,
      result: validation,
      ipAddress
    });
  }

  /**
   * Log a validation failure
   * @param suggestionId Suggestion ID
   * @param data Original request data
   * @param validation Validation result with errors
   * @param ipAddress Client IP address
   */
  async logValidationFailure(
    suggestionId: string,
    data: any,
    validation: SuggestionValidation,
    ipAddress: string
  ): Promise<void> {
    await this.logSuggestion({
      suggestionId,
      action: 'validation_failed',
      data,
      result: validation,
      ipAddress
    });
  }

  /**
   * Log a duplicate detection
   * @param suggestionId Suggestion ID
   * @param data Sanitized suggestion data
   * @param validation Validation result with duplicate info
   * @param ipAddress Client IP address
   */
  async logDuplicateDetection(
    suggestionId: string,
    data: any,
    validation: SuggestionValidation,
    ipAddress: string
  ): Promise<void> {
    await this.logSuggestion({
      suggestionId,
      action: 'duplicate_detected',
      data,
      result: validation,
      ipAddress
    });
  }

  /**
   * Log a rate limiting event
   * @param ipAddress Client IP address
   * @param validation Basic validation result
   */
  async logRateLimitExceeded(
    ipAddress: string,
    validation: SuggestionValidation
  ): Promise<void> {
    await this.logSuggestion({
      suggestionId: '',
      action: 'rate_limited',
      data: { ip_address: ipAddress },
      result: validation,
      ipAddress
    });
  }

  /**
   * Log a server error
   * @param error Error details
   * @param ipAddress Client IP address
   */
  async logServerError(error: any, ipAddress: string): Promise<void> {
    await this.logSuggestion({
      suggestionId: '',
      action: 'server_error',
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      result: {
        isValid: false,
        errors: [{ field: 'server', message: 'Internal server error', code: 'server_error' }],
        warnings: [],
        isDuplicate: false
      },
      ipAddress
    });
  }

  /**
   * Get logging statistics for monitoring
   */
  async getStatistics(): Promise<{
    logFileExists: boolean;
    logFilePath: string;
    lastModified?: Date;
    sizeBytes?: number;
  }> {
    try {
      const stats = await this.logWriter.getStats();
      const exists = await this.logWriter.exists();
      
      return {
        logFileExists: exists,
        logFilePath: this.logWriter.getFilePath(),
        lastModified: stats?.mtime,
        sizeBytes: stats?.size
      };
    } catch (error) {
      return {
        logFileExists: false,
        logFilePath: this.logWriter.getFilePath()
      };
    }
  }
}

/**
 * Create singleton suggestion log service instance
 */
export const suggestionLogService = new SuggestionLogService();