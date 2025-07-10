/**
 * @file runbooks_test.js
 * @description Tests for runbook folder structure and dashboard integration
 * @task plan_docs_standardisation_0015 Task 6
 * @tdd-phase RED (Failing tests for runbook folder & template)
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const Ajv = require('ajv');

// TDD Phase: RED - These tests should FAIL initially
describe('Runbook Integration Tests', () => {
  const runbooksDir = 'docs/runbooks';
  const dashboardFile = 'templates/grafana-citypee-validation.json';
  
  let schema;
  let validate;
  
  beforeAll(() => {
    // Load the docs front-matter schema
    const schemaContent = fs.readFileSync('docs_frontmatter_schema.json', 'utf8');
    schema = JSON.parse(schemaContent);
    
    const ajv = new Ajv();
    validate = ajv.compile(schema);
  });

  describe('Runbook Folder Structure', () => {
    it('should have docs/runbooks/ directory', () => {
      expect(fs.existsSync(runbooksDir)).toBe(true);
      expect(fs.statSync(runbooksDir).isDirectory()).toBe(true);
    });

    it('should contain at least one runbook file', () => {
      expect(fs.existsSync(runbooksDir)).toBe(true);
      const files = fs.readdirSync(runbooksDir);
      const markdownFiles = files.filter(file => file.endsWith('.md'));
      expect(markdownFiles.length).toBeGreaterThan(0);
    });

    it('should have performance runbook migrated from cookbook', () => {
      const performanceRunbookPath = path.join(runbooksDir, 'performance-monitoring.md');
      expect(fs.existsSync(performanceRunbookPath)).toBe(true);
    });
  });

  describe('Runbook Front-matter Schema Compliance', () => {
    it('should have all runbook files with category=runbook', () => {
      if (!fs.existsSync(runbooksDir)) {
        throw new Error(`Runbooks directory ${runbooksDir} does not exist`);
      }

      const files = fs.readdirSync(runbooksDir);
      const markdownFiles = files.filter(file => file.endsWith('.md'));
      
      expect(markdownFiles.length).toBeGreaterThan(0);

      markdownFiles.forEach(file => {
        const filePath = path.join(runbooksDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = matter(content);
        
        // Schema validation
        const isValid = validate(parsed.data);
        expect(isValid).toBe(true);
        
        // Category validation
        expect(parsed.data.category).toBe('runbook');
        
        // Required fields validation
        expect(parsed.data.title).toBeDefined();
        expect(parsed.data.description).toBeDefined();
        expect(parsed.data.last_updated).toBeDefined();
      });
    });

    it('should have runbook template structure in all files', () => {
      if (!fs.existsSync(runbooksDir)) {
        throw new Error(`Runbooks directory ${runbooksDir} does not exist`);
      }

      const files = fs.readdirSync(runbooksDir);
      const markdownFiles = files.filter(file => file.endsWith('.md'));
      
      expect(markdownFiles.length).toBeGreaterThan(0);

      markdownFiles.forEach(file => {
        const filePath = path.join(runbooksDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for required runbook sections
        expect(content).toMatch(/## Alert Overview/);
        expect(content).toMatch(/## Troubleshooting Steps/);
        expect(content).toMatch(/## Resolution/);
        expect(content).toMatch(/## References/);
      });
    });
  });

  describe('Dashboard Integration', () => {
    it('should have Grafana dashboard file', () => {
      expect(fs.existsSync(dashboardFile)).toBe(true);
    });

    it('should contain runbook links in dashboard JSON', () => {
      expect(fs.existsSync(dashboardFile)).toBe(true);
      
      const dashboardContent = fs.readFileSync(dashboardFile, 'utf8');
      const dashboard = JSON.parse(dashboardContent);
      
      // Check for runbook_url references in alert configurations
      const dashboardStr = JSON.stringify(dashboard);
      expect(dashboardStr).toMatch(/runbook_url/);
      expect(dashboardStr).toMatch(/docs\/runbooks\//);
    });

    it('should have runbook links pointing to existing files', () => {
      expect(fs.existsSync(dashboardFile)).toBe(true);
      
      const dashboardContent = fs.readFileSync(dashboardFile, 'utf8');
      const dashboard = JSON.parse(dashboardContent);
      
      // Extract runbook URLs from dashboard
      const dashboardStr = JSON.stringify(dashboard);
      const runbookUrlMatches = dashboardStr.match(/docs\/runbooks\/[^"]+\.md/g);
      
      expect(runbookUrlMatches).toBeTruthy();
      expect(runbookUrlMatches.length).toBeGreaterThan(0);
      
      // Verify each referenced runbook file exists
      runbookUrlMatches.forEach(runbookPath => {
        const fullPath = path.join(process.cwd(), runbookPath);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });
  });

  describe('Runbook Template Definition', () => {
    it('should have runbook template file', () => {
      const templatePath = 'templates/runbook-template.md';
      expect(fs.existsSync(templatePath)).toBe(true);
    });

    it('should have template with correct front-matter schema', () => {
      const templatePath = 'templates/runbook-template.md';
      expect(fs.existsSync(templatePath)).toBe(true);
      
      const content = fs.readFileSync(templatePath, 'utf8');
      const parsed = matter(content);
      
      // Template should have runbook category
      expect(parsed.data.category).toBe('runbook');
      
      // Template should be schema compliant
      const isValid = validate(parsed.data);
      expect(isValid).toBe(true);
    });

    it('should have template with standard runbook sections', () => {
      const templatePath = 'templates/runbook-template.md';
      expect(fs.existsSync(templatePath)).toBe(true);
      
      const content = fs.readFileSync(templatePath, 'utf8');
      
      // Check for required runbook template sections
      expect(content).toMatch(/## Alert Overview/);
      expect(content).toMatch(/## Symptoms/);
      expect(content).toMatch(/## Troubleshooting Steps/);
      expect(content).toMatch(/## Resolution/);
      expect(content).toMatch(/## Prevention/);
      expect(content).toMatch(/## References/);
    });
  });
});