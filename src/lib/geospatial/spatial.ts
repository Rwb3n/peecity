/**
 * Spatial Indexing and Search Utilities
 * 
 * @artifact docs/architecture-spec.md#suggest-agent
 * @epic foundation_consolidation_epic
 * @task foundation_consolidation_task3
 * @tdd-phase GREEN
 * 
 * Spatial grid index for efficient nearest neighbor queries and duplicate detection.
 * 
 * Migrated from src/utils/geospatial.ts as part of lib foundation consolidation.
 */

import { calculateDistance } from './coordinates';

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