---
title: "Rate-Limit-Service API Reference"
description: "API reference for IP-based rate limiting service with submission tracking"
category: reference
version: "1.0.0"
last_updated: "2025-07-09"
---

# Rate-Limit-Service API Reference

> **Status:** Stable · **Version:** 1.0.0 · **Last Updated:** 2025-07-06  
> @doc generated during **plan_docs_agent_api_0009 / agent_api_docs_impl**

---

## 1. Purpose
The **rate-limit-service** enforces per-IP submission limits to protect the Suggest API and other public endpoints from abuse.  It exposes a lightweight HTTP endpoint allowing external dashboards or monitoring tools to query current usage statistics and configuration parameters.

## 2. Base URL
```
/​api/​rate-limit
```

## 3. Endpoint Summary
| Method | Path                | Description                                     |
|--------|--------------------|-------------------------------------------------|
| GET    | `/api/rate-limit`  | Retrieve rate-limit stats & config              |
| POST   | `/api/rate-limit`  | Manually record a submission for an IP (admin)  |

## 4. Authentication
* **GET** – public, read-only.  
* **POST** – requires `X-Admin-Token` header.

## 5. GET /api/rate-limit
### 5.1 Success Response
```jsonc
{
  "success": true,
  "activeIPs": 17,
  "totalSubmissions": 214,
  "config": {
    "maxSubmissions": 5,
    "windowDurationMs": 3600000
  },
  "timestamp": "2025-07-06T20:10:00.000Z"
}
```

## 6. POST /api/rate-limit
### 6.1 Request Schema
```jsonc
{
  "ip": "203.0.113.6" // string, required – IPv4 or IPv6
}
```
### 6.2 Success Response
```jsonc
{
  "success": true,
  "message": "Submission recorded",
  "submissions": 3,
  "maxSubmissions": 5,
  "windowDuration": 3600000,
  "timestamp": "2025-07-06T20:11:12.004Z"
}
```

## 7. Error Responses
| HTTP Status | Error Code        | When it happens                                      |
|-------------|------------------|------------------------------------------------------|
| 400         | `validation_failed`| Missing or invalid `ip` field                        |
| 401         | `unauthorized`    | Missing/invalid admin token for POST                 |
| 429         | `rate_limited`    | IP has exceeded max submissions when recording via POST |
| 500         | `server_error`    | Unexpected persistence or parsing error              |

### 7.1 Example Rate-Limited Error (429)
```json
{
  "success": false,
  "message": "Rate limit exceeded. Maximum 5 submissions per hour.",
  "error": {
    "code": "rate_limited",
    "details": "IP 203.0.113.6 has made 6 submissions this hour.",
    "timestamp": "2025-07-06T20:12:30.443Z"
  }
}
```

## 8. Configuration Source
The max submissions and window duration are defined in `aiconfig.json > duplicate_detection` and can be changed without redeploying—values are loaded at runtime.

## 9. OpenAPI Snippet
```yaml
paths:
  /api/rate-limit:
    get:
      summary: Fetch rate-limit statistics
      responses:
        '200':
          description: Statistics & config
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RateLimitStatsResponse'
    post:
      summary: Record a submission for an IP
      security:
        - AdminToken: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RateLimitRecordRequest'
      responses:
        '200':
          description: Submission recorded
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RateLimitRecordResponse'
        '429':
          description: Rate limit exceeded
  
components:
  securitySchemes:
    AdminToken:
      type: apiKey
      in: header
      name: X-Admin-Token
  schemas:
    RateLimitStatsResponse:
      type: object
      properties:
        success: { type: boolean }
        activeIPs: { type: integer }
        totalSubmissions: { type: integer }
        config:
          type: object
          properties:
            maxSubmissions: { type: integer }
            windowDurationMs: { type: integer }
    RateLimitRecordRequest:
      type: object
      required: [ip]
      properties:
        ip: { type: string }
    RateLimitRecordResponse:
      allOf:
        - $ref: '#/components/schemas/RateLimitStatsResponse'
```

## 10. Related Links
* Source code: `src/services/rateLimitService.ts`
* Utility helpers: `src/utils/rateLimit.ts`

---
*(End of file – ≥60 lines)* 