---
title: "Validation-Service API Reference"
description: "API reference for schema validation and sanitization service for user submissions"
category: reference
version: "1.0.0"
last_updated: "2025-07-09"
---

# Validation-Service API Reference

> **Status:** Stable · **Version:** 1.0.0 · **Last Updated:** 2025-07-06  
> @doc generated during **plan_docs_agent_api_0009 / agent_api_docs_impl**

---

## 1. Purpose
The **validation-service** centralises all schema checking and sanitisation logic for user-submitted toilet suggestions.  It ensures incoming data meets field-type expectations, range limits, and optional formatting constraints before any further processing (duplicate detection, logging, etc.).

For integration tests and possible future front-end form validation, the service offers a stateless HTTP endpoint that mirrors the same validation pipeline used by the backend.

## 2. Base URL
```
/​api/​validate-suggestion
```

## 3. Endpoint Summary
| Method | Path                       | Description                     |
|--------|---------------------------|---------------------------------|
| POST   | `/api/validate-suggestion`| Validate a suggestion payload   |

## 4. Request Schema
```jsonc
// Content-Type: application/json
{
  "lat": 51.5100,             // number, required
  "lng": -0.1300,             // number, required
  "name": "Example Toilet",   // string, optional
  "hours": "9:00-17:00",     // string, optional
  "accessible": true,         // boolean, optional
  "fee": 0,                   // number, optional
  "description": "notes",     // string, optional
  "submitter_email": "me@example.com" // string, optional
}
```

### 4.1 CURL Example
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"lat":51.51,"lng":-0.13,"name":"Example"}' \
     https://peecity.vercel.app/api/validate-suggestion
```

## 5. Response Schema
```jsonc
{
  "success": true,
  "sanitizedData": {
    "lat": 51.51,
    "lng": -0.13,
    "name": "Example",
    "fee": 0
  },
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": []
  },
  "timestamp": "2025-07-06T20:15:00.000Z"
}
```

## 6. Error Response Example (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "validation_failed",
    "details": "lat: Latitude must be between -90 and 90 degrees; lng: Longitude must be between -180 and 180 degrees",
    "timestamp": "2025-07-06T20:15:44.321Z"
  },
  "validation": {
    "isValid": false,
    "errors": [
      {"field":"lat","message":"Latitude must be between -90 and 90 degrees","code":"out_of_range"},
      {"field":"lng","message":"Longitude must be between -180 and 180 degrees","code":"out_of_range"}
    ],
    "warnings": []
  }
}
```

## 7. Validation Rules Snapshot
| Field | Rule | Error Code |
|-------|------|-----------|
| lat   | number • -90 ≤ lat ≤ 90 | `out_of_range` |
| lng   | number • -180 ≤ lng ≤ 180 | `out_of_range` |
| name  | string ≤ 255 chars | `invalid_format` |
| hours | string ≤ 100 chars | `invalid_format` |
| fee   | number ≥ 0 | `invalid_format` |

*(See `src/utils/validation.ts` for full implementation.)*

## 8. OpenAPI Snippet
```yaml
paths:
  /api/validate-suggestion:
    post:
      summary: Validate suggestion payload
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SuggestionInput'
      responses:
        '200':
          description: Validation result (success or fail)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationResponse'
components:
  schemas:
    SuggestionInput:
      $ref: 'schemas/suggestion.schema.json#/Suggestion'
    ValidationResponse:
      type: object
      properties:
        success: { type: boolean }
        sanitizedData: { type: object }
        validation: { $ref: '#/components/schemas/ValidationObject' }
        timestamp: { type: string, format: date-time }
    ValidationObject:
      type: object
      properties:
        isValid: { type: boolean }
        errors:
          type: array
          items: { $ref: '#/components/schemas/ValidationError' }
        warnings:
          type: array
          items: { $ref: '#/components/schemas/ValidationWarning' }
    ValidationError:
      type: object
      properties:
        field: { type: string }
        message: { type: string }
        code: { type: string }
    ValidationWarning:
      allOf:
        - $ref: '#/components/schemas/ValidationError'
```

## 9. Related Links
* Source code: `src/services/validationService.ts`
* Validation utilities: `src/utils/validation.ts`
* Suggest API route: `src/app/api/suggest/route.ts`

---
*(End of file – ≥60 lines)* 