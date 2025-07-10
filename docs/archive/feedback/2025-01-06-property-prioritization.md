---
title: "OpenStreetMap Property Prioritization Feedback"
description: "User feedback on OpenStreetMap property prioritization for suggest-agent API implementation"
category: feedback
version: "1.0.0"
last_updated: "2025-01-06"
---

# OpenStreetMap Property Prioritization Feedback

**Date**: 2025-01-06  
**Context**: Following the documentation of all 120 OpenStreetMap properties for the suggest-agent API, this feedback was provided to guide the implementation of a pragmatic property tier system.

**Source**: User feedback following completion of comprehensive API documentation (plan_docs_suggest_api_0010)

---

## Original Feedback

Now that every property is documented we're free to be opinionated about which ones should shape the public-facing API and validation rules. Below is a pragmatic prioritisation framework and a first-pass shortlist.

## 1. Prioritisation Criteria

### A. User value
Does the field materially improve a typical user's search/decision (e.g. wheelchair, fee)?

### B. Data availability / frequency
How often does the property actually appear in London OSM data (export.geojson statistics)?

### C. Ease of validation
Can we validate the field cheaply (boolean/enums) versus complex free-text?

### D. Future extensibility
Is the field likely to drive upcoming features (payments, disposal type, levels for indoor maps)?

## 2. Tier Definitions

- **Core (MUST HAVE)**: API v1 continues to support these, they're always validated.
- **High-frequency (SHOULD HAVE)**: Enabled by default in v2, visible in UI forms.
- **Optional (COULD HAVE)**: Exposed via "Advanced options" or power-user flow.
- **Specialized (EDGE)**: Retained for data integrity; accepted but neither required nor surfaced in main UI.

## 3. Recommended Shortlist

### Core (keep in v1 & v2):
- lat, lng, @id, amenity (always "toilets", but keeps schema honest)
- wheelchair (accessibility)
- access (public / customers / private)
- opening_hours
- fee + charge (binary & amount)

### High-frequency (v2 defaults):
- male, female, unisex
- changing_table (+ changing_table:fee)
- toilets:disposal (flush, compost, chemical…)
- level (supports multi-floor venues & maps)
- Payment methods: payment:cash, payment:contactless
- Building context: building, indoor

### Optional (advanced):
- operator, source, name, description
- toilets:position, toilets:handwashing, toilets:wheelchair
- layer, roof:shape, roof:colour (useful for 3-D mapping but niche)

### Specialised / edge (accept but hide in UI):
All remaining ~80 properties (survey dates, wikidata links, addr:* granularity, support poles, etc.)

## 4. How to Operationalise This

1. **Add a "Priority" column** to the property table (already mandated in the plan).

2. **Update ValidationService**:
   - Core + high-frequency → strict validation (missing or bad value ⇒ 400).
   - Optional → validate if provided but do not require.
   - Specialized → lenient: unknown strings accepted, only basic type checks.

3. **UI forms**:
   - Core fields = always visible.
   - High-frequency = behind "More details" accordion.
   - Optional = "Advanced" toggle.

4. **API docs**:
   - Split table into collapsible tiers or colour-coded rows so integrators instantly see what matters.

## 5. Next Steps

- Amend docs/reference/api/suggest-api.md to add the Priority column and maybe an accordion-style layout for readability.
- Create a tiny config JSON (e.g. src/config/suggestPropertyTiers.json) that lists each property and its tier—ValidationService and front-end forms can import it.

---

## Implementation Notes

This feedback has been preserved as part of plan_property_prioritization_0011. The tier system has been implemented as:
- Configuration file: `src/config/suggestPropertyTiers.json`
- Architecture Decision Record: `docs/adr/ADR-002-property-tiering.md`
- Reference documentation: `docs/reference/property-prioritization.md`
- Test coverage: `tests/config/property_tiers_test.js`

The implementation follows the exact tier definitions and property assignments recommended in this feedback.