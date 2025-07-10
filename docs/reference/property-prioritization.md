---
title: "Property Prioritization Framework"
description: "4-tier classification framework for managing 120 OpenStreetMap properties balancing data completeness with performance"
category: reference
version: "1.0.0"
last_updated: "2025-07-09"
---

# Property Prioritization Framework

## Overview

CityPee's property tier system manages 120 OpenStreetMap properties through a 4-tier classification framework. This system balances data completeness with user experience, validation performance, and API evolution.

## Quick Reference

| Tier | Properties | Validation | UI Visibility | Use Case |
|------|-----------|------------|---------------|----------|
| **Core** | 8 | Strict, Required | Always visible | Essential user decisions |
| **High-frequency** | 16 | Strict when provided | Default visible (v2) | Common enhancements |
| **Optional** | 17 | Validated if present | Advanced toggle | Power user features |
| **Specialized** | 79 | Basic type checking | Hidden | Data completeness |

## Tier System Details

### Core Tier (8 properties)

Essential properties that directly impact user toilet-finding decisions.

**Properties**:
- `lat`, `lng` - Location coordinates
- `@id` - Unique identifier
- `amenity` - Always "toilets" 
- `wheelchair` - Accessibility status
- `access` - Public/customers/private
- `opening_hours` - Availability
- `fee` - Cost indicator

**Characteristics**:
- Backward compatible with v1 API
- Required for all toilet entries
- Strict validation rules
- Always visible in UI forms
- Highest data quality standards

### High-frequency Tier (16 properties)

Commonly available properties that enhance user experience.

**Properties**:
- Gender indicators: `male`, `female`, `unisex`
- Family facilities: `changing_table`, `changing_table:fee`
- Toilet type: `toilets:disposal` (flush/compost/chemical)
- Navigation: `level` (floor number), `indoor`, `building`
- Payments: `payment:cash`, `payment:contactless`
- Additional amenities (varies by implementation)

**Characteristics**:
- Available in >10% of London OSM data
- Visible by default in v2 UI
- Grouped in "More details" sections
- Strict validation when provided
- Drive feature development

### Optional Tier (17 properties)

Advanced properties for specific use cases.

**Properties**:
- Metadata: `operator`, `source`, `name`, `description`
- Detailed facilities: `toilets:position`, `toilets:handwashing`, `toilets:wheelchair`
- Mapping details: `layer`, `roof:shape`, `roof:colour`
- Specialized amenities (varies)

**Characteristics**:
- Lower frequency in data (<10%)
- Hidden behind "Advanced" UI toggle
- Validated only when provided
- Support niche workflows
- Power user focused

### Specialized Tier (79 properties)

Edge case properties preserved for data integrity.

**Properties**:
- Survey metadata: `check_date`, `survey:date`
- External references: `wikidata`, `wikipedia`
- Detailed addressing: `addr:*` fields
- Structural details: `support`, `poles`
- Many others...

**Characteristics**:
- Rarely populated (<1% frequency)
- Not shown in UI
- Lenient validation
- API accepts but doesn't promote
- Future-proofing

## Implementation Guide

### Configuration File

The tier system is defined in `src/config/suggestPropertyTiers.json`:

```json
{
  "version": "1.0.0",
  "generated_at": "2025-01-06T12:00:00Z",
  "source": "data/osm_properties_analysis.json",
  "tiers": {
    "core": {
      "description": "Essential properties for user decisions",
      "ui_behavior": "Always visible",
      "validation_requirement": "Required, strict validation",
      "strict_validation": true,
      "required": true
    },
    // ... other tiers
  },
  "properties": {
    "wheelchair": {
      "tier": "core",
      "frequency": 1042,
      "validationType": "boolean"
    },
    // ... all 120 properties
  }
}
```

### Validation Patterns

```javascript
// ValidationService implementation
const tierConfig = require('./suggestPropertyTiers.json');

function validateProperty(name, value) {
  const property = tierConfig.properties[name];
  if (!property) return { valid: false, error: 'Unknown property' };
  
  const tier = tierConfig.tiers[property.tier];
  
  // Core properties must be present
  if (tier.required && value === undefined) {
    return { valid: false, error: `${name} is required` };
  }
  
  // Apply tier-specific validation
  if (tier.strict_validation && value !== undefined) {
    return strictValidate(property, value);
  }
  
  return basicTypeCheck(property, value);
}
```

### UI Implementation

```jsx
// Progressive disclosure pattern
function ToiletForm({ toilet }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  return (
    <form>
      {/* Core fields - always visible */}
      <CoreFieldsSection properties={getCoreProperties()} />
      
      {/* High-frequency - collapsible but visible */}
      <Accordion defaultOpen title="More details">
        <HighFrequencyFields properties={getHighFrequencyProperties()} />
      </Accordion>
      
      {/* Optional - hidden by default */}
      {showAdvanced && (
        <OptionalFieldsSection properties={getOptionalProperties()} />
      )}
      
      <button onClick={() => setShowAdvanced(!showAdvanced)}>
        {showAdvanced ? 'Hide' : 'Show'} advanced options
      </button>
    </form>
  );
}
```

## API Evolution Strategy

### v1 API (Current)
- Supports only Core tier properties
- Simple flat structure
- Backward compatible

### v2 API (Planned)
- Supports all 120 properties
- Tier-aware validation
- Progressive enhancement
- Maintains v1 compatibility

### Migration Path
1. Deploy tier configuration
2. Update ValidationService with tier awareness
3. Soft launch v2 endpoints
4. Monitor adoption
5. Update UI progressively
6. Deprecate v1 after transition period

## Maintenance

### Adding New Properties
1. Update OSM analysis: `npm run analyze:osm`
2. Regenerate config: `npm run generate:tiers`
3. Assign appropriate tier based on criteria
4. Update tests and documentation

### Tier Reassignment
1. Analyze usage data quarterly
2. Properties with increased usage → promote tier
3. Unused properties → demote tier
4. Update configuration and tests

## Related Documentation

- [ADR-002: Property Tiering Decision](../adr/ADR-002-property-tiering.md)
- [Suggest API Reference](./api/suggest-api.md)
- [Validation Service](../../src/services/ValidationService.js)
- [Property Analysis Data](../../data/osm_properties_analysis.json)

## Top 10 Properties by Frequency

| Property | Frequency | Tier | Type |
|----------|-----------|------|------|
| `@id` | 1042 | core | string |
| `amenity` | 1042 | core | string |
| `fee` | 528 | core | monetary |
| `wheelchair` | 467 | core | boolean |
| `access` | 422 | core | enum |
| `@geometry` | 231 | specialized | string |
| `female` | 227 | high_frequency | boolean |
| `male` | 219 | high_frequency | boolean |
| `changing_table` | 201 | high_frequency | boolean |
| `building` | 188 | high_frequency | string |

_Generated from osm_properties_analysis.json on 2025-07-06_
