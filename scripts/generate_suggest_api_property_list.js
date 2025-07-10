#!/usr/bin/env node

/**
 * Generate comprehensive property list from OpenStreetMap toilet data
 * @artifact docs/reference/api/suggest-api.md
 * @task suggest_api_docs_impl
 * @tdd-phase GREEN
 * 
 * Parses docs/export.geojson to extract all unique properties with:
 * - Frequency counts
 * - Data type detection
 * - Enum value extraction
 * - Priority categorization
 */

const fs = require('fs');
const path = require('path');

// Load the GeoJSON data
const geojsonPath = path.join(__dirname, '../docs/export.geojson');
const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

// Initialize property analysis
const propertyAnalysis = {};

// Core properties that are always required
const CORE_PROPERTIES = ['lat', 'lng', 'amenity', '@id'];

// High frequency properties (based on issue #0008 analysis)
const HIGH_FREQUENCY_PROPERTIES = [
  'fee', 'wheelchair', 'access', 'male', 'female', 
  'changing_table', 'opening_hours', 'name', 'toilets:wheelchair',
  'unisex', 'toilets:disposal', 'level', 'building'
];

// Known boolean properties that use yes/no in OSM
const BOOLEAN_PROPERTIES = [
  'wheelchair', 'changing_table', 'male', 'female', 'unisex',
  'baby_changing', 'toilets:wheelchair', 'toilets:handwashing'
];

// Analyze each feature
geojsonData.features.forEach(feature => {
  if (feature.properties) {
    Object.entries(feature.properties).forEach(([key, value]) => {
      if (!propertyAnalysis[key]) {
        propertyAnalysis[key] = {
          count: 0,
          values: new Set(),
          types: new Set(),
          examples: []
        };
      }
      
      propertyAnalysis[key].count++;
      propertyAnalysis[key].values.add(value);
      propertyAnalysis[key].types.add(typeof value);
      
      // Store up to 3 unique examples
      if (propertyAnalysis[key].examples.length < 3 && 
          !propertyAnalysis[key].examples.includes(value)) {
        propertyAnalysis[key].examples.push(value);
      }
    });
  }
});

// Sort properties by frequency
const sortedProperties = Object.entries(propertyAnalysis)
  .sort((a, b) => b[1].count - a[1].count)
  .map(([property, data]) => {
    // Determine category
    let category = 'specialized';
    if (CORE_PROPERTIES.includes(property)) {
      category = 'core';
    } else if (HIGH_FREQUENCY_PROPERTIES.includes(property)) {
      category = 'high_frequency';
    } else if (data.count >= 50) {
      category = 'optional';
    }
    
    // Determine data type
    let dataType = 'string';
    if (BOOLEAN_PROPERTIES.includes(property)) {
      dataType = 'boolean (OSM: yes/no)';
    } else if (property === 'fee' || property === 'charge') {
      dataType = 'monetary';
    } else if (data.values.size <= 10 && data.count >= 10) {
      dataType = 'enum';
    } else if (Array.from(data.types).includes('number')) {
      dataType = 'number';
    }
    
    // Format enum values if applicable
    let enumValues = '';
    if (dataType === 'enum' || data.values.size <= 5) {
      enumValues = Array.from(data.values)
        .filter(v => v !== null && v !== undefined)
        .slice(0, 10)
        .join(', ');
    }
    
    // Conversion notes
    let conversionNotes = '';
    if (BOOLEAN_PROPERTIES.includes(property)) {
      conversionNotes = 'OSM "yes"/"no" → boolean true/false';
    } else if (property === 'charge' || property === 'fee') {
      conversionNotes = 'Normalize to £X.XX format';
    } else if (property === 'opening_hours') {
      conversionNotes = 'OSM opening_hours format';
    } else if (property.includes('payment:')) {
      conversionNotes = 'Payment method boolean';
    }
    
    return {
      property,
      count: data.count,
      category,
      dataType,
      enumValues,
      examples: data.examples.slice(0, 2).join(', '),
      conversionNotes
    };
  });

// Generate markdown table
console.log('# OpenStreetMap Toilet Properties Analysis\n');
console.log(`Total unique properties: ${sortedProperties.length}\n`);
console.log(`Total features analyzed: ${geojsonData.features.length}\n`);

console.log('## Property Table\n');
console.log('| Property | Category | Type | Count | Examples | Enum Values | Conversion Notes |');
console.log('|----------|----------|------|-------|----------|-------------|------------------|');

sortedProperties.forEach(prop => {
  const examples = prop.examples.replace(/\|/g, '\\|'); // Escape pipes
  const enumValues = prop.enumValues.replace(/\|/g, '\\|');
  console.log(
    `| \`${prop.property}\` | ${prop.category} | ${prop.dataType} | ${prop.count} | ${examples} | ${enumValues} | ${prop.conversionNotes} |`
  );
});

// Generate JSON output for programmatic use
const jsonOutput = {
  totalProperties: sortedProperties.length,
  totalFeatures: geojsonData.features.length,
  properties: sortedProperties.reduce((acc, prop) => {
    acc[prop.property] = {
      category: prop.category,
      type: prop.dataType,
      frequency: prop.count,
      conversionNotes: prop.conversionNotes
    };
    return acc;
  }, {})
};

// Write JSON output
const jsonPath = path.join(__dirname, '../data/osm_properties_analysis.json');
fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));
console.log(`\nJSON analysis saved to: ${jsonPath}`);

// Summary statistics
console.log('\n## Summary by Category\n');
const categoryCounts = sortedProperties.reduce((acc, prop) => {
  acc[prop.category] = (acc[prop.category] || 0) + 1;
  return acc;
}, {});

Object.entries(categoryCounts).forEach(([category, count]) => {
  console.log(`- ${category}: ${count} properties`);
});