/**
 * Geospatial Utilities for Toilet Location Processing
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * 
 * Geographic distance calculations and coordinate validation functions.
 * Uses the Haversine formula for accurate distance calculations on Earth's surface.
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
 * Spatial grid index for efficient nearest neighbor queries
 */
interface SpatialIndex {
  grid: Map<string, any[]>;
  cellSize: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

/**
 * Global spatial index cache
 */
let globalSpatialIndex: SpatialIndex | null = null;

/**
 * Create a spatial grid index for efficient nearest neighbor queries
 * @param toilets Array of toilet features
 * @param cellSize Size of each grid cell in degrees (default: 0.01 ≈ 1.1km)
 * @returns Spatial index structure
 */
export function createSpatialIndex(toilets: any[], cellSize: number = 0.01): SpatialIndex {
  const grid = new Map<string, any[]>();
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  for (const toilet of toilets) {
    if (toilet.geometry && toilet.geometry.type === 'Point' && toilet.geometry.coordinates) {
      const [toiletLng, toiletLat] = toilet.geometry.coordinates;
      
      // Update bounds
      minLat = Math.min(minLat, toiletLat);
      maxLat = Math.max(maxLat, toiletLat);
      minLng = Math.min(minLng, toiletLng);
      maxLng = Math.max(maxLng, toiletLng);
      
      // Calculate grid cell key
      const cellLat = Math.floor(toiletLat / cellSize);
      const cellLng = Math.floor(toiletLng / cellSize);
      const key = `${cellLat},${cellLng}`;
      
      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(toilet);
    }
  }

  return {
    grid,
    cellSize,
    bounds: { minLat, maxLat, minLng, maxLng }
  };
}

/**
 * Get grid cell keys for a radius search
 * @param lat Target latitude
 * @param lng Target longitude
 * @param radius Search radius in meters
 * @param index Spatial index
 * @returns Array of cell keys to search
 */
function getSearchCells(lat: number, lng: number, radius: number, index: SpatialIndex): string[] {
  // Convert radius from meters to approximate degrees
  const degreeRadius = radius / 111000; // Rough conversion: 1 degree ≈ 111km
  
  const cellRadius = Math.ceil(degreeRadius / index.cellSize);
  const baseCellLat = Math.floor(lat / index.cellSize);
  const baseCellLng = Math.floor(lng / index.cellSize);
  
  const cells: string[] = [];
  
  for (let dLat = -cellRadius; dLat <= cellRadius; dLat++) {
    for (let dLng = -cellRadius; dLng <= cellRadius; dLng++) {
      const cellLat = baseCellLat + dLat;
      const cellLng = baseCellLng + dLng;
      cells.push(`${cellLat},${cellLng}`);
    }
  }
  
  return cells;
}

/**
 * Find nearest toilet using spatial indexing for better performance
 * @param lat Target latitude
 * @param lng Target longitude
 * @param existingToilets Array of existing toilet features
 * @param useCache Whether to use cached spatial index
 * @returns Object with nearest toilet info
 */
export function findNearestToilet(
  lat: number, 
  lng: number, 
  existingToilets: any[],
  useCache: boolean = true
): { distance: number; toiletId: string | null; toilet: any | null } {
  if (!existingToilets || existingToilets.length === 0) {
    return { distance: Infinity, toiletId: null, toilet: null };
  }

  // Use cached spatial index if available and requested
  let spatialIndex: SpatialIndex;
  if (useCache && globalSpatialIndex && existingToilets.length > 100) {
    spatialIndex = globalSpatialIndex;
  } else {
    spatialIndex = createSpatialIndex(existingToilets);
    if (useCache && existingToilets.length > 100) {
      globalSpatialIndex = spatialIndex;
    }
  }

  // For small datasets, use linear search for simplicity
  if (existingToilets.length < 100) {
    return findNearestToiletLinear(lat, lng, existingToilets);
  }

  let nearestDistance = Infinity;
  let nearestToiletId: string | null = null;
  let nearestToilet: any | null = null;

  // Start with a small radius and expand if needed
  const maxRadius = 5000; // 5km max search radius
  const searchRadii = [100, 500, 1000, 2000, 5000];
  
  for (const radius of searchRadii) {
    const searchCells = getSearchCells(lat, lng, radius, spatialIndex);
    
    for (const cellKey of searchCells) {
      const cellToilets = spatialIndex.grid.get(cellKey);
      if (!cellToilets) continue;
      
      for (const toilet of cellToilets) {
        if (toilet.geometry && toilet.geometry.type === 'Point' && toilet.geometry.coordinates) {
          const [toiletLng, toiletLat] = toilet.geometry.coordinates;
          const distance = calculateDistance(lat, lng, toiletLat, toiletLng);
          
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestToiletId = toilet.properties?.id || null;
            nearestToilet = toilet;
          }
        }
      }
    }
    
    // If we found something within this radius, we can stop expanding
    if (nearestDistance < radius) {
      break;
    }
  }

  return { 
    distance: nearestDistance === Infinity ? 0 : nearestDistance, 
    toiletId: nearestToiletId, 
    toilet: nearestToilet 
  };
}

/**
 * Linear search implementation for small datasets or fallback
 * @param lat Target latitude
 * @param lng Target longitude
 * @param existingToilets Array of existing toilet features
 * @returns Object with nearest toilet info
 */
function findNearestToiletLinear(
  lat: number, 
  lng: number, 
  existingToilets: any[]
): { distance: number; toiletId: string | null; toilet: any | null } {
  let nearestDistance = Infinity;
  let nearestToiletId: string | null = null;
  let nearestToilet: any | null = null;

  for (const toilet of existingToilets) {
    if (toilet.geometry && toilet.geometry.type === 'Point' && toilet.geometry.coordinates) {
      const [toiletLng, toiletLat] = toilet.geometry.coordinates;
      const distance = calculateDistance(lat, lng, toiletLat, toiletLng);
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestToiletId = toilet.properties?.id || null;
        nearestToilet = toilet;
      }
    }
  }

  return { 
    distance: nearestDistance === Infinity ? 0 : nearestDistance, 
    toiletId: nearestToiletId, 
    toilet: nearestToilet 
  };
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
 * Clear the global spatial index cache
 * Call this when toilet data is updated
 */
export function clearSpatialIndexCache(): void {
  globalSpatialIndex = null;
}

/**
 * Get cache statistics for monitoring
 */
export function getSpatialIndexCacheStats(): { 
  cached: boolean; 
  cellCount: number; 
  totalItems: number; 
  bounds?: SpatialIndex['bounds'];
} {
  if (!globalSpatialIndex) {
    return { cached: false, cellCount: 0, totalItems: 0 };
  }
  
  let totalItems = 0;
  for (const items of globalSpatialIndex.grid.values()) {
    totalItems += items.length;
  }
  
  return {
    cached: true,
    cellCount: globalSpatialIndex.grid.size,
    totalItems,
    bounds: globalSpatialIndex.bounds
  };
}