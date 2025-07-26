/**
 * Base Common Types
 * 
 * @artifact docs/analysis/type-system-organization-analysis.md
 * @epic architecture_optimization_epic
 * @task architecture_optimization_task2
 * @tdd-phase GREEN
 * 
 * Shared base interfaces and utility types used across domains.
 * Provides foundational type definitions for the type system.
 * 
 * This file will contain:
 * - Common base interfaces
 * - Shared utility types
 * - Cross-domain type helpers
 */

// ============================================================================
// Common Utility Types
// ============================================================================

/**
 * Deep partial type helper
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract keys of a specific value type
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Make specific keys optional
 */
export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific keys required
 */
export type RequiredKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// ============================================================================
// Common Base Interfaces
// ============================================================================

/**
 * Base entity with ID and timestamps
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Base response structure
 */
export interface BaseResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    version: string;
    [key: string]: any;
  };
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> extends BaseResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}