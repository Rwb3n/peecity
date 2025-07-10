# tests/

Comprehensive Jest test suites supporting service-oriented architecture.

## Testing Strategy

### Multi-Layer Testing
- **Unit Tests**: Fast, isolated service testing (`tests/services/`)
- **Integration Tests**: Full request/response cycles (`tests/agents/`)
- **Utility Tests**: Framework-agnostic utilities (`tests/utils/`)
- **Diagnostic Tests**: Bug reproduction and regression guards (`tests/diagnostics/`)

### Test Organization
- **Naming**: `*_test.js` or `.test.tsx`
- **Location**: Mirrors source directories
- **Helpers**: Reusable test utilities (`tests/helpers/`)
- **Coverage**: 90% project-wide threshold

## Test Commands

```bash
npm test                    # Run all tests (100+ test cases)
npm run test:watch         # Run tests in watch mode  
npm run test:coverage      # Run tests with coverage report
npm run test:services      # Run service unit tests only
npm run test:agents        # Run agent integration tests only
npm run test:components    # Run component tests only
npm run storybook          # Run Storybook for visual testing
npm run chromatic          # Run visual regression testing
```

## Test Categories

### Service Unit Tests (`tests/services/`)
Fast, isolated testing of business logic services:

| File | Service | Purpose |
|------|---------|---------|
| `validationService_test.js` | ValidationService | Schema validation, data sanitization, error handling |
| `rateLimitService_test.js` | RateLimitService | Rate limiting logic, IP tracking, statistics |
| `duplicateService_test.js` | DuplicateService | Spatial duplicate detection, caching behavior |
| `suggestionLogService_test.js` | SuggestionLogService | Structured logging, event recording |
| `ingestService_test.js` | IngestService | Data processing, normalization, error handling |

**Features**:
- Mocked dependencies for isolation
- Edge case coverage
- Performance validation
- Error scenario testing

### Agent Integration Tests (`tests/agents/`)
Full workflow testing with real dependencies:

| File | Agent | Purpose |
|------|-------|---------|
| `ingest_agent_test.js` | ingest-agent | End-to-end data ingestion, API mocking, error cases |
| `suggest_agent_validation_test.js` | suggest-agent | Request validation workflows |
| `suggest_agent_duplicates_test.js` | suggest-agent | Duplicate detection integration |
| `suggest_agent_rate_limit_test.js` | suggest-agent | Rate limiting workflows |
| `suggest_agent_logging_test.js` | suggest-agent | Logging integration |
| `suggest_agent_response_format_test.js` | suggest-agent | Response formatting standards |

**Features**:
- Real HTTP requests and responses
- File system interactions
- Error propagation testing
- Performance validation

### Utility Tests (`tests/utils/`)
Framework-agnostic utility testing:

| File | Utility | Purpose |
|------|---------|---------|
| `overpass_test.js` | overpass.ts | API client, caching, retry logic, timeout handling |
| `config_test.js` | config.ts | Configuration loading, environment overrides |
| `errors_test.js` | errors.ts | Error factory, response formatting |
| `geospatial_test.js` | geospatial.ts | Distance calculations, spatial indexing |
| `rateLimit_test.js` | rateLimit.ts | Rate limiting algorithms, statistics |

### Helper Utilities (`tests/helpers/`)
Reusable test infrastructure:

| File | Purpose |
|------|---------|
| `index.js` | Barrel export for clean imports |
| `withSuggestFs.js` | Higher-order Jest helper for filesystem setup |
| `api-test-helper.js` | Next.js API route testing utilities |
| `suggestion-factory.js` | Test data generation |
| `fs-test-utils.js` | File system test utilities |

**Key Helper: withSuggestFs**
```javascript
import { withSuggestFs } from '../helpers';

describe('Suggest Agent', withSuggestFs(() => {
  // Tests run with clean filesystem setup
  // Automatic cleanup after each test
}));
```

### Component Tests (`tests/components/`)
Atomic design component testing with TDD methodology:

| File | Component | Purpose |
|------|-----------|---------|
| `atoms/Button_test.tsx` | Button | Interactive button component with variants, mobile ergonomics, accessibility |
| `atoms/Input_test.tsx` | Input | Form input component with validation, types, mobile-friendly touch targets |
| `atoms/Icon_test.tsx` | Icon | SVG icon component with accessibility, sizes, Lucide React integration |
| `atoms/Badge_test.tsx` | Badge | Status and notification badges with variants, mobile layouts |

**Features**:
- **TDD Red Phase**: Tests fail until components implemented
- **Mobile Ergonomics**: 44px+ touch target validation
- **WCAG 2.1 AA**: Color contrast, ARIA labels, keyboard navigation
- **Comprehensive Coverage**: 90+ test cases across 4 components
- **Storybook Integration**: Story file validation and template usage

### Diagnostic Tests (`tests/diagnostics/`)
Bug reproduction and regression prevention:

| File | Purpose |
|------|---------|
| `overpass_timeout_diag_test.js` | Timeout bug reproduction and regression guard |
| `duplicate_detection_diag_test.js` | Duplicate detection bug reproduction |

**Features**:
- Deliberately fail until bugs are fixed (Red phase)
- Remain as regression guards after fixes
- Real-world failure scenario reproduction

### Configuration Tests (`tests/config/`)
Project configuration validation:

| File | Purpose |
|------|---------|
| `aiconfig_schema_test.js` | Validate aiconfig.json schema compliance |
| `plan_schema_test.js` | Validate plan JSON schema structure |

## Testing Patterns

### Service Testing Pattern
```javascript
describe('ServiceName (Unit)', () => {
  let service;
  
  beforeEach(() => {
    service = new ServiceName(mockDependencies);
  });
  
  describe('methodName', () => {
    it('should handle success case', async () => {
      const result = await service.methodName(validInput);
      expect(result.success).toBe(true);
    });
    
    it('should handle error case', async () => {
      const result = await service.methodName(invalidInput);
      expect(result.error).toBeDefined();
    });
  });
});
```

### Integration Testing Pattern
```javascript
describe('Agent Integration', withSuggestFs(() => {
  it('should process complete workflow', async () => {
    // Arrange
    const requestData = createTestSuggestion();
    
    // Act
    const response = await request(app)
      .post('/api/suggest')
      .send(requestData);
    
    // Assert
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
}));
```

### Mock Patterns
```javascript
// Service mocking for isolation
const mockDataProvider = {
  loadToilets: jest.fn().mockResolvedValue([]),
  isDataAvailable: jest.fn().mockResolvedValue(true),
  // ... other interface methods
};

// HTTP mocking for external APIs
nock('https://overpass-api.de')
  .post('/api/interpreter')
  .reply(200, mockOverpassResponse);
```

## Test Data Management

### Factories
```javascript
function createTestSuggestion(overrides = {}) {
  return {
    lat: 51.5074,
    lng: -0.1278,
    name: 'Test Toilet',
    hours: '24/7',
    accessible: true,
    fee: 0,
    ...overrides
  };
}
```

### Fixtures
- Static test data in `tests/fixtures/`
- Realistic GeoJSON samples
- Error response examples
- Configuration templates

## Coverage Requirements

### Thresholds
- **Overall**: 90% coverage minimum
- **Services**: 95% coverage (critical business logic)
- **Utilities**: 90% coverage
- **Integration**: 80% coverage (focus on workflows)

### Coverage Reports
```bash
npm run test:coverage
# Generates reports in coverage/ directory
# View coverage/lcov-report/index.html for detailed analysis
```

## Performance Testing

### Benchmarks
- Service method execution times
- Cache hit/miss ratios
- Memory usage patterns
- Concurrent request handling

### Load Testing
```javascript
describe('Performance', () => {
  it('should handle concurrent requests', async () => {
    const requests = Array(100).fill().map(() => 
      service.validateRequest(testData)
    );
    
    const start = Date.now();
    await Promise.all(requests);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(1000); // 1 second for 100 requests
  });
});
```

## Continuous Integration

### Test Pipeline
1. **Unit Tests**: Fast feedback on service logic
2. **Integration Tests**: Verify component interactions
3. **Coverage Validation**: Ensure coverage thresholds
4. **Performance Tests**: Validate response times
5. **Regression Tests**: Prevent bug reintroduction

### Test Environment
- **Node.js**: v20.x LTS
- **Jest**: Test runner with TypeScript support
- **Testing Library**: React component testing (@testing-library/react, @testing-library/user-event)
- **Supertest**: HTTP assertions
- **Nock**: HTTP mocking
- **jsdom**: Browser environment simulation
- **Storybook**: Visual testing and component documentation

## Guidelines

1. **Fast Feedback**: Unit tests should run in <100ms each
2. **Isolation**: Mock external dependencies in unit tests
3. **Realistic**: Use real dependencies in integration tests
4. **Comprehensive**: Test success paths, error paths, and edge cases
5. **Maintainable**: Use helpers and factories for DRY test code
6. **Documentation**: Clear test descriptions and assertions
7. **Coverage**: Aim for high coverage with meaningful tests
8. **Performance**: Include performance assertions for critical paths