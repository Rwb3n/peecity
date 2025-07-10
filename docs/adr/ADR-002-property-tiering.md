---
title: "ADR-002: Property Tiering System for OpenStreetMap Data"
description: "Architecture decision record defining a 4-tier classification system for 120 OpenStreetMap properties to optimize validation performance and user experience"
category: adr
version: "1.0.0"
last_updated: "2025-07-09"
---

# ADR-002: Property Tiering System for OpenStreetMap Data

**Status**: Accepted  
**Date**: 2025-01-06  
**Decision Makers**: Development Team  
**Related**: issue_0008 (API documentation gap), plan_property_prioritization_0011

## Context

The suggest-agent API documentation revealed 120 unique OpenStreetMap properties in our London toilet dataset, but only 9 (8.6%) were initially documented. After comprehensive documentation (plan_docs_suggest_api_0010), we needed a systematic approach to:

1. Maintain backward compatibility with the v1 API (9 properties)
2. Support all 120 properties for data integrity
3. Provide appropriate validation rules for different property types
4. Create intuitive UI patterns that don't overwhelm users
5. Guide future feature development priorities

## Decision

We will implement a 4-tier property classification system:

### Tier 1: Core (8 properties)
**Purpose**: Essential properties that directly impact user decisions  
**Properties**: lat, lng, @id, amenity, wheelchair, access, opening_hours, fee  
**Validation**: Strict validation, missing or invalid values return 400 errors  
**UI**: Always visible in forms  
**API**: Supported in both v1 and v2  

### Tier 2: High-frequency (16 properties)
**Purpose**: Common properties that enhance user experience  
**Properties**: male, female, unisex, changing_table, changing_table:fee, toilets:disposal, level, payment:cash, payment:contactless, building, indoor, etc.  
**Validation**: Strict validation when provided  
**UI**: Visible by default in v2, grouped in "More details" section  
**API**: v2 defaults  

### Tier 3: Optional (17 properties)
**Purpose**: Advanced properties for power users  
**Properties**: operator, source, name, description, toilets:position, toilets:handwashing, layer, roof:shape, etc.  
**Validation**: Validated if provided, not required  
**UI**: Hidden behind "Advanced options" toggle  
**API**: Available but not promoted  

### Tier 4: Specialized (79 properties)
**Purpose**: Edge cases for data completeness  
**Properties**: Survey dates, wikidata links, address granularity, structural details, etc.  
**Validation**: Lenient, basic type checking only  
**UI**: Not surfaced in main UI  
**API**: Accepted for data integrity  

## Rationale

### Why 4 tiers?
- **User Experience**: Progressive disclosure prevents overwhelming casual users while supporting power users
- **Data Quality**: Strict validation on high-value properties ensures data reliability
- **Performance**: Focusing validation effort on ~20% of properties that provide 80% of value
- **Maintainability**: Clear tier boundaries simplify feature decisions

### Why these specific assignments?
1. **Core tier** based on:
   - Original v1 API contract (backward compatibility)
   - Highest user value (accessibility, cost, availability)
   - 100% data availability

2. **High-frequency tier** based on:
   - Actual OSM data frequency analysis
   - Direct user impact (gender-specific facilities, baby changing)
   - Future feature potential (payment integration, indoor navigation)

3. **Optional/Specialized** split based on:
   - Validation complexity
   - UI real estate cost
   - Niche use cases

## Consequences

### Positive
- **Progressive Enhancement**: v1 clients continue working, v2 clients get richer data
- **Performance**: ValidationService can optimize for common cases
- **Developer Experience**: Clear guidelines for feature implementation
- **User Experience**: Clean UI with optional complexity
- **Data Integrity**: All 120 properties preserved

### Negative
- **Configuration Overhead**: Additional config file to maintain
- **Testing Complexity**: Multiple validation paths to test
- **Documentation**: Need to maintain tier-aware documentation
- **Migration Path**: Existing data may need re-validation

### Mitigation
- Automated configuration generation from OSM analysis data
- Comprehensive test coverage for each tier
- Clear documentation with examples
- Gradual rollout with monitoring

## Implementation

1. **Configuration**: `src/config/suggestPropertyTiers.json`
   - Generated programmatically from OSM property analysis
   - Single source of truth for ValidationService and UI

2. **Validation Strategy**:
   ```javascript
   // Core + High-frequency: strict
   if (tier === 'core' || tier === 'high_frequency') {
     validateStrict(property, value);
   }
   // Optional: validate if present
   else if (tier === 'optional' && value !== undefined) {
     validateOptional(property, value);
   }
   // Specialized: basic type check
   else if (tier === 'specialized') {
     validateBasicType(property, value);
   }
   ```

3. **UI Pattern**:
   ```typescript
   // Progressive disclosure
   <CoreFields always visible />
   <Accordion title="More details">
     <HighFrequencyFields />
   </Accordion>
   <AdvancedToggle>
     <OptionalFields />
   </AdvancedToggle>
   // Specialized fields: API-only
   ```

## References

- [Property Prioritization Feedback](../feedback/2025-01-06-property-prioritization.md)
- [Property Prioritization Framework](../reference/property-prioritization.md)
- [Suggest API Documentation](../reference/api/suggest-api.md)
- [OSM Property Analysis](../../data/osm_properties_analysis.json)