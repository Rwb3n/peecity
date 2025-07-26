/**
 * Optimized TieredValidationService Export
 * 
 * Export wrapper for optimized validation service from factory
 */

import { createOptimizedValidationService } from './validation/factory';

// Export constructor function that creates optimized service instances
export function TieredValidationServiceOptimized() {
  return createOptimizedValidationService();
}