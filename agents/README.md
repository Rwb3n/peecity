# agents/

This folder houses **AI agent manifests** and supporting code.

## Available Agents
| Agent | Status | Responsibility | Trigger |
|-------|--------|---------------|---------|
| `ingest-agent` | ✅ **COMPLETE** | Fetch & normalize OSM toilet data → `data/toilets.geojson` | Manual / cron |
| `suggest-agent` | ✅ **COMPLETE** | Validate & stage user submissions → `data/suggestions.log` | HTTP POST `/api/suggest` |
| `seo-agent` | ✅ **COMPLETE** | Generate static borough pages for SEO | On data update / build |
| `deploy-agent` | ⏳ Pending | Build & deploy frontend + datasets | Git push |
| `monitor-agent` | ✅ **COMPLETE** | Weekly monitoring with Discord notifications | GitHub Actions cron |

## Agent Implementation Details

### ✅ ingest-agent (COMPLETE - REFACTORED)
- **Implementation**: Service-oriented architecture with CLI separation
  - `src/services/ingestService.ts` (Pure data processing logic)
  - `scripts/ingest-cli.ts` (Enhanced CLI with verbose/quiet modes)
  - `scripts/ingest.ts` (Backward compatibility wrapper)
- **Utilities**: `src/utils/overpass.ts` (reusable Overpass API client)
- **Features**: 
  - Pure business logic separated from CLI concerns
  - Enhanced CLI with argument parsing and output formatting
  - Retry logic, caching, comprehensive error handling
  - Structured logging with agent-specific loggers
  - Configuration management with environment overrides
- **Architecture**: Clean separation between data processing and presentation
- **Testing**: 8 test cases with 98.63% coverage, updated for service architecture
- **Output**: `data/toilets.geojson` (GeoJSON FeatureCollection)
- **Commands**: `npm run ingest` (backward compatible), `node scripts/ingest-cli.ts run --verbose`

### ✅ suggest-agent (COMPLETE - REFACTORED)
- **Implementation**: Service-oriented architecture with dedicated business logic services
  - `src/app/api/suggest/route.ts` (Clean 70-LOC orchestration layer)
  - `src/services/validationService.ts` (Request validation & schema checking)
  - `src/services/duplicateService.ts` (Spatial duplicate detection with caching)
  - `src/services/rateLimitService.ts` (IP-based rate limiting management)
  - `src/services/suggestionLogService.ts` (Structured logging with agent integration)
- **Shared Utilities**: 
  - `src/utils/config.ts` (Centralized configuration with environment overrides)
  - `src/utils/errors.ts` (Standardized error handling with custom error classes)
  - `src/utils/logger.ts` (Agent-specific loggers with file rotation)
  - `src/utils/geospatial.ts` (Optimized spatial indexing - O(k) vs O(n) performance)
- **Features**: 
  - Schema validation with configurable rules
  - Optimized duplicate detection with spatial indexing and caching
  - Rate limiting with sliding window tracking
  - Structured logging with performance metrics
  - Comprehensive error handling with consistent response formats
- **Architecture**: Perfect SOLID compliance, service-oriented design, dependency injection
- **Testing**: 11 test cases with reusable test hooks (`withSuggestFs` helper)
- **Endpoint**: `POST /api/suggest`
- **Responses**: 201 (success), 400 (validation), 409 (duplicate), 429 (rate limited)

### ✅ monitor-agent (COMPLETE - REFACTORED)
- **Implementation**: Service-oriented architecture with pluggable component design
  - `src/services/MonitorService.ts` (Core monitoring workflow orchestration)
  - `src/interfaces/AlertSender.ts` (Pluggable alert channel abstraction)
  - `src/interfaces/MetricsCollector.ts` (Configurable metrics collection abstraction)
  - `src/services/alerts/DiscordAlertSender.ts` (Discord webhook implementation)
  - `src/services/metrics/ValidationSummaryMetricsCollector.ts` (JSON API metrics)
  - `src/services/metrics/PrometheusMetricsCollector.ts` (Prometheus text format metrics)
  - `scripts/monitor-agent.ts` (CLI wrapper with proper exit codes)
  - `.github/workflows/monitor.yml` (GitHub Actions weekly cron job)
- **Features**:
  - Weekly data change analysis comparing current vs cached toilet datasets
  - Suggestion submission parsing with time-window filtering
  - Multi-source metrics collection with fallback strategies
  - Discord webhook notifications with formatted weekly summaries
  - Pluggable alert channels enabling future Slack/email integrations
  - Cross-platform CLI compatibility (Windows/Unix path handling)
- **Architecture**: SOLID principles, dependency injection, configuration-driven behavior
- **Testing**: 15 test cases with 100% pass rate, mocking strategies for cron/HTTP
- **Schedule**: Monday 02:00 UTC via GitHub Actions
- **Outputs**: Discord notifications, cached data snapshots, structured logs

## Manifest Schema (example)
```json
{
  "name": "ingest-agent",
  "prompt_template": "Fetch London toilets from Overpass, normalize tags, output GeoJSON.",
  "schedule": "cron(0 3 * * MON)",
  "output": "data/toilets.geojson"
}
```

## Development Tips
1. **Service-Oriented Design**: Business logic lives in `src/services/` with pure functions
2. **Separation of Concerns**: Keep CLI logic separate from data processing logic
3. **Follow TDD**: Tests under `tests/agents/` should drive implementation using `withSuggestFs` helpers
4. **Shared Utilities**: Leverage `src/utils/` for cross-agent patterns (config, errors, logging)
5. **Configuration**: Use `src/utils/config.ts` for centralized, environment-aware settings
6. **Error Handling**: Use standardized error classes from `src/utils/errors.ts`
7. **Logging**: Use agent-specific loggers from `src/utils/logger.ts`
8. **TypeScript**: All production code uses `.ts` files with comprehensive type coverage
9. **Documentation**: Annotate files with `@doc refs` pointing to specs in `docs/`

## Testing Patterns
- **ingest-agent**: Uses `
