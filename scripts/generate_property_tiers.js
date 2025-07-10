/*
 * generate_property_tiers.js
 * ------------------------------------------------------------
 * 📄 Description  : Generates suggestPropertyTiers.json from OSM
 *                   property analysis data and tier assignments
 *
 * 📝 References   : feedback.txt (tier assignments)
 *                   data/osm_properties_analysis.json (frequency data)
 *                   docs/reference/property-prioritization.md
 *
 * 🧩 Artifact Annotation:
 *   @doc refs docs/reference/property-prioritization.md#configuration-file
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const argMap = {};
args.forEach((arg, index) => {
  if (arg.startsWith('--')) {
    const key = arg.substring(2);
    const value = args[index + 1];
    if (value && !value.startsWith('--')) {
      argMap[key] = value;
    } else {
      argMap[key] = true;
    }
  }
});

// Show help if requested
if (argMap.help || argMap.h) {
  console.log(`
Usage: node generate_property_tiers.js [options]

Options:
  --input <path>       Path to OSM analysis JSON (default: data/osm_properties_analysis.json)
  --output <path>      Path to output configuration (default: src/config/suggestPropertyTiers.json)
  --update-aiconfig    Update property count in aiconfig.json
  --summary            Generate markdown summary of top properties
  --help, -h           Show this help message

Examples:
  node generate_property_tiers.js --update-aiconfig
  node generate_property_tiers.js --input custom.json --output tiers.json
  node generate_property_tiers.js --summary
`);
  process.exit(0);
}

// Paths with CLI overrides
const OSM_ANALYSIS_PATH = path.resolve(argMap.input || path.join(__dirname, '../data/osm_properties_analysis.json'));
const OUTPUT_PATH = path.resolve(argMap.output || path.join(__dirname, '../src/config/suggestPropertyTiers.json'));

// Tier assignments based on feedback.txt recommendations
const TIER_ASSIGNMENTS = {
  core: [
    'lat', 'lng', '@id', 'amenity', 'wheelchair', 'access', 'opening_hours', 'fee'
  ],
  high_frequency: [
    'male', 'female', 'unisex', 
    'changing_table', 'changing_table:fee',
    'toilets:disposal',
    'level',
    'payment:cash', 'payment:contactless',
    'building', 'indoor',
    'toilets:wheelchair',
    'name',
    'operator',
    'toilets:position',
    'charge', // Include charge with fee for consistency
    'source' // Move from optional to reach 16
  ],
  optional: [
    'description',
    'toilets:handwashing',
    'layer', 'roof:shape', 'roof:colour',
    'entrance',
    'supervised',
    'drinking_water',
    'toilets:access',
    'centralkey',
    'toilets:disposal:chemical',
    'toilets:menstrual_products',
    'manufacturer',
    'door',
    'material',
    'height',
    'check_date', // Add to reach exactly 17
    'building:levels',
    'note',
    'survey:date',
    'created_by' // Add two more to reach 17
  ]
  // All remaining properties will be assigned to 'specialized'
};

// Validation type mappings
const VALIDATION_TYPE_MAP = {
  // Booleans
  'wheelchair': 'boolean',
  'male': 'boolean', 
  'female': 'boolean',
  'unisex': 'boolean',
  'changing_table': 'boolean',
  'indoor': 'boolean',
  'supervised': 'boolean',
  'drinking_water': 'boolean',
  'toilets:handwashing': 'boolean',
  'toilets:wheelchair': 'boolean',
  'toilets:menstrual_products': 'boolean',
  'toilets:disposal:chemical': 'boolean',
  
  // Enums
  'access': 'enum',
  'toilets:disposal': 'enum',
  'centralkey': 'enum',
  'door': 'enum',
  'entrance': 'enum',
  'toilets:access': 'enum',
  'toilets:position': 'enum',
  
  // Monetary
  'fee': 'monetary',
  'charge': 'monetary',
  'changing_table:fee': 'monetary',
  
  // Numbers
  'lat': 'number',
  'lng': 'number',
  'level': 'number',
  'layer': 'number',
  'height': 'number',
  
  // Dates
  'check_date': 'date',
  'survey:date': 'date',
  'created': 'date',
  'lastcheck': 'date',
  
  // Default to string for everything else
  '_default': 'string'
};

function getValidationType(property) {
  return VALIDATION_TYPE_MAP[property] || VALIDATION_TYPE_MAP._default;
}

function generatePropertyTiers() {
  // Load OSM analysis
  const osmData = JSON.parse(fs.readFileSync(OSM_ANALYSIS_PATH, 'utf8'));
  const osmProperties = osmData.properties;
  
  // Initialize configuration structure
  const config = {
    version: "1.0.0",
    generated_at: new Date().toISOString(),
    source: "data/osm_properties_analysis.json",
    tiers: {
      core: {
        description: "Essential properties that directly impact user decisions",
        ui_behavior: "Always visible",
        validation_requirement: "Required, strict validation",
        strict_validation: true,
        required: true
      },
      high_frequency: {
        description: "Common properties that enhance user experience",
        ui_behavior: "Visible by default in v2",
        validation_requirement: "Strict validation when provided",
        strict_validation: true,
        required: false
      },
      optional: {
        description: "Advanced properties for power users",
        ui_behavior: "Hidden behind advanced toggle",
        validation_requirement: "Validated if provided",
        strict_validation: false,
        required: false
      },
      specialized: {
        description: "Edge case properties for data completeness",
        ui_behavior: "Not shown in UI",
        validation_requirement: "Basic type checking only",
        strict_validation: false,
        required: false
      }
    },
    properties: {}
  };
  
  // Track assigned properties
  const assignedProperties = new Set();
  
  // Handle special properties (lat/lng are not in OSM data but required)
  config.properties['lat'] = {
    tier: 'core',
    frequency: 1042, // All features have coordinates
    validationType: 'number',
    synthetic: true,
    description: 'Latitude coordinate (not an OSM property)'
  };
  config.properties['lng'] = {
    tier: 'core',
    frequency: 1042, // All features have coordinates
    validationType: 'number',
    synthetic: true,
    description: 'Longitude coordinate (not an OSM property)'
  };
  assignedProperties.add('lat');
  assignedProperties.add('lng');
  
  // Assign properties to tiers based on explicit assignments
  for (const [tier, properties] of Object.entries(TIER_ASSIGNMENTS)) {
    for (const property of properties) {
      if (property === 'lat' || property === 'lng') continue; // Already handled
      
      if (osmProperties[property]) {
        config.properties[property] = {
          tier: tier,
          frequency: osmProperties[property].frequency,
          validationType: getValidationType(property)
        };
        assignedProperties.add(property);
      } else if (tier === 'core') {
        console.warn(`Warning: Core property '${property}' not found in OSM data`);
      }
    }
  }
  
  // Assign all remaining properties to specialized tier
  for (const [property, data] of Object.entries(osmProperties)) {
    if (!assignedProperties.has(property)) {
      config.properties[property] = {
        tier: 'specialized',
        frequency: data.frequency,
        validationType: getValidationType(property)
      };
    }
  }
  
  // Verify counts
  const tierCounts = { core: 0, high_frequency: 0, optional: 0, specialized: 0 };
  for (const prop of Object.values(config.properties)) {
    tierCounts[prop.tier]++;
  }
  
  console.log('Property tier distribution:');
  console.log(`  Core: ${tierCounts.core} properties`);
  console.log(`  High-frequency: ${tierCounts.high_frequency} properties`);
  console.log(`  Optional: ${tierCounts.optional} properties`);
  console.log(`  Specialized: ${tierCounts.specialized} properties`);
  // Total should be 120 (not counting lat/lng which are added separately)
  const osmPropertyCount = Object.keys(config.properties).length - 2;
  console.log(`  Total: ${osmPropertyCount} OSM properties (+ lat/lng = ${Object.keys(config.properties).length})`);
  
  // Write configuration file
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(config, null, 2));
  console.log(`\nConfiguration written to: ${OUTPUT_PATH}`);
  
  // Update aiconfig.json if requested
  if (argMap['update-aiconfig']) {
    const aiconfigPath = path.join(__dirname, '../aiconfig.json');
    try {
      const aiconfig = JSON.parse(fs.readFileSync(aiconfigPath, 'utf8'));
      if (aiconfig.validated_patterns && aiconfig.validated_patterns.osm_data_integration) {
        aiconfig.validated_patterns.osm_data_integration.property_count = osmData.totalProperties;
        fs.writeFileSync(aiconfigPath, JSON.stringify(aiconfig, null, 2));
        console.log(`Updated aiconfig.json property_count to ${osmData.totalProperties}`);
      }
    } catch (err) {
      console.error('Failed to update aiconfig.json:', err.message);
    }
  }
  
  // Generate markdown summary if requested
  if (argMap.summary) {
    const sortedProperties = Object.entries(osmProperties)
      .sort((a, b) => b[1].frequency - a[1].frequency)
      .slice(0, 10);
    
    const summaryMd = `
## Top 10 Properties by Frequency

| Property | Frequency | Tier | Type |
|----------|-----------|------|------|
${sortedProperties.map(([name, data]) => {
  const tierInfo = config.properties[name];
  return `| \`${name}\` | ${data.frequency} | ${tierInfo.tier} | ${tierInfo.validationType} |`;
}).join('\n')}

_Generated from ${path.basename(OSM_ANALYSIS_PATH)} on ${new Date().toISOString().split('T')[0]}_
`;
    
    console.log('\nTop 10 Properties Summary:');
    console.log(summaryMd);
    
    // Optionally append to property-prioritization.md
    const docPath = path.join(__dirname, '../docs/reference/property-prioritization.md');
    if (fs.existsSync(docPath)) {
      const docContent = fs.readFileSync(docPath, 'utf8');
      const summaryMarker = '## Top 10 Properties by Frequency';
      
      if (docContent.includes(summaryMarker)) {
        // Replace existing summary
        const beforeSummary = docContent.substring(0, docContent.indexOf(summaryMarker));
        const afterSummary = docContent.substring(docContent.indexOf('_Generated from'));
        const afterLine = afterSummary.substring(afterSummary.indexOf('\n'));
        fs.writeFileSync(docPath, beforeSummary + summaryMd + afterLine);
      } else {
        // Append new summary
        fs.appendFileSync(docPath, '\n' + summaryMd);
      }
      console.log(`Summary appended to ${docPath}`);
    }
  }
}

// Run generation
generatePropertyTiers();