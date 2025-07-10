/**
 * Diagnostic Unit Test: DuplicateService Function Signature Bug
 * 
 * @doc refs issues/issue_0005.txt, plans/plan_diagnose_0005.txt
 * 
 * This diagnostic test isolates the function signature mismatch bug in
 * DuplicateService.checkDuplicate() where an object {lat, lng} is passed
 * to findNearestToilet() which expects individual lat, lng parameters.
 * 
 * This test directly validates the hypothesis that the bug is caused by
 * incorrect parameter passing, resulting in silent failure and infinite
 * distance calculations.
 */

const { DuplicateService } = require('../../src/services/duplicateService');

// Mock the file toilet data provider to return controlled test data
jest.mock('../../src/providers/fileToiletDataProvider', () => ({
  FileToiletDataProvider: jest.fn().mockImplementation(() => ({
    loadToilets: jest.fn().mockResolvedValue([
      {
        id: 'test-toilet-1',
        lat: 51.5074,
        lng: -0.1278,
        name: 'Test Existing Toilet',
        properties: {
          name: 'Test Existing Toilet',
          hours: '24/7',
          accessible: true,
          fee: 0
        }
      }
    ])
  })),
  createFileToiletDataProvider: jest.fn().mockImplementation(() => ({
    loadToilets: jest.fn().mockResolvedValue([
      {
        id: 'test-toilet-1',
        lat: 51.5074,
        lng: -0.1278,
        name: 'Test Existing Toilet',
        properties: {
          name: 'Test Existing Toilet',
          hours: '24/7',
          accessible: true,
          fee: 0
        }
      }
    ])
  }))
}));

describe('DIAGNOSTIC: DuplicateService Function Signature Bug', () => {
  let duplicateService;

  beforeEach(() => {
    duplicateService = new DuplicateService();
    jest.clearAllMocks();
  });

  it('DIAGNOSTIC: should fail to detect duplicate due to function signature mismatch', async () => {
    // Test coordinates: ~22m north of existing toilet (51.5074, -0.1278)
    // This should definitely be within 50m threshold and flagged as duplicate
    const duplicateRequest = {
      lat: 51.5076, // ~22m north
      lng: -0.1278, // same longitude
      name: 'Duplicate Test Toilet',
      validation: {
        isValid: true,
        warnings: []
      }
    };

    const result = await duplicateService.checkDuplicate(duplicateRequest);

    // This test MUST FAIL to confirm the bug exists
    // Expected: isDuplicate: true (duplicate should be detected)
    // Actual (buggy): isDuplicate: false (due to function signature bug)
    expect(result.isDuplicate).toBe(true);
    
    // Additional validations to confirm the bug behavior
    if (!result.isDuplicate) {
      // If duplicate not detected, it should be due to distance calculation failure
      // The bug causes distance to be calculated as Infinity due to wrong parameters
      expect(result.nearestDistance).not.toBe(Infinity);
      expect(result.nearestDistance).toBeLessThan(50);
    }
  });

  it('DIAGNOSTIC: should demonstrate distance calculation failure with object parameters', async () => {
    // This test demonstrates the exact bug scenario:
    // DuplicateService passes {lat, lng} object to findNearestToilet
    const duplicateRequest = {
      lat: 51.5074, // exact same coordinates as existing toilet
      lng: -0.1278,
      name: 'Exact Duplicate',
      validation: {
        isValid: true,
        warnings: []
      }
    };

    const result = await duplicateService.checkDuplicate(duplicateRequest);

    // With exact same coordinates, distance should be 0 and duplicate detected
    // But due to the bug, this will fail
    expect(result.isDuplicate).toBe(true);
    expect(result.nearestDistance).toBe(0);
    expect(result.nearestToiletId).toBe('test-toilet-1');
  });

  it('DIAGNOSTIC: should show that far toilets work correctly (control test)', async () => {
    // Test coordinates far away from existing toilet
    const farRequest = {
      lat: 51.5200, // ~1.4km away
      lng: -0.1400,
      name: 'Far Away Toilet',
      validation: {
        isValid: true,
        warnings: []
      }
    };

    const result = await duplicateService.checkDuplicate(farRequest);

    // This should work correctly regardless of the bug
    // (the bug only affects parameter passing, not the logic when parameters are wrong)
    expect(result.isDuplicate).toBe(false);
    expect(result.nearestDistance).toBeGreaterThan(50);
  });
});