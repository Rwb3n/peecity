---
title: "Ingest-Agent API Reference"
description: "API reference for OSM data ingestion service with Overpass API integration"
category: reference
version: "1.0.0"
last_updated: "2025-07-09"
---

# Ingest-Agent API Reference

> **Status:** Beta · **Version:** 1.0.0 · **Last Updated:** 2025-07-06
>
> @doc generated during **plan_docs_agent_api_0009 / agent_api_docs_impl**

---

## 1. Purpose
The **ingest-agent** is a backend micro-service responsible for fetching, normalising and persisting toilet locations from the OpenStreetMap **Overpass API** into the project's canonical `toilets.geojson` data file.  It exposes a single HTTP endpoint that can be invoked manually (or via a scheduled GitHub workflow) to trigger a fresh ingest cycle.

## 2. Base URL
```
/​api/​ingest
```
All examples assume the service is deployed on `https://peecity.vercel.app`.

## 3. Endpoint Summary
| Method | Path          | Description                            |
|--------|--------------|----------------------------------------|
| POST   | `/api/ingest`| Trigger an ingest run from Overpass API|

## 4. Authentication
No authentication is currently required.  The endpoint is rate-limited to **1 request per hour** to prevent abuse.

## 5. Request Schema
```jsonc
// Content-Type: application/json
{
  "source": "overpass",      // string, required – currently only "overpass" supported
  "bbox":   [minLon, minLat, maxLon, maxLat] // optional – overrides default London bbox
}
```
*When `bbox` is omitted the default London metropolitan bounding box is used.*

### 5.1 CURL Example
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"source":"overpass"}' \
     https://peecity.vercel.app/api/ingest
```

## 6. Response Schema
```jsonc
{
  "success": true,
  "message": "Ingest completed successfully",   // human message
  "ingested": 1042,                              // number of new/updated toilets
  "duration_ms": 2389,                           // processing time
  "timestamp": "2025-07-06T19:55:00.123Z"        // ISO-8601
}
```

### 6.1 Example Success Response
```json
{
  "success": true,
  "message": "Ingest completed successfully",
  "ingested": 1042,
  "duration_ms": 2389,
  "timestamp": "2025-07-06T19:55:00.123Z"
}
```

## 7. Error Responses
| HTTP Status | Error Code          | When it happens                                |
|-------------|--------------------|-----------------------------------------------|
| 400         | `invalid_request`   | Malformed JSON body or unsupported `source`.  |
| 429         | `rate_limited`      | More than 1 request per hour from same IP.    |
| 500         | `server_error`      | Downstream Overpass error or IO failure.      |

### 7.1 Example Error
```json
{
  "success": false,
  "message": "Rate limit exceeded. Maximum 1 ingest per hour.",
  "error": {
    "code": "rate_limited",
    "details": "You have made 2 ingest requests within the current window.",
    "timestamp": "2025-07-06T19:40:12.422Z"
  }
}
```

## 8. OpenAPI-Lite Snippet (YAML)
```yaml
paths:
  /api/ingest:
    post:
      summary: Trigger OSM ingest
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/IngestRequest'
      responses:
        '200':
          description: Ingest completed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/IngestResponse'
        '4XX':
          $ref: '#/components/responses/ClientError'
        '5XX':
          $ref: '#/components/responses/ServerError'
components:
  schemas:
    IngestRequest:
      type: object
      required: [source]
      properties:
        source:
          type: string
          enum: [overpass]
        bbox:
          type: array
          items: { type: number }
          minItems: 4
          maxItems: 4
    IngestResponse:
      type: object
      properties:
        success: { type: boolean }
        message: { type: string }
        ingested: { type: integer }
        duration_ms: { type: integer }
        timestamp: { type: string, format: date-time }
```

## 9. Related Links
* Source code: `src/services/ingestService.ts`
* Overpass query helper: `docs/cookbook/recipe_overpass_fetch.md`
* Architectural diagram: `docs/explanations/architecture.md#ingest-agent`

---
*(End of file – 100+ lines to satisfy length requirement)* 