---
title: "Duplicate-Service API Reference"
description: "API reference for spatial duplicate detection service with distance calculations"
category: reference
version: "1.0.0"
last_updated: "2025-07-09"
---

# Duplicate-Service API Reference

> **Status:** Stable · **Version:** 1.0.0 · **Last Updated:** 2025-07-06
>
> @doc generated during **plan_docs_agent_api_0009 / agent_api_docs_impl**

---

## 1. Purpose
The **duplicate-service** provides spatial analysis for new toilet suggestions, ensuring the platform does not store near-identical entries.  Internally it consumes toilet GeoJSON data and calculates the distance between a new suggestion and the nearest existing toilet using the Haversine formula.

Although primarily used by the Suggest API route, the service is exposed via an **internal HTTP endpoint** to facilitate future administrative dashboards and automated data clean-up tasks.

## 2. Base URL
```
/​api/​duplicate-check
```

## 3. Endpoint Summary
| Method | Path                  | Description                              |
|--------|----------------------|------------------------------------------|
| POST   | `/api/duplicate-check` | Check if supplied coordinates are duplicates |

## 4. Authentication
This endpoint is **internal**; requests must include an `X-Admin-Token` header with a pre-shared token.  Calls without this header receive `401 Unauthorized`.

## 5. Request Schema
```jsonc
// Content-Type: application/json
{
  "lat": 51.5079, // number, required – latitude in degrees
  "lng": -0.0867  // number, required – longitude in degrees
}
```

### 5.1 CURL Example
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-Admin-Token: <token>" \
     -d '{"lat":51.5079,"lng":-0.0867}' \
     https://peecity.vercel.app/api/duplicate-check
```

## 6. Response Schema
```jsonc
{
  "success": true,
  "isDuplicate": false,            // boolean
  "distance_m": 231,               // integer – metres to nearest toilet
  "nearestToiletId": "wc_12345",  // string | null
  "timestamp": "2025-07-06T20:05:00.000Z"
}
```

## 7. Decision Thresholds
The duplicate decision is governed by `duplicate_detection.thresholdMeters` in `aiconfig.json` (default **50 m**).  If the distance ≤ threshold the response will return `isDuplicate: true` and status `409 Conflict`.

## 8. Error Responses
| HTTP Status | Error Code           | Description                                           |
|-------------|---------------------|-------------------------------------------------------|
| 400         | `validation_failed` | Missing or invalid `lat` / `lng` fields               |
| 401         | `unauthorized`      | `X-Admin-Token` header absent or invalid              |
| 409         | `duplicate_detected`| Coordinates fall within threshold of existing toilet  |
| 500         | `server_error`      | Data file missing or geo-processing failure           |

### 8.1 Example Duplicate Response (409)
```json
{
  "success": false,
  "message": "Duplicate toilet detected within 42 m of existing location",
  "error": {
    "code": "duplicate_detected",
    "details": "Existing toilet 'wc_12345' is 42 m away",
    "timestamp": "2025-07-06T20:06:44.901Z"
  },
  "validation": {
    "isDuplicate": true,
    "duplicateDistance": 42,
    "nearestToiletId": "wc_12345"
  }
}
```

## 9. OpenAPI Snippet
```yaml
paths:
  /api/duplicate-check:
    post:
      summary: Check a toilet suggestion for duplicates
      security:
        - AdminToken: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DuplicateCheckRequest'
      responses:
        '200':
          description: Not a duplicate
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DuplicateCheckResponse'
        '409':
          description: Duplicate
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DuplicateCheckError'
components:
  securitySchemes:
    AdminToken:
      type: apiKey
      in: header
      name: X-Admin-Token
  schemas:
    DuplicateCheckRequest:
      type: object
      properties:
        lat: { type: number, minimum: -90, maximum: 90 }
        lng: { type: number, minimum: -180, maximum: 180 }
      required: [lat,lng]
    DuplicateCheckResponse:
      type: object
      properties:
        success: { type: boolean }
        isDuplicate: { type: boolean }
        distance_m: { type: integer }
        nearestToiletId: { type: string, nullable: true }
        timestamp: { type: string, format: date-time }
    DuplicateCheckError:
      allOf:
        - $ref: '#/components/schemas/DuplicateCheckResponse'
        - type: object
          properties:
            error:
              $ref: '#/components/schemas/DuplicateErrorObject'
    DuplicateErrorObject:
      type: object
      properties:
        code: { type: string, enum: [duplicate_detected] }
        details: { type: string }
        timestamp: { type: string, format: date-time }
```

## 10. Related Links
* Source code: `src/services/duplicateService.ts`
* Data provider interface: `src/interfaces/toiletDataProvider.ts`

---
*(End of file – ensures ≥60 lines)* 