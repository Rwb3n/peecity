# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CityPee is a London public toilet finder web application built with AI-driven orchestration. The project uses OpenStreetMap data to help users locate accessible, 24-hour public toilets across London boroughs.

## Development Methodology

This project follows the **Hybrid_AI_OS** operational framework with strict Test-Driven Development (TDD):

1. **Phases**: ANALYZE → DIAGNOSE → BLUEPRINT → CONSTRUCT → VALIDATE → IDLE
2. **TDD Cycle**: Every feature follows Red-Green-Refactor
3. **Task Types**: TEST_CREATION → IMPLEMENTATION → REFACTORING
4. **Central Config**: `aiconfig.json` is the single source of truth

## Architecture

The system uses 5 AI agents for different responsibilities:
- `ingest-agent`: Fetches and normalizes OSM toilet data
- `suggest-agent`: Validates user submissions
- `seo-agent`: Generates static borough pages
- `deploy-agent`: Handles build and deployment
- `monitor-agent`: Weekly data updates

## Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Node.js 20.x LTS
- **Mapping**: React-Leaflet with clustering
- **Data**: GeoJSON format from OpenStreetMap
- **Testing**: Jest, @testing-library/react, nock, supertest, jsdom, sinon, nodemailer-mock, shelljs
- **Deployment**: Vercel (auto-deploy on push)

## Development Commands

```bash
npm run dev         # Development server
npm run build       # Production build
npm run test        # Run Jest tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint        # Code linting
npm run ingest      # Run ingest agent (fetch OSM data)
```

## Project Management Scripts

```bash
node scripts/generate_status_skeletons.js  # Generate status report templates for all pending tasks
```

## Project Structure

```
/
├── src/           # Next.js application source
│   ├── app/       # Next.js App Router pages
│   ├── components/ # React components
│   ├── lib/       # Utility libraries
│   ├── types/     # TypeScript type definitions
│   └── utils/     # Shared utility functions (overpass.ts)
├── agents/        # AI agent manifests
├── data/          # Generated datasets (toilets.geojson)
├── scripts/       # Orchestration scripts
├── templates/     # Scaffold templates
├── docs/          # Documentation
│   └── cookbook/  # Reusable implementation patterns
├── tests/         # Test files (*_test.js pattern)
├── plans/         # Task plans (plan_*.txt)
├── issues/        # Issue tracking (issue_*.txt)
└── status/        # Task status reports
```

## Testing Conventions

- Test files: `tests/` directory with `*_test.js` suffix
- Test runner: Jest with jsdom environment
- Follow TDD: Write failing test first, then implementation
- Test creation tasks must produce failing tests (Red phase)
- Implementation tasks must make tests pass (Green phase)
- **Agent Testing Patterns**:
  - `nock` for HTTP mocking (Overpass API calls)
  - `supertest` for API endpoint testing
  - `sinon` for function mocking and spies
  - `nodemailer-mock` for email testing
  - `shelljs` for shell command testing
- **React Hook Testing Pattern**:
  - When Jest module mocking becomes intractable, use dependency injection
  - Add optional hook prop with default value: `useHookName?: typeof useHookName`
  - Tests pass mock implementations directly via props
  - See `docs/cookbook/recipe_dependency_injection_hooks.md` for details
  - Example: SearchBar component's `useGeolocationHook` prop

## Key Data Schema

### Suggest-Agent Schema v2

The suggest-agent API now supports comprehensive OpenStreetMap property mapping:

**v1 Schema (Backward Compatible)**: Original 9-property simplified API
```json
{
  "lat": "number",           // Required. Latitude (-90 to 90)
  "lng": "number",           // Required. Longitude (-180 to 180)
  "name": "string",          // Required. Name/description
  "accessible": "boolean",   // Maps to OSM "wheelchair"
  "hours": "string",         // Maps to OSM "opening_hours"
  "fee": "number",           // Maps to OSM "charge" 
  "changing_table": "boolean",
  "payment_contactless": "boolean",
  "access": "string"         // Values: "yes", "customers", "private"
}
```

**v2 Schema (Extended)**: Full 120 OpenStreetMap properties supported
- **Core (2)**: `@id`, `amenity` - always present
- **High Frequency (13)**: `fee`, `wheelchair`, `male`, `female`, `unisex`, `toilets:disposal`, etc.
- **Optional (6)**: `operator`, `check_date`, `toilets:handwashing`, etc.
- **Specialized (99)**: Payment methods, address fields, building details, etc.

**Data Type Conversion Patterns**:
- **Boolean**: OSM "yes"/"no" → API `true`/`false`
- **Monetary**: "£0.20", "50p" → Numeric `0.20`, `0.50`
- **Enums**: Validated string sets (e.g., `access`: ["yes", "private", "customers"])
- **Dates**: ISO format preserved as strings

See `docs/reference/api/suggest-api.md` for complete property documentation.

## Property Tier System

The project implements a 4-tier classification system for the 120 OpenStreetMap properties:

### Tier Structure
- **Core (8)**: Essential properties always validated (lat, lng, @id, amenity, wheelchair, access, opening_hours, fee)
- **High-frequency (16)**: Common properties with strict validation when provided
- **Optional (17)**: Advanced properties for power users
- **Specialized (81)**: Edge cases accepted for data integrity

### Tier-based Validation Behavior

#### Core Properties
- **Required**: All core properties must be present
- **Strict validation**: Type and format strictly enforced
- **v1 compatibility**: Default values provided for backward compatibility
- **Examples**: lat/lng coordinates, amenity type, wheelchair access

#### High-frequency Properties  
- **Optional but strict**: Not required, but strictly validated when provided
- **No type coercion**: Values must match expected types exactly
- **Common fields**: name, male/female facilities, building info

#### Optional Properties
- **Lenient validation**: Type coercion attempted when reasonable
- **Warnings over errors**: Issues logged as warnings, not failures
- **User convenience**: Designed for power users adding extra detail

#### Specialized Properties
- **Maximum flexibility**: Basic type checking only
- **Always accepted**: Preserves data integrity for edge cases
- **Future-proofing**: Handles new OSM tags without code changes

### Validation Services

#### TieredValidationService
- **Base service**: Core tier-based validation logic
- **Configuration**: Loads from `src/config/suggestPropertyTiers.json`
- **Performance**: Optimized with Map-based lookups and single-pass validation
- **v1/v2 support**: Handles both API versions with appropriate strictness

#### TieredValidationServiceWithMetrics
- **Extended service**: Adds metrics collection and monitoring
- **Performance tracking**: P95 latency, request counts by tier
- **Error analysis**: Tracks validation failures by property tier
- **Structured logging**: Uses pino for operational visibility

### Performance Targets

Validation performance is monitored against environment-specific thresholds:

```javascript
// From aiconfig.json validated_patterns.performance_targets
{
  "local": {
    "minimal": 15,   // 9 properties
    "full": 20,      // 120 properties  
    "config": 25,    // Cold start
    "cached": 1      // Warm cache
  },
  "ci": {
    "minimal": 20,
    "full": 30,
    "config": 30,
    "cached": 2
  }
}
```

### Key Files
- **Configuration**: `src/config/suggestPropertyTiers.json` - Generated tier assignments
- **Services**: `src/services/TieredValidationService.ts` - Core validation logic
- **Metrics**: `src/services/TieredValidationServiceWithMetrics.ts` - With monitoring
- **Error Messages**: `src/utils/errorMessages.ts` - Standardized error templates
- **Generator**: `scripts/generate_property_tiers.js` - CLI tool for updates
- **Documentation**: `docs/reference/property-prioritization.md` - Framework reference
- **Schema**: `schemas/propertyTiers.schema.json` - JSON validation schema
- **ADR**: `docs/adr/ADR-002-property-tiering.md` - Architecture decision
- **Cookbook**: `docs/cookbook/recipe_tiered_validation.md` - Implementation guide

### Usage
```bash
# Regenerate tier configuration
node scripts/generate_property_tiers.js --summary --update-aiconfig

# Use custom data source
node scripts/generate_property_tiers.js --input custom.json --output tiers.json

# Run performance benchmarks
npm test tests/performance/validation_benchmark_test.js

# Check optimization improvements
npm test tests/performance/optimization_comparison_test.js
```

### GeoJSON Toilet Data Structure
```json
{
  "id": "string",
  "name": "string", 
  "lat": "number",
  "lng": "number",
  "hours": "string",
  "accessible": "boolean",
  "fee": "number",
  "source": "string",
  "last_verified_at": "ISO date",
  "verified_by": "string"
}
```

## Current Implementation Status

- ✅ Requirements, Architecture, Design phases complete
- ✅ Development environment scaffolded (aiconfig.json, package.json, Next.js setup)
- ✅ Epic-based master plan established (plan_0003.txt)
- ✅ **Ingest agent COMPLETE** (TDD cycle finished with CLI/service separation)
- ✅ **Suggest agent COMPLETE** (Production-ready with 99%+ test coverage and performance optimization)
- ✅ **SEO agent COMPLETE** (Template-based static page generation)
- ✅ **Metrics Export COMPLETE** (Prometheus endpoint, validation summary API, CI guardrails, Grafana dashboard)
- ✅ **Monitor agent COMPLETE** (Weekly monitoring with pluggable alerts and configurable metrics collection)
- ✅ Service-oriented architecture established as project standard
- 🔄 V1 feature implementation in progress (2 remaining epics)
- ⏳ Frontend UI, Deploy pipeline pending

## Service-Oriented Architecture

The project now implements mature service-oriented architecture patterns:

### Core Services
- **ValidationService** - Request validation and schema checking
- **TieredValidationServiceOptimized** - Performance-optimized 4-tier property validation with 99%+ test coverage
- **TieredValidationServiceWithMetrics** - Metrics-enhanced validation with P95 latency tracking
- **DuplicateService** - Spatial duplicate detection with dependency injection  
- **RateLimitService** - IP-based rate limiting management
- **SuggestionLogService** - Structured logging with file rotation
- **IngestService** - OSM data processing and normalization
- **MonitorService** - Weekly monitoring workflow with pluggable alert channels and metrics collection

### Architecture Patterns
- **SOLID Compliance** - Perfect adherence to all five principles
- **Dependency Injection** - Clean separation through interfaces
- **Service Orchestration** - Route handlers as thin orchestration layers
- **Error Standardization** - Consistent error handling via ErrorFactory
- **Multi-Layer Testing** - Unit tests for services + integration tests for workflows

## Important Files to Consult

1. **Architecture**: `docs/architecture-spec.md`, `docs/architecture.md`
2. **Design System**: `docs/design-spec.md` (atomic design, tokens)
3. **Engineering**: `docs/engineering-spec.md`, `docs/engineering.md`
4. **Current Plan**: `plans/plan_0003.txt` (V1 Epic Master Plan)
5. **Validation Plan**: `plans/plan_validation_service_tier_0012.txt` (Tier-based validation) ✅ COMPLETE
6. **Metrics Plan**: `plans/plan_metrics_export_0013.txt` (Observability epic) ✅ COMPLETE
7. **ADRs**: `docs/adr/ADR-002-property-tiering.md`, `docs/adr/ADR-003-core-property-validation.md`, `docs/adr/ADR-004-validation-performance-caching.md`
8. **API Docs**: `docs/reference/api/suggest-api.md` (120 OSM properties)
9. **Config**: `aiconfig.json` (single source of truth), `src/config/suggestPropertyTiers.json`
10. **Metrics Guide**: `docs/cookbook/recipe_metrics_export.md` (Monitoring & observability patterns)
11. **Testing Patterns**: `docs/cookbook/recipe_dependency_injection_hooks.md` (Dependency injection for React hooks)

## V1 Epic Implementation (plan_0003.txt)

**Epic-Based Development Structure**:
Each epic follows strict TDD (TEST_CREATION → IMPLEMENTATION → REFACTORING)

1. **epic_ingest_agent** (`plan_ingest_agent.txt`) ✅ COMPLETE
   - Overpass API → GeoJSON data pipeline with TypeScript
   - Reusable utility functions (src/utils/overpass.ts)
   - Comprehensive test coverage (98.63%)
   - Prerequisite for other components

2. **epic_suggest_agent** (`plan_suggest_agent.txt`) ✅ COMPLETE
   - Production-ready TieredValidationServiceOptimized with 99.45% test coverage
   - Performance-optimized validation (20-50% improvement over baseline)
   - Comprehensive error message system with 99.64% test coverage
   - 100+ test cases including negative scenarios and edge cases
   - v1/v2 API endpoints with backward compatibility

3. **epic_seo_agent** (`plan_seo_agent.txt`) ✅ COMPLETE
   - Static borough page generation with template system
   - SEO optimization and robots.txt generation
   - Modular template builders following SOLID principles

4. **epic_frontend_ui** (`plan_frontend_ui.txt`)
   - React-Leaflet map integration with clustering
   - Borough page routing and mobile-responsive UI
   - Depends on ingest-agent data

5. **epic_deploy_pipeline** (`plan_deploy_pipeline.txt`)
   - CI/CD pipeline automation
   - GitHub Actions workflow

6. **epic_monitor_agent** (`plan_monitor_agent_0016.txt`) ✅ COMPLETE
   - Weekly GitHub Actions monitoring with Discord notifications
   - Pluggable alert channels (Discord, with interfaces for Slack/email extensions)
   - Configurable metrics collection from validation summary and Prometheus endpoints
   - Service-oriented architecture with dependency injection patterns

**Epic Execution Strategy**:
- ✅ ingest-agent completed (data dependency satisfied)
- ✅ suggest-agent completed (production-ready with 99%+ test coverage)
- ✅ seo-agent completed (static page generation operational)
- ✅ monitor-agent completed (weekly monitoring with pluggable architecture)
- 🔄 frontend-ui in progress (atomic components complete, organisms pending)
- ⏳ deploy-pipeline ready to begin (all dependencies satisfied)

## Operational Notes

- Always check `aiconfig.json` for project standards once it exists
- Create status reports in `status/` after task completion using the template
- Use `docs/cookbook/recipe_*.md` for reusable patterns
- Increment global event counter `g` in aiconfig.json for significant events
- Follow artifact annotation requirements in implementation tasks
- Current g counter: 123 (as of monitor agent epic completion)

## Monitoring & Operations

The project now includes comprehensive observability features from the completed metrics export epic:

### Metrics Collection
- **Prometheus Endpoint**: GET `/api/metrics` - Real-time metrics export
  - Validation request counts by tier and version
  - Error counts by tier and error type  
  - Duration histograms for performance monitoring
  - Performance overhead: avg 0.104ms, p95 0.066ms (< 1ms requirement met)

### Operational APIs
- **Validation Summary**: GET `/api/validation/summary` - JSON operational insights
  - Request distribution across property tiers
  - Error patterns and validation failure analysis
  - Performance percentiles (p50, p95, p99)
  - Time-windowed aggregations

### CI/CD Performance Guardrails
- **Automated Performance Testing**: `scripts/validate-performance.js`
  - Enforces performance SLAs in CI pipeline
  - Prevents performance regressions
  - Validates ADR-004 requirements

### Visualization
- **Grafana Dashboard**: Production-ready dashboard template
  - Request rate and error rate panels
  - Performance heatmaps
  - Tier distribution visualizations
  - Alert configuration examples

### Weekly Monitoring Agent
- **Monitor Service**: Automated weekly execution via GitHub Actions (Monday 02:00 UTC)
  - Data change analysis comparing current vs cached toilet datasets
  - Suggestion submission parsing from logs with time-window filtering
  - Metrics collection from multiple sources (validation summary, Prometheus)
  - Discord webhook notifications with formatted weekly summaries
  
- **Pluggable Architecture**: Interface-based design enabling future extensions
  - AlertSender interface supports Discord, with planned Slack/email integrations
  - MetricsCollector interface supports multiple data sources with fallback strategies
  - Configuration-driven behavior allowing runtime channel and metrics selection
  
- **CLI Integration**: Cross-platform executable script with proper error handling
  - `scripts/monitor-agent.ts` provides GitHub Actions integration
  - Structured logging and exit codes for operational visibility
  - Windows/Unix compatibility with normalized path handling

See `docs/cookbook/recipe_metrics_export.md` for observability implementation guide.
See `docs/cookbook/recipe_monitor_agent_patterns.md` for monitoring architecture patterns.

## Status Report Management

- Use `templates/template_status_.md` as the base template for all status reports
- Run `node scripts/generate_status_skeletons.js` to auto-generate skeleton reports for all pending tasks
- Status reports follow naming: `status/plan_<id>_task_<id>_status.md`
- All reports must include TDD phase identification and validation results