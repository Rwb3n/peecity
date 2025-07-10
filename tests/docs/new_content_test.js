/**
 * @fileoverview Tests for new content files (Task 9 - TDD Red phase)
 * 
 * These tests verify the existence and structure of new documentation content:
 * - Prometheus exporter recipe
 * - k6 load-testing guide
 * - ADR-005 Native Histograms
 * 
 * All tests should FAIL initially (TDD Red phase) until the content is implemented.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Ajv from 'ajv';

describe('New Content Files Tests (TDD Red Phase)', () => {
  let schema;
  let ajv;

  beforeAll(() => {
    // Load the front-matter schema
    const schemaPath = path.join(process.cwd(), 'docs_frontmatter_schema.json');
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    ajv = new Ajv();
  });

  describe('Prometheus Exporter Recipe', () => {
    const exporterRecipePath = 'docs/cookbook/recipe_prometheus_exporter.md';

    it('should exist as a file', () => {
      expect(fs.existsSync(exporterRecipePath)).toBe(true);
    });

    it('should have valid front-matter schema', () => {
      const content = fs.readFileSync(exporterRecipePath, 'utf8');
      const { data: frontMatter } = matter(content);
      
      const validate = ajv.compile(schema);
      const isValid = validate(frontMatter);
      
      expect(isValid).toBe(true);
      if (!isValid) {
        console.error('Front-matter validation errors:', validate.errors);
      }
    });

    it('should be categorized as cookbook', () => {
      const content = fs.readFileSync(exporterRecipePath, 'utf8');
      const { data: frontMatter } = matter(content);
      
      expect(frontMatter.category).toBe('cookbook');
    });

    it('should contain required cookbook sections', () => {
      const content = fs.readFileSync(exporterRecipePath, 'utf8');
      const { content: markdownContent } = matter(content);
      
      // Check for required headings
      expect(markdownContent).toMatch(/## Overview/);
      expect(markdownContent).toMatch(/## Prerequisites/);
      expect(markdownContent).toMatch(/## Implementation/);
      expect(markdownContent).toMatch(/## Best Practices/);
      expect(markdownContent).toMatch(/## Usage Examples/);
    });

    it('should cover prometheus exporter naming conventions', () => {
      const content = fs.readFileSync(exporterRecipePath, 'utf8');
      const { content: markdownContent } = matter(content);
      
      // Should mention key exporter concepts
      expect(markdownContent.toLowerCase()).toMatch(/naming/);
      expect(markdownContent.toLowerCase()).toMatch(/labels/);
      expect(markdownContent.toLowerCase()).toMatch(/help strings/);
      expect(markdownContent.toLowerCase()).toMatch(/maintainability/);
    });

    it('should include code examples', () => {
      const content = fs.readFileSync(exporterRecipePath, 'utf8');
      const { content: markdownContent } = matter(content);
      
      // Should contain code blocks
      expect(markdownContent).toMatch(/```/);
    });
  });

  describe('k6 Load Testing Guide', () => {
    const k6GuidePath = 'docs/howto/k6_load_testing.md';

    it('should exist as a file', () => {
      expect(fs.existsSync(k6GuidePath)).toBe(true);
    });

    it('should have valid front-matter schema', () => {
      const content = fs.readFileSync(k6GuidePath, 'utf8');
      const { data: frontMatter } = matter(content);
      
      const validate = ajv.compile(schema);
      const isValid = validate(frontMatter);
      
      expect(isValid).toBe(true);
      if (!isValid) {
        console.error('Front-matter validation errors:', validate.errors);
      }
    });

    it('should be categorized as howto', () => {
      const content = fs.readFileSync(k6GuidePath, 'utf8');
      const { data: frontMatter } = matter(content);
      
      expect(frontMatter.category).toBe('howto');
    });

    it('should contain required howto sections', () => {
      const content = fs.readFileSync(k6GuidePath, 'utf8');
      const { content: markdownContent } = matter(content);
      
      // Check for required headings
      expect(markdownContent).toMatch(/## Problem/);
      expect(markdownContent).toMatch(/## Solution Overview/);
      expect(markdownContent).toMatch(/## Prerequisites/);
      expect(markdownContent).toMatch(/## Step-by-Step Guide/);
      expect(markdownContent).toMatch(/## Verification/);
      expect(markdownContent).toMatch(/## Troubleshooting/);
    });

    it('should cover k6 load testing concepts', () => {
      const content = fs.readFileSync(k6GuidePath, 'utf8');
      const { content: markdownContent } = matter(content);
      
      // Should mention key k6 concepts
      expect(markdownContent.toLowerCase()).toMatch(/smoke.*test/);
      expect(markdownContent.toLowerCase()).toMatch(/soak.*test/);
      expect(markdownContent.toLowerCase()).toMatch(/thresholds/);
      expect(markdownContent.toLowerCase()).toMatch(/checks/);
      expect(markdownContent.toLowerCase()).toMatch(/output analysis/);
      expect(markdownContent.toLowerCase()).toMatch(/compact mode/);
    });

    it('should include k6 script examples', () => {
      const content = fs.readFileSync(k6GuidePath, 'utf8');
      const { content: markdownContent } = matter(content);
      
      // Should contain k6 script examples
      expect(markdownContent).toMatch(/```javascript/);
      expect(markdownContent.toLowerCase()).toMatch(/import.*k6/);
    });

    it('should reference CityPee validation API', () => {
      const content = fs.readFileSync(k6GuidePath, 'utf8');
      const { content: markdownContent } = matter(content);
      
      // Should reference the validation API in context
      expect(markdownContent.toLowerCase()).toMatch(/validation|citypee|suggest/);
    });
  });

  describe('ADR-005 Prometheus Native Histograms', () => {
    const adrPath = 'docs/adr/ADR-005-prometheus-native-histograms.md';

    it('should exist as a file', () => {
      expect(fs.existsSync(adrPath)).toBe(true);
    });

    it('should have valid front-matter schema', () => {
      const content = fs.readFileSync(adrPath, 'utf8');
      const { data: frontMatter } = matter(content);
      
      const validate = ajv.compile(schema);
      const isValid = validate(frontMatter);
      
      expect(isValid).toBe(true);
      if (!isValid) {
        console.error('Front-matter validation errors:', validate.errors);
      }
    });

    it('should be categorized as adr', () => {
      const content = fs.readFileSync(adrPath, 'utf8');
      const { data: frontMatter } = matter(content);
      
      expect(frontMatter.category).toBe('adr');
    });

    it('should contain required ADR sections', () => {
      const content = fs.readFileSync(adrPath, 'utf8');
      const { content: markdownContent } = matter(content);
      
      // Check for required ADR headings
      expect(markdownContent).toMatch(/## Context/);
      expect(markdownContent).toMatch(/## Decision/);
      expect(markdownContent).toMatch(/## Consequences/);
      expect(markdownContent).toMatch(/## Implementation/);
      expect(markdownContent).toMatch(/## Alternatives Considered/);
    });

    it('should include ADR status information', () => {
      const content = fs.readFileSync(adrPath, 'utf8');
      const { content: markdownContent } = matter(content);
      
      // Should have status, date, and deciders
      expect(markdownContent).toMatch(/\*\*Status\*\*:/);
      expect(markdownContent).toMatch(/\*\*Date\*\*:/);
      expect(markdownContent).toMatch(/\*\*Deciders\*\*:/);
    });

    it('should cover native histograms concepts', () => {
      const content = fs.readFileSync(adrPath, 'utf8');
      const { content: markdownContent } = matter(content);
      
      // Should mention key native histograms concepts
      expect(markdownContent.toLowerCase()).toMatch(/native histogram/);
      expect(markdownContent.toLowerCase()).toMatch(/prometheus/);
      expect(markdownContent.toLowerCase()).toMatch(/bucket/);
      expect(markdownContent.toLowerCase()).toMatch(/latency|performance/);
    });

    it('should explain rationale for adoption', () => {
      const content = fs.readFileSync(adrPath, 'utf8');
      const { content: markdownContent } = matter(content);
      
      // Should explain why we're adopting native histograms
      expect(markdownContent.toLowerCase()).toMatch(/rationale|reason|benefit/);
      expect(markdownContent.toLowerCase()).toMatch(/design.*change/);
    });

    it('should include implementation plan', () => {
      const content = fs.readFileSync(adrPath, 'utf8');
      const { content: markdownContent } = matter(content);
      
      // Should have implementation details
      expect(markdownContent.toLowerCase()).toMatch(/implementation.*plan/);
      expect(markdownContent.toLowerCase()).toMatch(/dashboard.*update/);
    });

    it('should reference validation performance monitoring', () => {
      const content = fs.readFileSync(adrPath, 'utf8');
      const { content: markdownContent } = matter(content);
      
      // Should reference our validation performance context
      expect(markdownContent.toLowerCase()).toMatch(/validation|tier|performance/);
    });
  });

  describe('Content Integration Tests', () => {
    it('should have all three new content files', () => {
      const files = [
        'docs/cookbook/recipe_prometheus_exporter.md',
        'docs/howto/k6_load_testing.md',
        'docs/adr/ADR-005-prometheus-native-histograms.md'
      ];
      
      files.forEach(file => {
        expect(fs.existsSync(file)).toBe(true);
      });
    });

    it('should have consistent author information', () => {
      const files = [
        'docs/cookbook/recipe_prometheus_exporter.md',
        'docs/howto/k6_load_testing.md',
        'docs/adr/ADR-005-prometheus-native-histograms.md'
      ];
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const { data: frontMatter } = matter(content);
        
        // Should have author information
        expect(frontMatter.author).toBeDefined();
        expect(typeof frontMatter.author).toBe('string');
        expect(frontMatter.author.length).toBeGreaterThan(0);
      });
    });

    it('should have recent last_updated dates', () => {
      const files = [
        'docs/cookbook/recipe_prometheus_exporter.md',
        'docs/howto/k6_load_testing.md',
        'docs/adr/ADR-005-prometheus-native-histograms.md'
      ];
      
      const today = new Date().toISOString().split('T')[0];
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const { data: frontMatter } = matter(content);
        
        // Should have current or recent date
        expect(frontMatter.last_updated).toBeDefined();
        expect(frontMatter.last_updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should have appropriate tags for their categories', () => {
      const expectations = [
        {
          file: 'docs/cookbook/recipe_prometheus_exporter.md',
          expectedTags: ['prometheus', 'exporter', 'metrics']
        },
        {
          file: 'docs/howto/k6_load_testing.md',
          expectedTags: ['k6', 'load-testing', 'performance']
        },
        {
          file: 'docs/adr/ADR-005-prometheus-native-histograms.md',
          expectedTags: ['adr', 'native-histograms', 'prometheus']
        }
      ];
      
      expectations.forEach(({ file, expectedTags }) => {
        const content = fs.readFileSync(file, 'utf8');
        const { data: frontMatter } = matter(content);
        
        expect(frontMatter.tags).toBeDefined();
        expect(Array.isArray(frontMatter.tags)).toBe(true);
        
        // Check if at least some expected tags are present
        expectedTags.forEach(tag => {
          expect(frontMatter.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))).toBe(true);
        });
      });
    });
  });
});