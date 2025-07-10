/**
 * Rate Limiting Service
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * 
 * Service for managing API rate limiting with IP-based tracking.
 * Handles rate limit checks, submission recording, and cleanup.
 */

import { checkRateLimit, recordSubmission, extractIPAddress, getRateLimitStats } from '../utils/rateLimit';
import { getRateLimitConfig } from '../utils/config';
import { createAgentLogger } from '../utils/logger';
import { ErrorFactory } from '../utils/errors';
import { NextRequest } from 'next/server';

const logger = createAgentLogger('rate-limit-service');

export interface RateLimitRequest {
  request: NextRequest;
}

export interface RateLimitResult {
  allowed: boolean;
  ipAddress: string;
  submissions: number;
  maxSubmissions: number;
  windowDuration: number;
  error?: any;
}

/**
 * Rate limiting service class
 */
export class RateLimitService {
  /**
   * Check if a request is within rate limits
   * @param request Rate limit request
   * @returns Rate limit check result
   */
  async checkRateLimit(request: RateLimitRequest): Promise<RateLimitResult> {
    try {
      if (!request || !request.request) {
        throw new Error('Invalid request object');
      }
      
      const ipAddress = extractIPAddress(request.request);
      const config = getRateLimitConfig();
      
      logger.debug('check_rate_limit', 'Checking rate limit', {
        ipAddress,
        maxSubmissions: config.maxSubmissions,
        windowDuration: config.windowDuration
      });
      
      const { allowed, info } = checkRateLimit(ipAddress);
    
    const result: RateLimitResult = {
      allowed,
      ipAddress,
      submissions: info.submissions,
      maxSubmissions: info.maxSubmissions,
      windowDuration: info.windowDuration
    };
    
    if (!allowed) {
      logger.warn('rate_limit_exceeded', 'Rate limit exceeded for IP', {
        ipAddress,
        submissions: info.submissions,
        maxSubmissions: info.maxSubmissions,
        windowDuration: info.windowDuration
      });
      
      result.error = ErrorFactory.rateLimit(
        info.submissions,
        info.maxSubmissions,
        info.windowDuration
      );
    } else {
      logger.debug('rate_limit_ok', 'Rate limit check passed', {
        ipAddress,
        submissions: info.submissions,
        maxSubmissions: info.maxSubmissions
      });
    }
    
      return result;
    } catch (error) {
      logger.error('rate_limit_error', 'Error checking rate limit', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        allowed: false,
        ipAddress: 'unknown',
        submissions: 0,
        maxSubmissions: 5,
        windowDuration: 3600000,
        error: ErrorFactory.serverError('Rate limit check failed')
      };
    }
  }

  /**
   * Record a successful submission for rate limiting
   * @param ipAddress IP address to record submission for
   */
  async recordSubmission(ipAddress: string): Promise<void> {
    try {
      recordSubmission(ipAddress);
      
      logger.debug('record_submission', 'Submission recorded for rate limiting', {
        ipAddress
      });
    } catch (error) {
      logger.error('record_submission', 'Failed to record submission', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress
      });
      
      // Don't throw error - rate limiting failure shouldn't block the submission
    }
  }

  /**
   * Get rate limiting statistics for monitoring
   * @returns Rate limiting statistics
   */
  getStatistics(): {
    activeIPs: number;
    totalSubmissions: number;
    config: {
      maxSubmissions: number;
      windowDurationMs: number;
    };
  } {
    try {
      const config = getRateLimitConfig();
      const stats = getRateLimitStats();
      
      return {
        activeIPs: stats.totalIPs,
        totalSubmissions: stats.totalSubmissions,
        config: {
          maxSubmissions: config.maxSubmissions,
          windowDurationMs: config.windowDuration
        }
      };
    } catch (error) {
      logger.error('stats_error', 'Error getting rate limit statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        activeIPs: 0,
        totalSubmissions: 0,
        config: {
          maxSubmissions: 5,
          windowDurationMs: 3600000
        }
      };
    }
  }
}

/**
 * Create singleton rate limit service instance
 */
export const rateLimitService = new RateLimitService();