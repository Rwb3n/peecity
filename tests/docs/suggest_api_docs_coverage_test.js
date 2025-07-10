/**
 * @fileoverview Test coverage for suggest API documentation completeness
 * @artifact docs/reference/api/suggest-api.md
 * @task suggest_api_docs_test_create
 * @tdd-phase RED
 * 
 * Validates that suggest-api.md documents all 104 OpenStreetMap properties
 * discovered in the real data analysis (issue #0008)
 */

const fs = require('fs');
const path = require('path');

describe('Suggest API Documentation Coverage', () => {
  const docPath = path.join(__dirname, '../../docs/reference/api/suggest-api.md');
  const MINIMUM_PROPERTIES = 104; // Based on OSM data analysis
  
  /**
   * Parse markdown to extract documented properties from the property table
   * Looks for table rows with property names in backticks
   * @param {string} content - Markdown content
   * @returns {Array<string>} Array of property names
   */
  function extractDocumentedProperties(content) {
    const properties = [];
    
    // Find the properties table section
    // Look for headers like "### Properties", "## Property Table", etc.
    const propertySectionRegex = /###?\s*(?:OSM\s+)?(?:Property|Properties)(?:\s+Table)?/i;
    const sectionMatch = content.match(propertySectionRegex);
    
    if (!sectionMatch) {
      return properties;
    }
    
    // Extract content after the properties header until next section
    const startIndex = sectionMatch.index + sectionMatch[0].length;
    const nextSectionRegex = /^#{1,3}\s+/m;
    const remainingContent = content.slice(startIndex);
    const nextSectionMatch = remainingContent.match(nextSectionRegex);
    const endIndex = nextSectionMatch ? nextSectionMatch.index : remainingContent.length;
    const propertySection = remainingContent.slice(0, endIndex);
    
    // Extract properties from table rows
    // Match lines that start with | and contain a property name in backticks
    const propertyRowRegex = /^\|\s*`([^`]+)`\s*\|/gm;
    let match;
    
    while ((match = propertyRowRegex.exec(propertySection)) !== null) {
      properties.push(match[1]);
    }
    
    return properties;
  }
  
  /**
   * Validate that required table columns are present
   * @param {string} content - Property table section content
   * @returns {Object} Validation results with column presence
   */
  function validateTableColumns(content) {
    const requiredColumns = ['Category', 'Conversion Notes'];
    const foundColumns = {};
    
    // Find the property table section
    const propertySectionRegex = /###?\s*Property\s+Table/i;
    const sectionMatch = content.match(propertySectionRegex);
    
    if (!sectionMatch) {
      return {
        hasAllColumns: false,
        missingColumns: requiredColumns
      };
    }
    
    // Extract table content after the header
    const tableContent = content.slice(sectionMatch.index);
    const lines = tableContent.split('\n');
    
    // Look for table header row
    for (let i = 0; i < lines.length && i < 10; i++) {
      const line = lines[i];
      if (line.includes('|') && line.includes('Property')) {
        // This is likely the header row
        requiredColumns.forEach(required => {
          if (line.includes(required)) {
            foundColumns[required] = true;
          }
        });
        break;
      }
    }
    
    return {
      hasAllColumns: requiredColumns.every(col => foundColumns[col]),
      missingColumns: requiredColumns.filter(col => !foundColumns[col])
    };
  }
  
  it('should exist and be readable', () => {
    expect(fs.existsSync(docPath)).toBe(true);
    const stats = fs.statSync(docPath);
    expect(stats.isFile()).toBe(true);
  });
  
  it('should document at least 104 OSM properties', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    const properties = extractDocumentedProperties(content);
    
    // Log for debugging
    console.log(`Found ${properties.length} documented properties`);
    if (properties.length < 10) {
      console.log('Documented properties:', properties);
    }
    
    expect(properties.length).toBeGreaterThanOrEqual(MINIMUM_PROPERTIES);
  });
  
  it('should include required table columns (Category and Conversion Notes)', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    const validation = validateTableColumns(content);
    
    if (!validation.hasAllColumns) {
      console.log('Missing required columns:', validation.missingColumns);
    }
    
    expect(validation.hasAllColumns).toBe(true);
  });
  
  it('should document backward compatibility (v1/v2 schema versioning)', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    
    // Check for backward compatibility section
    const hasBackwardCompatibility = 
      content.includes('Backward Compatibility') ||
      content.includes('Schema v2') ||
      content.includes('v1/v2') ||
      content.includes('progressive enhancement');
    
    expect(hasBackwardCompatibility).toBe(true);
  });
  
  it('should include data type conversion patterns section', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    
    // Check for conversion patterns section
    const hasConversionPatterns = 
      content.includes('Data Type Conversion') ||
      content.includes('Conversion Patterns') ||
      content.includes('OSM to API Mapping');
    
    expect(hasConversionPatterns).toBe(true);
  });
  
  it('should categorize properties by priority', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    const expectedCategories = ['core', 'high_frequency', 'optional', 'specialized'];
    
    const foundCategories = expectedCategories.filter(category => 
      content.toLowerCase().includes(category.replace('_', ' '))
    );
    
    expect(foundCategories.length).toBeGreaterThanOrEqual(3); // At least 3 of 4 categories
  });
  
  it('should document v2 endpoint and strict validation', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    
    // Check for v2 endpoint documentation
    const hasV2Endpoint = content.includes('/api/v2/suggest');
    const hasStrictValidation = content.includes('strict validation') || content.includes('Strict Validation');
    const hasV2Examples = content.includes('v2') && content.includes('400') && content.includes('core');
    const hasVersioningSection = content.includes('API Versioning');
    
    expect(hasV2Endpoint).toBe(true);
    expect(hasStrictValidation).toBe(true);
    expect(hasV2Examples).toBe(true);
    expect(hasVersioningSection).toBe(true);
  });
  
  it('should include v2 error examples with tier information', () => {
    const content = fs.readFileSync(docPath, 'utf8');
    
    // Check for v2-specific error examples
    const hasTierSummary = content.includes('tierSummary');
    const hasErrorsByTier = content.includes('errorsByTier');
    const hasTierField = content.includes('"tier"') && content.includes('"core"');
    
    expect(hasTierSummary).toBe(true);
    expect(hasErrorsByTier).toBe(true);
    expect(hasTierField).toBe(true);
  });
});