/**
 * agent_api_docs_presence_test.js
 * ------------------------------------------------------------
 * RED-phase integration test for Hybrid_AI_OS documentation work.
 * Ensures API reference pages for key backend services exist and
 * contain at least 60 lines each. Expected to FAIL initially.
 *
 * @task agent_api_docs_test_create
 * @plan docs_agent_api_0009
 * @tdd-phase RED
 * @artifact docs/reference/api/*-api.md
 */

const fs = require('fs');
const path = require('path');

// Relative paths (from repo root) to required docs
const docFiles = [
  'docs/reference/api/ingest-agent-api.md',
  'docs/reference/api/duplicate-service-api.md',
  'docs/reference/api/rate-limit-service-api.md',
  'docs/reference/api/validation-service-api.md'
];

/**
 * Resolve a path relative to the repository root.
 * Assumes this test file lives in tests/docs/.
 */
function resolveFromRoot(relPath) {
  return path.resolve(__dirname, '..', '..', relPath);
}

describe('Agent API reference documentation presence', () => {
  docFiles.forEach((relPath) => {
    const absolutePath = resolveFromRoot(relPath);

    test(`Documentation file \
      "${relPath}" should exist and be at least 60 lines`, () => {
      const exists = fs.existsSync(absolutePath);
      expect(exists).toBe(true);

      if (exists) {
        const fileContent = fs.readFileSync(absolutePath, 'utf8');
        const lineCount = fileContent.trim().split(/\r?\n/).length;
        expect(lineCount).toBeGreaterThanOrEqual(60);
      }
    });
  });
}); 