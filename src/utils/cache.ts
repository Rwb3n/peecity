/**
 * Simple in-memory cache implementation with TTL support
 * 
 * @artifact docs/cookbook/recipe_metrics_export.md
 * @task metrics_export_0013_task6
 * @tdd-phase REFACTOR
 */

export interface CacheEntry<T> {
  value: T;
  etag: string;
  expiresAt: number;
}

export class MemoryCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private defaultTTL: number = 60000) {
    // Start cleanup interval to remove expired entries
    this.cleanupInterval = setInterval(() => this.cleanup(), 30000);
  }

  /**
   * Generate ETag from value
   */
  private generateETag(value: T): string {
    const hash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(value))
      .digest('hex');
    return `"${hash}"`;
  }

  /**
   * Get value from cache
   */
  get(key: string): { value: T; etag: string } | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return {
      value: entry.value,
      etag: entry.etag
    };
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): string {
    const etag = this.generateETag(value);
    const expiresAt = Date.now() + (ttl || this.defaultTTL);

    this.cache.set(key, {
      value,
      etag,
      expiresAt
    });

    return etag;
  }

  /**
   * Check if ETag matches
   */
  hasMatchingETag(key: string, etag: string): boolean {
    const entry = this.cache.get(key);
    return entry ? entry.etag === etag : false;
  }

  /**
   * Clear specific key or all keys
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Destroy cache and stop cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Global cache instance for validation summary
export const summaryCache = new MemoryCache(60000); // 60 seconds TTL