/**
 * Coordinate and Distance Calculation Utilities
 * 
 * @artifact docs/architecture-spec.md#suggest-agent
 * @epic foundation_consolidation_epic
 * @task foundation_consolidation_task3
 * @tdd-phase GREEN
 * 
 * Geographic distance calculations and coordinate validation functions.
 * Uses the Haversine formula for accurate distance calculations on Earth's surface.
 * 
 * Migrated from src/utils/geospatial.ts as part of lib foundation consolidation.
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters
  return Math.round(distance);
}

/**
 * Check if coordinates are within London bounds (approximate)
 */
export function isWithinLondonBounds(lat: number, lng: number): boolean {
  // Approximate London bounds
  const LONDON_BOUNDS = {
    north: 51.7,
    south: 51.3,
    east: 0.3,
    west: -0.6
  };

  return lat >= LONDON_BOUNDS.south && 
         lat <= LONDON_BOUNDS.north && 
         lng >= LONDON_BOUNDS.west && 
         lng <= LONDON_BOUNDS.east;
}

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lng: number, precision: number = 6): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

/**
 * Validate coordinate ranges
 */
export function validateCoordinates(lat: number, lng: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (lat < -90 || lat > 90) {
    errors.push('Latitude must be between -90 and 90 degrees');
  }
  
  if (lng < -180 || lng > 180) {
    errors.push('Longitude must be between -180 and 180 degrees');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}