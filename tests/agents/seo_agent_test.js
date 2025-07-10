/**
 * SEO Agent Test Suite
 * 
 * @doc refs docs/architecture-spec.md#seo-agent
 * Tests for the seo-agent that generates static borough pages with SEO metadata
 * 
 * TDD Phase: Red (failing tests)
 * These tests should FAIL initially until the implementation is created
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('SEO Agent', () => {
  const testDataDir = path.join(__dirname, '../../data');
  const testOutputDir = path.join(__dirname, '../../src/app/borough');
  const testAgentManifest = path.join(__dirname, '../../agents/seo-agent.json');
  const testSeoScript = path.join(__dirname, '../../agents/seo-agent.ts');
  
  beforeEach(() => {
    // Clean up any existing test output
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
    
    // Ensure test data directory exists
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    
    // Create mock toilet data for testing
    const mockToiletData = {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {
            "id": "test-toilet-1",
            "name": "Test Toilet Camden",
            "hours": "24/7",
            "accessible": true,
            "fee": false,
            "source": "system",
            "last_verified_at": "2025-01-01T00:00:00Z",
            "verified_by": "test-system"
          },
          "geometry": {
            "type": "Point",
            "coordinates": [-0.1426, 51.5414]
          }
        },
        {
          "type": "Feature",
          "properties": {
            "id": "test-toilet-2",
            "name": "Test Toilet Westminster",
            "hours": "6AM-10PM",
            "accessible": false,
            "fee": true,
            "source": "system",
            "last_verified_at": "2025-01-01T00:00:00Z",
            "verified_by": "test-system"
          },
          "geometry": {
            "type": "Point",
            "coordinates": [-0.1276, 51.4994]
          }
        }
      ]
    };
    
    fs.writeFileSync(
      path.join(testDataDir, 'toilets.geojson'),
      JSON.stringify(mockToiletData, null, 2)
    );
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('Agent Manifest', () => {
    test('should have a valid seo-agent.json manifest', () => {
      expect(fs.existsSync(testAgentManifest)).toBe(true);
      
      const manifest = JSON.parse(fs.readFileSync(testAgentManifest, 'utf8'));
      
      expect(manifest.name).toBe('seo-agent');
      expect(manifest.version).toBeDefined();
      expect(manifest.description).toContain('borough pages');
      expect(manifest.type).toBe('static-generation');
      expect(manifest.config).toBeDefined();
      expect(manifest.config.input_file).toBe('data/toilets.geojson');
      expect(manifest.config.output_directory).toBe('src/app/borough');
      expect(manifest.documentation).toBe('docs/architecture-spec.md#seo-agent');
    });
  });

  describe('SEO Agent Implementation', () => {
    test('should have executable seo-agent.ts script', () => {
      expect(fs.existsSync(testSeoScript)).toBe(true);
      
      const seoAgent = require(testSeoScript);
      expect(typeof seoAgent.generateBoroughPages).toBe('function');
    });

    test('should generate borough pages from toilet data', async () => {
      const seoAgent = require(testSeoScript);
      
      await seoAgent.generateBoroughPages();
      
      // Should create borough directory
      expect(fs.existsSync(testOutputDir)).toBe(true);
      
      // Should generate pages for each borough with toilets
      const boroughPages = fs.readdirSync(testOutputDir);
      expect(boroughPages.length).toBeGreaterThan(0);
      
      // Should have at least Camden and Westminster based on mock data
      const expectedBoroughs = ['camden', 'westminster'];
      expectedBoroughs.forEach(borough => {
        const boroughDir = path.join(testOutputDir, borough);
        expect(fs.existsSync(boroughDir)).toBe(true);
        
        const pageFile = path.join(boroughDir, 'page.tsx');
        expect(fs.existsSync(pageFile)).toBe(true);
      });
    });
  });

  describe('Borough Page Generation', () => {
    test('should generate valid Next.js page.tsx files', async () => {
      const seoAgent = require(testSeoScript);
      await seoAgent.generateBoroughPages();
      
      const camdenPageFile = path.join(testOutputDir, 'camden', 'page.tsx');
      expect(fs.existsSync(camdenPageFile)).toBe(true);
      
      const pageContent = fs.readFileSync(camdenPageFile, 'utf8');
      
      // Should be valid React component
      expect(pageContent).toContain('export default function');
      expect(pageContent).toContain('Camden');
      
      // Should include metadata export
      expect(pageContent).toContain('export const metadata');
      
      // Should reference toilet data
      expect(pageContent).toContain('toilet');
    });

    test('should generate correct metadata for SEO', async () => {
      const seoAgent = require(testSeoScript);
      await seoAgent.generateBoroughPages();
      
      const camdenPageFile = path.join(testOutputDir, 'camden', 'page.tsx');
      const pageContent = fs.readFileSync(camdenPageFile, 'utf8');
      
      // Should have proper SEO metadata
      expect(pageContent).toContain('title:');
      expect(pageContent).toContain('description:');
      expect(pageContent).toContain('Camden');
      expect(pageContent).toContain('public toilet');
      expect(pageContent).toContain('London');
      
      // Should include Open Graph tags
      expect(pageContent).toContain('openGraph:');
      expect(pageContent).toContain('twitter:');
    });

    test('should include structured data for toilets', async () => {
      const seoAgent = require(testSeoScript);
      await seoAgent.generateBoroughPages();
      
      const camdenPageFile = path.join(testOutputDir, 'camden', 'page.tsx');
      const pageContent = fs.readFileSync(camdenPageFile, 'utf8');
      
      // Should include JSON-LD structured data
      expect(pageContent).toContain('application/ld+json');
      expect(pageContent).toContain('LocalBusiness');
      expect(pageContent).toContain('RestRoom');
    });
  });

  describe('Borough Page Content', () => {
    test('should display correct toilet information', async () => {
      const seoAgent = require(testSeoScript);
      await seoAgent.generateBoroughPages();
      
      const camdenPageFile = path.join(testOutputDir, 'camden', 'page.tsx');
      const pageContent = fs.readFileSync(camdenPageFile, 'utf8');
      
      // Should contain toilet information from mock data
      expect(pageContent).toContain('Test Toilet Camden');
      expect(pageContent).toContain('24/7');
      expect(pageContent).toContain('accessible');
      expect(pageContent).toContain('free');
    });

    test('should generate proper HTML structure', async () => {
      const seoAgent = require(testSeoScript);
      await seoAgent.generateBoroughPages();
      
      const camdenPageFile = path.join(testOutputDir, 'camden', 'page.tsx');
      const pageContent = fs.readFileSync(camdenPageFile, 'utf8');
      
      // Should have proper heading hierarchy
      expect(pageContent).toContain('<h1');
      expect(pageContent).toContain('<h2');
      expect(pageContent).toContain('Camden');
      expect(pageContent).toContain('Public Toilets');
    });

    test('should include navigation breadcrumbs', async () => {
      const seoAgent = require(testSeoScript);
      await seoAgent.generateBoroughPages();
      
      const camdenPageFile = path.join(testOutputDir, 'camden', 'page.tsx');
      const pageContent = fs.readFileSync(camdenPageFile, 'utf8');
      
      // Should include breadcrumb navigation
      expect(pageContent).toContain('Home');
      expect(pageContent).toContain('Borough');
      expect(pageContent).toContain('Camden');
    });
  });

  describe('SEO Compliance', () => {
    test('should generate sitemap entries', async () => {
      const seoAgent = require(testSeoScript);
      await seoAgent.generateBoroughPages();
      
      const sitemapFile = path.join(__dirname, '../../public/sitemap.xml');
      expect(fs.existsSync(sitemapFile)).toBe(true);
      
      const sitemapContent = fs.readFileSync(sitemapFile, 'utf8');
      expect(sitemapContent).toContain('camden');
      expect(sitemapContent).toContain('westminster');
      expect(sitemapContent).toContain('https://');
    });

    test('should generate robots.txt', async () => {
      const seoAgent = require(testSeoScript);
      await seoAgent.generateBoroughPages();
      
      const robotsFile = path.join(__dirname, '../../public/robots.txt');
      expect(fs.existsSync(robotsFile)).toBe(true);
      
      const robotsContent = fs.readFileSync(robotsFile, 'utf8');
      expect(robotsContent).toContain('User-agent: *');
      expect(robotsContent).toContain('Allow: /');
      expect(robotsContent).toContain('Sitemap: ');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing toilet data gracefully', async () => {
      // Remove the mock data file
      fs.unlinkSync(path.join(testDataDir, 'toilets.geojson'));
      
      const seoAgent = require(testSeoScript);
      
      await expect(seoAgent.generateBoroughPages()).rejects.toThrow('No toilet data found');
    });

    test('should handle invalid GeoJSON gracefully', async () => {
      // Write invalid GeoJSON
      fs.writeFileSync(
        path.join(testDataDir, 'toilets.geojson'),
        '{"invalid": "json"}'
      );
      
      const seoAgent = require(testSeoScript);
      
      await expect(seoAgent.generateBoroughPages()).rejects.toThrow('Invalid GeoJSON');
    });
  });
});