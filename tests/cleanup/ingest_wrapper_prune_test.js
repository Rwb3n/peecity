/**
 * Deprecated Ingest Wrapper Prune Test (RED phase)
 *
 * Ensures legacy wrapper files are removed from the codebase. Tests must FAIL
 * until `scripts/ingest.ts` and `agents/ingest-agent.ts` are deleted and
 * ingestion tests are updated to use `IngestService` or the CLI directly.
 *
 * @doc refs docs/engineering-spec.md#deprecated-artifacts
 * @artifact plan_prune_deprecated_ingest_wrapper
 */

const fs = require('fs');
const path = require('path');

// Helper to resolve project root relative paths
function root(...segments) {
  return path.join(__dirname, '..', '..', ...segments);
}

describe('Deprecated ingest wrapper artifacts should not exist', () => {
  const deprecatedFiles = [
    root('scripts', 'ingest.ts'),
    root('agents', 'ingest-agent.ts')
  ];

  deprecatedFiles.forEach((file) => {
    test(`${path.relative(path.join(__dirname, '../../'), file)} should be removed`, () => {
      // Expectation intentionally set to false; currently true so the test fails (RED)
      expect(fs.existsSync(file)).toBe(false);
    });
  });
}); 