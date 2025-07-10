/**
 * Suggest Agent – Duplicate Detection Tests (RED)
 * ------------------------------------------------------------
 * Tests for handling duplicate toilet submissions.
 *
 * @artifact docs/architecture-spec.md#suggest-agent
 */

const { postSuggest, makeValidSuggestion } = require('../helpers/suggestion-factory');
const { createSuggestFsHooks } = require('../helpers/withSuggestFs');
const fs = require('fs');

describe('Suggest Agent – Duplicate Detection', () => {
  // Use the alternative API for more control
  createSuggestFsHooks();

  it('should flag near-duplicate within 50m', async () => {
    const duplicate = makeValidSuggestion({ lat: 51.5074, lng: -0.1278 });
    const response = await postSuggest(duplicate);

    expect(response.status).toBe(409); // RED – expected duplicate status
    if (response.body.validation) {
      expect(response.body.validation.isDuplicate).toBe(true);
      expect(response.body.validation.duplicateDistance).toBeLessThan(50);
    }
  });

  it('should accept non-duplicate far away', async () => {
    const far = makeValidSuggestion({ lat: 51.5200, lng: -0.1400 });
    const response = await postSuggest(far);

    expect(response.status).toBe(201); // RED – will fail until route implemented
    if (response.body.validation) {
      expect(response.body.validation.isDuplicate).toBe(false);
    }
  });
}); 