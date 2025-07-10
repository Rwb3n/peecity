---
title: "Documentation Front-matter Examples"
description: "Examples of valid and invalid front-matter structures for CityPee documentation standardization"
category: "reference"
last_updated: "2025-07-08"
tags: ["documentation", "front-matter", "validation", "examples"]
version: "1.0.0"
author: "Development Team"
status: "published"
audience: "developers"
---

# Documentation Front-matter Examples

**@artifact**: docs/engineering-spec.md#documentation-standards
**@task**: docs_frontmatter_schema
**@tdd-phase**: IMPLEMENTATION
**@pattern-type**: Documentation Standards
**@complexity**: Intermediate
**@audience**: AI agents, developers

## Overview

This document provides comprehensive examples of valid and invalid front-matter structures based on the unified schema defined in `docs_frontmatter_schema.json`. These examples guide implementation of the documentation standardization system.

## Valid Front-matter Examples

### 1. Cookbook Recipe (Complete)
```yaml
---
title: "Overpass API Data Fetching Recipe"
description: "Comprehensive guide for fetching toilet data from OpenStreetMap using the Overpass API with error handling and caching"
category: "cookbook"
last_updated: "2025-07-08"
tags: ["overpass", "api", "data-fetching", "osm"]
version: "2.1.0"
author: "Development Team"
status: "published"
audience: "developers"
complexity: "intermediate"
dependencies: ["Node.js", "axios", "typescript"]
related_files: ["docs/reference/api/overpass-api.md"]
---
```

### 2. ADR (Architecture Decision Record)
```yaml
---
title: "ADR-005: Prometheus Native Histograms Adoption"
description: "Decision to adopt Prometheus native histograms for improved performance monitoring and reduced cardinality"
category: "adr"
last_updated: "2025-07-08"
tags: ["prometheus", "metrics", "architecture", "performance"]
version: "1.0.0"
author: "Architecture Team"
status: "approved"
audience: "developers"
---
```

### 3. API Reference (Minimal Required Fields)
```yaml
---
title: "Validation Service API"
description: "REST API endpoints for toilet suggestion validation with schema checking and error handling"
category: "reference"
last_updated: "2025-07-08"
---
```

### 4. Runbook (Operational Guide)
```yaml
---
title: "Performance Monitoring Runbook"
description: "Step-by-step procedures for monitoring, diagnosing, and resolving performance issues in the validation service"
category: "runbook"
last_updated: "2025-07-08"
tags: ["monitoring", "performance", "troubleshooting", "prometheus"]
author: "Operations Team"
status: "published"
audience: "maintainers"
complexity: "advanced"
---
```

## Invalid Front-matter Examples

### 1. Missing Required Fields
```yaml
---
title: "Incomplete Document"
description: "This example is missing required fields"
# Missing: category, last_updated
tags: ["example"]
---
```
**Error**: Missing required properties `category` and `last_updated`

### 2. Invalid Category
```yaml
---
title: "Invalid Category Example"
description: "This example uses an invalid category value"
category: "invalid-category"
last_updated: "2025-07-08"
---
```
**Error**: `category` must be one of: cookbook, adr, reference, howto, explanation, feedback, archive, runbook, api

### 3. Invalid Date Format
```yaml
---
title: "Invalid Date Format"
description: "This example has an incorrectly formatted date"
category: "reference"
last_updated: "2025-07-08"
---
```
**Error**: `last_updated` must be in ISO 8601 date format (YYYY-MM-DD)

### 4. Invalid Version Format
```yaml
---
title: "Invalid Version Format"
description: "This example has an incorrectly formatted version"
category: "cookbook"
last_updated: "2025-07-08"
version: "v1.0.0-beta"
---
```
**Error**: `version` must match semantic versioning pattern (e.g., "1.0.0", "2.1", "3")

### 5. String Too Long
```yaml
---
title: "This is an extremely long title that exceeds the maximum allowed length of 100 characters and should fail validation"
description: "Valid description"
category: "reference"
last_updated: "2025-07-08"
---
```
**Error**: `title` must be maximum 100 characters

### 6. Invalid Status
```yaml
---
title: "Invalid Status Example"
description: "This example uses an invalid status value"
category: "cookbook"
last_updated: "2025-07-08"
status: "in-progress"
---
```
**Error**: `status` must be one of: draft, review, approved, published, deprecated, archived

### 7. Invalid Complexity
```yaml
---
title: "Invalid Complexity Example"
description: "This example uses an invalid complexity value"
category: "cookbook"
last_updated: "2025-07-08"
complexity: "medium"
---
```
**Error**: `complexity` must be one of: beginner, intermediate, advanced, expert

### 8. Duplicate Tags
```yaml
---
title: "Duplicate Tags Example"
description: "This example has duplicate tags"
category: "cookbook"
last_updated: "2025-07-08"
tags: ["api", "validation", "api"]
---
```
**Error**: `tags` array must contain unique items

## Schema Validation Notes

1. **Required Fields**: All documents MUST include title, description, category, and last_updated
2. **Date Format**: Use ISO 8601 format (YYYY-MM-DD) for last_updated
3. **Category Values**: Must be one of the predefined enum values
4. **Version Format**: Should follow semantic versioning (e.g., "1.0.0", "2.1", "3")
5. **Tags**: Maximum 10 unique tags, each 1-30 characters
6. **Title Length**: Maximum 100 characters
7. **Description Length**: 10-500 characters
8. **Additional Properties**: Not allowed - only defined schema properties permitted

## Migration Strategy

When migrating existing documentation:

1. **Phase 1**: Add minimal required fields (title, description, category, last_updated)
2. **Phase 2**: Add relevant optional fields based on document type
3. **Phase 3**: Standardize existing metadata to match schema format

## Testing Integration

The examples in this document are used by the Jest test suite in `tests/docs/docs_schema_test.js` to validate:
- Schema compliance across all documentation
- Front-matter parsing with gray-matter
- Validation error handling and reporting