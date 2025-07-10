---
title: "Suggest API Reference"
description: "Complete API reference for the suggest endpoint including validation, rate limiting, and OpenStreetMap property support"
category: reference
version: "1.0.0"
last_updated: "2025-07-09"
---

# Suggest API Reference

## Overview

The Suggest API allows users to submit new public toilet locations to the CityPee database. Submissions are validated, checked for duplicates, and rate-limited before being logged for review.

> **📚 Looking for exhaustive field definitions?**  
> See the [Property Prioritization Framework](../property-prioritization.md) for details on all 120 OpenStreetMap properties, their tier classifications, and validation requirements.

## API Versioning

CityPee Suggest API supports two validation modes to balance ease of use with data quality:

### v1 (Default) - `/api/suggest`
- **Philosophy**: Developer-friendly with sensible defaults
- **Core Properties**: Automatically filled with defaults if missing
- **Use Case**: Quick integrations, prototypes, backward compatibility
- **Validation**: Lenient with automatic field mappings

### v2 (Strict) - `/api/v2/suggest`  
- **Philosophy**: Data quality enforcement through strict validation
- **Core Properties**: All 8 core properties must be explicitly provided
- **Use Case**: Production systems requiring high data quality
- **Validation**: Strict tier-based validation per ADR-003

### Key Differences

| Feature | v1 (Default) | v2 (Strict) |
|---------|--------------|-------------|
| Endpoint | `/api/suggest` | `/api/v2/suggest` |
| Missing `@id` | Auto-generated `node/{timestamp}` | 400 Error |
| Missing `amenity` | Defaults to `"toilets"` | 400 Error |
| Missing `wheelchair` | Defaults to `"no"` | 400 Error |
| Missing `access` | Defaults to `"yes"` | 400 Error |
| Missing `opening_hours` | Defaults to `"unknown"` | 400 Error |
| Missing `fee` | Defaults to `false` | 400 Error |
| Field Mappings | `accessible` → `wheelchair` | Same |
| High-frequency validation | Strict when provided | Strict when provided |
| Optional properties | Lenient with warnings | Lenient with warnings |
| Response format | Standard | Standard |

## Endpoints

### POST /api/suggest (v1 - Default)

Submit a new toilet suggestion with backward compatibility and automatic defaults.

### POST /api/v2/suggest (v2 - Strict Validation)

Submit a new toilet suggestion with strict validation and no automatic defaults for core properties.

#### Request

**Headers:**
- `Content-Type: application/json` (required)
- `X-Forwarded-For: <ip-address>` (optional, used for rate limiting)

**Body Schema:**
```json
{
  "lat": number,           // Required. Latitude (-90 to 90)
  "lng": number,           // Required. Longitude (-180 to 180)
  "name": string,          // Required. Name/description of the toilet
  "accessible": boolean,   // Optional. Wheelchair accessibility (maps to OSM "wheelchair")
  "hours": string,         // Optional. Opening hours (maps to OSM "opening_hours")
  "fee": number,           // Optional. Usage fee in GBP (maps to OSM "charge")
  "changing_table": boolean, // Optional. Baby changing facilities
  "payment_contactless": boolean, // Optional. Contactless payment accepted
  "access": string,        // Optional. Access type ("yes", "customers", "private")
  "description": string    // Optional. Additional details
}
```

**OSM Property Mapping:**
- `accessible` → `wheelchair` (boolean to "yes"/"no")
- `hours` → `opening_hours` (string format preserved)
- `fee` → `charge` (number to "£X.XX" format)
- `changing_table` → `changing_table` (boolean to "yes"/"no")
- `payment_contactless` → `payment:contactless` (boolean to "yes"/"no")
- `access` → `access` (string preserved)

**Example Request (v1):**
```bash
curl -X POST http://localhost:3000/api/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 51.5074,
    "lng": -0.1278,
    "name": "Victoria Station Public Toilets",
    "accessible": true,
    "hours": "24/7",
    "fee": 0.50,
    "changing_table": true,
    "payment_contactless": true,
    "access": "yes",
    "description": "Located near the main entrance"
  }'
```

**Example Request (v2 - All Core Properties Required):**
```bash
curl -X POST http://localhost:3000/api/v2/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 51.5074,
    "lng": -0.1278,
    "@id": "node/123456789",
    "amenity": "toilets",
    "wheelchair": "yes",
    "access": "yes",
    "opening_hours": "24/7",
    "fee": true,
    "name": "Victoria Station Public Toilets",
    "changing_table": true,
    "payment:contactless": "yes"
  }'
```

#### Responses

**Success Response (201 Created):**
```json
{
  "success": true,
  "suggestionId": "sug_abc123def456",
  "message": "Toilet suggestion submitted successfully",
  "validation": {
    "isValid": true,
    "warnings": [],
    "isDuplicate": false,
    "nearestDistance": 523.4,
    "nearestToiletId": "osm_node_123456"
  },
  "timestamp": "2025-07-06T19:30:00.000Z"
}
```

**Validation Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "validation_failed",
    "details": "Request body validation failed",
    "timestamp": "2025-07-06T19:30:00.000Z"
  },
  "validation": {
    "isValid": false,
    "errors": [
      {
        "field": "lat",
        "message": "Latitude is required",
        "code": "required"
      }
    ],
    "warnings": []
  }
}
```

**v2 Validation Error - Missing Core Properties (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "validation_failed",
    "details": "Request body validation failed",
    "timestamp": "2025-07-06T19:30:00.000Z"
  },
  "validation": {
    "isValid": false,
    "errors": [
      {
        "field": "@id",
        "message": "@id is required",
        "code": "required",
        "tier": "core"
      },
      {
        "field": "amenity",
        "message": "amenity is required",
        "code": "required",
        "tier": "core"
      },
      {
        "field": "wheelchair",
        "message": "wheelchair is required", 
        "code": "required",
        "tier": "core"
      }
    ],
    "warnings": [],
    "tierSummary": {
      "core": { "provided": 2, "required": 8, "valid": 2 },
      "high_frequency": { "provided": 0, "valid": 0 },
      "optional": { "provided": 0, "valid": 0 },
      "specialized": { "provided": 0, "valid": 0 }
    },
    "errorsByTier": {
      "core": 6,
      "high_frequency": 0
    }
  }
}
```

**Duplicate Detected (409 Conflict):**
```json
{
  "success": false,
  "message": "Toilet suggestion too close to existing toilet (22m away)",
  "error": {
    "code": "duplicate_detected",
    "details": "Found existing toilet \"Central London Toilet\" 22 meters away",
    "timestamp": "2025-07-06T19:30:00.000Z"
  },
  "validation": {
    "isValid": true,
    "warnings": [],
    "isDuplicate": true,
    "duplicateDistance": 22,
    "nearestToiletId": "osm_node_central"
  }
}
```

**Rate Limit Exceeded (429 Too Many Requests):**
```json
{
  "success": false,
  "message": "Rate limit exceeded. Maximum 5 submissions per hour.",
  "error": {
    "code": "rate_limited",
    "details": "You have made 5 submissions in the current window.",
    "timestamp": "2025-07-06T19:30:00.000Z"
  }
}
```

**Headers:**
- `X-RateLimit-Limit: 5`
- `X-RateLimit-Remaining: 0`
- `X-RateLimit-Reset: 2025-07-06T20:30:00.000Z`

**Server Error (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Internal server error occurred",
  "error": {
    "code": "server_error",
    "details": "An unexpected error occurred",
    "timestamp": "2025-07-06T19:30:00.000Z"
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `validation_failed` | 400 | Request body validation failed |
| `invalid_json` | 400 | Request body is not valid JSON |
| `missing_body` | 400 | Request body is required |
| `duplicate_detected` | 409 | Toilet too close to existing location |
| `rate_limited` | 429 | Too many submissions from IP |
| `server_error` | 500 | Internal server error |

## Rate Limiting

- **Limit:** 5 submissions per hour per IP address
- **Window:** Rolling 1-hour window
- **Headers:** Rate limit status returned in response headers
- **IP Detection:** Uses `X-Forwarded-For` header, falls back to `127.0.0.1`

## Validation Rules

### Tier-Based Validation System

The API uses a 4-tier validation system based on property importance and frequency:

#### Core Properties (Tier 1)
**v1 behavior**: Auto-filled with defaults if missing  
**v2 behavior**: Required - returns 400 error if missing

- `lat`: Number between -90 and 90 (always required in both versions)
- `lng`: Number between -180 and 180 (always required in both versions)
- `@id`: OpenStreetMap element identifier
- `amenity`: Always "toilets"
- `wheelchair`: Accessibility status ("yes", "no", "limited")
- `access`: Public access level ("yes", "private", "customers")
- `opening_hours`: Operating hours in OSM format
- `fee`: Boolean indicating if there's a charge

#### High-Frequency Properties (Tier 2)  
**Both versions**: Strictly validated when provided, optional

- `name`: Location name/description
- `male`, `female`, `unisex`: Gender-specific facilities
- `changing_table`: Baby changing facilities
- `building`: Building type
- `level`: Floor level
- `toilets:disposal`: Disposal method
- `toilets:wheelchair`: Wheelchair-specific facilities
- `payment:contactless`: Contactless payment support

#### Optional Properties (Tier 3)
**Both versions**: Lenient validation with type coercion

- `operator`: Facility operator
- `check_date`: Last verification date
- `toilets:handwashing`: Handwashing facilities
- `source`: Data source
- `description`: Additional details
- `entrance`: Entrance type

#### Specialized Properties (Tier 4)
**Both versions**: Basic type checking, warnings only

- 99 additional OSM properties for edge cases
- Address fields (`addr:street`, `addr:city`, etc.)
- Payment methods (`payment:cash`, `payment:visa`, etc.)
- Building details (`roof:shape`, `building:levels`, etc.)
- Custom fields and notes

### Duplicate Detection
- Suggestions within 50 meters of existing toilets are rejected
- Distance calculated using Haversine formula
- Checks against `data/toilets.geojson` dataset (1,042 London toilet locations)

## Data Source

**Current Dataset:** `data/toilets.geojson`
- **Source:** OpenStreetMap (www.openstreetmap.org) via Overpass API
- **License:** Open Database License (ODbL)
- **Last Updated:** 2025-07-04T13:59:43Z
- **Feature Count:** 1,042 public toilet locations across London
- **Coverage:** Greater London area with focus on central boroughs
- **Data Fields:** amenity=toilets with properties like fee, accessibility, opening hours

**Original Source:** `docs/export.geojson` (exported from overpass-turbo)

**Sample Feature Structure:**
```json
{
  "type": "Feature",
  "properties": {
    "@id": "way/27186039",
    "access": "yes",
    "amenity": "toilets",
    "building": "yes",
    "changing_table": "yes",
    "charge": "£0.20",
    "fee": "yes",
    "payment:cash": "no",
    "payment:contactless": "yes",
    "wheelchair": "yes",
    "@geometry": "center"
  },
  "geometry": {
    "type": "Point",
    "coordinates": [-0.1756836, 51.5113555]
  },
  "id": "way/27186039"
}
```

**Common OSM Properties:**
- `@id`: OpenStreetMap element ID (node/way/relation)
- `amenity`: Always "toilets"
- `access`: Public accessibility ("yes", "customers", etc.)
- `fee`: Whether there's a charge ("yes", "no")
- `charge`: Specific fee amount (e.g., "£0.20")
- `wheelchair`: Wheelchair accessibility ("yes", "no", "limited")
- `changing_table`: Baby changing facilities ("yes", "no")
- `opening_hours`: Operating hours (various formats)
- `payment:cash`, `payment:contactless`: Payment methods accepted
- `building`: Whether it's a standalone building ("yes", "no")
- `@geometry`: How coordinates were derived ("center", "entrance")

## Implementation Details

- **Services:** [ValidationService](../../src/services/validationService.ts), [DuplicateService](../../src/services/duplicateService.ts), [RateLimitService](../../src/services/rateLimitService.ts), [SuggestionLogService](../../src/services/suggestionLogService.ts)
- **Logging:** All submissions logged to `logs/suggestions.log`
- **Data Source:** Real OpenStreetMap data (1,042 locations)
- **Coordinates:** WGS84 (standard lat/lng)
- **Update Frequency:** Manual updates via ingest-agent
- **Related Documentation:**
  - [CLAUDE.md](../../CLAUDE.md#suggest-agent-schema-v2) - Project overview with v2 schema summary
  - [Debugging Guide](../../howto/debug-suggest-agent.md) - Troubleshooting suggest API issues
  - [Testing Guide](../../howto/test-api-endpoints.md) - API testing methods
  - [Tiered Validation Recipe](../cookbook/recipe_tiered_validation.md#using-v2-strict-validation) - Implementation details for v2 validation
  - [ADR-003](../adr/ADR-003-core-property-validation.md) - Core property validation strategy decision

## Backward Compatibility

### Schema Versioning

The Suggest API maintains backward compatibility through progressive enhancement:

- **v1 Schema (Current)**: The 9-property API documented in the simplified body schema above remains fully functional
- **v2 Schema (Extended)**: Supports all 120 OpenStreetMap properties documented below
- **Migration Path**: Existing integrations continue working with v1 properties while new features leverage v2 capabilities

### Version Selection
- No version header required - API accepts both v1 and v2 properties
- Unknown properties are validated but stored for future compatibility
- Response format remains consistent across versions

## Data Type Conversion Patterns

### OSM to API Mapping

OpenStreetMap uses specific conventions that differ from typical JSON APIs:

#### Boolean Conversions
- **OSM Format**: String values "yes", "no", "limited", "only"
- **API Format**: Boolean `true`/`false`
- **Conversion**: 
  - "yes", "designated" → `true`
  - "no", "none" → `false`
  - Other values preserved as strings for context

#### Monetary Values
- **OSM Format**: Various formats like "£0.20", "50p", "0.20 GBP", "free"
- **API Format**: Numeric value in GBP
- **Conversion**: Parse and normalize to decimal (e.g., 0.20, 0.50, 0.00)

#### Enum Fields
- **OSM Format**: Standardized string values
- **API Format**: Validated enum strings
- **Common Enums**:
  - `access`: "yes", "private", "customers", "permissive", "no"
  - `toilets:disposal`: "flush", "bucket", "chemical", "dry_toilet"
  - `wheelchair`: "yes", "no", "limited", "designated"

#### Time/Date Fields
- **OSM Format**: ISO dates, opening_hours syntax
- **API Format**: Preserved as strings
- **Examples**: 
  - Date: "2021-09-11"
  - Hours: "Mo-Su 07:30-16:30", "24/7"

## OpenStreetMap Properties

### Property Table

Total unique properties: 120 (from 1,042 analyzed features)

| Property | Category | Type | Count | Examples | Enum Values | Conversion Notes |
|----------|----------|------|-------|----------|-------------|------------------|
| `@id` | core | string | 1042 | way/5028979, node/20849686 |  |  |
| `amenity` | core | enum | 1042 | toilets | toilets |  |
| `fee` | high_frequency | monetary | 528 | no, yes | no, yes, 50p, 30p, £0.20 | Normalize to £X.XX format |
| `wheelchair` | high_frequency | boolean (OSM: yes/no) | 467 | designated, yes | designated, yes, limited, no, only | OSM "yes"/"no" → boolean true/false |
| `access` | high_frequency | enum | 422 | yes, private | yes, private, permissive, no, customers, permit, passengers, fee, unknown |  |
| `@geometry` | optional | enum | 231 | center | center |  |
| `female` | high_frequency | boolean (OSM: yes/no) | 227 | yes, no | yes, no, only | OSM "yes"/"no" → boolean true/false |
| `male` | high_frequency | boolean (OSM: yes/no) | 219 | yes, no | yes, no | OSM "yes"/"no" → boolean true/false |
| `changing_table` | high_frequency | boolean (OSM: yes/no) | 201 | yes, no | yes, no, limited | OSM "yes"/"no" → boolean true/false |
| `building` | high_frequency | enum | 188 | yes, toilets | yes, toilets, pavilion, civic |  |
| `level` | high_frequency | string | 186 | 0, 1 |  |  |
| `check_date` | optional | string | 182 | 2021-09-11, 2025-01-09 |  |  |
| `toilets:disposal` | high_frequency | enum | 175 | flush, bucket | flush, bucket, chemical, dry_toilet |  |
| `unisex` | high_frequency | boolean (OSM: yes/no) | 118 | yes, no | yes, no | OSM "yes"/"no" → boolean true/false |
| `opening_hours` | high_frequency | string | 98 | Mo-Su 07:30-00:30, Mo-Su 07:30-16:30 |  | OSM opening_hours format |
| `operator` | optional | string | 79 | City of Westminster, Essex County Council |  |  |
| `toilets:handwashing` | optional | boolean (OSM: yes/no) | 77 | yes, no | yes, no | OSM "yes"/"no" → boolean true/false |
| `name` | high_frequency | string | 69 | Queensway, Peckham Rye Park |  |  |
| `source` | optional | string | 53 | survey;OS, survey;Bing |  |  |
| `toilets:position` | optional | enum | 50 | seated;urinal, seated | seated;urinal, seated, urinal;seated, urinal |  |
| `description` | specialized | string | 32 | Call the phone number for assistance, Several blocks of portakabin toilets, on platform 18, but with no barrier between them and concourse. |  |  |
| `charge` | specialized | monetary | 29 | £0.20, 0.20 GBP |  | Normalize to £X.XX format |
| `building:levels` | specialized | enum | 27 | 1 | 1 |  |
| `toilets:wheelchair` | high_frequency | boolean (OSM: yes/no) | 23 | no, yes | no, yes | OSM "yes"/"no" → boolean true/false |
| `note` | specialized | string | 22 | Fee is 20 pence using contactless payments only, Wheelchair users must ring bell |  |  |
| `indoor` | specialized | enum | 18 | room, yes | room, yes |  |
| `roof:shape` | specialized | enum | 16 | hipped, round | hipped, round, gabled, flat, pyramidal |  |
| `layer` | specialized | enum | 15 | 1, -1 | 1, -1, 0 |  |
| `payment:cash` | specialized | enum | 13 | no, yes | no, yes, only | Payment method boolean |
| `survey:date` | specialized | enum | 13 | 2021-05-02, 2014-06-01 | 2021-05-02, 2014-06-01, 2024-11-03, 2021-10-22, 2017-06-08, 2022-07-03, 2024-11-02 |  |
| `created_by` | specialized | enum | 10 | JOSM, Potlatch 0.6a | JOSM, Potlatch 0.6a, Potlatch 0.4c, Potlatch 0.9b, Potlatch 0.10, Potlatch 0.10b |  |
| `payment:contactless` | specialized | enum | 10 | yes, only | yes, only | Payment method boolean |
| `toilets:paper_supplied` | specialized | enum | 10 | yes | yes |  |
| `payment:credit_cards` | specialized | enum | 10 | yes, only | yes, only, no | Payment method boolean |
| `disabled` | specialized | string | 9 | yes, designated | yes, designated |  |
| `addr:street` | specialized | string | 9 | The Mall, Wallis Road |  |  |
| `wheelchair:description` | specialized | string | 9 | Combined accessible toilet and baby change, limited space. Staff available to open with Radar key during peak periods., Poor design. Approach & entry is difficult, due to loose gravel & 1 step.  Locking the door via a tiny handle is hard! Bad contrast makes it difficult for visually impaired people to navigate or operate "automatic" features such as water, soap & dryer. |  |  |
| `supervised` | specialized | string | 9 | no, yes | no, yes, interval |  |
| `addr:city` | specialized | string | 8 | London, Croydon | London, Croydon |  |
| `addr:housename` | specialized | string | 7 | Osterley Park, London Waterloo Station | Osterley Park, London Waterloo Station, Boxpark Croydon |  |
| `location` | specialized | string | 7 | underground, entrance | underground, entrance, upstairs, outdoor |  |
| `drinking_water` | specialized | string | 7 | yes, no | yes, no |  |
| `entrance` | specialized | string | 6 | yes, staircase | yes, staircase |  |
| `addr:postcode` | specialized | string | 6 | W8 5SA, N16 0LH | W8 5SA, N16 0LH, NW1 2JS, TW7 4RB, SE1 8XX, CR0 1RN |  |
| `changing_table:fee` | specialized | string | 6 | no | no |  |
| `ref` | specialized | string | 6 | 126, 0124 | 126, 0124, 0120, 0123, 0122, 0027 |  |
| `payment:debit_cards` | specialized | string | 5 | only, yes | only, yes |  |
| `baby_changing` | specialized | boolean (OSM: yes/no) | 5 | yes | yes | OSM "yes"/"no" → boolean true/false |
| `created_by:ref` | specialized | string | 5 | 1, 0000000000 | 1, 0000000000 |  |
| `changing_table:location` | specialized | string | 4 | wheelchair_toilet, dedicated_room | wheelchair_toilet, dedicated_room, toilets |  |
| `addr:housenumber` | specialized | string | 4 | 11-15 | 11-15 |  |
| `toilets:seats` | specialized | string | 4 | 4, 2 | 4, 2, 3, 1 |  |
| `source:ref` | specialized | string | 4 | https://www.bfn.org.uk/bfn-bfz-award-venues/#london | https://www.bfn.org.uk/bfn-bfz-award-venues/#london |  |
| `created_by:version` | specialized | string | 4 | 0.6a, 0.5 | 0.6a, 0.5, 0.4c, 0.9b |  |
| `radar_key` | specialized | string | 4 | yes | yes |  |
| `payment:coins` | specialized | string | 3 | yes, no | yes, no |  |
| `roof:colour` | specialized | string | 3 | grey, red | grey, red |  |
| `payment:mastercard` | specialized | string | 3 | yes | yes | Payment method boolean |
| `emergency` | specialized | string | 3 | yes | yes |  |
| `payment:visa` | specialized | string | 3 | yes | yes | Payment method boolean |
| `centralkey` | specialized | string | 3 | yes | yes |  |
| `addr:country` | specialized | string | 3 | GB | GB |  |
| `image` | specialized | string | 3 | https://commons.wikimedia.org/wiki/File:Inside_a_public_toilet_in_a_park_-_geograph.org.uk_-_6094765.jpg, https://s0.geograph.org.uk/geophotos/06/09/47/6094765_fe088b77.jpg | https://commons.wikimedia.org/wiki/File:Inside_a_public_toilet_in_a_park_-_geograph.org.uk_-_6094765.jpg, https://s0.geograph.org.uk/geophotos/06/09/47/6094765_fe088b77.jpg, https://s0.geograph.org.uk/geophotos/06/13/17/6131755_e8b6cfcc.jpg |  |
| `network` | specialized | string | 3 | Community Toilet Scheme | Community Toilet Scheme |  |
| `locked` | specialized | string | 3 | yes | yes |  |
| `opening_hours:covid19` | specialized | string | 2 | restricted | restricted |  |
| `changing_table:count` | specialized | string | 2 | 2 | 2 |  |
| `height` | specialized | string | 2 | 5, 2.7 | 5, 2.7 |  |
| `ref:GB:uprn` | specialized | string | 2 | 200002847648 | 200002847648 |  |
| `payment:amex` | specialized | string | 2 | yes | yes | Payment method boolean |
| `shop` | specialized | string | 2 | yes | yes |  |
| `building:material` | specialized | string | 2 | metal | metal |  |
| `wikimedia_commons` | specialized | string | 2 | File:Public conveniences, Oxford Street - geograph.org.uk - 2252712.jpg, Category:Public toilets near St Dunstan-in-the-East | File:Public conveniences, Oxford Street - geograph.org.uk - 2252712.jpg, Category:Public toilets near St Dunstan-in-the-East |  |
| `not:changing_table` | specialized | string | 2 | yes | yes |  |
| `railway` | specialized | string | 2 | station | station |  |
| `toilets:access` | specialized | string | 2 | key | key |  |
| `colour` | specialized | string | 2 | black | black |  |
| `wikipedia` | specialized | string | 2 | en:Sanisette | en:Sanisette |  |
| `gender` | specialized | string | 2 | segregated | segregated |  |
| `floor:material` | specialized | string | 2 | linoleum, asphalt | linoleum, asphalt |  |
| `urinal` | specialized | string | 2 | yes | yes |  |
| `addr:suburb` | specialized | string | 2 | Holland Park, West Brompton | Holland Park, West Brompton |  |
| `fixme` | specialized | string | 2 | likely inaccurate placement | likely inaccurate placement |  |
| `changing_table:description` | specialized | string | 1 | Accessed via Breastfeeding Welcome scheme | Accessed via Breastfeeding Welcome scheme |  |
| `min_age` | specialized | string | 1 | 5 | 5 |  |
| `denomination` | specialized | string | 1 | roman_catholic | roman_catholic |  |
| `addr:state` | specialized | string | 1 | England | England |  |
| `bus` | specialized | string | 1 | no | no |  |
| `designation` | specialized | string | 1 | Townfield | Townfield |  |
| `women` | specialized | string | 1 | yes | yes |  |
| `wikidata` | specialized | string | 1 | Q7232327 | Q7232327 |  |
| `brand:wikidata` | specialized | string | 1 | Q106626818 | Q106626818 |  |
| `name:en` | specialized | string | 1 | Ruislip | Ruislip |  |
| `payment:notes` | specialized | string | 1 | GBP 0.2 | GBP 0.2 | Payment method boolean |
| `support` | specialized | string | 1 | pole | pole |  |
| `shower` | specialized | string | 1 | no | no |  |
| `disused` | specialized | string | 1 | yes | yes |  |
| `is_in` | specialized | string | 1 | St James | St James |  |
| `note:name` | specialized | string | 1 | this has a name on the sign | this has a name on the sign |  |
| `ref:streetnix:date` | specialized | string | 1 | 20071220 | 20071220 |  |
| `addr:place` | specialized | string | 1 | Regent's Park | Regent's Park |  |
| `phone` | specialized | string | 1 | +44 20 7974 8921 | +44 20 7974 8921 |  |
| `name:signed` | specialized | string | 1 | no | no |  |
| `capacity:women` | specialized | string | 1 | 4 | 4 |  |
| `contact:phone` | specialized | string | 1 | +44 20 8359 2000 | +44 20 8359 2000 |  |
| `toilets` | specialized | string | 1 | yes | yes |  |
| `religion` | specialized | string | 1 | christian | christian |  |
| `fee:conditional` | specialized | string | 1 | no@(event day) | no@(event day) |  |
| `changing_table:adult` | specialized | string | 1 | yes | yes |  |
| `fee:note` | specialized | string | 1 | The event day urinals are free. | The event day urinals are free. |  |
| `bottle` | specialized | string | 1 | yes | yes |  |
| `man_made` | specialized | string | 1 | water_tap | water_tap |  |
| `seasonal` | specialized | string | 1 | no | no |  |
| `toilets:supervised` | specialized | string | 1 | no | no |  |
| `child` | specialized | string | 1 | only | only |  |
| `opening_hours:signed` | specialized | string | 1 | no | no |  |
| `composting` | specialized | string | 1 | yes | yes |  |
| `outdoor_seating` | specialized | string | 1 | no | no |  |
| `payment:visa_debit` | specialized | string | 1 | yes | yes | Payment method boolean |
| `men` | specialized | string | 1 | yes | yes |  |

### Property Categories Summary
- **core**: 2 properties (always required/present)
- **high_frequency**: 13 properties (common, high-value fields)
- **optional**: 6 properties (useful but less common)
- **specialized**: 99 properties (edge cases, specific scenarios)

## Testing

See `tests/agents/suggest_agent_*.js` for comprehensive test coverage including:
- Validation scenarios
- Duplicate detection
- Rate limiting
- Error handling
- Response format validation