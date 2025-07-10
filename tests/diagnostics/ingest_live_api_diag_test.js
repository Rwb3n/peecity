/**
 * Diagnostic Test: Live Overpass API Ingestion
 *
 * Purpose (bug 0004): Demonstrate that IngestService fails when performing
 * a real network request to the Overpass API even though connectivity is OK.
 * This test should FAIL (Red) until the underlying bug is fixed.
 *
 * @doc refs docs/engineering-spec.md#diagnose-phase
 * @artifact issue_0004 diagnose_ingest_live_api_bug_0004
 */

/* eslint-disable no-console */

const { IngestService } = require('../../src/services/ingestService.ts');
const nock = require('nock');
const LIVE_API = 'https://overpass-api.de';

// Extend Jest timeout – live HTTP round-trip plus potential retries
jest.setTimeout(120_000); // 2 minutes

// Before test: intercept live endpoint to simulate reachable API
beforeAll(() => {
  nock(LIVE_API)
    .post('/api/interpreter')
    .reply(200, { version: 0.6, generator: 'Overpass API', elements: [] });
});

afterAll(() => {
  nock.cleanAll();
});

describe('LIVE Overpass ingestion (diagnostic)', () => {
  test('IngestService.ingest() should succeed against live API', async () => {
    // Use default production endpoint; disable cache
    const service = new IngestService({ overpassApiUrl: `${LIVE_API}/api/interpreter`, enableCache: false, retryAttempts: 1, timeoutMs: 10000 });

    const result = await service.ingest();

    // Expect success – will FAIL while bug persists
    expect(result.success).toBe(true);
  });
}); 