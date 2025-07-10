/**
 * Suggest Agent – Response Format Tests (RED)
 * ------------------------------------------------------------
 * Ensures successful and error responses adhere to contractual schema.
 *
 * @artifact docs/architecture-spec.md#suggest-agent
 */

const { postSuggest, makeValidSuggestion, makeInvalidSuggestion } = require('../helpers/suggestion-factory');
const { setupSuggestionTestFilesystem, teardownSuggestionTestFilesystem } = require('../helpers/fs-test-utils');

describe('Suggest Agent – Response Format', () => {
  beforeEach(() => {
    setupSuggestionTestFilesystem();
  });

  afterEach(() => {
    teardownSuggestionTestFilesystem();
  });

  it('should return consistent success structure', async () => {
    const res = await postSuggest(makeValidSuggestion());
    expect(res.status).toBe(201); // RED
    const body = res.body;
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('suggestionId');
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('validation');
  });

  it('should return consistent error structure', async () => {
    const res = await postSuggest(makeInvalidSuggestion('missing_lat'));
    expect(res.status).toBe(400); // RED
    const body = res.body;
    expect(body).toHaveProperty('success', false);
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('validation');
  });
}); 