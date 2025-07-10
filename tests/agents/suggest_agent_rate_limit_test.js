/**
 * Suggest Agent – Rate Limiting Tests (RED)
 * ------------------------------------------------------------
 * Ensures IP-based request throttling works.
 *
 * @artifact docs/architecture-spec.md#suggest-agent
 */

const { postSuggest, makeValidSuggestion } = require('../helpers/suggestion-factory');
const { setupSuggestionTestFilesystem, teardownSuggestionTestFilesystem } = require('../helpers/fs-test-utils');

describe('Suggest Agent – Rate Limiting', () => {
  beforeEach(() => {
    setupSuggestionTestFilesystem();
  });

  afterEach(() => {
    teardownSuggestionTestFilesystem();
  });

  it('should allow first 5 submissions then block', async () => {
    const ip = '203.0.113.5';

    for (let i = 0; i < 5; i++) {
      const res = await postSuggest(makeValidSuggestion({ name: `Suggest ${i}` }), { 'X-Forwarded-For': ip });
      expect(res.status).toBe(201); // RED – will fail
    }

    const sixth = await postSuggest(makeValidSuggestion(), { 'X-Forwarded-For': ip });
    expect(sixth.status).toBe(429); // RED – rate limited
  });
}); 