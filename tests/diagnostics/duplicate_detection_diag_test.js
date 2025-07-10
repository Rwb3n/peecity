/**
 * Diagnostic Test: Duplicate Detection Bug Reproduction
 * 
 * @doc refs issues/issue_0005.txt
 * 
 * This diagnostic test isolates and reproduces the duplicate detection bug
 * where submitting a toilet within 50m of an existing toilet should return
 * HTTP 409 but is returning HTTP 201 instead.
 * 
 * This test creates a controlled scenario without dependencies on agent
 * behavior or existing test data, making the bug reproducible and verifiable.
 */

const fs = require('fs');
const path = require('path');
const { postSuggest, makeValidSuggestion } = require('../helpers/suggestion-factory');
const { createSuggestFsHooks } = require('../helpers/withSuggestFs');

describe('DIAGNOSTIC: Duplicate Detection Bug Reproduction', () => {
  createSuggestFsHooks();

  beforeEach(() => {
    // Clear any existing toilet data to start with a clean state
    const toiletsPath = path.join(process.cwd(), 'data', 'toilets.geojson');
    
    // Create an initial toilet at known coordinates for duplicate testing
    const initialToilet = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            id: "diagnostic-toilet-1",
            name: "Diagnostic Test Toilet",
            hours: "24/7",
            accessible: true,
            fee: 0,
            source: "diagnostic_test",
            last_verified_at: new Date().toISOString(),
            verified_by: "diagnostic_test"
          },
          geometry: {
            type: "Point",
            coordinates: [-0.1278, 51.5074] // lon, lat format for GeoJSON
          }
        }
      ]
    };

    // Ensure data directory exists
    const dataDir = path.dirname(toiletsPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write the initial toilet data
    fs.writeFileSync(toiletsPath, JSON.stringify(initialToilet, null, 2));
  });

  it('DIAGNOSTIC: should return 409 when submitting toilet within 50m of existing toilet', async () => {
    // Submit a toilet very close to the existing one (lat: 51.5074, lng: -0.1278)
    // Moving ~25m north should still be within 50m threshold
    const duplicateSubmission = makeValidSuggestion({
      lat: 51.5076, // ~22m north of original (51.5074)
      lng: -0.1278, // same longitude
      name: 'Duplicate Test Toilet',
      description: 'This should be flagged as duplicate'
    });

    const response = await postSuggest(duplicateSubmission);

    // This test MUST FAIL to confirm the bug exists
    // Expected: 409 (Conflict - duplicate detected)
    // Actual (buggy): 201 (Created - duplicate not detected)
    expect(response.status).toBe(409);
    
    // Additional assertions to verify duplicate detection response structure
    if (response.status === 409) {
      expect(response.body).toHaveProperty('validation');
      expect(response.body.validation.isDuplicate).toBe(true);
      expect(response.body.validation.duplicateDistance).toBeLessThan(50);
      expect(response.body.validation.duplicateDistance).toBeGreaterThan(0);
    }
  });

  it('DIAGNOSTIC: should return 201 when submitting toilet far from existing toilets', async () => {
    // Submit a toilet far away from the existing one
    // Moving ~500m away should be well outside 50m threshold
    const farSubmission = makeValidSuggestion({
      lat: 51.5119, // ~500m north of original (51.5074)
      lng: -0.1278, // same longitude
      name: 'Far Away Test Toilet',
      description: 'This should NOT be flagged as duplicate'
    });

    const response = await postSuggest(farSubmission);

    // This should pass - far submissions should be accepted
    expect(response.status).toBe(201);
    
    if (response.body.validation) {
      expect(response.body.validation.isDuplicate).toBe(false);
    }
  });
});