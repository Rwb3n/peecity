/*
 * tests/helpers/fs-test-utils.js
 * ------------------------------------------------------------
 * Utilities for setting up and cleaning the filesystem used by suggest-agent
 * tests. Centralising this logic avoids duplication and ensures SRP compliance.
 *
 * @artifact docs/architecture-spec.md#suggest-agent
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const SUGGESTIONS_LOG_PATH = path.join(DATA_DIR, 'suggestions.log');
const TOILETS_DATA_PATH = path.join(DATA_DIR, 'toilets.geojson');

/**
 * Create mock toilets data and ensure a clean suggestions log.
 */
function setupSuggestionTestFilesystem() {
  // Ensure data directory exists
  fs.mkdirSync(DATA_DIR, { recursive: true });

  // Remove existing log
  if (fs.existsSync(SUGGESTIONS_LOG_PATH)) {
    fs.unlinkSync(SUGGESTIONS_LOG_PATH);
  }

  // Write mock toilets.geojson
  const mockToiletsData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-0.1278, 51.5074] // London
        },
        properties: {
          id: 'existing_toilet_1',
          name: 'Existing Public Toilets',
          hours: '24/7',
          accessible: true,
          fee: 0,
          source: 'osm'
        }
      }
    ]
  };

  fs.writeFileSync(TOILETS_DATA_PATH, JSON.stringify(mockToiletsData, null, 2));
}

/**
 * Remove log and geojson files to restore pristine state.
 */
function teardownSuggestionTestFilesystem() {
  [SUGGESTIONS_LOG_PATH, TOILETS_DATA_PATH].forEach(filePath => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
}

module.exports = {
  setupSuggestionTestFilesystem,
  teardownSuggestionTestFilesystem,
  SUGGESTIONS_LOG_PATH,
  TOILETS_DATA_PATH
}; 