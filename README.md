# CityPee - London Public Toilet Finder

A London public toilet finder web application built with AI-driven orchestration and OpenStreetMap data integration.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
```

## Project Overview

CityPee helps Londoners and visitors locate public and accessible toilets, with emphasis on 24-hour availability. The project follows strict Test-Driven Development (TDD) using the Hybrid_AI_OS operational framework.

## Architecture

- **5 AI Agents**: ingest-agent, suggest-agent, seo-agent, deploy-agent, monitor-agent
- **Tech Stack**: Next.js, React, TypeScript, TailwindCSS, React-Leaflet
- **Data Source**: OpenStreetMap via Overpass API
- **Development Method**: Epic-based TDD (Red-Green-Refactor)

## Development Commands

```bash
npm run dev              # Development server (http://localhost:3000)
npm run build            # Production build
npm run test             # Run Jest tests (100+ test cases)
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run lint             # Code linting
npm run ingest           # Run ingest agent (fetch OSM data)
npm run storybook        # Run Storybook development server
npm run build-storybook  # Build Storybook for production
npm run chromatic        # Run visual regression testing
npm run lint:docs        # Run documentation linting (46 files)
```

## Project Management

```bash
# Generate status report templates for all pending tasks
node scripts/generate_status_skeletons.js

# Generate new documentation with schema-compliant front-matter
node scripts/scaffold-doc.js --category cookbook --title "Recipe Title" --description "Recipe description" --output docs/cookbook/recipe_name.md
```

## Project Structure

```
├── src/                 # Next.js application source
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React components (atomic design)
│   │   ├── atoms/      # Button, Input, Icon, Badge components
│   │   ├── molecules/  # Form, Card, Navigation components
│   │   └── organisms/  # Header, Footer, Section components
│   ├── lib/            # Utility libraries
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Shared utility functions (overpass.ts)
├── .storybook/          # Storybook configuration and templates
├── tests/               # Test files (*_test.js pattern)
├── docs/                # Documentation and specifications
│   └── cookbook/       # Reusable implementation patterns
├── plans/               # Task plans (plan_*.txt)
├── status/              # Task status reports (*.md)
├── agents/              # AI agent manifests
├── scripts/             # Orchestration and utility scripts
├── templates/           # Status report and code templates
└── data/                # Generated datasets (toilets.geojson)
```

## Epic Dependency & Integration Overview

### 1. Dependency graph & execution order
```
Ingest-agent ┐
             │             ┐─► SEO-agent
             │             │
             └─► Suggest-agent──► Frontend-UI ──► Deploy-pipeline
                        │                               │
                        └─────────────────────────► Monitor-agent
```
Execution sequence:
1. `epic_ingest_agent`
2. `epic_suggest_agent`
3. `epic_seo_agent` + `epic_frontend_ui` (parallel)
4. `epic_deploy_pipeline`
5. `epic_monitor_agent`

### 2. Integration & integration-test stack
* Jest (primary runner)
* `nock` – mock Overpass HTTP
* `supertest` – in-process API tests
* `tmp-promise` / `fs-extra` – sandbox file ops
* `@testing-library/react` + `jsdom` – UI snapshots
* `shelljs` – deploy-pipeline script mocks
* `sinon` + `node-cron` – schedule simulation

CI flow: unit tests → epic integration tests (`tests/integration/<epic>/`) → top-level CI job in dependency order.

### 3. Approach summary per epic
| Epic | Status | Approach | Key Integration Tests |
|------|--------|----------|-----------------------|
| Ingest-agent | ✅ COMPLETE | TypeScript script + reusable utility | Mock Overpass; GeoJSON validation; retry logic; caching |
| Suggest-agent | ✅ COMPLETE | Next.js API with optimized tier-based validation (120 properties) | v1/v2 endpoints; 4-tier validation; 99%+ test coverage; performance optimized |
| SEO-agent | ✅ COMPLETE | Node script generates static pages | Snapshot borough HTML; page count; meta tags; template validation |
| Frontend-UI | 🔄 IN PROGRESS | Storybook infrastructure complete, atomic components in TDD development | Map renders markers; routing; axe accessibility; component testing |
| Deploy-pipeline | ⏳ PENDING | GitHub Actions + deploy-agent | Dry-run verifies steps; missing artifacts fail; env matrix |
| Monitor-agent | ✅ COMPLETE | node-cron weekly monitoring with pluggable alerts | Discord webhooks; metrics collection; GitHub Actions integration |

### 4. Primary reference artefacts / docs
| Doc / File | Relevant Epics |
|------------|---------------|
| `docs/architecture-spec.md` | All epics |
| `docs/design-spec.md` | Frontend-UI, SEO-agent |
| `docs/engineering-spec.md` | Deploy-pipeline, Monitor-agent |
| `docs/roadmap.md` | Phase alignment |
| `aiconfig.json` | Testing standards |
| `agents/*.json` | Each agent |
| `scripts/*.sh` | Ingest, SEO, Deploy |
| `templates/*.tpl` | Deploy-pipeline, Frontend-UI |

## Current Status

- ✅ **Ingest Agent**: Complete OSM data ingestion pipeline (1,041+ London toilets)
- ✅ **Suggest Agent**: Complete tier-based validation system for 120 OSM properties
  - TieredValidationServiceOptimized with 99.45% test coverage and 20-50% performance improvement
  - Comprehensive test suite: 100+ test cases including negative scenarios and edge cases
  - Production-ready v1/v2 API endpoints with backward compatibility
  - 4-tier property classification: Core, High-frequency, Optional, Specialized
- ✅ **SEO Agent**: Complete static borough page generation and optimization
- ✅ **Metrics Export**: Complete observability infrastructure (plan_metrics_export_0013)
  - Prometheus-compatible /api/metrics endpoint with < 1ms overhead
  - JSON validation summary API at /api/validation/summary
  - CI/CD performance guardrails via scripts/validate-performance.js
  - Production-ready Grafana dashboard template
  - 90%+ test coverage on all monitoring components
- ✅ **Documentation Standardisation**: Complete unified documentation system (plan_docs_standardisation_0015)
  - Unified front-matter schema across 46 documentation files
  - Automated testing with 59 tests across 7 test suites
  - CI-optimized linting infrastructure with caching
  - Scaffolding CLI for automated documentation generation
  - Diátaxis-compliant directory structure with operational runbooks
  - New technical content: Prometheus exporter recipe, k6 load testing guide, ADR-005 native histograms
- ✅ **Monitor Agent**: Complete weekly monitoring system (plan_monitor_agent_0016)
  - MonitorService with complete workflow: ingest refresh, data analysis, metrics collection
  - Pluggable alert channels: AlertSender interface with Discord implementation
  - Configurable metrics collection: validation summary and Prometheus endpoints
  - GitHub Actions workflow for Monday 02:00 UTC execution
  - Cross-platform CLI integration with proper error handling
  - Service-oriented architecture with dependency injection patterns
- 🔄 **Frontend UI**: Core atomic components (`Button`, `Input`, `Icon`, `Badge`) are implemented and tested. A new "Modern Thames Blueprint" visual theme has been applied. Storybook is fully configured. A known bug with `Badge` component positioning remains.
- ⏳ **Deploy Agent**: CI/CD pipeline and automation

## Testing Patterns

### Dependency Injection for React Hooks

When Jest module mocking becomes intractable (especially with React hooks and ES modules), use dependency injection:

```typescript
// Component accepts hook as optional prop with default
interface SearchBarProps {
  // ... other props
  useGeolocationHook?: typeof useGeolocation
}

export function SearchBar({
  useGeolocationHook = useGeolocation,
  ...props
}: SearchBarProps) {
  const { loading, error, requestLocation } = useGeolocationHook()
  // ... component logic
}

// Test passes mock implementation directly
test('should handle loading state', () => {
  const mockHook = () => ({
    loading: true,
    error: null,
    requestLocation: jest.fn()
  })
  render(<SearchBar useGeolocationHook={mockHook} />)
  // ... assertions
})
```

**Benefits**:
- Bypasses Jest module mocking issues entirely
- Makes dependencies explicit and testable
- No changes to production usage (default value)
- Improves component architecture

This pattern was discovered after 60+ attempts to fix Jest mocking issues with the SearchBar component.

## API Usage

### Submit a Toilet Suggestion

CityPee supports two API versions for toilet submissions:

#### v1 API (Default) - Backward Compatible
Simple 9-property interface with automatic defaults for missing core properties:

```bash
curl -X POST http://localhost:3000/api/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 51.5074,
    "lng": -0.1278,
    "name": "Victoria Station Public Toilets",
    "accessible": true,
    "hours": "24/7",
    "fee": 0.50
  }'
```

#### v2 API (Strict) - Full OpenStreetMap Support
Supports all 120 OpenStreetMap properties with strict validation for core fields:

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
    "male": true,
    "female": true,
    "unisex": false,
    "changing_table": true,
    "toilets:disposal": "flush",
    "payment:contactless": "yes",
    "operator": "Network Rail"
  }'
```

**Key Differences:**
- v1: Auto-fills missing core properties, lenient validation
- v2: Requires all 8 core properties, strict tier-based validation
- Both versions support the same 120 OSM properties

See [`docs/reference/api/suggest-api.md`](docs/reference/api/suggest-api.md) for complete API documentation.

### Monitoring APIs

#### Prometheus Metrics
Collect real-time operational metrics:
```bash
curl http://localhost:3000/api/metrics
```

Returns Prometheus-formatted metrics including:
- `citypee_validation_requests_total` - Request counts by tier and version
- `citypee_validation_errors_total` - Error counts by tier and type
- `citypee_validation_duration_seconds` - Performance histograms

#### Validation Summary
Get JSON-formatted operational insights:
```bash
curl http://localhost:3000/api/validation/summary
```

Returns aggregated statistics including request distribution, error patterns, and performance percentiles.

## Key Files

- `aiconfig.json` - Single source of truth for project standards
- `plans/plan_0003.txt` - Epic master plan with 6 child plans
- `plans/plan_validation_service_tier_0012.txt` - Tier-based validation implementation plan (COMPLETE)
- `plans/plan_metrics_export_0013.txt` - Metrics export & observability epic (COMPLETE)
- `src/services/TieredValidationService.ts` - 4-tier property validation service
- `src/services/TieredValidationServiceWithMetrics.ts` - Metrics-enhanced validation service
- `src/config/suggestPropertyTiers.json` - Property tier classification config
- `docs/adr/ADR-002-property-tiering.md` - Property tier system architecture decision
- `docs/adr/ADR-003-core-property-validation.md` - Core validation policy decision
- `docs/reference/api/suggest-api.md` - Complete API documentation (120 properties)
- `docs/cookbook/recipe_tiered_validation.md` - Tier validation implementation patterns
- `docs/cookbook/recipe_metrics_export.md` - Monitoring & observability patterns
- `src/utils/overpass.ts` - Reusable Overpass API utility
- `scripts/validate-performance.js` - CI/CD performance guardrails
- `CLAUDE.md` - AI assistant guidance with tier system documentation
- `templates/template_status_.md` - Status report template

## Data Schema

GeoJSON toilet data structure:
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

## Contributing

1. Follow strict TDD methodology (Red-Green-Refactor)
2. Use status report template for all task completion
3. Check aiconfig.json for project standards
4. Increment global event counter (g) for significant changes
5. Add artifact annotations pointing to canonical documentation

For detailed development guidance, see `CLAUDE.md`.

## 📚 Documentation

For full project documentation, see [`docs/README.md`](docs/README.md).
