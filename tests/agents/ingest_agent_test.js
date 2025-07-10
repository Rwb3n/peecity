/**
 * Ingest Agent Test Suite
 * 
 * @doc refs docs/architecture-spec.md#ingest-agent
 * Tests for the ingest-agent that fetches and normalizes OSM data into toilets.geojson
 * 
 * TDD Phase: Red (failing tests)
 * These tests should FAIL initially until the implementation is created
 */

const fs = require('fs');
const path = require('path');
const nock = require('nock');
const geojsonValidation = require('geojson-validation');

// NEW: Import IngestService and create wrapper to mimic runIngestAgent
const { IngestService } = require('../../src/services/ingestService.ts');

/**
 * Local helper replicating legacy `runIngestAgent` behaviour using IngestService.
 * Returns boolean true on success, otherwise throws (to satisfy existing test expectations).
 */
async function runIngestAgent() {
  const service = new IngestService();
  const result = await service.ingest();
  if (!result.success) {
    throw new Error(result.error || 'Ingest failed');
  }
  return true;
}

describe('Ingest Agent', () => {
  const testDataDir = path.join(__dirname, '../../data');
  const testOutputFile = path.join(testDataDir, 'toilets.geojson');
  
  beforeEach(() => {
    // Clean up any existing test output
    if (fs.existsSync(testOutputFile)) {
      fs.unlinkSync(testOutputFile);
    }
    
    // Ensure data directory exists
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    
    // Clear any existing nock interceptors
    nock.cleanAll();
  });

  afterEach(() => {
    // Clean up nock interceptors
    nock.cleanAll();
  });

  describe('Overpass API Integration', () => {
    it('should fetch toilet data from Overpass API', async () => {
      // Mock Overpass API response
      const mockOverpassResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: [
          {
            type: "node",
            id: 123456,
            lat: 51.5074,
            lon: -0.1278,
            tags: {
              amenity: "toilets",
              name: "Westminster Public Toilets",
              opening_hours: "24/7",
              wheelchair: "yes",
              fee: "no"
            }
          },
          {
            type: "node", 
            id: 789012,
            lat: 51.5155,
            lon: -0.0922,
            tags: {
              amenity: "toilets",
              name: "City of London Toilets",
              opening_hours: "06:00-22:00",
              wheelchair: "limited",
              fee: "yes"
            }
          }
        ]
      };

      // Mock the Overpass API call
      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, mockOverpassResponse);

      // This should fail because ingest agent doesn't exist yet
      await expect(runIngestAgent()).resolves.toBe(true);
      
      // Verify output file was created
      expect(fs.existsSync(testOutputFile)).toBe(true);
    });

    it('should handle API errors with retry mechanism', async () => {
      // Mock API failures followed by success
      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(429, 'Rate limited')
        .post('/api/interpreter')
        .reply(500, 'Internal server error')
        .post('/api/interpreter')
        .reply(200, {
          version: 0.6,
          generator: "Overpass API",
          elements: []
        });

      // This should fail because ingest agent doesn't exist yet
      await expect(runIngestAgent()).resolves.toBe(true);
    });

    it('should fail after maximum retry attempts', async () => {
      // Mock persistent failures
      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(429, 'Rate limited')
        .persist();

      // This should fail because ingest agent doesn't exist yet
      await expect(runIngestAgent()).rejects.toThrow();
    });
  });

  describe('GeoJSON Normalization', () => {
    it('should normalize OSM data to internal GeoJSON schema', async () => {
      const mockOverpassResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: [
          {
            type: "node",
            id: 123456,
            lat: 51.5074,
            lon: -0.1278,
            tags: {
              amenity: "toilets",
              name: "Westminster Public Toilets",
              opening_hours: "24/7",
              wheelchair: "yes",
              fee: "no"
            }
          }
        ]
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, mockOverpassResponse);

      // This should fail because ingest agent doesn't exist yet
      await runIngestAgent();
      
      // Verify GeoJSON output structure
      const outputData = JSON.parse(fs.readFileSync(testOutputFile, 'utf8'));
      
      // Validate GeoJSON format
      expect(geojsonValidation.valid(outputData)).toBe(true);
      
      // Verify internal schema
      expect(outputData.type).toBe('FeatureCollection');
      expect(outputData.features).toHaveLength(1);
      
      const feature = outputData.features[0];
      expect(feature.type).toBe('Feature');
      expect(feature.geometry.type).toBe('Point');
      expect(feature.geometry.coordinates).toEqual([-0.1278, 51.5074]);
      
      // Verify normalized properties
      expect(feature.properties).toMatchObject({
        id: 'osm_node_123456',
        name: 'Westminster Public Toilets',
        hours: '24/7',
        accessible: true,
        fee: 0,
        source: 'osm',
        last_verified_at: expect.any(String),
        verified_by: 'ingest-agent'
      });
    });

    it('should handle missing or invalid data gracefully', async () => {
      const mockOverpassResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: [
          {
            type: "node",
            id: 123456,
            lat: 51.5074,
            lon: -0.1278,
            tags: {
              amenity: "toilets"
              // Missing name, hours, accessibility info
            }
          }
        ]
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, mockOverpassResponse);

      // This should fail because ingest agent doesn't exist yet
      await runIngestAgent();
      
      const outputData = JSON.parse(fs.readFileSync(testOutputFile, 'utf8'));
      const feature = outputData.features[0];
      
      // Verify defaults are applied
      expect(feature.properties).toMatchObject({
        id: 'osm_node_123456',
        name: 'Public Toilets',
        hours: '24/7',
        accessible: false,
        fee: 0,
        source: 'osm'
      });
    });
  });

  describe('Output File Generation', () => {
    it('should create data/toilets.geojson file', async () => {
      const mockOverpassResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: []
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, mockOverpassResponse);

      // This should fail because ingest agent doesn't exist yet
      await runIngestAgent();
      
      expect(fs.existsSync(testOutputFile)).toBe(true);
      
      const outputData = JSON.parse(fs.readFileSync(testOutputFile, 'utf8'));
      expect(outputData.type).toBe('FeatureCollection');
      expect(Array.isArray(outputData.features)).toBe(true);
    });

    it('should overwrite existing output file', async () => {
      // Create existing file
      const existingData = { type: 'FeatureCollection', features: [] };
      fs.writeFileSync(testOutputFile, JSON.stringify(existingData));
      
      const mockOverpassResponse = {
        version: 0.6,
        generator: "Overpass API", 
        elements: [
          {
            type: "node",
            id: 999999,
            lat: 51.5074,
            lon: -0.1278,
            tags: { amenity: "toilets" }
          }
        ]
      };

      nock('https://overpass-api.de')
        .post('/api/interpreter')
        .reply(200, mockOverpassResponse);

      // This should fail because ingest agent doesn't exist yet
      await runIngestAgent();
      
      const outputData = JSON.parse(fs.readFileSync(testOutputFile, 'utf8'));
      expect(outputData.features).toHaveLength(1);
      expect(outputData.features[0].properties.id).toBe('osm_node_999999');
    });
  });

  describe('Agent Configuration', () => {
    it('should load configuration from agents/ingest-agent.json', () => {
      // Test the JSON manifest file
      const manifestPath = path.join(__dirname, '../../agents/ingest-agent.json');
      expect(fs.existsSync(manifestPath)).toBe(true);
      
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.name).toBe('ingest-agent');
      expect(manifest.version).toBeDefined();
      expect(manifest.description).toBeDefined();
    });
  });
});