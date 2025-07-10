# Config Directory

This directory contains configuration files for the CityPee application.

## Files

### suggestPropertyTiers.json

Generated configuration file containing the 4-tier classification for all 120 OpenStreetMap properties.

**Structure:**
```json
{
  "version": "1.0.0",
  "generated_at": "ISO timestamp",
  "source": "data/osm_properties_analysis.json",
  "tiers": {
    "core": { /* tier metadata */ },
    "high_frequency": { /* tier metadata */ },
    "optional": { /* tier metadata */ },
    "specialized": { /* tier metadata */ }
  },
  "properties": {
    "propertyName": {
      "tier": "core|high_frequency|optional|specialized",
      "frequency": 123,
      "validationType": "string|boolean|enum|monetary|date|number",
      "synthetic": true, // Optional, for lat/lng
      "description": "..." // Optional, for synthetic properties
    }
  }
}
```

## Generation

The configuration is generated from OSM analysis data:

```bash
# Basic generation
node scripts/generate_property_tiers.js

# With options
node scripts/generate_property_tiers.js --summary --update-aiconfig

# Custom input/output
node scripts/generate_property_tiers.js --input data.json --output config.json

# Full example with all options
node scripts/generate_property_tiers.js \
  --input data/osm_properties_analysis.json \
  --output src/config/suggestPropertyTiers.json \
  --update-aiconfig \
  --summary

# Show help
node scripts/generate_property_tiers.js --help
```

## Tier Definitions

1. **Core (8 properties)**
   - Essential for all toilet entries
   - Required fields with strict validation
   - UI: Always visible
   - Examples: lat, lng, wheelchair, access

2. **High-frequency (16 properties)**
   - Common enhancements
   - Strict validation when provided
   - UI: Visible by default
   - Examples: male, female, changing_table

3. **Optional (17 properties)**
   - Power user features
   - Validated if present
   - UI: Hidden behind toggle
   - Examples: operator, description

4. **Specialized (81 properties)**
   - Edge cases for completeness
   - Basic type checking only
   - UI: Not shown
   - Examples: survey dates, structural details

## Usage in Code

```javascript
// Load configuration
const tierConfig = require('./suggestPropertyTiers.json');

// Check property tier
const wheelchairInfo = tierConfig.properties.wheelchair;
console.log(wheelchairInfo.tier); // "core"

// Get tier rules
const coreTier = tierConfig.tiers.core;
console.log(coreTier.strict_validation); // true
console.log(coreTier.required); // true
```

## Validation

The configuration schema is validated by:
- JSON Schema: `schemas/propertyTiers.schema.json`
- Test Suite: `tests/config/property_tiers_test.js`

## Maintenance

1. **Adding Properties**: Update OSM analysis, regenerate config
2. **Changing Tiers**: Modify assignments in generator script
3. **Updating Counts**: Use `--update-aiconfig` flag

## References

- [Property Prioritization Framework](../../docs/reference/property-prioritization.md)
- [Generator Script](../../scripts/generate_property_tiers.js)
- [Tiered Validation Recipe](../../docs/cookbook/recipe_tiered_validation.md)