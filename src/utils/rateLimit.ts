/**
 * Rate Limiting Utilities for API Protection
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * 
 * In-memory rate limiting implementation with sliding window approach.
 * Tracks submissions per IP address to prevent spam and abuse.
 */

import { RateLimitInfo } from '../types/suggestions';

/**
 * Rate limit configuration
 */
const RATE_LIMIT_CONFIG = {
  maxSubmissionsPerHour: 5,
  windowDurationMs: 60 * 60 * 1000, // 1 hour
  cleanupIntervalMs: 5 * 60 * 1000   // 5 minutes
};

/**
 * In-memory store for rate limit tracking
 */
class RateLimitStore {
  private submissions = new Map<string, number[]>();
  private lastCleanup = Date.now();

  /**
   * Record a submission for an IP address
   */
  recordSubmission(ip: string): void {
    const now = Date.now();
    
    if (!this.submissions.has(ip)) {
      this.submissions.set(ip, []);
    }
    
    const timestamps = this.submissions.get(ip)!;
    timestamps.push(now);
    
    // Clean up old entries for this IP
    this.cleanupOldEntries(ip);
    
    // Periodic cleanup of all IPs
    if (now - this.lastCleanup > RATE_LIMIT_CONFIG.cleanupIntervalMs) {
      this.cleanupAllEntries();
      this.lastCleanup = now;
    }
  }

  /**
   * Get current submission count for an IP
   */
  getSubmissionCount(ip: string): number {
    this.cleanupOldEntries(ip);
    return this.submissions.get(ip)?.length || 0;
  }

  /**
   * Check if IP is rate limited
   */
  isRateLimited(ip: string): boolean {
    return this.getSubmissionCount(ip) >= RATE_LIMIT_CONFIG.maxSubmissionsPerHour;
  }

  /**
   * Get rate limit info for an IP
   */
  getRateLimitInfo(ip: string): RateLimitInfo {
    this.cleanupOldEntries(ip);
    const submissions = this.getSubmissionCount(ip);
    const windowStart = new Date(Date.now() - RATE_LIMIT_CONFIG.windowDurationMs).toISOString();
    
    return {
      ip,
      submissions,
      windowStart,
      windowDuration: RATE_LIMIT_CONFIG.windowDurationMs,
      maxSubmissions: RATE_LIMIT_CONFIG.maxSubmissionsPerHour
    };
  }

  /**
   * Remove old entries for a specific IP
   */
  private cleanupOldEntries(ip: string): void {
    if (!this.submissions.has(ip)) return;
    
    const now = Date.now();
    const cutoff = now - RATE_LIMIT_CONFIG.windowDurationMs;
    const timestamps = this.submissions.get(ip)!;
    
    const validTimestamps = timestamps.filter(timestamp => timestamp > cutoff);
    
    if (validTimestamps.length === 0) {
      this.submissions.delete(ip);
    } else {
      this.submissions.set(ip, validTimestamps);
    }
  }

  /**
   * Cleanup old entries for all IPs
   */
  private cleanupAllEntries(): void {
    const ipsToCheck = Array.from(this.submissions.keys());
    for (const ip of ipsToCheck) {
      this.cleanupOldEntries(ip);
    }
  }

  /**
   * Get statistics about the rate limiter
   */
  getStats(): { totalIPs: number; totalSubmissions: number } {
    let totalSubmissions = 0;
    for (const timestamps of this.submissions.values()) {
      totalSubmissions += timestamps.length;
    }
    
    return {
      totalIPs: this.submissions.size,
      totalSubmissions
    };
  }

  /**
   * Clear all rate limit data (for testing)
   */
  clear(): void {
    this.submissions.clear();
    this.lastCleanup = Date.now();
  }
}

// Global rate limit store instance
const rateLimitStore = new RateLimitStore();

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(ip: string): { allowed: boolean; info: RateLimitInfo } {
  const info = rateLimitStore.getRateLimitInfo(ip);
  const allowed = !rateLimitStore.isRateLimited(ip);
  
  return { allowed, info };
}

/**
 * Record a submission for rate limiting
 */
export function recordSubmission(ip: string): void {
  rateLimitStore.recordSubmission(ip);
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats(): { totalIPs: number; totalSubmissions: number } {
  return rateLimitStore.getStats();
}

/**
 * Clear rate limit data (for testing)
 */
export function clearRateLimit(): void {
  rateLimitStore.clear();
}

/**
 * Extract IP address from request headers
 */
export function extractIPAddress(request: Request): string {
  // Check common headers for real IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Take the first IP from the chain
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to a default IP for development/testing
  return '127.0.0.1';
}