/**
 * DuplicateService Test Suite - Production Tests (RED Phase)
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * @fix refs issues/issue_0005.txt, plans/plan_fix_duplicate_detection_0005.txt
 * 
 * This test suite validates the DuplicateService.checkDuplicate() method
 * for correct duplicate detection behavior within 50m threshold and 
 * accurate distance calculations. These tests will initially FAIL due to
 * the function signature bug where {lat, lng} object is passed instead
 * of individual lat, lng parameters to findNearestToilet().
 * 
 * TDD Phase: RED (tests must fail to confirm bug exists)
 */

const { DuplicateService } = require('../../src/services/duplicateService');

// Create mock data provider with realistic London toilet data in proper GeoJSON format
const mockDataProvider = {
  loadToilets: jest.fn().mockResolvedValue([
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-0.1278, 51.5074] // London coordinates: [lng, lat]
      },
      properties: {
        id: 'osm_node_test_central',
        name: 'Central Test Toilet',
        hours: '24/7',
        accessible: true,
        fee: 0,
        source: 'osm',
        last_verified_at: '2025-07-04T00:00:00Z',
        verified_by: 'test'
      }
    },
    {
      type: 'Feature', 
      geometry: {
        type: 'Point',
        coordinates: [-0.1400, 51.5200] // ~1.4km away
      },
      properties: {
        id: 'osm_node_test_distant',
        name: 'Distant Test Toilet',
        hours: '9:00-17:00',
        accessible: false,
        fee: 0.50,
        source: 'osm',
        last_verified_at: '2025-07-04T00:00:00Z',
        verified_by: 'test'
      }
    }
  ]),
  clearCache: jest.fn().mockResolvedValue(undefined),
  getCacheStats: jest.fn().mockResolvedValue({
    isValid: true,
    lastLoaded: new Date(),
    cacheHits: 0,
    cacheMisses: 0
  }),
  getMetadata: jest.fn().mockResolvedValue({
    lastModified: new Date(),
    featureCount: 2,
    source: 'test'
  })
};

describe('DuplicateService - Production Test Suite', () => {
  let duplicateService;

  beforeEach(() => {
    duplicateService = new DuplicateService(mockDataProvider);
    jest.clearAllMocks();
  });

  describe('Duplicate Detection Within 50m Threshold', () => {
    it('should detect duplicate for toilet within 25m of existing toilet', async () => {
      // Submit toilet ~22m north of central toilet (51.5074, -0.1278)
      const nearDuplicateRequest = {
        lat: 51.5076, // ~22m north of central toilet
        lng: -0.1278, // same longitude
        name: 'Near Duplicate Toilet',
        validation: {
          isValid: true,
          warnings: []
        }
      };

      const result = await duplicateService.checkDuplicate(nearDuplicateRequest);

      // The function signature bug has been fixed, so this test should now pass
      expect(result.isDuplicate).toBe(true);
      expect(result.distance).toBeLessThan(50);
      expect(result.distance).toBeGreaterThan(0);
      expect(result.nearestToiletId).toBe('osm_node_test_central');
    });

    it('should detect exact duplicate at same coordinates', async () => {
      // Submit toilet at exact same coordinates as existing toilet
      const exactDuplicateRequest = {
        lat: 51.5074, // exact same as central toilet
        lng: -0.1278, // exact same as central toilet
        name: 'Exact Duplicate Toilet',
        validation: {
          isValid: true,
          warnings: []
        }
      };

      const result = await duplicateService.checkDuplicate(exactDuplicateRequest);

      // The function signature bug has been fixed, so this test should now pass
      expect(result.isDuplicate).toBe(true);
      expect(result.distance).toBe(0);
      expect(result.nearestToiletId).toBe('osm_node_test_central');
    });

    it('should detect duplicate for toilet within 45m threshold', async () => {
      // Submit toilet ~40m southeast of central toilet
      const borderlineDuplicateRequest = {
        lat: 51.5071, // ~40m south
        lng: -0.1275, // ~40m east  
        name: 'Borderline Duplicate Toilet',
        validation: {
          isValid: true,
          warnings: []
        }
      };

      const result = await duplicateService.checkDuplicate(borderlineDuplicateRequest);

      // The function signature bug has been fixed, so this test should now pass
      expect(result.isDuplicate).toBe(true);
      expect(result.distance).toBeLessThan(50);
      expect(result.distance).toBeGreaterThan(30);
      expect(result.nearestToiletId).toBe('osm_node_test_central');
    });
  });

  describe('Non-Duplicate Detection Beyond 50m Threshold', () => {
    it('should not detect duplicate for toilet >100m away', async () => {
      // Submit toilet ~150m northeast of central toilet
      const farToiletRequest = {
        lat: 51.5088, // ~150m north
        lng: -0.1262, // ~150m east
        name: 'Far Away Toilet',
        validation: {
          isValid: true,
          warnings: []
        }
      };

      const result = await duplicateService.checkDuplicate(farToiletRequest);

      // This should work correctly regardless of the bug
      expect(result.isDuplicate).toBe(false);
      expect(result.distance).toBeGreaterThan(100);
      expect(result.nearestToiletId).toBe('osm_node_test_central'); // nearest, but not duplicate
    });

    it('should correctly identify nearest toilet even when not duplicate', async () => {
      // Submit toilet equidistant between central and distant toilets but closer to central
      const middleToiletRequest = {
        lat: 51.5137, // halfway between central and distant
        lng: -0.1339, // halfway between central and distant
        name: 'Middle Position Toilet',
        validation: {
          isValid: true,
          warnings: []
        }
      };

      const result = await duplicateService.checkDuplicate(middleToiletRequest);

      expect(result.isDuplicate).toBe(false);
      expect(result.distance).toBeGreaterThan(50);
      expect(result.nearestToiletId).toBe('osm_node_test_central'); // should be nearer than distant
    });
  });

  describe('Distance Calculation Accuracy', () => {
    it('should calculate accurate distances for duplicate detection', async () => {
      // Test with known coordinates to verify distance calculation
      const knownDistanceRequest = {
        lat: 51.5083, // ~100m north of central toilet
        lng: -0.1278, // same longitude as central toilet
        name: 'Known Distance Toilet',
        validation: {
          isValid: true,
          warnings: []
        }
      };

      const result = await duplicateService.checkDuplicate(knownDistanceRequest);

      // Distance should be approximately 100m (allowing for Earth curvature)
      expect(result.distance).toBeGreaterThan(90);
      expect(result.distance).toBeLessThan(110);
      expect(result.isDuplicate).toBe(false); // >50m threshold
      expect(result.nearestToiletId).toBe('osm_node_test_central');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle validation object with existing warnings', async () => {
      const requestWithWarnings = {
        lat: 51.5076,
        lng: -0.1278,
        name: 'Toilet with Existing Warnings',
        validation: {
          isValid: true,
          warnings: [
            { field: 'name', message: 'Name too short', code: 'name_warning' }
          ]
        }
      };

      const result = await duplicateService.checkDuplicate(requestWithWarnings);

      // Should preserve existing warnings and add duplicate detection
      expect(result.validation.warnings).toBeDefined();
      expect(result.validation.warnings.length).toBeGreaterThanOrEqual(1);
      
      // RED PHASE: Duplicate detection should work (will fail due to bug)
      expect(result.isDuplicate).toBe(true);
    });

    it('should return proper validation structure in response', async () => {
      const validRequest = {
        lat: 51.5076,
        lng: -0.1278,
        name: 'Structure Test Toilet',
        validation: {
          isValid: true,
          warnings: []
        }
      };

      const result = await duplicateService.checkDuplicate(validRequest);

      // Verify response structure regardless of duplicate detection result
      expect(result).toHaveProperty('isDuplicate');
      expect(result).toHaveProperty('distance');
      expect(result).toHaveProperty('nearestToiletId');
      expect(result).toHaveProperty('validation');
      expect(result.validation).toHaveProperty('warnings');
      expect(Array.isArray(result.validation.warnings)).toBe(true);
    });
  });
});