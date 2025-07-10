# src/

Next.js App Router source code with service-oriented architecture.

## Directory Structure

* `app/` – Route handlers & pages (Next.js App Router)
* `components/` – Reusable React components (Atomic design)
* `services/` – Business logic services with dependency injection
* `providers/` – Data access layer implementations
* `interfaces/` – Contracts and abstractions for dependency injection
* `utils/` – Framework-agnostic helper modules (config, errors, logging, etc.)
* `types/` – Global TypeScript type declarations

## Architecture Patterns

### Service-Oriented Design
- **Route Handlers**: Thin orchestration layer (≈70 LOC)
- **Services**: Focused business logic with single responsibility
- **Providers**: Data access implementations with caching
- **Interfaces**: Contracts enabling dependency injection and testing

### Key Services
- `ValidationService` - Request validation and schema checking
- `DuplicateService` - Spatial duplicate detection with caching
- `RateLimitService` - IP-based rate limiting management
- `SuggestionLogService` - Structured logging with file rotation
- `IngestService` - OSM data processing and normalization

### Shared Utilities
- `config.ts` - Centralized configuration with environment overrides
- `errors.ts` - Standardized error handling and response formatting
- `logger.ts` - Agent-specific structured logging
- `fileLogWriter.ts` - Low-level file operations for logging systems
- `geospatial.ts` - Optimized spatial calculations and indexing

## Development Guidelines

1. **Follow SOLID Principles**: Single responsibility, dependency injection, interface segregation
2. **Use TypeScript**: All production code with comprehensive type coverage
3. **Service First**: Business logic lives in services, not route handlers
4. **Dependency Injection**: Prefer constructor injection for testability
5. **Error Handling**: Use standardized ErrorFactory patterns
6. **Logging**: Use agent-specific loggers with structured data
7. **Testing**: Unit test services independently, integration test routes
8. **Configuration**: Use centralized config with environment overrides

## Testing Strategy
- **Service Tests**: Fast, isolated unit tests in `tests/services/`
- **Integration Tests**: Full request/response cycles in `tests/agents/`
- **Helpers**: Reusable test utilities in `tests/helpers/`

Follow ESLint rules and maintain 90%+ test coverage.