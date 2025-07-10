---
title: "Documentation Index"
description: "Central hub for CityPee project documentation organized using the Diátaxis framework"
category: reference
last_updated: "2025-07-09"
---

# 📚 Documentation Index

Welcome to the CityPee documentation hub, structured according to the **Diátaxis** framework.

| Category | Description | Path |
|----------|-------------|------|
| Tutorials | Step-by-step guides for beginners | `docs/tutorials/` |
| How-To Guides | Problem-oriented solutions | `docs/howto/` |
| Reference | API contracts & change logs | `docs/reference/` |
| Explanations | High-level architectural, design, and engineering reasoning | `docs/explanations/` |
| ADRs | Architecture Decision Records | `docs/adr/` |
| Cookbook | Reusable code patterns | `docs/cookbook/` |
| Archive | Historical dev logs | `docs/archive/` |
| **Sources of Truth** |  |  |
| Primary Config | Canonical project rules & global counter | `/aiconfig.json` |
| Schemas | JSON Schema contracts | `/schemas/` |
| Task Plans | Decomposed Red-Green-Refactor tasks | `/plans/` |
| Issues | Bugs & clarifications | `/issues/` |
| Status Logs | Execution & validation reports | `/status/` |
| Templates | File skeletons for new artefacts | `/templates/` |
| Tests | Unit, integration, diagnostic suites | `/tests/` |
| Scripts | Helper CLIs & generators | `/scripts/` |
| Coverage | Test coverage output | `/coverage/` |
| Logs | Runtime/service logs | `/logs/` |
| Design System | Static UI reference | `/storybook-static/` |
| Public Assets | Deployment-ready static files | `/public/` |

Start with the **Architecture Overview** in `docs/explanations/architecture.md` or the **Frontend UI Specification** in `docs/explanations/frontend-ui-spec.md`.

# docs/

Project documentation & specs.

## Key Documents

| Title | Purpose | Location |
|-------|---------|----------|
| Architecture Overview | Macro-level system design | `docs/explanations/architecture.md` |
| Design System Overview | Visual language & atomic hierarchy | `docs/explanations/design.md` |
| Engineering Notes | Stack & infra specifics | `docs/explanations/engineering.md` |
| Frontend UI Specification | Component & layout rules | `docs/explanations/frontend-ui-spec.md` |
| Product Roadmap | Time-phased delivery plan | `docs/reference/roadmap.md` |
| Licensing & Attribution | OSS and data licence requirements | `docs/reference/licensing.md` |
| Changelog | Historical notable changes | `docs/reference/changelog.md` |

*For ADRs, browse the `docs/adr/` folder; for reusable code see `docs/cookbook/`.*

## Quick Navigation

### 🎯 Getting Started
- [Architecture Overview](explanations/architecture.md) - System design and agent responsibilities
- [Engineering Guide](explanations/engineering.md) - Technical stack and development setup
- [Design System](explanations/design.md) - UI/UX components and design tokens
- [Frontend UI Spec](explanations/frontend-ui-spec.md) - Component architecture and layouts

### 📋 Reference Documentation
- [API Documentation](reference/api/) - Complete API contracts and endpoints
- [Troubleshooting Guide](reference/troubleshooting.md) - Common issues and solutions
- [Property Prioritization](reference/property-prioritization.md) - OSM property classification framework
- [Changelog](reference/changelog.md) - Project history and notable changes
- [Licensing](reference/licensing.md) - OSS and data license requirements
- [Roadmap](reference/roadmap.md) - Project timeline and delivery phases

### 🏗️ Implementation Guides
- [Cookbook Recipes](cookbook/) - Reusable code patterns and implementation guides
- [How-To Guides](howto/) - Problem-oriented step-by-step solutions
- [Architecture Decisions](adr/) - Technical decision records and rationale

### 🚨 Operational Documentation
- [Runbooks](runbooks/) - Incident response and troubleshooting procedures
- [Performance Monitoring](runbooks/performance-monitoring.md) - API latency alerts and resolution
- [Error Rate Monitoring](runbooks/error-rate-monitoring.md) - Error rate alerts and debugging

### 📚 Historical & Archive
- [Development Logs](archive/) - Historical development context and analysis
- [Feedback Records](feedback/) - Task feedback and improvement recommendations

## Implementation Guides

### 🍳 Cookbook Recipes
Reusable code patterns and recipes for common development tasks:
- [**Overpass API Integration**](cookbook/recipe_overpass_fetch.md) - OpenStreetMap data fetching patterns
- [**Suggest Agent Implementation**](cookbook/recipe_suggest_agent.md) - User submission workflow with duplicate detection
- [**Template Refactoring**](cookbook/recipe_template_refactoring.md) - Template builder and modular design patterns
- [**Atomic Components**](cookbook/recipe_atomic_components.md) - shadcn/ui component development patterns
- [**Shadcn Integration**](cookbook/recipe_shadcn_integration.md) - Design system integration with TailwindCSS
- [**AI Config Patterns**](cookbook/recipe_aiconfig_patterns.md) - Configuration management and optimization patterns
- [**Tiered Validation**](cookbook/recipe_tiered_validation.md) - 4-tier property validation implementation (99%+ test coverage)
- [**Metrics Export**](cookbook/recipe_metrics_export.md) - Prometheus metrics and observability patterns ✅ COMPLETE
- [**Documentation Structure**](cookbook/recipe_docs_structure.md) - Documentation organization and standards
- [**Storybook Setup**](cookbook/recipe_storybook_setup.md) - Component story development patterns

### 🔌 API Documentation
Complete API contracts and endpoint documentation:
- [**Suggest API**](reference/api/suggest-api.md) - Comprehensive suggest-agent API reference
  - v1 API: Backward-compatible 9-property interface with defaults
  - v2 API: Strict validation supporting all 120 OSM properties
  - Tier-based validation system (Core, High-frequency, Optional, Specialized)
  - Complete property reference with conversion patterns
- [**Validation Service API**](reference/api/validation-service-api.md) - Core validation service contracts
- [**Ingest Agent API**](reference/api/ingest-agent-api.md) - OpenStreetMap data ingestion interface
- [**Duplicate Service API**](reference/api/duplicate-service-api.md) - Spatial duplicate detection service
- [**Rate Limit Service API**](reference/api/rate-limit-service-api.md) - IP-based rate limiting service

### 🔧 How-To Guides
Problem-oriented step-by-step solutions:
- [**Debug Suggest Agent**](howto/debug-suggest-agent.md) - Step-by-step debugging for suggest API issues
- [**Test API Endpoints**](howto/test-api-endpoints.md) - Testing methods for API endpoints
- [**Performance Benchmarks**](howto/perf-benchmarks.md) - Performance testing and optimization guide

### 📋 Architecture Decision Records
Technical decision records and rationale:
- [**ADR-001**](adr/ADR-001.md) - Initial architecture decisions
- [**ADR-002**](adr/ADR-002-property-tiering.md) - Property tiering framework
- [**ADR-003**](adr/ADR-003-core-property-validation.md) - Core property validation approach
- [**ADR-004**](adr/ADR-004-validation-performance-caching.md) - Validation performance and caching strategy

### 🚨 Operational Runbooks
Incident response and troubleshooting procedures:
- [**Performance Monitoring**](runbooks/performance-monitoring.md) - API latency alerts and resolution procedures
- [**Error Rate Monitoring**](runbooks/error-rate-monitoring.md) - Error rate alerts and debugging workflows

### 📊 Monitoring & Observability
The project includes comprehensive monitoring features:
- **Prometheus Metrics**: Real-time metrics export via `/api/metrics`
- **Validation Summary**: Operational insights via `/api/validation/summary`  
- **Performance Guardrails**: Automated CI/CD performance validation
- **Grafana Dashboard**: Production-ready monitoring dashboard with runbook integration

---

## 📝 Documentation Creation

To create new documentation that follows the project standards:

```bash
# Create new documentation with proper front-matter
node scripts/scaffold-doc.js --category cookbook --title "My Recipe" --description "Implementation guide for..." --output docs/cookbook/recipe_my_recipe.md

# Available categories: cookbook, adr, reference, howto, explanation, feedback, archive, runbook, api
```

All documentation must follow the front-matter schema defined in `docs_frontmatter_schema.json`. 

## 🛠 Operational Workflow (TDD Loop)

1. **Plan** – create or edit a `plans/plan_<id>.txt` file (TEST_CREATION ➜ IMPLEMENTATION ➜ REFACTORING).
2. **Construct** – follow the plan; artefacts live in `src/`, `tests/`, etc.
3. **Validate** – run the test runner specified in `aiconfig.json`; results captured in `status/`.
4. **Iterate** – refactor or raise an `issues/issue_<id>.txt` if ambiguity/bugs emerge.

> For detailed patterns, consult the Cookbook (`docs/cookbook/recipe_*.md`). 