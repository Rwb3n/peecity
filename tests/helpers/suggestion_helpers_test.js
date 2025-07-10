/**
 * Helper Factories & FS Utilities Test Suite (RED)
 *
 * This suite defines the expected behaviour of the new reusable helper modules
 * that will be introduced to enforce DRY/KISS/SOLID principles across the
 * suggest-agent test family.
 *
 * NOTE: All tests are expected to fail initially (RED phase) because the helper
 * modules do not exist yet. The following tests codify their required API.
 *
 * @artifact docs/architecture-spec.md#suggest-agent
 */

const fs = require('fs');
const path = require('path');

// These imports will throw until the corresponding helpers are implemented.
const {
  makeValidSuggestion,
  makeInvalidSuggestion,
  postSuggest
} = require('./suggestion-factory');

const {
  setupSuggestionTestFilesystem,
  teardownSuggestionTestFilesystem,
  TOILETS_DATA_PATH
} = require('./fs-test-utils');

// Derive common paths so that assertions remain stable if directory moves.
const SUGGESTIONS_LOG_PATH = path.join(__dirname, '..', '..', 'data', 'suggestions.log');

describe('Helper Factory: makeValidSuggestion', () => {
  it('produces a suggestion object with minimum required fields', () => {
    const suggestion = makeValidSuggestion();
    expect(suggestion).toEqual(
      expect.objectContaining({
        lat: expect.any(Number),
        lng: expect.any(Number),
        name: expect.any(String)
      })
    );
  });

  it('accepts field overrides', () => {
    const suggestion = makeValidSuggestion({ lat: 0, lng: 0, name: 'Override' });
    expect(suggestion.lat).toBe(0);
    expect(suggestion.lng).toBe(0);
    expect(suggestion.name).toBe('Override');
  });
});

describe('Helper Factory: makeInvalidSuggestion', () => {
  it('supports preset types for common validation failures', () => {
    const missingLat = makeInvalidSuggestion('missing_lat');
    expect(missingLat.lat).toBeUndefined();
  });
});

describe('Helper: postSuggest', () => {
  it('wraps callApiRoute to POST /api/suggest and returns a response object', async () => {
    const suggestion = makeValidSuggestion();
    const response = await postSuggest(suggestion);

    // We only assert the shape here; deeper behaviour covered in endpoint tests.
    expect(response).toEqual(
      expect.objectContaining({
        status: expect.any(Number),
        body: expect.anything()
      })
    );
  });
});

describe('FS Test Utilities', () => {
  beforeEach(() => {
    setupSuggestionTestFilesystem();
  });

  afterEach(() => {
    teardownSuggestionTestFilesystem();
  });

  it('creates mock toilets.geojson stub and ensures clean slate', () => {
    expect(fs.existsSync(TOILETS_DATA_PATH)).toBe(true);
    const data = JSON.parse(fs.readFileSync(TOILETS_DATA_PATH, 'utf8'));
    expect(data).toHaveProperty('type', 'FeatureCollection');
  });

  it('cleans up log & data files after teardown', () => {
    // Create files manually to test cleanup
    fs.writeFileSync(SUGGESTIONS_LOG_PATH, 'test');

    teardownSuggestionTestFilesystem();
    expect(fs.existsSync(SUGGESTIONS_LOG_PATH)).toBe(false);
    expect(fs.existsSync(TOILETS_DATA_PATH)).toBe(false);
  });
}); 