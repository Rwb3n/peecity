/**
 * Suggest Agent – Validation Tests (RED)
 * ------------------------------------------------------------
 * Focused tests exercising schema validation logic for /api/suggest.
 * Uses helper factories for DRY/KISS/SOLID compliance.
 *
 * @artifact docs/architecture-spec.md#suggest-agent
 */

const { postSuggest, makeInvalidSuggestion, makeValidSuggestion } = require('../helpers/suggestion-factory');
const { withSuggestFs } = require('../helpers/withSuggestFs');

withSuggestFs('Suggest Agent – Schema Validation', () => {

  it.each([
    ['missing lat', makeInvalidSuggestion('missing_lat'), 'lat'],
    ['invalid lat range', { ...makeValidSuggestion(), lat: 95 }, 'lat'],
    ['invalid lng range', { ...makeValidSuggestion(), lng: 185 }, 'lng'],
    ['invalid type', { lat: 'string', lng: -0.1278 }, 'lat']
  ])('should reject invalid submission: %s', async (_case, payload, expectedField) => {
    const response = await postSuggest(payload);

    expect(response.status).toBe(400); // RED – will fail until route implemented
    expect(response.body).toHaveProperty('success', false);
    if (response.body.validation) {
      const hasField = response.body.validation.errors.some(e => e.field === expectedField);
      expect(hasField).toBe(true);
    }
  });
});